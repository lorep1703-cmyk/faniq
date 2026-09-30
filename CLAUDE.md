# FanIQ — Guida per Claude Code

## Progetto

SaaS B2B di fan intelligence per club sportivi italiani (Serie C / Lega Pro).
Multi-tenant: ogni club vede solo i propri dati via RLS PostgreSQL.

| Layer | Stack |
|-------|-------|
| Backend | Python · FastAPI 0.111 · SQLAlchemy 2.0.30 · python-jose JWT · bcrypt |
| Database prod | PostgreSQL 16 su Neon (RLS attivo) |
| Database dev | SQLite (default se `FANIQ_DATABASE_URL` non impostato) |
| Frontend | React 18.3 · Vite 5.3 · Tailwind 3.4 · Recharts 2.12 · Axios 1.7 |
| Deploy | Render (backend) · Vercel (frontend) |
| AI Chat | OpenAI GPT-4o via `anthropic>=0.25 / openai>=1.0` |

---

## Struttura

```
faniq/
├── backend/
│   ├── main.py                  # Entry point FastAPI, middleware, startup RLS
│   ├── config.py                # Config centralizzata — env vars con fallback
│   ├── database.py              # Engine SQLAlchemy, SessionLocal, _IS_POSTGRES flag
│   ├── models.py                # ORM: Club, Fan, Abbonamento, Biglietto, ShopOrder,
│   │                            #   Partita, ClubUser, UploadHistory, PrivacyLog
│   ├── tenant.py                # get_current_club() — JWT decode + SET LOCAL RLS
│   ├── fan_intelligence.py      # Dataclass FanIntelligence + enum (no ORM)
│   ├── intelligence_config.py   # Soglie e pesi del Fan Intelligence Engine
│   ├── routers/                 # Un file per dominio funzionale
│   │   ├── auth.py              # POST /auth/register, /auth/login
│   │   ├── password_reset.py    # POST /auth/password-reset/request, /confirm
│   │   ├── dashboard.py         # GET /dashboard/stats, /segments, /fans, ecc.
│   │   ├── insights.py          # GET /insights/overview, /fan/{id}
│   │   ├── intelligence.py      # GET/POST /api/intelligence/...
│   │   ├── upload.py            # POST /upload/{type}, DELETE /upload/{id}
│   │   ├── partite.py           # GET/POST/DELETE /partite/, /behavioral, /predizione
│   │   ├── export.py            # GET /export/fans
│   │   ├── privacy.py           # GDPR: consent, export, delete, log
│   │   ├── chat.py              # POST /chat/
│   │   └── simulator.py         # GET /simulate/...
│   ├── services/
│   │   ├── analytics.py         # RFM, segmentazione, KPI dashboard
│   │   ├── insights.py          # Business Score, Revenue Watch, Opportunità
│   │   ├── behavioral.py        # Analisi casa/trasferta, loyalty badge
│   │   ├── csv_import.py        # Import CSV: fan, abbonamenti, biglietti, shop
│   │   ├── chat.py              # Chat AI con anonimizzazione PII
│   │   ├── cache.py             # Cache in-memory semplice (TTL configurabile)
│   │   ├── auth.py              # hash_password, verify_password, create_token
│   │   ├── password_reset.py    # Token recupero password (stateless, monouso)
│   │   ├── email.py             # Invio email SMTP (stdlib)
│   │   └── intelligence/        # Fan Intelligence Engine (DA-00)
│   │       ├── engine.py        # Orchestratore pipeline 5 stadi + bulk loading
│   │       ├── decay.py         # Stadio 1: half-life pausa tra presenze
│   │       ├── journey.py       # Stadio 2: JourneyStage + momentum
│   │       ├── anomaly.py       # Stadio 3: AnomalyAlert abbonati silenti
│   │       ├── ambassador.py    # Stadio 4: score impatto sociale
│   │       └── renewal.py       # Stadio 5: renewal_probability formula pesata
│   └── tests/
│       └── test_intelligence_engine.py   # 23 test su dati sintetici
├── frontend/src/
│   ├── App.jsx                  # Router + PrivateRoute
│   ├── api/client.js            # Tutte le chiamate API (axios + interceptor JWT)
│   ├── pages/
│   │   ├── Dashboard.jsx        # KPI + chart città/revenue/presenze + JourneyWidget
│   │   ├── Insights.jsx         # Business Score + Revenue Watch + Opportunità
│   │   ├── Report.jsx           # Tabella fan: RFM, stadio journey, prob. rinnovo
│   │   ├── AlertsPage.jsx       # "Da contattare" — anomalie abbonamenti
│   │   ├── Upload.jsx           # Caricamento CSV
│   │   └── Privacy.jsx          # GDPR: consensi, export, cancellazione
│   └── components/
│       ├── Sidebar.jsx          # Nav + badge campanella anomalie critiche
│       ├── intelligence/
│       │   ├── JourneyBadge.jsx          # Badge atomico 7 stadi
│       │   ├── JourneyTimeline.jsx       # Timeline con rami negativi
│       │   ├── JourneyDistributionWidget.jsx  # Donut chart + insight testuale
│       │   └── FanAnomalyBanner.jsx      # Banner inline scheda fan
│       └── [ChatWidget, StatCard, EmptyState, ErrorBoundary, DataHealthPill...]
├── migrations/
│   └── rls_setup.sql            # Setup RLS PostgreSQL per nuove installazioni
├── sample_csv/                  # Dataset sintetici per test
└── start.sh                     # Avvia backend + frontend in parallelo
```

