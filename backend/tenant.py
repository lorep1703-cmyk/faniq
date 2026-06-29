from __future__ import annotations

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


