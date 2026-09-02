"""Stadio 4 — Ambassador Score: impatto sociale del tifoso."""
from __future__ import annotations

import statistics
from datetime import date, timedelta
from typing import Optional

from intelligence_config import (
    AMBASSADOR_DECAY_MONTHS,
    AMBASSADOR_MULTI_TICKET_MIN,
    AMBASSADOR_WEIGHT_AVG,
    AMBASSADOR_WEIGHT_FREQ,
    AMBASSADOR_WEIGHT_VAR,
)


def calculate_ambassador(
    purchases: list[dict],   # [{"date": date, "n_tickets": int, "amount": float}]
    total_presences: int,
) -> int:
    """
    Restituisce ambassador_score (0-100).
    I purchases devono includere anche quelli con n_tickets = 1 (per la frequenza base).
    """
    if not purchases:
        return 0

    ticket_counts = [p["n_tickets"] for p in purchases]
    avg_tickets = statistics.mean(ticket_counts) if ticket_counts else 0

    # Varianza dei gruppi: solo sugli acquisti multipli
    multi = [p["n_tickets"] for p in purchases if p["n_tickets"] >= AMBASSADOR_MULTI_TICKET_MIN]
    group_variance = statistics.variance(multi) if len(multi) >= 2 else 0.0

    # Frequenza acquisti con biglietti multipli
    multi_freq = len(multi) / len(purchases) if purchases else 0.0

    # Score grezzo 0-1
    avg_norm = min(avg_tickets / 5.0, 1.0)          # 5+ biglietti per acquisto → 1.0
    var_norm = min(group_variance / 4.0, 1.0)        # varianza ≥ 4 → 1.0
    raw_score = (
        avg_norm   * AMBASSADOR_WEIGHT_AVG
        + var_norm * AMBASSADOR_WEIGHT_VAR
        + multi_freq * AMBASSADOR_WEIGHT_FREQ
    )

    # Decay: se negli ultimi AMBASSADOR_DECAY_MONTHS nessun acquisto multiplo → -40%
    cutoff = date.today() - timedelta(days=AMBASSADOR_DECAY_MONTHS * 30)
    recent_multi = [
        p for p in purchases
        if p["n_tickets"] >= AMBASSADOR_MULTI_TICKET_MIN
        and p.get("date") is not None
        and p["date"] >= cutoff
    ]
    if not recent_multi:
        raw_score *= 0.60

    return min(100, round(raw_score * 100))
