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
from services.analytics import compute_fan_segments

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


# ── Predizione presenze ───────────────────────────────────────────────────────

@router.get("/predizione/{partita_id}")
def get_predizione(
    partita_id: int,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    partita = db.query(Partita).filter(Partita.id == partita_id, Partita.club_id == club.id).first()
    if not partita:
        raise HTTPException(404, "Partita non trovata")

    partita_out = {
        "id": partita.id,
        "data": partita.data.isoformat(),
        "avversario": partita.avversario,
        "casa_trasferta": partita.casa_trasferta,
        "competizione": partita.competizione,
    }

    behavioral = compute_behavioral(db, club.id)
    if not behavioral or not behavioral.get("fan_scores"):
        return {"empty": True, "partita": partita_out}

    # fan_scores è {fan_id: {...}} dal servizio
    raw_scores = behavioral["fan_scores"]

    # RFM per ogni fan
    rfm = compute_fan_segments(db, club.id)
    seg_map = {f["id"]: f["segment"] for f in rfm}

    # Tutti i fan del club per i "nessun dato"
    all_fans = db.query(Fan).filter(Fan.club_id == club.id).all()
    tipo = partita.casa_trasferta  # "casa" | "trasferta"

    alta, media, bassa, nessun_dato = [], [], [], []

    for fan in all_fans:
        score = raw_scores.get(fan.id)
        segment = seg_map.get(fan.id, "—")
        base = {"id": fan.id, "nome": fan.nome, "cognome": fan.cognome, "email": fan.email, "segment": segment}

        if score is None:
            nessun_dato.append(base)
            continue

        rate = score["home_rate"] if tipo == "casa" else score["away_rate"]
        attended = score["home_attended"] if tipo == "casa" else score["away_attended"]
        entry = {**base, "rate": rate, "partite_seguite": attended, "badge": score["badge"]}

        if rate >= 60:
            alta.append(entry)
        elif rate >= 25:
            media.append(entry)
        else:
            bassa.append(entry)

    for tier in [alta, media, bassa]:
        tier.sort(key=lambda f: -f.get("rate", 0))

    totale_previsto = round(len(alta) * 0.85 + len(media) * 0.50 + len(bassa) * 0.15)

    return {
        "partita": partita_out,
        "totale_previsto": totale_previsto,
        "tiers": {
            "alta":       {"fans": alta[:20],        "count": len(alta),       "label": "Verranno quasi sicuramente", "color": "#059669", "prob": 85},
            "media":      {"fans": media[:20],       "count": len(media),      "label": "Probabile presenza",         "color": "#2563eb", "prob": 50},
            "bassa":      {"fans": bassa[:20],       "count": len(bassa),      "label": "Presenza incerta",           "color": "#d97706", "prob": 15},
            "nessun_dato":{"fans": nessun_dato[:10], "count": len(nessun_dato),"label": "Nessun dato storico",        "color": "#6b7280", "prob": 0},
        },
    }
