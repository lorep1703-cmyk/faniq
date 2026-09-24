"""Invio email transazionali via SMTP (libreria standard, nessuna dipendenza)."""
from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

from config import MAIL_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER

logger = logging.getLogger("faniq")


def send_email(to: str, subject: str, text: str, html: str | None = None) -> bool:
    """Invia un'email. Ritorna False (senza sollevare) se SMTP non è configurato
    o l'invio fallisce. Nei log mai il destinatario né il contenuto: possono
    contenere dati personali o link di recupero."""
    if not SMTP_HOST:
        logger.warning("SMTP non configurato: email '%s' non inviata", subject)
        return False

    msg = EmailMessage()
    msg["From"] = MAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
            smtp.starttls(context=ssl.create_default_context())
            if SMTP_USER:
                smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except (smtplib.SMTPException, OSError) as exc:
        logger.error("Invio email '%s' fallito: %s", subject, type(exc).__name__)
        return False
