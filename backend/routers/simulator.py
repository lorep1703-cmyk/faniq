from fastapi import APIRouter, Depends
from models import Club
from tenant import get_current_club
from services.simulator import simulate_attendance

router = APIRouter(prefix="/simulate", tags=["simulate"])


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
