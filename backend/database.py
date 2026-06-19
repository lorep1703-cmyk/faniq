import logging

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import DATABASE_URL

logger = logging.getLogger("faniq.db")

_IS_POSTGRES = DATABASE_URL.startswith("postgresql")

if _IS_POSTGRES:
    engine = create_engine(
        DATABASE_URL,
        # Pool base: 5 connessioni permanenti, fino a 20 sotto carico
        pool_size=5,
        max_overflow=15,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_timeout=30,       # aspetta max 30s prima di dare errore pool esaurito
        connect_args={
            "connect_timeout": 10,
            "options": "-c statement_timeout=15000",
        },
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    except OperationalError as exc:
        logger.error("Errore database: %s", exc)
        db.rollback()
        raise
    finally:
        db.close()
