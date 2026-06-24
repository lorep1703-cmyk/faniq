"""Stadio 5 — Renewal Probability: output predittivo finale."""
from __future__ import annotations

from typing import Optional

from intelligence_config import (
    DECAY_FLOAT_MAP,
    FREQUENCY_WINDOW,
    LOYALTY_NORMALIZATION_SEASONS,
    RENEWAL_WEIGHTS,
    RFM_FLOAT_MAP,
)
from fan_intelligence import AnomalyAlert, AnomalySeverity, DataQuality, DecayProfile


def calculate_renewal(
    presence_flags: list[bool],        # dal più antico al più recente
    momentum: float,
    decay_profile: DecayProfile,
    rfm_segment: str,
    n_subscription_seasons: int,
    anomaly: Optional[AnomalyAlert],
    data_quality: DataQuality,
) -> Optional[float]:
    """
    Restituisce renewal_probability (0.0 → 1.0) o None se dati insufficienti.
    """
    if data_quality == DataQuality.INSUFFICIENT:
        return None

    recent = presence_flags[-FREQUENCY_WINDOW:]
    frequency = sum(recent) / len(recent) if recent else 0.0

    base_score    = RFM_FLOAT_MAP.get(rfm_segment, 0.40)
    decay_factor  = DECAY_FLOAT_MAP.get(decay_profile.value, 0.50)
    trend         = (momentum + 1) / 2                                          # normalizza -1..1 → 0..1
    loyalty_depth = min(n_subscription_seasons / LOYALTY_NORMALIZATION_SEASONS, 1.0)

    # anomalia critica azzera il contributo no_anomaly
    no_anomaly = 0.0 if (anomaly and anomaly.severity == AnomalySeverity.CRITICA) else 1.0

    w = RENEWAL_WEIGHTS
    score = (
        base_score    * w["base"]
        + frequency   * w["frequency"]
        + trend       * w["trend"]
        + decay_factor * w["decay"]
        + loyalty_depth * w["loyalty"]
        + no_anomaly  * w["no_anomaly"]
    )
    return round(min(1.0, max(0.0, score)), 4)
