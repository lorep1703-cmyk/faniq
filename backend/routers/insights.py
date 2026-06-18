from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.insights import generate_insights
from services.analytics import compute_fan_segments
from services.data_readiness import compute_data_readiness

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/overview")
def get_insights_overview(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return generate_insights(db, club.id)


@router.get("/data-readiness")
def get_data_readiness(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return compute_data_readiness(db, club.id)


@router.get("/fan/{fan_id}")
def get_fan_detail(fan_id: int, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    fans = compute_fan_segments(db, club.id)
    fan = next((f for f in fans if f["id"] == fan_id), None)
    if not fan:
        raise HTTPException(status_code=404, detail="Fan non trovato")
    return fan
