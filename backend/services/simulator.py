"""Simulatore affluenza stadio."""
from sqlalchemy.orm import Session

from models import Biglietto

MATCH_MULTIPLIERS = {"standard": 1.0, "importante": 1.25, "derby": 1.5, "finale": 1.4}
WEATHER_MULTIPLIERS = {"sole": 1.0, "nuvoloso": 0.95, "pioggia": 0.75, "neve": 0.6}
PROMO_MULTIPLIERS = {"nessuna": 1.0, "sconto_10": 1.1, "sconto_20": 1.2, "family_pack": 1.15}


def suggested_base(db: Session, club_id: int) -> dict:
    biglietti = db.query(Biglietto).filter(Biglietto.club_id == club_id).all()
    if not biglietti:
        return {"base": 1500, "source": "default", "avg_per_match": 0, "matches": 0}

    by_date: dict = {}
    for b in biglietti:
        if b.data_partita:
            by_date[b.data_partita] = by_date.get(b.data_partita, 0) + 1

    if not by_date:
        return {"base": 1500, "source": "default", "avg_per_match": 0, "matches": 0}

    avg = sum(by_date.values()) / len(by_date)
    return {"base": round(avg), "source": "historical", "avg_per_match": round(avg), "matches": len(by_date)}


def simulate_attendance(
    base: float,
    match_type: str = "standard",
    weather: str = "sole",
    promo: str = "nessuna",
    capienza: int = 7500,
    prezzo_medio: float = 15,
    abbonati: int = 0,
) -> dict:
    m_mult = MATCH_MULTIPLIERS.get(match_type, 1.0)
    w_mult = WEATHER_MULTIPLIERS.get(weather, 1.0)
    p_mult = PROMO_MULTIPLIERS.get(promo, 1.0)

    biglietti_stimati = base * m_mult * w_mult * p_mult
    totale = min(capienza, round(biglietti_stimati) + abbonati)
    revenue_stimata = round(totale * prezzo_medio * 0.6 + abbonati * prezzo_medio * 0.4, 2)
    occupazione = round(totale / capienza * 100, 1) if capienza else 0

    return {
        "affluenza_stimata": totale,
        "biglietti_stimati": round(biglietti_stimati),
        "abbonati": abbonati,
        "occupazione_pct": occupazione,
        "revenue_stimata": revenue_stimata,
        "capienza": capienza,
        "fattori": {
            "match_type": match_type,
            "match_multiplier": m_mult,
            "weather": weather,
            "weather_multiplier": w_mult,
            "promo": promo,
            "promo_multiplier": p_mult,
        },
    }
