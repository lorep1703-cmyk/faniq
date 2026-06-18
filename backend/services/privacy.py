"""Servizi GDPR: consenso, export, cancellazione."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from models import Abbonamento, Biglietto, Fan, PrivacyLog, ShopOrder
from services.analytics import compute_fan_segments
from services.cache import invalidate


def log_action(db: Session, club_id: int, action: str, fan_id: int | None = None, details: str | None = None):
    db.add(PrivacyLog(club_id=club_id, action=action, fan_id=fan_id, details=details))
    db.commit()


def consent_summary(db: Session, club_id: int) -> dict:
    fans = db.query(Fan).filter(Fan.club_id == club_id).all()
    total = len(fans)
    marketing_yes = sum(1 for f in fans if f.consenso_marketing is True)
    marketing_no = sum(1 for f in fans if f.consenso_marketing is False)
    marketing_unknown = sum(1 for f in fans if f.consenso_marketing is None)
    profilazione_yes = sum(1 for f in fans if f.consenso_profilazione is True)

    return {
        "total_fans": total,
        "consenso_marketing": {
            "si": marketing_yes,
            "no": marketing_no,
            "non_registrato": marketing_unknown,
        },
        "consenso_profilazione": {
            "si": profilazione_yes,
            "no": sum(1 for f in fans if f.consenso_profilazione is False),
            "non_registrato": sum(1 for f in fans if f.consenso_profilazione is None),
        },
        "contattabili": sum(1 for f in fans if f.consenso_marketing is True and f.email),
    }


def export_fan_gdpr(db: Session, club_id: int, fan_id: int) -> dict:
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club_id).first()
    if not fan:
        raise ValueError("Fan non trovato")

    abbonamenti = db.query(Abbonamento).filter(Abbonamento.fan_id == fan_id, Abbonamento.club_id == club_id).all()
    biglietti = db.query(Biglietto).filter(Biglietto.fan_id == fan_id, Biglietto.club_id == club_id).all()
    shop = db.query(ShopOrder).filter(ShopOrder.fan_id == fan_id, ShopOrder.club_id == club_id).all()

    log_action(db, club_id, "export_gdpr", fan_id, "Export dati personali")

    return {
        "fan": {
            "id": fan.id,
            "nome": fan.nome,
            "cognome": fan.cognome,
            "email": fan.email,
            "citta": fan.citta,
            "consenso_marketing": fan.consenso_marketing,
            "consenso_profilazione": fan.consenso_profilazione,
            "created_at": fan.created_at.isoformat() if fan.created_at else None,
        },
        "abbonamenti": [{"stagione": a.stagione, "importo": a.importo_pagato} for a in abbonamenti],
        "biglietti": [
            {"data": a.data_partita.isoformat() if a.data_partita else None, "settore": a.settore, "prezzo": a.prezzo}
            for a in biglietti
        ],
        "shop": [
            {"prodotto": o.prodotto, "importo": o.importo, "data": o.data.isoformat() if o.data else None}
            for o in shop
        ],
        "exported_at": datetime.utcnow().isoformat(),
    }


def delete_fan_gdpr(db: Session, club_id: int, fan_id: int) -> dict:
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club_id).first()
    if not fan:
        raise ValueError("Fan non trovato")

    log_action(db, club_id, "delete_gdpr", fan_id, f"Cancellazione {fan.nome} {fan.cognome}")
    db.delete(fan)
    db.commit()
    invalidate(club_id)

    return {"message": f"Tifoso #{fan_id} cancellato"}


def update_consent(db: Session, club_id: int, fan_id: int, tipo: str, consenso: bool) -> dict:
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club_id).first()
    if not fan:
        raise ValueError("Fan non trovato")

    if tipo == "marketing":
        fan.consenso_marketing = consenso
    elif tipo == "profilazione":
        fan.consenso_profilazione = consenso
    else:
        raise ValueError("Tipo consenso non valido")

    log_action(db, club_id, "update_consent", fan_id, f"{tipo}={consenso}")
    db.commit()
    invalidate(club_id)

    return {"message": "Consenso aggiornato", "fan_id": fan_id, "tipo": tipo, "consenso": consenso}


def data_retention_info(db: Session, club_id: int) -> dict:
    fans = compute_fan_segments(db, club_id)
    return {
        "policy": "I dati vengono conservati per 3 anni dall'ultima interazione, salvo consenso marketing attivo.",
        "retention_years": 3,
        "fans_with_activity": sum(1 for f in fans if f.get("last_activity")),
        "fans_dormant": sum(1 for f in fans if f.get("segment") == "Dormiente"),
        "recommendation": "Valuta la cancellazione dei profili dormienti senza consenso dopo 36 mesi.",
    }


def privacy_log(db: Session, club_id: int, limit: int = 20) -> list[dict]:
    logs = (
        db.query(PrivacyLog)
        .filter(PrivacyLog.club_id == club_id)
        .order_by(PrivacyLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "action": l.action,
            "fan_id": l.fan_id,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]
