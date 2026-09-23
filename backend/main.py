"""FanIQ API — backend principale."""
import logging
import os
import secrets

import time
from collections import defaultdict

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from config import CORS_ORIGINS, FANIQ_ENV, LOG_LEVEL
from database import Base, SessionLocal, _IS_POSTGRES, engine
from routers import chat, dashboard, export, fans, insights, intelligence, partite, privacy, simulator, upload
from routers.auth import router as auth_router

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger("faniq")

app = FastAPI(
    title="FanIQ API",
    description="Analytics e intelligence per tifosi — piattaforma multi-club",
    version="3.0.0",
    docs_url="/docs" if FANIQ_ENV != "production" else None,
    redoc_url="/redoc" if FANIQ_ENV != "production" else None,
)

# Rate limiting in-memory per IP sugli endpoint di auth
_rate_store: dict = defaultdict(list)
_RATE_LIMITS = {
    "/auth/register": (5, 60),
    "/auth/login": (10, 60),
    "/chat/": (20, 60),
    "POST:/upload/": (5, 60),          # solo POST — il polling GET /upload/status/ non viene contato
    "/api/intelligence/club/refresh": (3, 60),
}
_CLEANUP_INTERVAL = 300  # pulisci chiavi scadute ogni 5 minuti
_last_cleanup = time.time()


@app.middleware("http")
async def rate_limit_auth(request: Request, call_next):
    global _last_cleanup
    path = request.url.path

    # Pulizia periodica per evitare memory leak
    now = time.time()
    if now - _last_cleanup > _CLEANUP_INTERVAL:
        max_window = max(w for _, w in _RATE_LIMITS.values())
        stale = [k for k, times in _rate_store.items() if not any(now - t < max_window for t in times)]
        for k in stale:
            del _rate_store[k]
        _last_cleanup = now

    # Trova la chiave di rate limit: prima tenta "METHOD:/prefix/", poi path esatto
    matched_key = None
    for rl_key in _RATE_LIMITS:
        if ":" in rl_key:
            method_prefix, path_prefix = rl_key.split(":", 1)
            if request.method == method_prefix and path.startswith(path_prefix):
                matched_key = rl_key
                break
        elif path == rl_key:
            matched_key = rl_key
            break

    if matched_key is not None:
        max_calls, window = _RATE_LIMITS[matched_key]
        ip = request.client.host if request.client else "unknown"
        bucket = f"{ip}:{matched_key}"
        _rate_store[bucket] = [t for t in _rate_store[bucket] if now - t < window]
        if len(_rate_store[bucket]) >= max_calls:
            return JSONResponse(
                status_code=429,
                content={"detail": "Troppi tentativi. Riprova tra un minuto."},
            )
        _rate_store[bucket].append(now)
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msgs = []
    for e in errors:
        field = e["loc"][-1] if e["loc"] else "campo"
        raw = e.get("msg", "")
        if "email" in str(field).lower() or "email" in raw.lower():
            msgs.append("Inserisci un indirizzo email valido (es. nome@dominio.it)")
        elif "missing" in e.get("type", ""):
            msgs.append(f"Il campo '{field}' è obbligatorio")
        else:
            msgs.append(raw)
    return JSONResponse(
        status_code=422,
        content={"detail": " | ".join(msgs)},
    )


@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    logger.error("Database non raggiungibile: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Servizio temporaneamente non disponibile. Riprova tra qualche istante."},
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.error("Errore non gestito su %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Errore interno del server."},
    )


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"
    )
    return response

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(auth_router)
app.include_router(dashboard.router)
app.include_router(upload.router)
app.include_router(insights.router)
app.include_router(export.router)
app.include_router(simulator.router)
app.include_router(privacy.router)
app.include_router(chat.router)
app.include_router(partite.router)
app.include_router(fans.router)
app.include_router(intelligence.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Tabelle tenant su cui va applicata la RLS
# ---------------------------------------------------------------------------
_TENANT_TABLES = ["fans", "abbonamenti", "biglietti", "shop_orders", "upload_history", "privacy_log", "partite"]


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

        demo_password = secrets.token_urlsafe(16)
        demo = Club(nome="Demo Club", slug="demo", password_hash=hash_password(demo_password))
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
            "SEED: club demo creato con password temporanea: %s — CAMBIALA SUBITO",
            demo_password,
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
