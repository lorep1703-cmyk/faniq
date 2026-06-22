"""Unit test per il Rinnovo Probability Score — nessun DB reale."""
from __future__ import annotations

from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest

from services.renewal import calculate_renewal_probability


def _today():
    return date.today()


def _make_db(partite_dates, fan_ticket_dates, n_stagioni=0, shop_total=0.0):
    """Costruisce un db mock con i dati minimi necessari."""
    db = MagicMock()

    # Fan
    fan = MagicMock()
    fan.id = 1
    fan.club_id = 99

    # Partite
    from models import Partita
    partite_objs = []
    for d in sorted(partite_dates, reverse=True):
        p = MagicMock(spec=Partita)
        p.data = d
        p.club_id = 99
        partite_objs.append(p)

    # Biglietti
    from models import Biglietto
    bigs = []
    for d in fan_ticket_dates:
        b = MagicMock(spec=Biglietto)
        b.data_partita = d
        b.fan_id = 1
        b.club_id = 99
        bigs.append(b)

    # Abbonamenti
    from models import Abbonamento
    abbs = []
    for i in range(n_stagioni):
        a = MagicMock(spec=Abbonamento)
        a.stagione = f"{2023 + i}/{2024 + i}"
        a.fan_id = 1
        a.club_id = 99
        abbs.append(a)

    # Shop
    from models import ShopOrder
    shop_objs = []
    if shop_total > 0:
        o = MagicMock(spec=ShopOrder)
        o.importo = shop_total
        o.fan_id = 1
        o.club_id = 99
        shop_objs.append(o)

    def query_side_effect(model):
        q = MagicMock()
        from models import Fan
        if model is Fan:
            q.filter.return_value.first.return_value = fan
        elif model is Partita:
            q.filter.return_value.order_by.return_value.all.return_value = partite_objs
        elif model is Biglietto:
            q.filter.return_value.all.return_value = bigs
        elif model is Abbonamento:
            q.filter.return_value.all.return_value = abbs
        elif model is ShopOrder:
            q.filter.return_value.all.return_value = shop_objs
        return q

    db.query.side_effect = query_side_effect
    return db


def _past_dates(n: int, start_offset=0) -> list[date]:
    """n date passate, una a settimana, partendo da start_offset settimane fa."""
    return [_today() - timedelta(weeks=start_offset + i) for i in range(n)]


# ── Profili tifoso ─────────────────────────────────────────────────────────────

def test_vip_tifoso_score_alto():
    """VIP: presenza a tutte le 16 partite, 3 stagioni, shop attivo → score alto."""
    dates = _past_dates(16)
    db = _make_db(dates, set(dates), n_stagioni=3, shop_total=80.0)
    result = calculate_renewal_probability(1, 99, db)
    assert result["score_pct"] >= 80
    assert result["has_incomplete_data"] is False


def test_fedele_score_medio_alto():
    """Fedele: presente a 6 delle ultime 8, 2 stagioni, nessun shop."""
    dates = _past_dates(16)
    fan_dates = set(dates[:6])  # prime 6 (le più recenti)
    db = _make_db(dates, fan_dates, n_stagioni=2)
    result = calculate_renewal_probability(1, 99, db)
    assert 55 <= result["score_pct"] <= 85


def test_calo_presenze_score_inferiore_al_fedele():
    """Calo: presente nelle precedenti 8 ma assente nelle ultime 8 → trend penalizza."""
    dates = _past_dates(16)
    recenti = set(dates[:8])
    precedenti = set(dates[8:])
    # Solo nelle precedenti
    db_stabile = _make_db(dates, recenti, n_stagioni=2)
    db_calo    = _make_db(dates, precedenti, n_stagioni=2)
    score_stabile = calculate_renewal_probability(1, 99, db_stabile)["score_pct"]
    score_calo    = calculate_renewal_probability(1, 99, db_calo)["score_pct"]
    assert score_calo < score_stabile


def test_dormiente_score_basso():
    """Dormiente: nessuna presenza, 1 stagione vecchia, nessun shop."""
    dates = _past_dates(16)
    db = _make_db(dates, set(), n_stagioni=1)
    result = calculate_renewal_probability(1, 99, db)
    assert result["score_pct"] < 40


def test_nuovo_senza_dati_score_neutro():
    """Nuovo: nessuna partita in calendario → dati incompleti, score 0.5."""
    db = _make_db([], set(), n_stagioni=0)
    result = calculate_renewal_probability(1, 99, db)
    assert result["has_incomplete_data"] is True
    assert 30 <= result["score_pct"] <= 70


def test_determinismo():
    """Stesso input → stesso output, due chiamate consecutive."""
    dates = _past_dates(12)
    fan_dates = set(dates[:5])
    db1 = _make_db(dates, fan_dates, n_stagioni=1, shop_total=20.0)
    db2 = _make_db(dates, fan_dates, n_stagioni=1, shop_total=20.0)
    r1 = calculate_renewal_probability(1, 99, db1)
    r2 = calculate_renewal_probability(1, 99, db2)
    assert r1["score_pct"] == r2["score_pct"]
    assert r1["score"] == r2["score"]
