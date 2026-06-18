#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== FanIQ — Avvio ==="

# Backend
echo ""
echo "[1/2] Avvio backend (porta 8000)..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "  Creazione virtualenv..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo ""
echo "[2/2] Avvio frontend (porta 3000)..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installazione dipendenze npm..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== FanIQ avviato ==="
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Premi Ctrl+C per fermare tutto."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
