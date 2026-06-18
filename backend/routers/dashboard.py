from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.analytics import (
    compute_fan_segments,
    dashboard_citta,
    dashboard_cross_source,
    dashboard_presenze,
    dashboard_retention,
    dashboard_revenue_breakdown,
    dashboard_seasons,
    dashboard_segments,
    dashboard_stats,
    dashboard_top_spenders,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_stats(db, club.id)


@router.get("/citta")
def get_citta(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_citta(db, club.id)


@router.get("/presenze")
def get_presenze(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_presenze(db, club.id)


@router.get("/revenue-breakdown")
def get_revenue_breakdown(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_revenue_breakdown(db, club.id)


@router.get("/retention")
def get_retention(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_retention(db, club.id)


@router.get("/segments")
def get_segments(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_segments(db, club.id)


@router.get("/top-spenders")
def get_top_spenders(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_top_spenders(db, club.id)


@router.get("/cross-source")
def get_cross_source(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_cross_source(db, club.id)


@router.get("/seasons")
def get_seasons(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_seasons(db, club.id)


@router.get("/fans")
def get_fans(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return compute_fan_segments(db, club.id)
