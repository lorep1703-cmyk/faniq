# FanIQ — Contesto di Progetto (da incollare all'inizio di una nuova chat)

## Identità del progetto
**FanIQ** è una piattaforma SaaS B2B di fan intelligence e analytics per club sportivi.
Ogni club carica i propri CSV (abbonati, biglietteria, shop), la piattaforma calcola
segmentazione RFM, insights automatici, simulatore affluenza, export GDPR.
Architettura **multi-tenant**: più club indipendenti, isolamento totale dei dati.

---

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| Backend | Python 3.9 · FastAPI 0.111 · SQLAlchemy 2.0 |
| Auth | JWT (python-jose) · bcrypt (passlib) |
| Database locale (dev) | SQLite (`faniq.db`) |
| Database produzione | PostgreSQL 16 (Neon) |
| Frontend | React 18 · Vite · Tailwind CSS · Recharts · Axios |
| Deploy target | Vercel (frontend) · Render (backend) · Neon (DB) |

---

## Percorso del progetto
```
/Users/lorenzoponzi/Desktop/corso ia/faniq/
├── backend/
│   ├── main.py                  # Entry point FastAPI, startup migration + RLS
│   ├── config.py                # Tutte le env var (DATABASE_URL, JWT, CORS, cache…)
│   ├── database.py              # Engine smart SQLite/PostgreSQL, connection pool
│   ├── models.py                # ORM + indici composti in __table_args__
│   ├── tenant.py                # Dependency get_current_club → SET LOCAL RLS
│   ├── routers/
│   │   ├── auth.py              # POST /auth/register, POST /auth/login
│   │   ├── dashboard.py         # GET /dashboard/* (tutti protetti da JWT)
│   │   ├── upload.py            # POST /upload/{type}, GET /upload/history
│   │   ├── insights.py          # GET /insights/overview, /data-readiness
│   │   ├── simulator.py         # GET /simulate/base, /simulate/attendance
│   │   ├── privacy.py           # GDPR: consent, export, delete, log
│   │   ├── export.py            # GET /export/fans (CSV download via blob)
│   │   └── chat.py              # POST /chat/ (OpenAI contestuale)
│   ├── services/
│   │   ├── analytics.py         # RFM scoring, dashboard KPI — tutti filtrati per club_id
│   │   ├── csv_import.py        # Import CSV abbonati/biglietteria/shop per club
│   │   ├── insights.py          # Insights automatici (email%, dormienti, VIP…)
│   │   ├── privacy.py           # Consenso, export GDPR, cancellazione
│   │   ├── simulator.py         # Simulatore affluenza stadio
│   │   ├── data_readiness.py    # Score qualità dati per club
│   │   ├── chat.py              # Context builder + chiamata OpenAI
│   │   ├── auth.py              # hash_password, verify_password, create_token, decode_token
│   │   └── cache.py             # Cache in-memory TTL con chiavi per club_id
│   ├── .env.example             # Template variabili d'ambiente
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + PrivateRoute (redirect /login se no token)
│   │   ├── api/client.js        # Axios con interceptor JWT + tutte le funzioni API
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Tab Accedi / Registra club
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── Report.jsx
│   │   │   ├── Simulatore.jsx
│   │   │   ├── Upload.jsx
│   │   │   └── Privacy.jsx
│   │   └── components/
│   │       ├── Sidebar.jsx      # Nome club da localStorage + pulsante Esci
│   │       ├── ChatWidget.jsx
│   │       ├── StatCard.jsx
│   │       ├── DataHealthPill.jsx / DataHealthModal.jsx
│   │       ├── EmptyState.jsx
│   │       ├── BackendStatus.jsx
│   │       └── ErrorBoundary.jsx
│   └── package.json             # React 18 · Vite 5 · Tailwind 3 · Recharts
└── migrations/
    └── rls_setup.sql            # SQL standalone per Neon: indici + RLS + ruolo dedicato
```

---

## Architettura multi-tenant (già implementata)

### Modello dati
Tutte le tabelle tenant (`fans`, `abbonamenti`, `biglietti`, `shop_orders`,
`upload_history`, `privacy_log`) hanno `club_id INTEGER FK → clubs.id`.

### Livello 1 — Filtro applicativo
Ogni service riceve `club_id: int` e filtra: `db.query(Fan).filter(Fan.club_id == club_id)`.

### Livello 2 — JWT
`tenant.py::get_current_club` verifica il token, estrae `club_id` dal payload,
lo inietta in tutti i router come dipendenza FastAPI.

### Livello 3 — Row-Level Security (PostgreSQL)
Attivata automaticamente allo startup se il DB è PostgreSQL:
```sql
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON fans AS PERMISSIVE FOR ALL TO PUBLIC
  USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);
```
Prima di ogni query autenticata, `tenant.py` esegue:
```python
db.execute(text("SET LOCAL app.current_club_id = :cid"), {"cid": club.id})
```
`SET LOCAL` è scoped alla transazione corrente → impossibile leakage nel pool.

