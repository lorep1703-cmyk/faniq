"""Calcoli analytics: RFM, segmentazione, dashboard KPI."""
from __future__ import annotations  # noqa: F401 — abilita X | Y su Python 3.9

from collections import Counter
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models import Abbonamento, Biglietto, Fan, ShopOrder
from services.cache import get as cache_get, set as cache_set



def _fan_activity_dates(fan: Fan) -> list[date]:
    dates: list[date] = []
    for b in fan.biglietti:
        if b.data_partita:
            dates.append(b.data_partita)
    for o in fan.shop_orders:
        if o.data:
            dates.append(o.data)
    return dates


def _fan_total_spend(fan: Fan) -> float:
    total = sum(a.importo_pagato or 0 for a in fan.abbonamenti)
    total += sum(b.prezzo or 0 for b in fan.biglietti)
    total += sum(o.importo or 0 for o in fan.shop_orders)
    return round(total, 2)


def _fan_n_sources(fan: Fan) -> int:
    n = 0
    if fan.abbonamenti:
        n += 1
    if fan.biglietti:
        n += 1
    if fan.shop_orders:
        n += 1
    return n


def _rfm_scores(fans_data: list[dict], today: date) -> None:
    if not fans_data:
        return

    recencies = [f["_recency_days"] for f in fans_data]
    frequencies = [f["_frequency"] for f in fans_data]
    monetaries = [f["total_spend"] for f in fans_data]

    def score_quintile(values, value, reverse=False):
        if not values:
            return 1
        sorted_vals = sorted(set(values))
        if len(sorted_vals) <= 1:
            return 3
        quintiles = []
        for i in range(1, 6):
            idx = min(int(len(sorted_vals) * i / 5) - 1, len(sorted_vals) - 1)
            quintiles.append(sorted_vals[max(0, idx)])
        for i, q in enumerate(quintiles):
            if value <= q:
                score = i + 1
                break
        else:
            score = 5
        return 6 - score if reverse else score

    for f in fans_data:
        f["r_score"] = score_quintile(recencies, f["_recency_days"], reverse=True)
        f["f_score"] = score_quintile(frequencies, f["_frequency"])
        f["m_score"] = score_quintile(monetaries, f["total_spend"])
        f["rfm_score"] = f["r_score"] + f["f_score"] + f["m_score"]

        r, fr, m = f["r_score"], f["f_score"], f["m_score"]
        if m >= 4 and fr >= 4:
            f["segment"] = "VIP"
        elif r >= 4 and fr >= 3:
            f["segment"] = "Fedele"
        elif r <= 2 and fr >= 3:
            f["segment"] = "A rischio"
        elif r <= 2 and fr <= 2:
            f["segment"] = "Dormiente"
        elif f["_frequency"] <= 1 and f["total_spend"] < 50:
            f["segment"] = "Nuovo"
        else:
            f["segment"] = "Occasionale"


def _build_fan_dict(fan: Fan, today: date) -> dict:
    activity_dates = _fan_activity_dates(fan)
    last_activity = max(activity_dates) if activity_dates else None
    recency_days = (today - last_activity).days if last_activity else 999
    frequency = len(fan.abbonamenti) + len(fan.biglietti) + len(fan.shop_orders)
    total_spend = _fan_total_spend(fan)

    return {
        "id": fan.id,
        "nome": fan.nome,
        "cognome": fan.cognome,
        "email": fan.email,
        "citta": fan.citta,
        "genere": fan.genere,
        "total_spend": total_spend,
        "rfm_score": 0,
        "r_score": 0,
        "f_score": 0,
        "m_score": 0,
        "segment": "Nuovo",
        "n_sources": _fan_n_sources(fan),
        "has_abbonamento": len(fan.abbonamenti) > 0,
        "has_biglietto": len(fan.biglietti) > 0,
        "has_shop": len(fan.shop_orders) > 0,
        "recency_days": recency_days,
        "last_activity": last_activity.isoformat() if last_activity else None,
        "consenso_marketing": fan.consenso_marketing,
        "consenso_profilazione": fan.consenso_profilazione,
        "_recency_days": recency_days,
        "_frequency": frequency,
    }


def compute_fan_segments(db: Session, club_id: int, force: bool = False) -> list[dict]:
    cache_key = f"fan_segments_{club_id}"
    cached = cache_get(cache_key) if not force else None
    if cached is not None:
        return cached

    today = date.today()
    fans = (
        db.query(Fan)
        .filter(Fan.club_id == club_id)
        .options(
            joinedload(Fan.abbonamenti),
            joinedload(Fan.biglietti),
            joinedload(Fan.shop_orders),
        )
        .all()
    )

    fans_data = [_build_fan_dict(f, today) for f in fans]
    _rfm_scores(fans_data, today)

    result = [{k: v for k, v in f.items() if not k.startswith("_")} for f in fans_data]
    cache_set(cache_key, result)
    return result


def get_all_fans_raw(db: Session, club_id: int) -> list[Fan]:
    return (
        db.query(Fan)
        .filter(Fan.club_id == club_id)
        .options(
            joinedload(Fan.abbonamenti),
            joinedload(Fan.biglietti),
            joinedload(Fan.shop_orders),
        )
        .all()
    )


