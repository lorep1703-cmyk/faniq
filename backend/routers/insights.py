from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.insights import generate_insights
from services.data_readiness import compute_data_readiness

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/overview")
def get_insights_overview(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return generate_insights(db, club.id)


@router.get("/data-readiness")
def get_data_readiness(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return compute_data_readiness(db, club.id)
