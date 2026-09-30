"""Configurazione centralizzata FanIQ — tutti i valori sovrascrivibili via variabili d'ambiente."""
import os

# Database
DATABASE_URL = os.environ.get("FANIQ_DATABASE_URL", "sqlite:///./faniq.db")

# CORS — lista separata da virgole
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("FANIQ_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    if o.strip()
]

# Upload
MAX_UPLOAD_SIZE_MB = int(os.environ.get("FANIQ_MAX_UPLOAD_MB", "10"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Chat AI
OPENAI_MODEL = os.environ.get("FANIQ_OPENAI_MODEL", "gpt-4o")
CHAT_MAX_TURNS = int(os.environ.get("FANIQ_CHAT_MAX_TURNS", "6"))
CHAT_MAX_TOKENS = int(os.environ.get("FANIQ_CHAT_MAX_TOKENS", "2048"))

# Privacy: se True (default) i dati personali (nome, email, data nascita) NON vengono
# mai inviati al modello AI esterno — i tifosi sono referenziati come "Tifoso #ID".
CHAT_ANONYMIZE_PII = os.environ.get("FANIQ_CHAT_ANONYMIZE", "true").lower() != "false"

# Cache analytics (secondi). 0 = disabilitata.
# 900s (15 min): su Render Free il worker si spegne dopo ~15 min di inattività e la cache
# si azzera ad ogni riavvio — un TTL più lungo riduce i ricalcoli tra una sessione e l'altra.
ANALYTICS_CACHE_TTL = int(os.environ.get("FANIQ_CACHE_TTL", "900"))

# Logging
LOG_LEVEL = os.environ.get("FANIQ_LOG_LEVEL", "INFO").upper()

# Auth JWT
_jwt_secret = os.environ.get("FANIQ_JWT_SECRET")
if not _jwt_secret:
    raise RuntimeError("FANIQ_JWT_SECRET non configurato — imposta la variabile d'ambiente")
JWT_SECRET_KEY = _jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("FANIQ_JWT_EXPIRE_MINUTES", "480"))  # 8 ore
FANIQ_ENV: str = os.environ.get("FANIQ_ENV", "development")

# Recupero password
# URL fisso del frontend per i link nelle email: mai ricavato dalla richiesta
# (host header injection, vedi OWASP Forgot Password Cheat Sheet).
FRONTEND_URL = os.environ.get("FANIQ_FRONTEND_URL", "http://localhost:3000").rstrip("/")
PASSWORD_RESET_MINUTES = int(os.environ.get("FANIQ_PASSWORD_RESET_MINUTES", "60"))

# Email (SMTP) — es. Brevo: smtp-relay.brevo.com:587. Senza SMTP_HOST le email
# non partono (in sviluppo il flusso funziona lo stesso, senza invio).
SMTP_HOST = os.environ.get("FANIQ_SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("FANIQ_SMTP_PORT", "587"))
SMTP_USER = os.environ.get("FANIQ_SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("FANIQ_SMTP_PASSWORD", "")
MAIL_FROM = os.environ.get("FANIQ_MAIL_FROM", "FanIQ <noreply@localhost>")
