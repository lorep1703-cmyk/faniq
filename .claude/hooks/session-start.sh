#!/bin/bash
# Sessioni cloud (Claude Code on the web): installa le dipendenze GIÀ dichiarate
# nel progetto, così test e build funzionano. Nessuna libreria nuova.
# Destinazioni non versionate: backend/.venv e frontend/node_modules.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Backend: requirements.txt + pytest (usato da backend/tests/)
if [ ! -x backend/.venv/bin/python ]; then
  python3 -m venv backend/.venv
fi
backend/.venv/bin/python -m pip install --quiet --disable-pip-version-check \
  -r backend/requirements.txt pytest

# Frontend: versioni esatte di package-lock.json (npm ci non lo riscrive mai)
(cd frontend && npm ci --no-audit --no-fund --loglevel=error)

# Il backend non parte senza JWT secret: nel container ne serve uno solo per i test,
# generato a caso a ogni sessione (mai quello di produzione).
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -z "${FANIQ_JWT_SECRET:-}" ]; then
  echo "export FANIQ_JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" >> "$CLAUDE_ENV_FILE"
fi
echo "export PATH=\"$CLAUDE_PROJECT_DIR/backend/.venv/bin:\$PATH\"" >> "${CLAUDE_ENV_FILE:-/dev/null}"
