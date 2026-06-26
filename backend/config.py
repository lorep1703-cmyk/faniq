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
import secrets as _secrets
_jwt_secret = os.environ.get("FANIQ_JWT_SECRET")
if not _jwt_secret:
    raise RuntimeError("FANIQ_JWT_SECRET non configurato — imposta la variabile d'ambiente")
JWT_SECRET_KEY = _jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("FANIQ_JWT_EXPIRE_MINUTES", "10080"))  # 7 giorni
