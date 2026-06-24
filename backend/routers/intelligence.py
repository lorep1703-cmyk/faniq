"""Endpoint Fan Intelligence Engine."""
from __future__ import annotations

from collections import Counter
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from fan_intelligence import DataQuality, FanIntelligence, JourneyStage
from models import Club, Fan
from services.cache import get as cache_get, set as cache_set
from services.intelligence.engine import compute_club_intelligence, compute_fan_intelligence
from tenant import get_current_club


def _intel_cache_key(club_id: int) -> str:
    return f"intelligence_{club_id}"


def _get_or_compute(club_id: int, db) -> list:
    key = _intel_cache_key(club_id)
    cached = cache_get(key)
    if cached is not None:
        return cached
    results = compute_club_intelligence(club_id, db)
    cache_set(key, results)
    return results

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])


# ── Serializzazione ────────────────────────────────────────────────────────

def _serialize(fi: FanIntelligence) -> dict:
    anomaly = None
    if fi.subscription_anomaly:
        a = fi.subscription_anomaly
        anomaly = {
            "severity": a.severity.value,
            "message": a.message,
            "consecutive_absences": a.consecutive_absences,
        }
    return {
        "fan_id": fi.fan_id,
        "renewal_probability": fi.renewal_probability,
        "journey_stage": fi.journey_stage.value if fi.journey_stage else None,
        "decay_profile": fi.decay_profile.value if fi.decay_profile else None,
        "ambassador_score": fi.ambassador_score,
        "subscription_anomaly": anomaly,
        "intelligence_score": fi.intelligence_score,
        "computed_at": fi.computed_at.isoformat(),
        "data_quality": fi.data_quality.value,
        "momentum": fi.momentum,
    }


# ── Endpoint singolo fan ───────────────────────────────────────────────────

@router.get("/fan/{fan_id}")
def get_fan_intelligence(
    fan_id: int,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club.id).first()
    if not fan:
        raise HTTPException(404, "Fan non trovato")
    fi = compute_fan_intelligence(fan_id, club.id, db)
    return _serialize(fi)


# ── Endpoint lista club ────────────────────────────────────────────────────

@router.get("/club")
def get_club_intelligence(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=5000),
    min_renewal: float = Query(0.0, ge=0.0, le=1.0),
    max_renewal: float = Query(1.0, ge=0.0, le=1.0),
    journey_stage: Optional[str] = Query(None),
    sort: str = Query("renewal_asc", regex="^(renewal_asc|renewal_desc|score_asc|score_desc)$"),
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    results = _get_or_compute(club.id, db)

    # Arricchisce con nome fan
    fans = db.query(Fan).filter(Fan.club_id == club.id).all()
    fan_map = {f.id: f for f in fans}

    items = []
    for fi in results:
        fan = fan_map.get(fi.fan_id)
        row = _serialize(fi)
        row["nome"] = fan.nome if fan else None
        row["cognome"] = fan.cognome if fan else None
        items.append(row)

    # Filtri
    def _within_renewal(r: dict) -> bool:
        rp = r.get("renewal_probability")
        if rp is None:
            return False
        return min_renewal <= rp <= max_renewal

    items = [r for r in items if _within_renewal(r)]

    if journey_stage:
        items = [r for r in items if r.get("journey_stage") == journey_stage.upper()]

    # Ordinamento
    reverse = sort.endswith("_desc")
    key = "renewal_probability" if sort.startswith("renewal") else "intelligence_score"
    items.sort(key=lambda r: (r.get(key) or 0), reverse=reverse)

    total = len(items)
    start = (page - 1) * per_page
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": items[start: start + per_page],
    }


# ── Summary club ───────────────────────────────────────────────────────────

@router.get("/club/summary")
def get_club_summary(
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    results = _get_or_compute(club.id, db)

    total = len(results)
    renewal_values = [fi.renewal_probability for fi in results if fi.renewal_probability is not None]
    avg_renewal = round(sum(renewal_values) / len(renewal_values), 3) if renewal_values else None

    fans_at_risk = sum(
        1 for fi in results
        if fi.renewal_probability is not None and fi.renewal_probability < 0.4
    )
    fans_critical_anomaly = sum(
        1 for fi in results
        if fi.subscription_anomaly and fi.subscription_anomaly.severity.value == "CRITICA"
    )

    journey_dist = Counter(
        fi.journey_stage.value for fi in results if fi.journey_stage
    )
    decay_dist = Counter(
        fi.decay_profile.value for fi in results if fi.decay_profile
    )

    return {
        "total_fans": total,
        "avg_renewal_probability": avg_renewal,
        "fans_at_risk": fans_at_risk,
        "fans_critical_anomaly": fans_critical_anomaly,
        "journey_distribution": dict(journey_dist),
        "decay_distribution": dict(decay_dist),
    }


# ── Refresh asincrono ──────────────────────────────────────────────────────

_refresh_jobs: dict[int, str] = {}  # club_id → status


def _do_refresh(club_id: int, db: Session) -> None:
    try:
        _refresh_jobs[club_id] = "running"
        compute_club_intelligence(club_id, db)
        _refresh_jobs[club_id] = "done"
    except Exception:
        _refresh_jobs[club_id] = "error"
    finally:
        db.close()


@router.post("/club/refresh")
def refresh_club_intelligence(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    job_id = f"refresh_{club.id}"
    _refresh_jobs[club.id] = "queued"
    background_tasks.add_task(_do_refresh, club.id, db)
    return {"job_id": job_id, "status": "queued"}


@router.get("/club/refresh/status")
def refresh_status(
    club: Club = Depends(get_current_club),
):
    status = _refresh_jobs.get(club.id, "idle")
    return {"status": status}
