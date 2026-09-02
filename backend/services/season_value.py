"""Spesa storica per stagione — base per il Valore futuro atteso (CLV in
avanti, Parte A) e per il Potenziale dormienti (Parte B). Un solo calcolo
riusato da entrambe le feature, non due versioni indipendenti.

Riusa lo stesso confine stagione (luglio-giugno) di
services.intelligence.engine.current_season_str, applicato qui a singole
date (Biglietto.data_partita, ShopOrder.data) invece che alla data odierna.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from models import Fan

SEASONS_FOR_RECENT_AVERAGE = 2


def _season_for_date(d: date) -> str:
    """Stagione (formato '2024/2025') a cui appartiene una data."""
    y = d.year
    if d.month >= 7:
        return f"{y}/{y + 1}"
    return f"{y - 1}/{y}"


def season_spend_breakdown(fan: Fan) -> dict[str, float]:
    """Spesa totale (abbonamento + biglietti + shop) per stagione, per un fan
    con abbonamenti/biglietti/shop_orders già caricati (selectinload)."""
    breakdown: dict[str, float] = {}

    for a in fan.abbonamenti:
        if a.stagione:
            breakdown[a.stagione] = breakdown.get(a.stagione, 0.0) + (a.importo_pagato or 0)

    for b in fan.biglietti:
        if b.data_partita:
            s = _season_for_date(b.data_partita)
            breakdown[s] = breakdown.get(s, 0.0) + (b.prezzo or 0)

    for o in fan.shop_orders:
        if o.data:
            s = _season_for_date(o.data)
            breakdown[s] = breakdown.get(s, 0.0) + (o.importo or 0)

    return breakdown


def recent_season_spend(fan: Fan, n_seasons: int = SEASONS_FOR_RECENT_AVERAGE) -> Optional[float]:
    """Media spesa sulle stagioni più recenti con attività (fino a n_seasons),
    o l'unica disponibile. None se il fan non ha nessuno storico di spesa —
    niente numeri inventati su dati mancanti."""
    breakdown = season_spend_breakdown(fan)
    if not breakdown:
        return None

    recent = sorted(breakdown.keys(), reverse=True)[:n_seasons]
    values = [breakdown[s] for s in recent]
    return round(sum(values) / len(values), 2)
