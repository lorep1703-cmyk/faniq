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
│   │   ├── dashboard.py         # GET /dashboard/stats, /segments, /fans, ecc.
│   │   ├── insights.py          # GET /insights/overview, /fan/{id}
│   │   ├── intelligence.py      # GET/POST /api/intelligence/...
│   │   ├── renewal.py           # GET /fans/renewal-scores, /{id}/renewal-score
│   │   ├── upload.py            # POST /upload/{type}, DELETE /upload/{id}
│   │   ├── partite.py           # GET/POST/DELETE /partite/, /behavioral, /predizione
│   │   ├── export.py            # GET /export/fans
│   │   ├── privacy.py           # GDPR: consent, export, delete, log
│   │   ├── chat.py              # POST /chat/
│   │   └── simulator.py         # GET /simulate/...
│   ├── services/
│   │   ├── analytics.py         # RFM, segmentazione, KPI dashboard
│   │   ├── insights.py          # Business Score, Revenue Watch, Opportunità
│   │   ├── renewal.py           # Renewal Probability Score (5 segnali pesati)
│   │   ├── behavioral.py        # Analisi casa/trasferta, loyalty badge
│   │   ├── csv_import.py        # Import CSV: fan, abbonamenti, biglietti, shop
│   │   ├── chat.py              # Chat AI con anonimizzazione PII
│   │   ├── cache.py             # Cache in-memory semplice (TTL configurabile)
│   │   ├── auth.py              # hash_password, verify_password, create_token
│   │   └── intelligence/        # Fan Intelligence Engine (DA-00)
│   │       ├── engine.py        # Orchestratore pipeline 5 stadi + bulk loading
│   │       ├── decay.py         # Stadio 1: half-life pausa tra presenze
│   │       ├── journey.py       # Stadio 2: JourneyStage + momentum
│   │       ├── anomaly.py       # Stadio 3: AnomalyAlert abbonati silenti
│   │       ├── ambassador.py    # Stadio 4: score impatto sociale
│   │       └── renewal.py       # Stadio 5: renewal_probability formula pesata
│   └── tests/
│       ├── test_intelligence_engine.py   # 23 test su dati sintetici
│       └── test_renewal.py
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
Middleware custom in `main.py` (non slowapi). Solo su `/auth/register` (5 req/min) e `/auth/login` (10 req/min).

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
| RFM segmentation (VIP/Fedele/A rischio/Dormiente/Nuovo) | `services/analytics.py` |
| Business Score 0-100 + Revenue Watch + Opportunità | `services/insights.py` |
| Renewal Probability Score (5 segnali pesati) | `services/renewal.py`, `routers/renewal.py` |
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
| → Stadio 5: Renewal Probability | `services/intelligence/renewal.py` |
| UI Journey Badge + Timeline + Distribution | `frontend/src/components/intelligence/` |
| UI Alerts "Da contattare" con archivio | `frontend/src/pages/AlertsPage.jsx` |

---

## Endpoint Intelligence Engine

> Tutti sotto prefix `/api/intelligence` — autenticati con Bearer token.

| Metodo | Path | Risposta |
|--------|------|----------|
| `GET` | `/api/intelligence/fan/{fan_id}` | `FanIntelligence` singolo fan |
| `GET` | `/api/intelligence/club` | Lista paginata, filtri: `journey_stage`, `min_renewal`, `max_renewal`, `sort` |
| `GET` | `/api/intelligence/club/summary` | `{ total_fans, avg_renewal_probability, fans_at_risk, fans_critical_anomaly, journey_distribution, decay_distribution }` |
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
  "momentum": 0.25
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

---

## Deploy — regola obbligatoria

Dopo ogni fix o sessione di lavoro, **committa e pusha sempre su `main`**:

```bash
git add backend/  # o i file modificati
git commit -m "fix: descrizione"
git push origin main
```

Render si aggiorna automaticamente ad ogni push. Non lasciare mai modifiche non committate a fine sessione.

---

## Cosa NON fare

- **Non riscrivere feature già esistenti** — leggi il codice prima. RFM, Business Score, Renewal e l'intero Intelligence Engine sono completi.
- **Non installare librerie** senza conferma esplicita — il bundle frontend e il venv backend sono stabili.
- **Non toccare** `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`.
- **Non creare file di documentazione** non richiesti (README, ADR, ecc.).
- **Non usare `slowapi`** — il rate limiting è il middleware custom in `main.py`.
- **Non aggiungere Chart.js, D3 o altre librerie di charting** — Recharts è già presente e sufficiente.
