from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from config import MAX_UPLOAD_SIZE_BYTES
from database import get_db
from models import Club, UploadHistory
from tenant import get_current_club
from services.csv_import import CSV_TEMPLATES, import_csv, undo_upload

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


@router.delete("/{upload_id}")
def delete_upload(upload_id: int, db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    try:
        return undo_upload(db, club.id, upload_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
