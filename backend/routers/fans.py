from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Abbonamento, Biglietto, Club, Fan, ShopOrder
from tenant import get_current_club

router = APIRouter(prefix="/fans", tags=["fans"])


@router.get("/{fan_id}/detail")
def get_fan_detail(
    fan_id: int,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club.id).first()
    if not fan:
        raise HTTPException(status_code=404, detail="Fan non trovato")

    abbonamenti = (
        db.query(Abbonamento)
        .filter(Abbonamento.fan_id == fan_id, Abbonamento.club_id == club.id)
        .order_by(Abbonamento.stagione.desc())
        .all()
    )

    totale_biglietti = (
        db.query(func.count(Biglietto.id))
        .filter(Biglietto.fan_id == fan_id, Biglietto.club_id == club.id)
        .scalar() or 0
    )

    shop_agg = (
        db.query(func.count(ShopOrder.id), func.sum(ShopOrder.importo))
        .filter(ShopOrder.fan_id == fan_id, ShopOrder.club_id == club.id)
        .one()
    )
    totale_ordini_shop = shop_agg[0] or 0
    spesa_shop = float(shop_agg[1] or 0)

    return {
        "id": fan.id,
        "nome": fan.nome,
        "cognome": fan.cognome,
        "email": fan.email,
        "citta": fan.citta,
        "abbonamenti": [
            {
                "stagione": a.stagione,
                "tipo": None,
                "stato": None,
            }
            for a in abbonamenti
        ],
        "totale_biglietti": totale_biglietti,
        "totale_ordini_shop": totale_ordini_shop,
        "spesa_shop": round(spesa_shop, 2),
    }
