"""Recupero password: link monouso con scadenza, nessuna enumerazione degli
account, nessuna confusione con i token di login."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from models import Club
import routers.password_reset as pr_router
from services.auth import create_token, decode_token, hash_password, verify_password
from services.password_reset import club_from_reset_token, create_reset_token

OLD_PW = "Vecchia1!pw"
NEW_PW = "Nuova2@password"


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    session.add(Club(nome="FC Prova", slug="fc-prova", email="club@example.com",
                     password_hash=hash_password(OLD_PW)))
    session.commit()
    yield session
    session.close()


@pytest.fixture
def sent(monkeypatch):
    outbox = []
    monkeypatch.setattr(pr_router, "send_email", lambda *a, **k: outbox.append(a) or True)
    return outbox


@pytest.fixture
def client(db):
    app = FastAPI()
    app.include_router(pr_router.router)
    app.dependency_overrides[get_db] = lambda: db
    return TestClient(app)


def _club(db):
    return db.query(Club).filter(Club.slug == "fc-prova").first()


# ── Token ─────────────────────────────────────────────────────────────────────

def test_token_valido_restituisce_il_club(db):
    club = _club(db)
    assert club_from_reset_token(create_reset_token(club), db).id == club.id


def test_token_scaduto_rifiutato(db):
    token = create_reset_token(_club(db), now=datetime.utcnow() - timedelta(days=1))
    assert club_from_reset_token(token, db) is None


def test_token_non_vale_piu_dopo_il_cambio_password(db):
    club = _club(db)
    token = create_reset_token(club)
    club.password_hash = hash_password(NEW_PW)
    db.commit()
    assert club_from_reset_token(token, db) is None


def test_token_manomesso_rifiutato(db):
    token = create_reset_token(_club(db))
    assert club_from_reset_token(token[:-2] + "xx", db) is None
    assert club_from_reset_token("non-un-token", db) is None


def test_token_di_recupero_e_di_login_non_sono_intercambiabili(db):
    club = _club(db)
    with pytest.raises(Exception):
        decode_token(create_reset_token(club))  # non apre una sessione
    login_token = create_token(club.id, club.slug, club.nome)
    assert club_from_reset_token(login_token, db) is None


# ── Endpoint ──────────────────────────────────────────────────────────────────

def test_stessa_risposta_per_email_registrata_e_non(client, sent):
    r1 = client.post("/auth/password-reset/request", json={"email": "Club@Example.com"})
    r2 = client.post("/auth/password-reset/request", json={"email": "nessuno@example.com"})
    assert r1.status_code == r2.status_code == 200
    assert r1.json() == r2.json()
    # Email inviata solo al club esistente, con un link verso il frontend.
    assert len(sent) == 1
    to, subject, text, _html = sent[0]
    assert to == "club@example.com"
    assert "/reimposta-password?token=" in text


def test_flusso_completo_e_link_monouso(client, sent, db):
    client.post("/auth/password-reset/request", json={"email": "club@example.com"})
    token = sent[0][2].split("token=")[1].split()[0]

    r = client.post("/auth/password-reset/confirm", json={"token": token, "password": NEW_PW})
    assert r.status_code == 200
    db.refresh(_club(db))
    assert verify_password(NEW_PW, _club(db).password_hash)
    assert "token" not in r.json()  # nessun login automatico
    assert sent[-1][1] == "La password di FanIQ è stata cambiata"

    again = client.post("/auth/password-reset/confirm", json={"token": token, "password": "Altra3#password"})
    assert again.status_code == 400
    assert verify_password(NEW_PW, _club(db).password_hash)


def test_password_debole_rifiutata_e_link_ancora_valido(client, sent, db):
    token = create_reset_token(_club(db))
    r = client.post("/auth/password-reset/confirm", json={"token": token, "password": "debole"})
    assert r.status_code == 400
    assert verify_password(OLD_PW, _club(db).password_hash)
    assert club_from_reset_token(token, db) is not None
