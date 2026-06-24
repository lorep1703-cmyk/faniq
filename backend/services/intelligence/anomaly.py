"""Stadio 3 — Subscription Anomaly: alert operativo per abbonati silenti."""
from __future__ import annotations

from typing import Optional

from intelligence_config import (
    ANOMALY_CRITICAL_ABSENCES,
    ANOMALY_HIGH_ABSENCES,
    ANOMALY_MEDIUM_ABSENCES,
)
from fan_intelligence import AnomalyAlert, AnomalySeverity, JourneyStage


def calculate_anomaly(
    presence_flags: list[bool],      # dal più antico al più recente
    has_active_subscription: bool,
    journey_stage: JourneyStage,
) -> Optional[AnomalyAlert]:
    """
    Genera un AnomalyAlert solo se il fan è abbonato e ha assenze consecutive.
    Severity scala con journey_stage: un RISCHIO è più urgente di un FEDELTA.
    """
    if not has_active_subscription:
        return None
    if not presence_flags:
        return None

    consecutive = _count_trailing_absences(presence_flags)
    if consecutive == 0:
        return None

    severity = _compute_severity(consecutive, journey_stage)
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


def _compute_severity(
    absences: int,
    stage: JourneyStage,
) -> Optional[AnomalySeverity]:
    # RISCHIO + 5 assenze → CRITICA; con meno assenze scala
    if stage == JourneyStage.RISCHIO:
        if absences >= ANOMALY_CRITICAL_ABSENCES:
            return AnomalySeverity.CRITICA
        if absences >= ANOMALY_HIGH_ABSENCES:
            return AnomalySeverity.ALTA
        if absences >= ANOMALY_MEDIUM_ABSENCES:
            return AnomalySeverity.MEDIA
    elif stage == JourneyStage.FEDELTA:
        # FEDELTA + 3 assenze → già ALTA (fan fedele che sparisce è preoccupante)
        if absences >= ANOMALY_HIGH_ABSENCES:
            return AnomalySeverity.ALTA
        if absences >= ANOMALY_MEDIUM_ABSENCES:
            return AnomalySeverity.MEDIA
    else:
        # Tutti gli altri stage: soglie standard
        if absences >= ANOMALY_CRITICAL_ABSENCES:
            return AnomalySeverity.CRITICA
        if absences >= ANOMALY_HIGH_ABSENCES:
            return AnomalySeverity.ALTA
        if absences >= ANOMALY_MEDIUM_ABSENCES:
            return AnomalySeverity.MEDIA
    return None


def _stage_label(stage: JourneyStage) -> str:
    labels = {
        JourneyStage.SCOPERTA:  "Scoperta",
        JourneyStage.ABITUDINE: "Abitudine",
        JourneyStage.FEDELTA:   "Fedeltà",
        JourneyStage.PICCO:     "Picco",
        JourneyStage.RISCHIO:   "Rischio",
        JourneyStage.DORMIENTE: "Dormiente",
        JourneyStage.RECUPERATO: "Recuperato",
    }
    return labels.get(stage, stage.value)
