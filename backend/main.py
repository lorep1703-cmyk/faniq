"""FanIQ API — backend principale."""
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from config import CORS_ORIGINS, LOG_LEVEL
from limiter import limiter
from database import Base, SessionLocal, _IS_POSTGRES, engine
from routers import chat, dashboard, export, insights, privacy, simulator, upload
from routers.auth import router as auth_router

load_dotenv()

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger("faniq")

app = FastAPI(
    title="FanIQ API",
    description="Analytics e intelligence per tifosi — piattaforma multi-club",
    version="3.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard.router)
app.include_router(upload.router)
app.include_router(insights.router)
app.include_router(export.router)
app.include_router(simulator.router)
app.include_router(privacy.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Tabelle tenant su cui va applicata la RLS
# ---------------------------------------------------------------------------
_TENANT_TABLES = ["fans", "abbonamenti", "biglietti", "shop_orders", "upload_history", "privacy_log"]


def _apply_rls_postgres():
    """
    Abilita Row-Level Security su ogni tabella tenant e crea (o sostituisce)
    la policy di isolamento.

    Logica della policy:
    - Se app.current_club_id è impostato nella sessione (via SET LOCAL in tenant.py),
      la query vede SOLO le righe di quel club.
    - Se non è impostato (migrazioni, seed, routes pubbliche), current_setting
      restituisce NULL (grazie al secondo argomento 'true') e nessuna riga viene
      filtrata erroneamente — il proprietario del DB bypassa RLS per default,
      quindi le operazioni di startup non vengono bloccate.

    NOTA PRODUZIONE: per forzare RLS anche sull'owner (massima sicurezza) usa
    `ALTER TABLE <t> FORCE ROW LEVEL SECURITY` e connettiti con un ruolo
    non-owner (es. faniq_app). Il file migrations/rls_setup.sql include
    le istruzioni per questo setup avanzato.
    """
    with engine.connect() as conn:
        for table in _TENANT_TABLES:
            conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))

            # DROP + CREATE per idempotenza (il startup può girare più volte)
            conn.execute(text(f"DROP POLICY IF EXISTS tenant_isolation ON {table}"))
            conn.execute(text(f"""
                CREATE POLICY tenant_isolation ON {table}
                AS PERMISSIVE FOR ALL TO PUBLIC
                USING (
                    club_id = NULLIF(
                        current_setting('app.current_club_id', true), ''
                    )::integer
                )
            """))

            logger.info("RLS applicata: %s", table)
        conn.commit()


def _seed_default_club():
    """
    Se esistono fan senza club_id assegnato (istanza migrata da SQLite),
    li assegna a un club Demo creato al volo.
    Questa funzione è idempotente: non fa nulla se ci sono già club.
    """
    from models import Club
    from services.auth import hash_password

    db = SessionLocal()
    try:
        if db.query(Club).count() > 0:
            return

        # Bypassiamo RLS qui perché siamo fuori dal ciclo request/tenant
        if _IS_POSTGRES:
            db.execute(text("SET LOCAL app.current_club_id = ''"))

        orphan_count = db.execute(
            text("SELECT COUNT(*) FROM fans WHERE club_id IS NULL")
        ).scalar()
        if not orphan_count:
            return

        demo = Club(nome="Demo Club", slug="demo", password_hash=hash_password("demo1234"))
        db.add(demo)
        db.flush()
        cid = demo.id

        for table in _TENANT_TABLES:
            db.execute(
                text(f"UPDATE {table} SET club_id = :cid WHERE club_id IS NULL"),
                {"cid": cid},
            )
        db.commit()
        logger.warning(
            "Migrati %d record al club demo (slug='demo', password='demo1234') — "
            "cambia la password dal pannello!",
            orphan_count,
        )
    except Exception as exc:
        logger.error("Errore seed club: %s", exc)
        db.rollback()
    finally:
        db.close()


@app.on_event("startup")
def startup():
    # 1. Crea tutte le tabelle e gli indici composti (se non esistono già)
    Base.metadata.create_all(bind=engine)

    # 2. Su PostgreSQL: attiva RLS + policy di isolamento tenant
    if _IS_POSTGRES:
        _apply_rls_postgres()
        logger.info("PostgreSQL RLS attivata su %d tabelle", len(_TENANT_TABLES))
    else:
        logger.info("SQLite locale — RLS non applicata")

    # 3. Migra eventuali dati orfani (upgrade da versione precedente)
    _seed_default_club()

    logger.info("FanIQ API v3.0 pronta — DB: %s — CORS: %s",
                "postgresql" if _IS_POSTGRES else "sqlite", CORS_ORIGINS)
