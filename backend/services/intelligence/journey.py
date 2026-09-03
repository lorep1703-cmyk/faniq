"""Stadio 2 — Journey Stage: posizione + direzione del tifoso."""
from __future__ import annotations

from intelligence_config import (
    JOURNEY_FEDELTA_MIN_RATE,
    JOURNEY_HIGH_MOMENTUM,
    JOURNEY_LOW_MOMENTUM,
    JOURNEY_PICCO_MIN_RATE,
    JOURNEY_WINDOW,
)
from fan_intelligence import DecayProfile, JourneyStage


def calculate_journey(
    presence_flags: list[bool],   # dal più antico al più recente
    decay_profile: DecayProfile,
    was_dormiente_last_week: bool = False,
) -> tuple[JourneyStage, float]:
    """
    Restituisce (JourneyStage, momentum).
    momentum: -1.0 (totale declino) → +1.0 (crescita massima).
    """
    if not presence_flags:
        return JourneyStage.DORMIENTE, -1.0

    recent = presence_flags[-JOURNEY_WINDOW:]
    previous = presence_flags[-(JOURNEY_WINDOW * 2):-JOURNEY_WINDOW]

    recent_rate = sum(recent) / len(recent) if recent else 0.0
    prev_rate = sum(previous) / len(previous) if previous else recent_rate

    momentum = _compute_momentum(recent_rate, prev_rate)

    # RECUPERATO: era dormiente ed è tornato
    if was_dormiente_last_week and any(recent[-2:]):
        return JourneyStage.RECUPERATO, momentum

    stage = _classify_stage(recent_rate, momentum)
    return stage, round(momentum, 3)


def _compute_momentum(recent_rate: float, prev_rate: float) -> float:
    """Differenza pesata normalizzata a [-1, +1]."""
    raw = recent_rate - prev_rate
    # Clamp a [-1, 1] (differenza massima possibile è 1.0)
    return max(-1.0, min(1.0, raw * 2))


def _classify_stage(
    recent_rate: float,
    momentum: float,
) -> JourneyStage:
    # DORMIENTE: quasi mai presente
    if recent_rate == 0.0:
        return JourneyStage.DORMIENTE

    # PICCO: presenza altissima
    if recent_rate >= JOURNEY_PICCO_MIN_RATE:
        return JourneyStage.PICCO

    # FEDELTA: presenza alta e stabile o in crescita
    if recent_rate >= JOURNEY_FEDELTA_MIN_RATE and momentum >= 0:
        return JourneyStage.FEDELTA

    # RISCHIO: momentum negativo oltre soglia
    if momentum <= JOURNEY_LOW_MOMENTUM:
        return JourneyStage.RISCHIO

    # ABITUDINE: presenza media, stabile
    if momentum > JOURNEY_LOW_MOMENTUM and recent_rate > 0.25:
        return JourneyStage.ABITUDINE

    # SCOPERTA: nuovo fan, poche presenze ma momentum positivo
    if momentum >= JOURNEY_HIGH_MOMENTUM:
        return JourneyStage.SCOPERTA

    return JourneyStage.ABITUDINE
