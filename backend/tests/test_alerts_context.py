"""GET /api/intelligence/club/alerts-context: spiega perché "Da contattare" è
vuota. Lo Stadio 3 considera solo gli abbonati della stagione corrente, quindi
un club con soli abbonamenti di stagioni passate non deve leggere "Tutto sotto
controllo"."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import Abbonamento, Club, Fan
import routers.intelligence as intel_router


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _club_with_subs(db, slug, stagioni_per_fan):
    club = Club(nome=slug, slug=slug, password_hash="x")
    db.add(club)
    db.commit()
    for i, stagioni in enumerate(stagioni_per_fan):
        fan = Fan(club_id=club.id, nome=f"Fan{i}", email=f"{slug}{i}@test.it")
        db.add(fan)
        db.commit()
        for s in stagioni:
            db.add(Abbonamento(club_id=club.id, fan_id=fan.id, stagione=s))
    db.commit()
    return club


def test_solo_stagioni_passate(monkeypatch):
    monkeypatch.setattr(intel_router, "current_season_str", lambda: "2026/2027")
    db = _make_session()
    club = _club_with_subs(db, "vecchio", [["2023/2024", "2024/2025"], ["2024/2025"]])

    ctx = intel_router._alerts_context(club.id, db)

    assert ctx == {
        "current_season": "2026/2027",
        "active_subscribers": 0,
        "latest_season": "2024/2025",
    }


def test_abbonati_stagione_corrente_contati_una_volta(monkeypatch):
    monkeypatch.setattr(intel_router, "current_season_str", lambda: "2026/2027")
    db = _make_session()
    # Il primo fan ha due righe nella stagione corrente: conta come un abbonato.
    club = _club_with_subs(db, "attuale", [["2026/2027", "2026/2027"], ["2026/2027"], ["2025/2026"]])

    ctx = intel_router._alerts_context(club.id, db)

    assert ctx["active_subscribers"] == 2
    assert ctx["latest_season"] == "2026/2027"


def test_nessun_abbonamento_e_isolamento_tra_club(monkeypatch):
    monkeypatch.setattr(intel_router, "current_season_str", lambda: "2026/2027")
    db = _make_session()
    _club_with_subs(db, "altro", [["2026/2027"]])
    vuoto = _club_with_subs(db, "vuoto", [[]])

    ctx = intel_router._alerts_context(vuoto.id, db)

    assert ctx["active_subscribers"] == 0
    assert ctx["latest_season"] is None
