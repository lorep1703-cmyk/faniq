"""Analisi comportamentale: presenza casa/trasferta, loyalty badge per tifoso."""
from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from models import Biglietto, Partita


def _badge(away_rate: float, total_away: int) -> str:
    if total_away == 0:
        return "Nessun dato trasferta"
    if away_rate >= 0.5:
        return "Ultras"
    if away_rate >= 0.25:
        return "Fedele trasferta"
    if away_rate < 0.05:
        return "Casa-only"
    return "Occasionale"


def compute_behavioral(db: Session, club_id: int) -> dict:
    """
    Restituisce analisi comportamentale basata sul calendario partite.
    Ritorna {} se nessuna partita è stata caricata.
    """
    partite = db.query(Partita).filter(Partita.club_id == club_id).all()
    if not partite:
        return {}

    today = date.today()

    home_dates = {p.data for p in partite if p.casa_trasferta == "casa"}
    away_dates = {p.data for p in partite if p.casa_trasferta == "trasferta"}
    past_home  = {d for d in home_dates if d <= today}
    past_away  = {d for d in away_dates if d <= today}

    total_home = len(past_home)
    total_away = len(past_away)

    # Prossima partita
    future = sorted([p for p in partite if p.data > today], key=lambda p: p.data)
    next_match = None
    if future:
        nm = future[0]
        next_match = {
            "data": nm.data.isoformat(),
            "avversario": nm.avversario,
            "casa_trasferta": nm.casa_trasferta,
            "competizione": nm.competizione,
        }

    # Biglietti per fan
    biglietti = db.query(Biglietto).filter(Biglietto.club_id == club_id).all()
    fan_dates: dict[int, set] = {}
    for b in biglietti:
        if b.data_partita:
            fan_dates.setdefault(b.fan_id, set()).add(b.data_partita)

    fan_scores: dict[int, dict] = {}
    for fan_id, dates in fan_dates.items():
        home_att = len(dates & past_home)
        away_att = len(dates & past_away)
        home_rate = home_att / total_home if total_home else 0
        away_rate = away_att / total_away if total_away else 0
        fan_scores[fan_id] = {
            "home_attended": home_att,
            "away_attended": away_att,
            "home_rate": round(home_rate * 100),
            "away_rate": round(away_rate * 100),
            "badge": _badge(away_rate, total_away),
        }

    badge_counts: dict[str, int] = {}
    for s in fan_scores.values():
        badge_counts[s["badge"]] = badge_counts.get(s["badge"], 0) + 1

    return {
        "total_partite": len(partite),
        "total_home": len(home_dates),
        "total_away": len(away_dates),
        "past_home": total_home,
        "past_away": total_away,
        "next_match": next_match,
        "badge_counts": badge_counts,
        "fan_scores": fan_scores,
    }
