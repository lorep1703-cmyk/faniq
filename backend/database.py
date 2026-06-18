from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import DATABASE_URL

# PostgreSQL needs pool settings; SQLite needs check_same_thread
_IS_POSTGRES = DATABASE_URL.startswith("postgresql")

if _IS_POSTGRES:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,          # connessioni permanenti nel pool
        max_overflow=10,      # connessioni extra temporanee sotto carico
        pool_pre_ping=True,   # riconnette automaticamente su connessioni stale
        pool_recycle=300,     # ricicla connessioni ogni 5 min (evita timeout Neon)
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite locale/test
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
