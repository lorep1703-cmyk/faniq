from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.privacy import (
    consent_summary,
    data_retention_info,
    delete_fan_gdpr,
    export_fan_gdpr,
    privacy_log,
    update_consent,
)

router = APIRouter(prefix="/privacy", tags=["privacy"])


class ConsentUpdate(BaseModel):
    tipo: str
    consenso: bool


@router.get("/consent-summary")
def get_consent_summary(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return consent_summary(db, club.id)


@router.get("/fan/{fan_id}/export")
def export_fan(fan_id: int, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    try:
        return export_fan_gdpr(db, club.id, fan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/fan/{fan_id}")
def delete_fan(fan_id: int, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    try:
        return delete_fan_gdpr(db, club.id, fan_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/fan/{fan_id}/consent")
def patch_consent(fan_id: int, body: ConsentUpdate, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    try:
        return update_consent(db, club.id, fan_id, body.tipo, body.consenso)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/retention")
def get_retention(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return data_retention_info(db, club.id)


@router.get("/log")
def get_log(limit: int = 20, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return privacy_log(db, club.id, limit=limit)
