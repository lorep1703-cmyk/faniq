"""Import CSV: abbonati, biglietteria, shop."""
from __future__ import annotations

import csv
import io
from datetime import datetime

from sqlalchemy.orm import Session

from models import Abbonamento, Biglietto, Fan, Partita, ShopOrder, UploadHistory
from services.cache import invalidate


from services.utils import _norm_email


_FORMULA_PREFIXES = ('=', '+', '-', '@', '\t', '\r')

def _sanitize_cell(value: str | None) -> str | None:
    if value and isinstance(value, str) and value[0] in _FORMULA_PREFIXES:
        return "'" + value
    return value


def _parse_date(value: str):
    if not value or not value.strip():
        return None
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _parse_float(value: str) -> float:
    if not value:
        return 0.0
    try:
        return float(str(value).replace(",", ".").strip())
    except ValueError:
        return 0.0


def _find_or_create_fan(
    db: Session, club_id: int, nome: str | None, cognome: str | None, email: str | None, citta: str | None = None
) -> Fan:
    norm_email = _norm_email(email)
    fan = None

    if norm_email:
        fan = db.query(Fan).filter(Fan.club_id == club_id, Fan.email == norm_email).first()

    if not fan and nome and cognome:
        fan = (
            db.query(Fan)
            .filter(Fan.club_id == club_id, Fan.nome.ilike(nome.strip()), Fan.cognome.ilike(cognome.strip()))
            .first()
        )

    if not fan:
        fan = Fan(
            club_id=club_id,
            nome=nome.strip() if nome else None,
            cognome=cognome.strip() if cognome else None,
            email=norm_email,
            citta=citta.strip() if citta else None,
        )
        db.add(fan)
        db.flush()
    else:
        if citta and not fan.citta:
            fan.citta = citta.strip()
        if norm_email and not fan.email:
            fan.email = norm_email

    return fan


def import_csv(db: Session, club_id: int, csv_type: str, content: bytes, filename: str) -> dict:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError("CSV senza intestazioni")

    upload = UploadHistory(club_id=club_id, type=csv_type, filename=filename, rows_imported=0)
    db.add(upload)
    db.flush()

    count = 0

    if csv_type == "abbonati":
        for row in reader:
            fan = _find_or_create_fan(db, club_id, _sanitize_cell(row.get("nome")), _sanitize_cell(row.get("cognome")), row.get("email"), _sanitize_cell(row.get("citta")))
            db.add(Abbonamento(
                club_id=club_id,
                fan_id=fan.id,
                upload_id=upload.id,
                stagione=row.get("stagione"),
                importo_pagato=_parse_float(row.get("importo_pagato")),
            ))
            count += 1

    elif csv_type == "biglietteria":
        for row in reader:
            fan = _find_or_create_fan(db, club_id, _sanitize_cell(row.get("nome")), _sanitize_cell(row.get("cognome")), row.get("email"))
            db.add(Biglietto(
                club_id=club_id,
                fan_id=fan.id,
                upload_id=upload.id,
                data_partita=_parse_date(row.get("data_partita")),
                settore=_sanitize_cell(row.get("settore")),
                prezzo=_parse_float(row.get("prezzo")),
            ))
            count += 1

    elif csv_type == "shop":
        for row in reader:
            fan = _find_or_create_fan(db, club_id, None, None, row.get("email"))
            db.add(ShopOrder(
                club_id=club_id,
                fan_id=fan.id,
                upload_id=upload.id,
                prodotto=_sanitize_cell(row.get("prodotto")),
                importo=_parse_float(row.get("importo")),
                data=_parse_date(row.get("data")),
            ))
            count += 1
    else:
        raise ValueError(f"Tipo CSV non supportato: {csv_type}")

    upload.rows_imported = count
    db.commit()
    invalidate(club_id)

    return {"message": f"{count} righe importate da {filename}", "rows": count, "upload_id": upload.id}


def undo_upload(db: Session, club_id: int, upload_id: int) -> dict:
    upload = db.query(UploadHistory).filter(
        UploadHistory.id == upload_id, UploadHistory.club_id == club_id
    ).first()
    if not upload:
        raise ValueError("Upload non trovato")

    if upload.type == "abbonati":
        db.query(Abbonamento).filter(Abbonamento.upload_id == upload_id).delete()
    elif upload.type == "biglietteria":
        db.query(Biglietto).filter(Biglietto.upload_id == upload_id).delete()
    elif upload.type == "shop":
        db.query(ShopOrder).filter(ShopOrder.upload_id == upload_id).delete()
    elif upload.type == "partite":
        db.query(Partita).filter(Partita.club_id == club_id).delete()

    # Rimuove i fan che non hanno più nessuna transazione collegata
    orphan_fans = (
        db.query(Fan)
        .filter(Fan.club_id == club_id)
        .filter(~Fan.abbonamenti.any())
        .filter(~Fan.biglietti.any())
        .filter(~Fan.shop_orders.any())
        .all()
    )
    for fan in orphan_fans:
        db.delete(fan)

    db.delete(upload)
    db.commit()
    invalidate(club_id)

    return {"message": f"Upload #{upload_id} annullato"}


CSV_TEMPLATES = {
    "abbonati": "nome,cognome,email,citta,stagione,importo_pagato\nPaolo,Verdi,p.verdi@gmail.com,Torino,2024/2025,200.00",
    "biglietteria": "nome,cognome,email,data_partita,settore,prezzo\nPaolo,Verdi,p.verdi@gmail.com,2025-03-02,Tribuna,18.00",
    "shop": "email,prodotto,importo,data\np.verdi@gmail.com,Maglia Home,75.00,2024-10-15",
}
