from __future__ import annotations

import html
import re

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from services.auth import create_token, hash_password, verify_password
from services.cache import get as cache_get, set as cache_set
from services.intelligence.engine import compute_club_intelligence


def _warmup_intelligence(club_id: int, db: Session) -> None:
    key = f"intelligence_{club_id}"
    if cache_get(key) is None:
        results = compute_club_intelligence(club_id, db)
        cache_set(key, results)

router = APIRouter(prefix="/auth", tags=["auth"])

# Slug: 2-30 caratteri, solo minuscole, numeri e trattini, non inizia/finisce con trattino
_SLUG_RE = re.compile(r"^[a-z0-9]([a-z0-9\-]{0,28}[a-z0-9])?$")

# Password: min 8 caratteri, almeno 1 maiuscola, 1 minuscola, 1 numero, 1 speciale
_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$")


def _validate_slug(slug: str) -> str:
    slug = slug.strip().lower()
    if not _SLUG_RE.match(slug):
        raise HTTPException(
            400,
            "Lo slug deve avere 3-30 caratteri, solo lettere minuscole, numeri e trattini "
            "(non può iniziare o finire con un trattino)",
        )
    return slug


def _validate_password(password: str) -> None:
    if not _PASSWORD_RE.match(password):
        raise HTTPException(
            400,
            "La password deve avere almeno 8 caratteri e contenere: "
            "1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale (es. !@#$%)",
        )


class RegisterRequest(BaseModel):
    nome: str
    slug: str
    email: EmailStr
    password: str

    @field_validator("nome")
    @classmethod
    def nome_not_empty(cls, v: str) -> str:
        v = html.escape(v.strip())
        if not v:
            raise ValueError("Il nome del club non può essere vuoto")
        if len(v) > 200:
            raise ValueError("Il nome del club non può superare 200 caratteri")
        return v

    @field_validator("email")
    @classmethod
    def email_error_ita(cls, v: EmailStr) -> EmailStr:
        return v


class LoginRequest(BaseModel):
    slug: str
    password: str


def _club_response(club: Club, token: str) -> dict:
    return {
        "token": token,
        "club": {"id": club.id, "nome": club.nome, "slug": club.slug, "email": club.email},
    }


@router.post("/register", status_code=201)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    slug = _validate_slug(body.slug)
    _validate_password(body.password)

    if db.query(Club).filter(Club.slug == slug).first():
        raise HTTPException(400, "Slug già in uso — scegli un identificativo diverso")

    email = body.email.lower().strip()
    if db.query(Club).filter(Club.email == email).first():
        raise HTTPException(400, "Email già in uso — usa un indirizzo diverso")

    club = Club(
        nome=body.nome,
        slug=slug,
        email=email,
        password_hash=hash_password(body.password),
    )
    db.add(club)
    db.commit()
    db.refresh(club)
    return _club_response(club, create_token(club.id, club.slug, club.nome))


@router.post("/login")
def login(
    request: Request,
    body: LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    slug = body.slug.strip().lower()
    club = db.query(Club).filter(Club.slug == slug).first()
    if not club or not verify_password(body.password, club.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenziali non valide")
    response = _club_response(club, create_token(club.id, club.slug, club.nome))
    background_tasks.add_task(_warmup_intelligence, club.id, db)
    return response
