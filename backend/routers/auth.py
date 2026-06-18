from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from services.auth import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


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
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    slug = body.slug.strip().lower()
    if not slug or not body.nome.strip():
        raise HTTPException(400, "Nome e slug obbligatori")
    if db.query(Club).filter(Club.slug == slug).first():
        raise HTTPException(400, "Slug già in uso — scegli un identificativo diverso")
    club = Club(nome=body.nome.strip(), slug=slug, password_hash=hash_password(body.password))
    db.add(club)
    db.commit()
    db.refresh(club)
    return _club_response(club, create_token(club.id, club.slug, club.nome))


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.slug == body.slug.strip().lower()).first()
    if not club or not verify_password(body.password, club.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenziali non valide")
    return _club_response(club, create_token(club.id, club.slug, club.nome))
