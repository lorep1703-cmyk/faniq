"""FanIntelligence — oggetto puro Python (non ORM), output della pipeline."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class JourneyStage(str, Enum):
    SCOPERTA  = "SCOPERTA"
    ABITUDINE = "ABITUDINE"
    FEDELTA   = "FEDELTA"
    PICCO     = "PICCO"
    RISCHIO   = "RISCHIO"
    DORMIENTE = "DORMIENTE"
    RECUPERATO = "RECUPERATO"


class DecayProfile(str, Enum):
    LENTO    = "LENTO"
    MEDIO    = "MEDIO"
    RAPIDO   = "RAPIDO"
    VOLATILE = "VOLATILE"


class AnomalySeverity(str, Enum):
    MEDIA   = "MEDIA"
    ALTA    = "ALTA"
    CRITICA = "CRITICA"


class DataQuality(str, Enum):
    FULL         = "FULL"
    PARTIAL      = "PARTIAL"
    INSUFFICIENT = "INSUFFICIENT"


@dataclass
class AnomalyAlert:
    severity: AnomalySeverity
    message: str
    consecutive_absences: int

    def __repr__(self) -> str:
        return f"AnomalyAlert({self.severity}, assenze={self.consecutive_absences})"


@dataclass
class FanIntelligence:
    fan_id: int
    renewal_probability: Optional[float] = None    # 0.0 → 1.0
    journey_stage: Optional[JourneyStage] = None
    decay_profile: Optional[DecayProfile] = None
    ambassador_score: Optional[int] = None          # 0 → 100
    subscription_anomaly: Optional[AnomalyAlert] = None
    intelligence_score: Optional[int] = None        # 0 → 100
    computed_at: datetime = field(default_factory=datetime.utcnow)
    data_quality: DataQuality = DataQuality.INSUFFICIENT

    # Campi intermedi utili per debug/frontend
    momentum: Optional[float] = None               # -1.0 → +1.0
    half_life_value: Optional[float] = None

    def __repr__(self) -> str:
        return (
            f"FanIntelligence(fan_id={self.fan_id}, "
            f"score={self.intelligence_score}, "
            f"renewal={self.renewal_probability:.2f if self.renewal_probability is not None else 'N/D'}, "
            f"journey={self.journey_stage}, "
            f"decay={self.decay_profile}, "
            f"quality={self.data_quality})"
        )
