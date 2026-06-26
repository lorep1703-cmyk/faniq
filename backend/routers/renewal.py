from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from models import Club, Fan
from tenant import get_current_club
from services.renewal import calculate_renewal_probability, calculate_renewal_scores_bulk

router = APIRouter(prefix="/fans", tags=["renewal"])


@router.get("/{fan_id}/renewal-score")
def get_renewal_score(
    fan_id: int,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club.id).first()
    if not fan:
        raise HTTPException(404, "Fan non trovato")
    result = calculate_renewal_probability(fan_id, club.id, db)
    return {
        "fan_id": fan_id,
        "nome": fan.nome,
        "cognome": fan.cognome,
        **result,
    }


@router.get("/renewal-scores")
def get_renewal_scores(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    solo_rischio: bool = Query(False, description="Solo fan con score < 40%"),
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    results = calculate_renewal_scores_bulk(club.id, db)

    rows = db.execute(
        text("SELECT id, nome, cognome, email FROM fans WHERE club_id = :cid"),
        {"cid": club.id},
    ).fetchall()
    fan_map = {row[0]: (row[1], row[2], row[3]) for row in rows}

    enriched = []
    for r in results:
        fan_data = fan_map.get(r["fan_id"])
        if not fan_data:
            continue
        nome, cognome, email = fan_data
        enriched.append({
            "fan_id": r["fan_id"],
            "nome": nome,
            "cognome": cognome,
            "email": email,
            "score_pct": r["score_pct"],
            "has_incomplete_data": r["has_incomplete_data"],
        })

    if solo_rischio:
        enriched = [e for e in enriched if e["score_pct"] < 40]

    enriched.sort(key=lambda e: e["score_pct"])  # più a rischio prima

    total = len(enriched)
    start = (page - 1) * per_page
    page_items = enriched[start: start + per_page]

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": page_items,
    }
