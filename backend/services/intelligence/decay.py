"""Stadio 1 — Decay Profile: analizza il pattern storico assenza→ritorno."""
from __future__ import annotations

import statistics
from typing import Optional

from intelligence_config import (
    DECAY_HALFLIFE_FAST_MAX,
    DECAY_HALFLIFE_FAST_MIN,
    DECAY_HALFLIFE_MEDIUM_MAX,
    DECAY_HALFLIFE_MEDIUM_MIN,
    DECAY_HALFLIFE_SLOW_MIN,
    DECAY_VOLATILE_CV_THRESHOLD,
    MIN_MATCHES_FOR_DECAY,
)
from fan_intelligence import DecayProfile


def calculate_decay(
    presence_flags: list[bool],   # True = presente, ordinata dal più antico al più recente
    rfm_segment: str,
) -> tuple[DecayProfile, Optional[float]]:
    """
    Restituisce (DecayProfile, half_life_value).
    half_life_value = media delle pause (in numero di partite) tra presenze consecutive.
    Se storico insufficiente usa rfm_segment come proxy.
    """
    if len(presence_flags) < MIN_MATCHES_FOR_DECAY:
        return _decay_from_rfm(rfm_segment), None

    pauses = _compute_pauses(presence_flags)
    if not pauses:
        # Mai assente → LENTO
        return DecayProfile.LENTO, 0.0

    half_life = statistics.mean(pauses)

    # Coefficient of variation: alta varianza → VOLATILE
    if len(pauses) >= 2:
        cv = statistics.stdev(pauses) / half_life if half_life > 0 else 0
        if cv > DECAY_VOLATILE_CV_THRESHOLD:
            return DecayProfile.VOLATILE, round(half_life, 2)

    profile = _classify_halflife(half_life)
    return profile, round(half_life, 2)


def _compute_pauses(flags: list[bool]) -> list[int]:
    """Estrae la lunghezza di ogni sequenza di assenze tra due presenze."""
    pauses: list[int] = []
    gap = 0
    in_gap = False
    for present in flags:
        if present:
            if in_gap:
                pauses.append(gap)
                gap = 0
                in_gap = False
        else:
            gap += 1
            in_gap = True
    return pauses


def _classify_halflife(hl: float) -> DecayProfile:
    if hl >= DECAY_HALFLIFE_SLOW_MIN:
        return DecayProfile.LENTO
    if DECAY_HALFLIFE_MEDIUM_MIN <= hl <= DECAY_HALFLIFE_MEDIUM_MAX:
        return DecayProfile.MEDIO
    if DECAY_HALFLIFE_FAST_MIN <= hl <= DECAY_HALFLIFE_FAST_MAX:
        return DecayProfile.RAPIDO
    # hl < 1 → ritorna quasi subito dopo ogni assenza
    return DecayProfile.RAPIDO


def _decay_from_rfm(rfm_segment: str) -> DecayProfile:
    """Proxy quando lo storico è insufficiente."""
    mapping = {
        "VIP":        DecayProfile.LENTO,
        "Fedele":     DecayProfile.LENTO,
        "Occasionale": DecayProfile.MEDIO,
        "Nuovo":      DecayProfile.MEDIO,
        "A rischio":  DecayProfile.RAPIDO,
        "Dormiente":  DecayProfile.VOLATILE,
    }
    return mapping.get(rfm_segment, DecayProfile.MEDIO)