### Indici composti (10 totali)
Dichiarati in `models.py::__table_args__`, creati da `create_all`:
- `ix_fans_club_email` → lookup email in _find_or_create_fan
- `ix_fans_club_id` → scan completo per club
- `ix_abbonamenti_club_stagione` → dashboard_retention
- `ix_abbonamenti_club_fan` → join fan→abbonamenti
- `ix_biglietti_club_data` → dashboard_presenze
- `ix_biglietti_club_fan` → join fan→biglietti
- `ix_shop_club_data` → dashboard_revenue_breakdown
- `ix_shop_club_fan` → join fan→shop
- `ix_upload_history_club_ts` → history endpoint
- `ix_privacy_log_club_ts` → log audit GDPR

---

## Auth flow

```
POST /auth/register  { nome, slug, password }  → { token, club }
POST /auth/login     { slug, password }         → { token, club }
```
Token JWT: payload `{ sub: club_id, slug, nome, exp }`, durata 7 giorni.
Frontend: token in `localStorage.faniq_token`, club in `localStorage.faniq_club`.
Axios interceptor aggiunge `Authorization: Bearer <token>` a ogni chiamata.
Se arriva 401 → logout automatico + redirect `/login`.

---

## Variabili d'ambiente (.env backend)

```env
# Dev (SQLite, già funzionante in locale):
FANIQ_DATABASE_URL=sqlite:///./faniq.db

# Produzione (Neon):
FANIQ_DATABASE_URL=postgresql://neondb_owner:PWD@ep-XXX.neon.tech/neondb?sslmode=require

FANIQ_JWT_SECRET=<openssl rand -hex 32>
FANIQ_JWT_EXPIRE_MINUTES=10080
FANIQ_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
FANIQ_MAX_UPLOAD_MB=20
FANIQ_CACHE_TTL=120
FANIQ_LOG_LEVEL=INFO
OPENAI_API_KEY=        # opzionale
```

Frontend su Vercel:
```env
VITE_API_URL=https://faniq-backend.onrender.com
```

---

## Come avviare in locale

```bash
# Backend
cd faniq/backend
python3 -m uvicorn main:app --reload --port 8000

# Frontend
cd faniq/frontend
npm run dev          # → http://localhost:3000
```

Il dev server frontend è gestito da `.claude/launch.json` (Vite su porta 3000).

---

## Stato attuale e prossimi step

### Completato ✅
- [x] Dashboard multi-pagina (KPI, grafici Recharts, segmentazione RFM)
- [x] Upload CSV (abbonati, biglietteria, shop) con undo
- [x] Segmentazione RFM automatica (VIP, Fedele, A rischio, Dormiente, Nuovo, Occasionale)
- [x] Insights automatici
- [x] Simulatore affluenza stadio
- [x] Export CSV con filtri per segmento / solo consenzienti (GDPR)
- [x] Privacy & GDPR (consenso, export dati, cancellazione, audit log)
- [x] Chat AI contestuale (OpenAI, anonimizzazione PII)
- [x] **Multi-tenancy completa**: Club model + JWT + club_id su tutte le tabelle
- [x] **PostgreSQL ready**: engine smart, connection pool, 10 indici composti, RLS automatica
- [x] **Frontend auth**: Login page, PrivateRoute, axios interceptor, logout

### Da fare ➡️
- [ ] **Fase 3 — Deploy**: Neon (DB) + Render (backend) + Vercel (frontend)
  - Creare DB su Neon, copiare connection string
  - Deploy backend su Render con variabili d'ambiente
  - Deploy frontend su Vercel con VITE_API_URL
  - Verificare RLS attiva su PostgreSQL (query di test in migrations/rls_setup.sql)
  - Configurare UptimeRobot → ping /health ogni 14 min (anti-sleep Render free tier)
- [ ] **Fase 4 — Tracciamento dati** (data model per eventi real-time, webhook, ecc.)
- [ ] **Setup avanzato RLS**: creare ruolo `faniq_app` non-owner su Neon + FORCE ROW LEVEL SECURITY

---

## Note tecniche importanti

- **Python 3.9**: usare `from __future__ import annotations` per sintassi `X | None`.
  I file che lo richiedono hanno già l'import. NON usare `int | None` senza di esso.
- **SQLite in locale**: RLS non viene applicata (corretto per dev), gli indici composti
  su tabelle già esistenti non vengono aggiunti da `create_all` → usare un DB fresco
  o PostgreSQL per testare RLS e indici.
- **Cache**: chiavi `f"fan_segments_{club_id}"` — `invalidate(club_id)` svuota solo
  la cache di quel club.
- **Export CSV**: usa axios con `responseType: 'blob'` (non `window.open`) per includere
  il token JWT nell'header.
- **Startup idempotente**: `_apply_rls_postgres()` fa DROP + CREATE POLICY, sicuro
  da eseguire più volte.
