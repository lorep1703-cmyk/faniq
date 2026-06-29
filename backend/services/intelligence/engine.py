"""Fan Intelligence Engine — orchestratore della pipeline a 5 stadi."""
from __future__ import annotations

import logging
import time
from datetime import date
from typing import Optional

INTELLIGENCE_BATCH_SIZE = 200  # fan per batch — mantiene il picco RAM sotto controllo

from sqlalchemy.orm import Session, selectinload

from intelligence_config import (
    CAP_DORMIENTE,
    MIN_MATCHES_FOR_DECAY,
    PENALTY_ANOMALY_CRITICAL,
    PENALTY_DECAY_VOLATILE,
)
from fan_intelligence import (
    AnomalySeverity,
    DataQuality,
    DecayProfile,
    FanIntelligence,
    JourneyStage,
)
from models import Abbonamento, Biglietto, Fan, Partita, ShopOrder
from services.intelligence.ambassador import calculate_ambassador
from services.intelligence.anomaly import calculate_anomaly
from services.intelligence.decay import calculate_decay
from services.intelligence.journey import calculate_journey
from services.intelligence.renewal import calculate_renewal

logger = logging.getLogger("faniq.intelligence")


# ── Struttura dati grezza per un fan ──────────────────────────────────────
class _FanRaw:
    __slots__ = (
        "fan_id", "club_id", "rfm_segment",
        "presence_flags", "has_active_subscription",
        "n_subscription_seasons", "purchases",
    )

    def __init__(
        self,
        fan_id: int,
        club_id: int,
        rfm_segment: str,
        presence_flags: list[bool],
        has_active_subscription: bool,
        n_subscription_seasons: int,
        purchases: list[dict],
    ):
        self.fan_id = fan_id
        self.club_id = club_id
        self.rfm_segment = rfm_segment
        self.presence_flags = presence_flags
        self.has_active_subscription = has_active_subscription
        self.n_subscription_seasons = n_subscription_seasons
        self.purchases = purchases


def _build_presence_flags(
    fan_ticket_dates: set[date],
    past_matches: list[date],
) -> list[bool]:
    """Costruisce la serie storica [True=presente] dal più antico al più recente."""
    return [d in fan_ticket_dates for d in past_matches]


def _determine_data_quality(presence_flags: list[bool]) -> DataQuality:
    total = len(presence_flags)
    if total == 0:
        return DataQuality.INSUFFICIENT
    if total < MIN_MATCHES_FOR_DECAY:
        return DataQuality.PARTIAL
    return DataQuality.FULL


def _rfm_from_fan(fan: Fan) -> str:
    """Calcola categoria RFM semplificata per usarla come proxy."""
    total_activities = len(fan.abbonamenti) + len(fan.biglietti) + len(fan.shop_orders)
    if len(fan.abbonamenti) >= 2 and total_activities >= 5:
        return "VIP"
    if len(fan.abbonamenti) >= 1 and total_activities >= 3:
        return "Fedele"
    if total_activities == 0:
        return "Dormiente"
    if total_activities == 1:
        return "Nuovo"
    return "Occasionale"


def _extract_fan_raw(
    fan: Fan,
    past_match_dates: list[date],
    current_season: str,
) -> _FanRaw:
    fan_ticket_dates = {b.data_partita for b in fan.biglietti if b.data_partita}
    presence_flags = _build_presence_flags(fan_ticket_dates, past_match_dates)

    has_sub = any(
        a.stagione == current_season for a in fan.abbonamenti
    )
    n_seasons = len({a.stagione for a in fan.abbonamenti if a.stagione})

    # Aggrega biglietti per data partita → un "acquisto" per data
    by_date: dict[date, int] = {}
    for b in fan.biglietti:
        if b.data_partita:
            by_date[b.data_partita] = by_date.get(b.data_partita, 0) + 1
    purchases = [{"date": d, "n_tickets": n, "amount": 0.0} for d, n in by_date.items()]

    rfm_segment = _rfm_from_fan(fan)

    return _FanRaw(
        fan_id=fan.id,
        club_id=fan.club_id,
        rfm_segment=rfm_segment,
        presence_flags=presence_flags,
        has_active_subscription=has_sub,
        n_subscription_seasons=n_seasons,
        purchases=purchases,
    )


