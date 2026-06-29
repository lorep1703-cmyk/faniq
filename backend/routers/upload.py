from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session

from config import MAX_UPLOAD_SIZE_BYTES
from database import SessionLocal, _IS_POSTGRES, get_db
from sqlalchemy import text
from models import Abbonamento, Biglietto, Club, Fan, Partita, ShopOrder, UploadHistory
from tenant import get_current_club
from services.cache import invalidate
from services.csv_import import CSV_TEMPLATES, import_csv, undo_upload

logger = logging.getLogger("faniq")

router = APIRouter(prefix="/upload", tags=["upload"])

_upload_jobs: dict[str, dict] = {}


def _run_upload(job_id: str, csv_type: str, content: bytes, club_id: int, filename: str) -> None:
    _upload_jobs[job_id]["status"] = "running"
    db = SessionLocal()
    try:
        if _IS_POSTGRES:
            db.execute(text("SET LOCAL app.current_club_id = :cid"), {"cid": str(club_id)})
        result = import_csv(db, club_id, csv_type, content, filename)
        _upload_jobs[job_id].update({
            "status": "done",
            "message": result.get("message", ""),
            "rows": result.get("rows", 0),
            "upload_id": result.get("upload_id"),
        })
    except Exception as e:
        logger.error("Errore background upload job %s: %s", job_id, e, exc_info=True)
        _upload_jobs[job_id]["status"] = "error"
    finally:
        db.close()


@router.post("/{csv_type}", status_code=202)
async def upload_file(
    csv_type: str,
    background_tasks: BackgroundTasks,
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

    job_id = str(uuid.uuid4())
    _upload_jobs[job_id] = {"status": "queued", "csv_type": csv_type}
    background_tasks.add_task(_run_upload, job_id, csv_type, content, club.id, file.filename)
    return {"job_id": job_id, "status": "queued"}


@router.get("/status/{job_id}")
def upload_status(job_id: str, club: Club = Depends(get_current_club)):
    job = _upload_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job non trovato")
    return job


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
