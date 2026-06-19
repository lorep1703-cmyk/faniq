from __future__ import annotations

from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import _IS_POSTGRES, get_db
from models import Club
from services.auth import decode_token

_bearer = HTTPBearer()


def get_current_club(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Club:
    try:
        payload = decode_token(credentials.credentials)
        club_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token non valido o scaduto")

    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Club non trovato")

    # Su PostgreSQL attiva il filtro RLS per questa transazione.
    # SET LOCAL è scoped alla transazione corrente: si azzera automaticamente
    # al commit/rollback, quindi non può mai "sporcare" la connessione nel pool.
    if _IS_POSTGRES:
        db.execute(text("SET LOCAL app.current_club_id = :cid"), {"cid": club.id})

    return club


def _get_raw_payload(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """Ritorna il payload JWT grezzo per leggere campi extra come 'ruolo'."""
    try:
        return decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token non valido o scaduto")


def require_role(allowed_roles: List[str]):
    """
    Dipendenza riutilizzabile per proteggere endpoint per ruolo.

    Uso:  club: Club = Depends(require_role(["admin"]))
          club: Club = Depends(require_role(["admin", "staff"]))

    I token emessi prima dell'introduzione del campo 'ruolo' non hanno quel campo:
    vengono trattati come 'admin' per retrocompatibilità (il club owner originale).
    """
    def _check(
        club: Club = Depends(get_current_club),
        payload: dict = Depends(_get_raw_payload),
    ) -> Club:
        ruolo = payload.get("ruolo", "admin")
        if ruolo not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ruolo '{ruolo}' non autorizzato. Richiesto: {allowed_roles}",
            )
        return club
    return _check
