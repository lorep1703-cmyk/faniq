import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session

from config import MAX_UPLOAD_SIZE_BYTES
from database import get_db
from models import Abbonamento, Biglietto, Club, Fan, Partita, ShopOrder, UploadHistory
from tenant import get_current_club
from services.cache import invalidate
from services.csv_import import CSV_TEMPLATES, import_csv, undo_upload

logger = logging.getLogger("faniq")

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/{csv_type}")
async def upload_file(
    csv_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    if csv_type not in CSV_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Tipo non valido: {csv_type}")

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File troppo grande")

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Solo file CSV")

    try:
        return import_csv(db, club.id, csv_type, content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/template/{csv_type}")
def download_template(csv_type: str):
    if csv_type not in CSV_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template non trovato")
    return PlainTextResponse(
        CSV_TEMPLATES[csv_type],
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={csv_type}_template.csv"},
    )


@router.get("/history")
def upload_history(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    uploads = (
        db.query(UploadHistory)
        .filter(UploadHistory.club_id == club.id)
        .order_by(UploadHistory.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": u.id,
            "type": u.type,
            "filename": u.filename,
            "rows_imported": u.rows_imported,
            "uploaded_at": u.uploaded_at.isoformat() if u.uploaded_at else None,
        }
        for u in uploads
    ]


@router.delete("/reset-all")
def reset_all_data(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    try:
        db.query(ShopOrder).filter(ShopOrder.club_id == club.id).delete(synchronize_session=False)
        db.query(Biglietto).filter(Biglietto.club_id == club.id).delete(synchronize_session=False)
        db.query(Abbonamento).filter(Abbonamento.club_id == club.id).delete(synchronize_session=False)
        db.query(Partita).filter(Partita.club_id == club.id).delete(synchronize_session=False)
        db.query(UploadHistory).filter(UploadHistory.club_id == club.id).delete(synchronize_session=False)
        db.query(Fan).filter(Fan.club_id == club.id).delete(synchronize_session=False)
        db.commit()
        invalidate(club.id)
        return {"deleted": True, "message": "Tutti i dati del club sono stati eliminati"}
    except Exception as e:
        db.rollback()
        logger.error("Errore reset-all club %d: %s", club.id, e, exc_info=True)
        raise HTTPException(status_code=500, detail="Errore durante il reset dei dati")


@router.delete("/{upload_id}")
def delete_upload(upload_id: int, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    try:
        return undo_upload(db, club.id, upload_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
