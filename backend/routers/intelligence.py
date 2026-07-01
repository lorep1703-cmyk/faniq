"""Endpoint Fan Intelligence Engine."""
from __future__ import annotations

import threading
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


# Un lock per club_id: evita che più richieste concorrenti sulla stessa cache
# "fredda" (es. subito dopo un riavvio, quando sidebar e pagina chiedono i dati
# quasi nello stesso istante) ricalcolino l'intelligence in parallelo, ognuna
# per conto proprio. Scoped per club_id — un club non aspetta mai per colpa
# di un altro club.
_compute_locks: dict[int, threading.Lock] = {}
_compute_locks_guard = threading.Lock()


def _get_compute_lock(club_id: int) -> threading.Lock:
    with _compute_locks_guard:
        lock = _compute_locks.get(club_id)
        if lock is None:
            lock = threading.Lock()
            _compute_locks[club_id] = lock
        return lock


def _build_cache(club_id: int, db) -> list[dict]:
    """Calcola intelligence, serializza e aggiunge nome/cognome in un'unica passata."""
    from sqlalchemy import text
    results = compute_club_intelligence(club_id, db)
    rows = db.execute(
        text("SELECT id, nome, cognome FROM fans WHERE club_id = :cid"),
        {"cid": club_id},
    ).fetchall()
    names = {row[0]: (row[1], row[2]) for row in rows}
    items = []
    for fi in results:
        row = _serialize(fi)
        nome, cognome = names.get(fi.fan_id, (None, None))
        row["nome"] = nome
        row["cognome"] = cognome
        items.append(row)
    return items


def _get_or_compute(club_id: int, db) -> list[dict]:
    key = _intel_cache_key(club_id)
    cached = cache_get(key)
    if cached is not None:
        return cached

    lock = _get_compute_lock(club_id)
    with lock:
        # Ricontrolla: un'altra richiesta potrebbe aver già calcolato e messo
        # in cache il risultato mentre aspettavamo il lock.
        cached = cache_get(key)
        if cached is not None:
            return cached
        items = _build_cache(club_id, db)
        cache_set(key, items)
        return items

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
    per_page: int = Query(50, ge=1, le=5000),  # paginazione in-memory; DB-level è ottimizzazione futura
    min_renewal: float = Query(0.0, ge=0.0, le=1.0),
    max_renewal: float = Query(1.0, ge=0.0, le=1.0),
    journey_stage: Optional[str] = Query(None),
    sort: str = Query("renewal_asc", regex="^(renewal_asc|renewal_desc|score_asc|score_desc)$"),
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    items = _get_or_compute(club.id, db)

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
    renewal_values = [r["renewal_probability"] for r in results if r.get("renewal_probability") is not None]
    avg_renewal = round(sum(renewal_values) / len(renewal_values), 3) if renewal_values else None

    fans_at_risk = sum(
        1 for r in results
        if r.get("renewal_probability") is not None and r["renewal_probability"] < 0.4
    )
    fans_critical_anomaly = sum(
        1 for r in results
        if r.get("subscription_anomaly") and r["subscription_anomaly"].get("severity") == "CRITICA"
    )

    journey_dist = Counter(r["journey_stage"] for r in results if r.get("journey_stage"))
    decay_dist = Counter(r["decay_profile"] for r in results if r.get("decay_profile"))

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


def _do_refresh(club_id: int) -> None:
    from database import SessionLocal
    from sqlalchemy import text
    import logging
    db = SessionLocal()
    try:
        _refresh_jobs[club_id] = "running"
        # Necessario su PostgreSQL: il background task apre una sessione nuova
        # senza il middleware RLS → lo settiamo esplicitamente.
        db.execute(text("SET app.current_club_id = :cid"), {"cid": str(club_id)})
        items = _build_cache(club_id, db)
        cache_set(_intel_cache_key(club_id), items)
        _refresh_jobs[club_id] = "done"
    except Exception:
        logging.exception("Errore durante il refresh intelligence per club_id=%s", club_id)
        _refresh_jobs[club_id] = "error"
    finally:
        db.close()


@router.post("/club/refresh")
def refresh_club_intelligence(
    background_tasks: BackgroundTasks,
    club: Club = Depends(get_current_club),
):
    job_id = f"refresh_{club.id}"
    current = _refresh_jobs.get(club.id)
    if current in ("queued", "running"):
        return {"job_id": job_id, "status": current}
    _refresh_jobs[club.id] = "queued"
    background_tasks.add_task(_do_refresh, club.id)
    return {"job_id": job_id, "status": "queued"}


@router.get("/club/refresh/status")
def refresh_status(
    club: Club = Depends(get_current_club),
):
    status = _refresh_jobs.get(club.id, "idle")
    return {"status": status}