def _run_pipeline(raw: _FanRaw) -> FanIntelligence:
    """Esegue i 5 stadi in sequenza e costruisce FanIntelligence."""
    data_quality = _determine_data_quality(raw.presence_flags)

    # Stadio 1 — Decay
    decay_profile, half_life = calculate_decay(raw.presence_flags, raw.rfm_segment)

    # Stadio 2 — Journey
    journey_stage, momentum = calculate_journey(
        raw.presence_flags,
        decay_profile,
        was_dormiente_last_week=False,  # non disponibile senza storico settimanale
    )

    # Stadio 3 — Anomaly
    anomaly = calculate_anomaly(
        raw.presence_flags,
        raw.has_active_subscription,
        journey_stage,
    )

    # Stadio 4 — Ambassador
    ambassador_score = calculate_ambassador(raw.purchases, sum(raw.presence_flags))

    # Stadio 5 — Renewal
    renewal_prob = calculate_renewal(
        raw.presence_flags,
        momentum,
        decay_profile,
        raw.rfm_segment,
        raw.n_subscription_seasons,
        anomaly,
        data_quality,
    )

    # Intelligence Score con penalità hard
    intelligence_score = _compute_intelligence_score(
        renewal_prob, anomaly, journey_stage, decay_profile, data_quality
    )

    return FanIntelligence(
        fan_id=raw.fan_id,
        renewal_probability=renewal_prob,
        journey_stage=journey_stage,
        decay_profile=decay_profile,
        ambassador_score=ambassador_score,
        subscription_anomaly=anomaly,
        intelligence_score=intelligence_score,
        data_quality=data_quality,
        momentum=momentum,
        half_life_value=half_life,
    )


def _compute_intelligence_score(
    renewal_prob: Optional[float],
    anomaly,
    journey_stage: JourneyStage,
    decay_profile: DecayProfile,
    data_quality: DataQuality,
) -> Optional[int]:
    if data_quality == DataQuality.INSUFFICIENT or renewal_prob is None:
        return None

    score = round(renewal_prob * 100)

    if anomaly and anomaly.severity == AnomalySeverity.CRITICA:
        score -= PENALTY_ANOMALY_CRITICAL

    if decay_profile == DecayProfile.VOLATILE:
        score -= PENALTY_DECAY_VOLATILE

    if journey_stage == JourneyStage.DORMIENTE:
        score = min(score, CAP_DORMIENTE)

    return max(0, score)


# ── Entry point pubblici ───────────────────────────────────────────────────

def compute_fan_intelligence(fan_id: int, club_id: int, db: Session) -> FanIntelligence:
    """Pipeline completa per un singolo fan."""
    fan = (
        db.query(Fan)
        .filter(Fan.id == fan_id, Fan.club_id == club_id)
        .options(
            selectinload(Fan.abbonamenti),
            selectinload(Fan.biglietti),
            selectinload(Fan.shop_orders),
        )
        .first()
    )
    if not fan:
        return FanIntelligence(fan_id=fan_id, data_quality=DataQuality.INSUFFICIENT)

    today = date.today()
    past_matches = _load_past_match_dates(club_id, today, db)
    current_season = _current_season()

    raw = _extract_fan_raw(fan, past_matches, current_season)
    return _run_pipeline(raw)


def compute_club_intelligence(club_id: int, db: Session) -> list[FanIntelligence]:
    """Pipeline batch per tutti i fan del club — processa INTELLIGENCE_BATCH_SIZE fan alla volta."""
    t0 = time.monotonic()

    today = date.today()
    # Partite: caricate una volta sola, condivise tra tutti i batch
    past_matches = _load_past_match_dates(club_id, today, db)
    current_season = _current_season()

    from sqlalchemy import func
    total = db.query(func.count(Fan.id)).filter(Fan.club_id == club_id).scalar() or 0

    results: list[FanIntelligence] = []
    offset = 0
    while offset < total:
        # 1. Carica solo gli ID del batch
        id_rows = (
            db.query(Fan.id)
            .filter(Fan.club_id == club_id)
            .order_by(Fan.id)
            .offset(offset)
            .limit(INTELLIGENCE_BATCH_SIZE)
            .all()
        )
        fan_ids = [row[0] for row in id_rows]
        if not fan_ids:
            break

        # 2. Carica i Fan completi (con relationship) solo per questo batch
        fans = (
            db.query(Fan)
            .filter(Fan.id.in_(fan_ids))
            .options(
                selectinload(Fan.abbonamenti),
                selectinload(Fan.biglietti),
                selectinload(Fan.shop_orders),
            )
            .all()
        )

        # 3. Estrai dati puri Python ed esegui pipeline — nessun riferimento ORM rimane
        for fan in fans:
            raw = _extract_fan_raw(fan, past_matches, current_season)
            results.append(_run_pipeline(raw))

        # 4. Libera gli oggetti ORM del batch dalla identity map di SQLAlchemy
        db.expunge_all()

        offset += INTELLIGENCE_BATCH_SIZE

    elapsed = time.monotonic() - t0
    logger.info(
        "compute_club_intelligence club_id=%s fans=%d batch_size=%d elapsed=%.2fs",
        club_id, total, INTELLIGENCE_BATCH_SIZE, elapsed,
    )
    return results


def _load_past_match_dates(club_id: int, today: date, db: Session) -> list[date]:
    """Carica le date partite passate ordinate dal più antico."""
    partite = (
        db.query(Partita.data)
        .filter(Partita.club_id == club_id, Partita.data <= today)
        .order_by(Partita.data.asc())
        .all()
    )
    return [row.data for row in partite]


def _current_season() -> str:
    """Stagione corrente nel formato '2024/25'."""
    y = date.today().year
    if date.today().month >= 7:
        return f"{y}/{str(y + 1)[-2:]}"
    return f"{y - 1}/{str(y)[-2:]}"
