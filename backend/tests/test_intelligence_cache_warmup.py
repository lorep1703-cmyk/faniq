"""Il warmup post-login e l'endpoint GET /api/intelligence/club condividono la
stessa chiave di cache — devono anche condividere lo stesso formato (dict
serializzati). Regressione per il bug: il warmup scriveva oggetti FanIntelligence
grezzi, e GET /api/intelligence/club crashava con AttributeError alla prima
richiesta successiva (r.get(...) su un oggetto, non un dict)."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import Club, Fan
import services.cache as cache_module
from routers.auth import _warmup_intelligence
from routers.intelligence import _intel_cache_key


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_warmup_scrive_dict_non_oggetti_grezzi():
    db = _make_session()
    club = Club(nome="Test", slug="test", password_hash="x")
    db.add(club)
    db.commit()
    db.add(Fan(club_id=club.id, nome="Mario", cognome="Rossi", email="m@test.it"))
    db.commit()

    cache_module.invalidate(club.id)
    _warmup_intelligence(club.id, db)

    cached = cache_module.get(_intel_cache_key(club.id))
    assert cached is not None
    for item in cached:
        assert isinstance(item, dict), f"atteso dict, trovato {type(item)}"
        item.get("renewal_probability")  # non deve sollevare AttributeError


def test_warmup_non_sovrascrive_cache_gia_calda():
    db = _make_session()
    club = Club(nome="Test2", slug="test2", password_hash="x")
    db.add(club)
    db.commit()

    key = _intel_cache_key(club.id)
    sentinel = [{"fan_id": 999, "renewal_probability": 0.5}]
    cache_module.set(key, sentinel)

    _warmup_intelligence(club.id, db)

    assert cache_module.get(key) == sentinel