---

## Comandi

```bash
# Avvio completo (backend porta 8000 + frontend porta 3000)
./start.sh

# Solo backend
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000

# Solo frontend
cd frontend && npm run dev

# Test backend
cd backend && python3 -m pytest tests/ -v

# Build frontend (produzione)
cd frontend && npm run build
```

**Variabili d'ambiente richieste per il backend:**

| Variabile | Obbligatoria | Note |
|-----------|-------------|------|
| `FANIQ_JWT_SECRET` | ✅ sì | Il backend crasha senza |
| `FANIQ_DATABASE_URL` | no | Default: SQLite locale |
| `FANIQ_CORS_ORIGINS` | no | Default: localhost:3000,5173 |
| `FANIQ_OPENAI_MODEL` | no | Default: gpt-4o |
| `FANIQ_FRONTEND_URL` | sì in prod | Base dei link nelle email di recupero password (es. URL Vercel). Default: localhost:3000 |
| `FANIQ_SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` | sì per inviare email | Oggi su Render: Gmail dedicato (`smtp.gmail.com:587` + password per app). Senza host le email non partono |
| `FANIQ_MAIL_FROM` | sì per inviare email | Mittente, uguale all'utente SMTP: `FanIQ <indirizzo@gmail.com>` |
| `FANIQ_PASSWORD_RESET_MINUTES` | no | Validità del link di recupero. Default: 60 |

---

## Architettura e convenzioni

### Multi-tenant RLS
Ogni tabella tenant (`fans`, `abbonamenti`, `biglietti`, `shop_orders`, `upload_history`, `privacy_log`, `partite`) ha una policy RLS che filtra su `club_id`.

Meccanica:
1. `tenant.py::get_current_club()` decodifica il JWT → estrae `club_id`
2. Esegue `SET LOCAL app.current_club_id = :cid` nella transazione corrente
3. PostgreSQL applica la policy automaticamente su ogni query successiva
4. `SET LOCAL` si azzera al commit/rollback — nessun leak tra richieste nel pool

Su SQLite (dev locale) RLS non è attivo — le query usano `filter(Model.club_id == club.id)`.

### Pattern endpoint backend
```python
@router.get("/percorso")
def handler(
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),   # ← JWT + RLS attivato qui
):
```
`get_current_club` è la dipendenza universale: valida il token e attiva RLS in una sola chiamata.

### Rate limiting
Middleware custom in `main.py` (non slowapi). Su `/auth/register` (5 req/min), `/auth/login` (10 req/min), `/auth/password-reset/request` (3 req/min), `/auth/password-reset/confirm` (10 req/min), più chat, upload e refresh intelligence (vedi `_RATE_LIMITS`). Le due righe del recupero password sono state autorizzate da Lorenzo (24/09/2026).

