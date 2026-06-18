from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.simulator import suggested_base, simulate_attendance

router = APIRouter(prefix="/simulate", tags=["simulate"])


@router.get("/base")
def get_suggested_base(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return suggested_base(db, club.id)


@router.get("/attendance")
def get_attendance(
    base: float,
    match_type: str = "standard",
    weather: str = "sole",
    promo: str = "nessuna",
    capienza: int = 7500,
    prezzo_medio: float = 15,
    abbonati: int = 0,
    club: Club = Depends(get_current_club),
):
    return simulate_attendance(base, match_type, weather, promo, capienza, prezzo_medio, abbonati)
