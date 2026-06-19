import logging

from sqlalchemy import create_engine, event
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import DATABASE_URL

logger = logging.getLogger("faniq.db")

_IS_POSTGRES = DATABASE_URL.startswith("postgresql")

if _IS_POSTGRES:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "connect_timeout": 10,       # timeout connessione: 10 secondi
            "options": "-c statement_timeout=15000",  # timeout query: 15 secondi
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
