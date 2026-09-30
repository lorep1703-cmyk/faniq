"""Token di recupero password — stesso schema di Django (PasswordResetTokenGenerator)
e fastapi-users: token firmato e senza stato, niente tabella nel database.

Il token contiene l'id del club, una scadenza e un'impronta dell'hash password
attuale. Quando la password cambia l'impronta non combacia più, quindi il link
vale una sola volta senza doverlo salvare.

Isolamento dal login: chiave derivata diversa da quella dei JWT di sessione e
audience dedicata. services.auth.decode_token (usato da tenant.py) rifiuta un
token con audience, quindi un link di recupero non apre mai una sessione."""
from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timedelta

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import JWT_ALGORITHM, JWT_SECRET_KEY, PASSWORD_RESET_MINUTES
from models import Club

_AUDIENCE = "faniq:password-reset"
_SECRET = hmac.new(JWT_SECRET_KEY.encode(), b"faniq-password-reset", hashlib.sha256).hexdigest()


def _fingerprint(password_hash: str) -> str:
    return hmac.new(_SECRET.encode(), password_hash.encode(), hashlib.sha256).hexdigest()


def create_reset_token(club: Club, now: datetime | None = None) -> str:
    now = now or datetime.utcnow()
    return jwt.encode(
        {
            "sub": str(club.id),
            "fgp": _fingerprint(club.password_hash),
            "aud": _AUDIENCE,
            "exp": now + timedelta(minutes=PASSWORD_RESET_MINUTES),
        },
        _SECRET,
        algorithm=JWT_ALGORITHM,
    )


def club_from_reset_token(token: str, db: Session) -> Club | None:
    """Il club del token, o None se il token è falso, scaduto o già usato."""
    try:
        payload = jwt.decode(
            token, _SECRET, algorithms=[JWT_ALGORITHM], audience=_AUDIENCE,
            options={"require_aud": True, "require_exp": True},
        )
        club_id = int(payload["sub"])
        fgp = str(payload["fgp"])
    except (JWTError, KeyError, ValueError):
        return None
    club = db.query(Club).filter(Club.id == club_id).first()
    if club is None or not hmac.compare_digest(fgp, _fingerprint(club.password_hash)):
        return None
    return club
