"""Stadio 3 — Subscription Anomaly: alert operativo per abbonati silenti."""
from __future__ import annotations

from typing import Optional

from intelligence_config import (
    ANOMALY_CRITICAL_ABSENCES,
    ANOMALY_CRITICAL_ABSENCES_MAX,
    ANOMALY_CRITICAL_ABSENCES_MIN,
    ANOMALY_DECAY_MARGIN,
    ANOMALY_HIGH_ABSENCES,
    ANOMALY_LOYALTY_SEASONS_PER_MARGIN,
    ANOMALY_MARGIN_MAX,
    ANOMALY_MARGIN_MIN,
    ANOMALY_MEDIUM_ABSENCES,
)
from fan_intelligence import AnomalyAlert, AnomalySeverity, DecayProfile, JourneyStage


def calculate_anomaly(
    presence_flags: list[bool],      # dal più antico al più recente
    has_active_subscription: bool,
    journey_stage: JourneyStage,     # solo per il testo del messaggio
    decay_profile: DecayProfile,     # modula la soglia di allarme
    n_subscription_seasons: int,     # modula la soglia di allarme
) -> Optional[AnomalyAlert]:
    """
    Genera un AnomalyAlert solo se il fan è abbonato e ha assenze consecutive.
    Le soglie di severity si adattano a decay profile e storico abbonamenti:
    un fan solido/fedele ha più margine prima di essere segnalato, uno nuovo
    o storicamente volatile ne ha meno — vedi _effective_thresholds.
    """
    if not has_active_subscription:
        return None
    if not presence_flags:
        return None

    consecutive = _count_trailing_absences(presence_flags)
    if consecutive == 0:
        return None

    severity = _compute_severity(consecutive, decay_profile, n_subscription_seasons)
    if severity is None:
        return None

    label = _stage_label(journey_stage)
    message = (
        f"Abbonato assente da {consecutive} partite consecutive. "
        f"Stadio attuale: {label}."
    )
    return AnomalyAlert(
        severity=severity,
        message=message,
        consecutive_absences=consecutive,
    )


def _count_trailing_absences(flags: list[bool]) -> int:
    count = 0
    for present in reversed(flags):
        if present:
            break
        count += 1
    return count


def _effective_thresholds(
    decay_profile: DecayProfile,
    n_subscription_seasons: int,
) -> tuple[int, int, int]:
    """Soglie (critica, alta, media) spostate da un margine calcolato su
    decay profile + storico abbonamenti. Il gap tra le soglie resta quello
    base (2 e 1), solo il blocco si sposta."""
    decay_margin = ANOMALY_DECAY_MARGIN.get(decay_profile.value, 0)
    loyalty_margin = n_subscription_seasons // ANOMALY_LOYALTY_SEASONS_PER_MARGIN
    margin = max(ANOMALY_MARGIN_MIN, min(ANOMALY_MARGIN_MAX, decay_margin + loyalty_margin))

    critica = max(
        ANOMALY_CRITICAL_ABSENCES_MIN,
        min(ANOMALY_CRITICAL_ABSENCES_MAX, ANOMALY_CRITICAL_ABSENCES + margin),
    )
    alta = max(1, critica - (ANOMALY_CRITICAL_ABSENCES - ANOMALY_HIGH_ABSENCES))
    media = max(1, alta - (ANOMALY_HIGH_ABSENCES - ANOMALY_MEDIUM_ABSENCES))
    return critica, alta, media


def _compute_severity(
    absences: int,
    decay_profile: DecayProfile,
    n_subscription_seasons: int,
) -> Optional[AnomalySeverity]:
    critica, alta, media = _effective_thresholds(decay_profile, n_subscription_seasons)
    if absences >= critica:
        return AnomalySeverity.CRITICA
    if absences >= alta:
        return AnomalySeverity.ALTA
    if absences >= media:
        return AnomalySeverity.MEDIA
    return None


def _stage_label(stage: JourneyStage) -> str:
    labels = {
        JourneyStage.SCOPERTA:  "Scoperta",
        JourneyStage.ABITUDINE: "Abitudine",
        JourneyStage.FEDELTA:   "Fedeltà",
        JourneyStage.PICCO:     "Picco",
        JourneyStage.RISCHIO:   "Declino",
        JourneyStage.DORMIENTE: "Dormiente",
        JourneyStage.RECUPERATO: "Recuperato",
    }
    return labels.get(stage, stage.value)
