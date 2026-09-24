"""Recupero password del club (OWASP Forgot Password Cheat Sheet):
- stessa risposta per email registrate e non (niente enumerazione account);
- invio email in background, così i tempi di risposta non rivelano nulla;
- link monouso con scadenza (services.password_reset);
- dopo il cambio: email di conferma, nessun login automatico.
Rate limit per IP nel middleware di main.py."""
from __future__ import annotations

import html

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from config import FRONTEND_URL, PASSWORD_RESET_MINUTES
from database import get_db
from models import Club
from routers.auth import _validate_password
from services.auth import hash_password
from services.email import send_email
from services.password_reset import club_from_reset_token, create_reset_token

router = APIRouter(prefix="/auth/password-reset", tags=["auth"])

REQUEST_MESSAGE = (
    "Se l'email è associata a un club, riceverai a breve un link per reimpostare la password."
)
INVALID_LINK = "Link non valido o scaduto. Richiedine uno nuovo."


class ResetRequest(BaseModel):
    email: EmailStr


class ResetConfirm(BaseModel):
    token: str
    password: str


def _reset_email(club_nome: str, link: str) -> tuple[str, str, str]:
    subject = "Reimposta la password di FanIQ"
    text = (
        "Ciao,\n"
        f"abbiamo ricevuto una richiesta per reimpostare la password del club {club_nome}.\n\n"
        f"Scegli una nuova password: {link}\n\n"
        f"Il link vale per {PASSWORD_RESET_MINUTES} minuti e si può usare una sola volta.\n"
        "Se non hai chiesto tu il cambio, ignora questa email: la password attuale resta valida.\n\n"
        "— FanIQ"
    )
    nome = html.escape(club_nome)
    body = (
        "<p>Ciao,<br>abbiamo ricevuto una richiesta per reimpostare la password del club "
        f"<strong>{nome}</strong>.</p>"
        f'<p><a href="{html.escape(link)}" style="display:inline-block;background:#4f46e5;'
        'color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">'
        "Scegli una nuova password</a></p>"
        f"<p>Il link vale per {PASSWORD_RESET_MINUTES} minuti e si può usare una sola volta.<br>"
        "Se non hai chiesto tu il cambio, ignora questa email: la password attuale resta valida.</p>"
        "<p>— FanIQ</p>"
    )
    return subject, text, body


def _changed_email(club_nome: str) -> tuple[str, str]:
    subject = "La password di FanIQ è stata cambiata"
    text = (
        "Ciao,\n"
        f"la password del club {club_nome} è stata appena cambiata.\n\n"
        "Se sei stato tu, non devi fare nulla.\n"
        f"Se non sei stato tu, reimposta subito la password da {FRONTEND_URL}/recupera-password "
        "e contattaci.\n\n"
        "— FanIQ"
    )
    return subject, text


@router.post("/request")
def request_reset(
    body: ResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = body.email.lower().strip()
    club = db.query(Club).filter(Club.email == email).first()
    if club is not None:
        link = f"{FRONTEND_URL}/reimposta-password?token={create_reset_token(club)}"
        subject, text, body_html = _reset_email(club.nome, link)
        background_tasks.add_task(send_email, club.email, subject, text, body_html)
    return {"message": REQUEST_MESSAGE}


@router.post("/confirm")
def confirm_reset(
    body: ResetConfirm,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    club = club_from_reset_token(body.token, db)
    if club is None:
        raise HTTPException(400, INVALID_LINK)
    _validate_password(body.password)

    club.password_hash = hash_password(body.password)
    db.commit()

    if club.email:
        subject, text = _changed_email(club.nome)
        background_tasks.add_task(send_email, club.email, subject, text)
    return {"message": "Password aggiornata. Ora puoi accedere con la nuova password."}
