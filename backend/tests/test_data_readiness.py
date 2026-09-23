import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import Club, Fan
from services.data_readiness import compute_data_readiness


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _make_club(db):
    club = Club(nome="Test", slug="test", password_hash="x")
    db.add(club)
    db.commit()
    return club


def test_nome_mancante_abbassa_il_punteggio():
    db = _make_session()
    club = _make_club(db)

    # 10 fan: solo 5 hanno il nome (50%, sotto la soglia dell'80%)
    for i in range(10):
        db.add(Fan(
            club_id=club.id,
            nome="Mario" if i < 5 else None,
            email=f"fan{i}@test.it",
            citta="Torino",
        ))
    db.commit()

    result = compute_data_readiness(db, club.id)
    nome_check = next(c for c in result["checks"] if c["label"] == "Nome presente")

    assert nome_check["ok"] is False
    assert nome_check["detail"] == "50% con nome"


def test_nome_presente_sopra_soglia_passa():
    db = _make_session()
    club = _make_club(db)

    for i in range(10):
        db.add(Fan(
            club_id=club.id,
            nome="Mario" if i < 9 else None,
            email=f"fan{i}@test.it",
        ))
    db.commit()

    result = compute_data_readiness(db, club.id)
    nome_check = next(c for c in result["checks"] if c["label"] == "Nome presente")

    assert nome_check["ok"] is True