def dashboard_stats(db: Session, club_id: int) -> dict:
    total_fans = db.query(func.count(Fan.id)).filter(Fan.club_id == club_id).scalar() or 0

    fans_with_email = (
        db.query(func.count(Fan.id))
        .filter(Fan.club_id == club_id, Fan.email.isnot(None), Fan.email != "")
        .scalar() or 0
    )

    rev_abb = db.query(func.sum(Abbonamento.importo_pagato)).filter(Abbonamento.club_id == club_id).scalar() or 0
    rev_big = db.query(func.sum(Biglietto.prezzo)).filter(Biglietto.club_id == club_id).scalar() or 0
    rev_shop = db.query(func.sum(ShopOrder.importo)).filter(ShopOrder.club_id == club_id).scalar() or 0
    total_revenue = round(float(rev_abb) + float(rev_big) + float(rev_shop), 2)

    spesa_media = round(total_revenue / total_fans, 2) if total_fans else 0
    return {
        "total_fans": total_fans,
        "fans_with_email": fans_with_email,
        "spesa_media": spesa_media,
        "total_revenue": total_revenue,
    }


def dashboard_citta(db: Session, club_id: int) -> list[dict]:
    rows = (
        db.query(Fan.citta, func.count(Fan.id))
        .filter(Fan.club_id == club_id)
        .group_by(Fan.citta)
        .all()
    )
    counts = Counter({(c or "Non indicata"): n for c, n in rows})
    return [{"citta": c, "count": n} for c, n in counts.most_common(5)]


def dashboard_presenze(db: Session, club_id: int) -> list[dict]:
    rows = (
        db.query(Biglietto.data_partita, func.count(Biglietto.id))
        .filter(Biglietto.club_id == club_id, Biglietto.data_partita.isnot(None))
        .group_by(Biglietto.data_partita)
        .order_by(Biglietto.data_partita)
        .all()
    )
    return [{"data": d.isoformat(), "presenze": n} for d, n in rows]


def dashboard_revenue_breakdown(db: Session, club_id: int) -> list[dict]:
    abbonamenti = db.query(func.sum(Abbonamento.importo_pagato)).filter(Abbonamento.club_id == club_id).scalar() or 0
    biglietti   = db.query(func.sum(Biglietto.prezzo)).filter(Biglietto.club_id == club_id).scalar() or 0
    shop        = db.query(func.sum(ShopOrder.importo)).filter(ShopOrder.club_id == club_id).scalar() or 0
    return [
        {"fonte": "Abbonamenti", "importo": round(abbonamenti, 2)},
        {"fonte": "Biglietteria", "importo": round(biglietti, 2)},
        {"fonte": "Shop", "importo": round(shop, 2)},
    ]


def dashboard_segments(db: Session, club_id: int) -> list[dict]:
    segments = compute_fan_segments(db, club_id)
    counts = Counter(s["segment"] for s in segments)
    return [{"segment": seg, "count": n} for seg, n in counts.items()]


def dashboard_top_spenders(db: Session, club_id: int, limit: int = 10) -> list[dict]:
    fans = compute_fan_segments(db, club_id)
    top = sorted(fans, key=lambda f: f["total_spend"], reverse=True)[:limit]
    return [
        {
            "id": f["id"],
            "nome": f["nome"],
            "cognome": f["cognome"],
            "email": f["email"],
            "total_spend": f["total_spend"],
            "segment": f["segment"],
        }
        for f in top
    ]


def dashboard_cross_source(db: Session, club_id: int) -> dict:
    from sqlalchemy import case, literal

    has_abb = (
        db.query(Abbonamento.fan_id)
        .filter(Abbonamento.club_id == club_id)
        .distinct()
        .subquery()
    )
    has_big = (
        db.query(Biglietto.fan_id)
        .filter(Biglietto.club_id == club_id)
        .distinct()
        .subquery()
    )
    has_shop = (
        db.query(ShopOrder.fan_id)
        .filter(ShopOrder.club_id == club_id)
        .distinct()
        .subquery()
    )

    n_sources = (
        case((Fan.id.in_(db.query(has_abb.c.fan_id)), 1), else_=0)
        + case((Fan.id.in_(db.query(has_big.c.fan_id)), 1), else_=0)
        + case((Fan.id.in_(db.query(has_shop.c.fan_id)), 1), else_=0)
    )

    rows = (
        db.query(n_sources.label("n"), func.count(Fan.id).label("cnt"))
        .filter(Fan.club_id == club_id)
        .group_by(n_sources)
        .all()
    )

    counts = {row.n: row.cnt for row in rows}
    single = counts.get(1, 0)
    multi = sum(v for k, v in counts.items() if k >= 2)
    triple = counts.get(3, 0)
    return {"single_source": single, "multi_source": multi, "all_three": triple}


def dashboard_retention(db: Session, club_id: int) -> list[dict]:
    rows = (
        db.query(Abbonamento.stagione, func.count(Abbonamento.id))
        .filter(Abbonamento.club_id == club_id)
        .group_by(Abbonamento.stagione)
        .all()
    )
    by_season = Counter({(s or "N/D"): n for s, n in rows})
    return [{"stagione": s, "count": n} for s, n in sorted(by_season.items())]


def dashboard_seasons(db: Session, club_id: int) -> list[str]:
    rows = (
        db.query(Abbonamento.stagione.distinct())
        .filter(Abbonamento.club_id == club_id)
        .order_by(Abbonamento.stagione.desc())
        .all()
    )
    return sorted(s for (s,) in rows if s)