### Pattern chiamate API frontend
Tutte le funzioni sono in `frontend/src/api/client.js`:
- Un'istanza axios condivisa con `baseURL = VITE_API_URL` (default `http://localhost:8000`)
- Interceptor request: aggiunge `Authorization: Bearer <token>` da localStorage
- Interceptor response: su 401 → logout automatico; altri errori → `error.userMessage` leggibile
- Ogni funzione esporta direttamente il `.data` della risposta

### Componenti React
- Nessun context globale — state locale per pagina con `useState` / `useEffect`
- Chart: Recharts (già installato) — non aggiungere Chart.js o D3
- Icone: lucide-react (già installato) — non aggiungere heroicons o simili
- Styling: solo classi Tailwind — niente CSS-in-JS

---

## Feature esistenti

| Feature | File principale |
|---------|----------------|
| Autenticazione club + ClubUser con ruoli | `routers/auth.py`, `services/auth.py`, `tenant.py` |
| Recupero password club (link email monouso, schema Django/fastapi-users senza tabella) | `routers/password_reset.py`, `services/password_reset.py`, `services/email.py` |
| RFM segmentation (VIP/Fedele/A rischio/Dormiente/Nuovo) | `services/analytics.py` |
| Business Score 0-100 + Revenue Watch + Opportunità | `services/insights.py` |
| Upload CSV: fan, abbonamenti, biglietti, shop, partite | `services/csv_import.py`, `routers/upload.py` |
| Calendario partite + Predizione presenze | `routers/partite.py`, `services/behavioral.py` |
| Export CSV fan per segmento | `routers/export.py` |
| Chat AI con anonimizzazione PII | `services/chat.py`, `routers/chat.py` |
| Privacy GDPR: export, cancellazione, log audit | `routers/privacy.py`, `services/privacy.py` |
| **Fan Intelligence Engine (DA-00)** | `services/intelligence/`, `fan_intelligence.py` |
| → Stadio 1: Decay Profile | `services/intelligence/decay.py` |
| → Stadio 2: Journey Stage (7 stadi) | `services/intelligence/journey.py` |
| → Stadio 3: Subscription Anomaly | `services/intelligence/anomaly.py` |
| → Stadio 4: Ambassador Score | `services/intelligence/ambassador.py` |
| → Stadio 5: Renewal Probability (unica fonte di "prob. rinnovo" in tutta l'app — Report, FanDetailPanel, Dashboard, Business Score) | `services/intelligence/renewal.py` |
| UI Journey Badge + Timeline + Distribution | `frontend/src/components/intelligence/` |
| UI Alerts "Da contattare" con archivio | `frontend/src/pages/AlertsPage.jsx` |

---

## Endpoint Intelligence Engine

> Tutti sotto prefix `/api/intelligence` — autenticati con Bearer token.

| Metodo | Path | Risposta |
|--------|------|----------|
| `GET` | `/api/intelligence/fan/{fan_id}` | `FanIntelligence` singolo fan |
| `GET` | `/api/intelligence/club` | Lista paginata, filtri: `journey_stage`, `min_renewal`, `max_renewal`, `sort` |
| `GET` | `/api/intelligence/club/summary` | `{ total_fans, avg_renewal_probability, fans_at_risk, fans_to_contact, journey_distribution, decay_distribution }` |
| `GET` | `/api/intelligence/club/alerts-context` | `{ current_season, active_subscribers, latest_season }` — spiega "Da contattare" vuota |
| `POST` | `/api/intelligence/club/refresh` | Avvia ricalcolo in background → `{ job_id, status: "queued" }` |
| `GET` | `/api/intelligence/club/refresh/status` | `{ status: "queued"|"running"|"done"|"error"|"idle" }` |

**Struttura `FanIntelligence` (response):**
```json
{
  "fan_id": 42,
  "renewal_probability": 0.72,
  "journey_stage": "FEDELTA",
  "decay_profile": "LENTO",
  "ambassador_score": 68,
  "subscription_anomaly": {
    "severity": "ALTA",
    "message": "Abbonato assente da 3 partite consecutive. Stadio attuale: Fedeltà.",
    "consecutive_absences": 3
  },
  "intelligence_score": 72,
  "computed_at": "2026-06-22T10:30:00",
  "data_quality": "FULL",
  "momentum": 0.25,
  "half_life_value": 2.5
}
```

---

## Vincoli di sicurezza — NON NEGOZIABILI

1. Non modificare autenticazione, JWT o middleware di sicurezza.
2. Non modificare la logica RLS PostgreSQL. Ogni nuova query eredita il contesto tenant.
3. Non usare dati reali. Usare solo il dataset sintetico in `/tests/fixtures/`.
4. Non esporre fan_id o dati personali in log, console output o error messages.
5. Non suggerire soluzioni che compromettano l'isolamento multi-tenant.

**Note operative aggiuntive:**
- Python 3.11 obbligatorio in produzione — 3.12 rompe SQLAlchemy
- `Base.metadata.create_all()` NON altera colonne esistenti su Neon → ALTER TABLE manuale via SQL Editor
- `from __future__ import annotations` obbligatorio nei file che usano `X | None` su Python <3.10
- Pydantic v2: `detail` è array per errori di validazione — il middleware in `main.py` lo normalizza a stringa
- **Email di recupero password NON partono in produzione (decisione di Lorenzo, 30/09/2026).** Render free blocca l'SMTP in uscita (porte 25/465/587, dal 26/09/2025): nei log compare `Invio email '...' fallito: OSError`. Codice e variabili SMTP su Render sono già a posto. Si sblocca quando arriva il primo club, con UNA di queste: **A)** Render a pagamento → Gmail SMTP funziona senza toccare il codice; **B)** dominio proprio + Brevo via API HTTPS → piccola modifica a `services/email.py`. Brevo senza dominio sconsigliato: riscrive il mittente Gmail, rischio spam. Nel frattempo i reset si fanno a mano.
- Su Render l'IP nei log è quello reale del client (non il proxy interno): il rate limit per IP in `main.py` distingue gli utenti.

---

## Deploy — regola obbligatoria

Dopo ogni fix o sessione di lavoro, **committa sempre** (non lasciare mai modifiche non committate a fine sessione):

```bash
git add backend/  # o i file modificati
git commit -m "fix: descrizione"
```

Il **push** su `main` è bloccato in modo assoluto dalla regola hookify `.claude/hookify.conferma-distruttivi.local.md` (`action: block`). La regola blocca ogni push tranne quello (non forzato) su un ramo `claude/...` di sessione cloud: lì il lavoro va salvato perché il contenitore viene cancellato, e non parte nessun deploy. Blocca sempre: push che nominano `main`, push senza ramo esplicito, `--force`/`-f`: è un divieto tecnico, non aggirabile con una conferma in chat — Claude Code non può eseguirlo in nessun caso, nemmeno se Lorenzo dice "vai" nello stesso turno. Claude Code annuncia sempre chiaramente cosa sta per pushare (commit inclusi) e poi si ferma lì: il push effettivo — che fa scattare il deploy automatico su Render — lo esegue sempre Lorenzo dal proprio terminale con `git push origin main`. Nessun workaround per aggirare il blocco (niente flag alternativi, niente comandi equivalenti).

---

## Cosa NON fare

- **Non riscrivere feature già esistenti** — leggi il codice prima. RFM, Business Score e l'intero Intelligence Engine (Renewal Probability incluso, Stadio 5) sono completi.
- **Non installare librerie** senza conferma esplicita — il bundle frontend e il venv backend sono stabili.
- **Non toccare** `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`.
- **Non creare file di documentazione** non richiesti (README, ADR, ecc.).
- **Non usare `slowapi`** — il rate limiting è il middleware custom in `main.py`.
- **Non aggiungere Chart.js, D3 o altre librerie di charting** — Recharts è già presente e sufficiente.
