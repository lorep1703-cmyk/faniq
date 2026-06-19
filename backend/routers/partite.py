from __future__ import annotations

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Club, Fan, Partita
from tenant import get_current_club
from services.behavioral import compute_behavioral

router = APIRouter(prefix="/partite", tags=["partite"])

_VALID = {"casa", "trasferta"}

_TEMPLATE = (
    "data,avversario,casa_trasferta,competizione\n"
    "2024-09-01,Ascoli,casa,Serie B\n"
    "2024-09-08,Brescia,trasferta,Serie B\n"
)


class PartitaIn(BaseModel):
    data: date
    avversario: str
    casa_trasferta: str
    competizione: str | None = None


# ── Template CSV ──────────────────────────────────────────────────────────────

@router.get("/template")
def get_template():
    return PlainTextResponse(
        _TEMPLATE,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=partite_template.csv"},
    )


# ── Lista partite ─────────────────────────────────────────────────────────────

@router.get("/")
def list_partite(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    rows = (
        db.query(Partita)
        .filter(Partita.club_id == club.id)
        .order_by(Partita.data.desc())
        .all()
    )
    today = date.today()
    return [
        {
            "id": p.id,
            "data": p.data.isoformat(),
            "avversario": p.avversario,
            "casa_trasferta": p.casa_trasferta,
            "competizione": p.competizione,
            "passata": p.data <= today,
        }
        for p in rows
    ]


# ── Aggiungi manuale ──────────────────────────────────────────────────────────

@router.post("/")
def add_partita(
    body: PartitaIn,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    if body.casa_trasferta not in _VALID:
        raise HTTPException(400, "casa_trasferta deve essere 'casa' o 'trasferta'")
    p = Partita(
        club_id=club.id,
        data=body.data,
        avversario=body.avversario.strip(),
        casa_trasferta=body.casa_trasferta,
        competizione=body.competizione,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "message": "Partita aggiunta"}


# ── Upload CSV ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_partite(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    imported, errors = 0, []
    for i, row in enumerate(reader, 1):
        try:
            ct = row.get("casa_trasferta", "").strip().lower()
            if ct not in _VALID:
                errors.append(f"Riga {i}: casa_trasferta '{ct}' non valido (usa 'casa' o 'trasferta')")
                continue
            db.add(Partita(
                club_id=club.id,
                data=date.fromisoformat(row["data"].strip()),
                avversario=row["avversario"].strip(),
                casa_trasferta=ct,
                competizione=row.get("competizione", "").strip() or None,
            ))
            imported += 1
        except Exception as e:
            errors.append(f"Riga {i}: {e}")

    db.commit()
    return {"imported": imported, "errors": errors, "message": f"{imported} partite importate"}


# ── Elimina ───────────────────────────────────────────────────────────────────

@router.delete("/{partita_id}")
def delete_partita(
    partita_id: int,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    p = db.query(Partita).filter(Partita.id == partita_id, Partita.club_id == club.id).first()
    if not p:
        raise HTTPException(404, "Partita non trovata")
    db.delete(p)
    db.commit()
    return {"message": "Partita eliminata"}


# ── Behavioral scores ─────────────────────────────────────────────────────────

@router.get("/behavioral")
def get_behavioral(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    data = compute_behavioral(db, club.id)
    if not data:
        return {"empty": True}

    # Arricchisce i fan_scores con nome/cognome
    fan_ids = list(data["fan_scores"].keys())
    fans = db.query(Fan).filter(Fan.id.in_(fan_ids), Fan.club_id == club.id).all()
    fan_map = {f.id: f for f in fans}

    enriched = []
    for fan_id, score in data["fan_scores"].items():
        fan = fan_map.get(fan_id)
        if not fan:
            continue
        enriched.append({
            "id": fan_id,
            "nome": fan.nome,
            "cognome": fan.cognome,
            "email": fan.email,
            **score,
        })

    enriched.sort(key=lambda f: (-f["away_attended"], -f["away_rate"]))

    return {
        **data,
        "fan_scores": enriched,
    }
