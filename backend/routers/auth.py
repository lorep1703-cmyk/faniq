from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from limiter import limiter
from models import Club
from services.auth import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

_MIN_PASSWORD_LEN = 8
_PASSWORD_RE = re.compile(r"(?=.*[A-Za-z])(?=.*\d)")  # almeno 1 lettera e 1 numero


def _validate_password(password: str) -> None:
    if len(password) < _MIN_PASSWORD_LEN:
        raise HTTPException(400, f"La password deve essere di almeno {_MIN_PASSWORD_LEN} caratteri")
    if not _PASSWORD_RE.search(password):
        raise HTTPException(400, "La password deve contenere almeno una lettera e un numero")


class RegisterRequest(BaseModel):
    nome: str
    slug: str
    password: str


class LoginRequest(BaseModel):
    slug: str
    password: str


def _club_response(club: Club, token: str) -> dict:
    return {
        "token": token,
        "club": {"id": club.id, "nome": club.nome, "slug": club.slug},
    }


@router.post("/register", status_code=201)
@limiter.limit("5/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    slug = body.slug.strip().lower()
    if not slug or not body.nome.strip():
        raise HTTPException(400, "Nome e slug obbligatori")
    _validate_password(body.password)
    if db.query(Club).filter(Club.slug == slug).first():
        raise HTTPException(400, "Slug già in uso — scegli un identificativo diverso")
    club = Club(nome=body.nome.strip(), slug=slug, password_hash=hash_password(body.password))
    db.add(club)
    db.commit()
    db.refresh(club)
    return _club_response(club, create_token(club.id, club.slug, club.nome))


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.slug == body.slug.strip().lower()).first()
    if not club or not verify_password(body.password, club.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenziali non valide")
    return _club_response(club, create_token(club.id, club.slug, club.nome))
