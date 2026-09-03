# Fix RFM Proxy nel Fan Intelligence Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il classificatore RFM "proxy" interno del Fan Intelligence Engine (che ignora la recency e non può mai produrre "A rischio") con l'RFM reale già calcolato da `compute_fan_segments`, usato ovunque altrove nell'app (Report, export, Revenue Watch).

**Architecture:** `_extract_fan_raw` smette di calcolare il proprio RFM tramite `_rfm_from_fan(fan)` e lo riceve come parametro. I due entry point (`compute_fan_intelligence` per singolo fan, `compute_club_intelligence` per batch club) calcolano una mappa `fan_id → segment` reale via `compute_fan_segments(db, club_id)` (già cache-backed) e la passano giù. `_rfm_from_fan` viene rimossa: nessun altro chiamante dopo il fix.

**Tech Stack:** Python 3.11, SQLAlchemy 2.0 ORM, pytest.

**Spec:** Nessun documento di design separato — problema individuato da un audit di coerenza in questa sessione (non da una skill di brainstorming). Sintesi del bug, verificata a mano prima di questo piano:

- `services/intelligence/engine.py::_rfm_from_fan` (riga 80-91) classifica solo per conteggi (`len(abbonamenti)`, `total_activities`), **ignora la recency**, e i suoi unici output possibili sono VIP / Fedele / Dormiente / Nuovo / Occasionale — **mai** "A rischio".
- `intelligence_config.py::RFM_FLOAT_MAP` (riga 78-85) ha 6 chiavi, incluso `"A rischio": 0.25` — pensata per l'RFM reale (`services/analytics.py::_rfm_scores`, righe 76-88, che produce esattamente queste 6 stringhe basandosi su quintili di recency/frequency/monetary), non per il proxy.
- Risultato: un fan che l'app mostra ovunque come RFM reale "A rischio" (ex-abbonato silente da mesi, alta storicità) viene trattato dal motore come "Fedele" (0.75 invece di 0.25) se ha ≥1 abbonamento e ≥3 attività totali — `renewal_probability` gonfiata fino a `(0.75-0.25) × 0.20 = +10 punti percentuali` sulla sola componente RFM (peso `base = 0.20`, vedi `renewal.py` riga ~30). Lo stesso proxy alimenta anche `decay.py::_decay_from_rfm` (Stadio 1) quando lo storico presenze è insufficiente.

## Global Constraints

- Non toccare `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`.
- Non usare dati reali — solo `sample_csv/` e dati sintetici nei test.
- Python 3.11 in produzione; `from __future__ import annotations` già presente in `engine.py`.
- Il motore è descritto come "completo" in CLAUDE.md — fix chirurgico, non redesign: nessuna modifica alla firma pubblica di `compute_fan_intelligence`/`compute_club_intelligence`, nessun nuovo file.
- `Base.metadata.create_all()` non altera schema esistente su Neon — non applicabile qui, nessuna modifica di modello in questo piano.

---

## File Structure

- Modify: `backend/services/intelligence/engine.py` — firma di `_extract_fan_raw` (aggiunge `rfm_segment`), rimozione di `_rfm_from_fan`, `compute_fan_intelligence` e `compute_club_intelligence` calcolano e passano l'RFM reale.
- Test: `backend/tests/test_intelligence_engine.py` — nuovo test di regressione sul passthrough di `_extract_fan_raw`.

---

### Task 1: `_extract_fan_raw` riceve `rfm_segment` come parametro

**Files:**
- Modify: `backend/services/intelligence/engine.py:94-124` (`_extract_fan_raw`)
- Test: `backend/tests/test_intelligence_engine.py`

**Interfaces:**
- Consumes: nessuna dipendenza da task precedenti.
- Produces: `_extract_fan_raw(fan, past_match_dates: list[date], current_season: str, rfm_segment: str) -> _FanRaw` — Task 3 e 4 passeranno `rfm_segment` da qui in poi.

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungi in fondo a `backend/tests/test_intelligence_engine.py` (stesso pattern di stub già usato per `test_data_quality_full`, righe 241-257 — `models`/`database` mockati per importare `engine.py` senza DB reale):

```python
# ── Regressione: _extract_fan_raw usa l'RFM passato, non un proxy interno ──

def test_extract_fan_raw_usa_rfm_segment_passato():
    import sys
    for key in list(sys.modules):
        if "intelligence.engine" in key:
            del sys.modules[key]
    import unittest.mock as mock
    from datetime import date as _date

    with mock.patch.dict("sys.modules", {
        "models": mock.MagicMock(),
        "database": mock.MagicMock(),
    }):
        import services.intelligence.engine as eng

        fake_fan = mock.MagicMock()
        fake_fan.id = 1
        fake_fan.club_id = 1
        fake_fan.abbonamenti = []
        fake_fan.biglietti = []
        fake_fan.shop_orders = []

        raw = eng._extract_fan_raw(
            fake_fan,
            past_match_dates=[],
            current_season="2024/2025",
            rfm_segment="A rischio",
        )
        assert raw.rfm_segment == "A rischio"
```

- [ ] **Step 2: Esegui il test e verifica che fallisca**

Run: `cd backend && source .venv/bin/activate && FANIQ_JWT_SECRET=dev-local-verify-only python3 -m pytest tests/test_intelligence_engine.py::test_extract_fan_raw_usa_rfm_segment_passato -v`
Expected: FAIL con `TypeError: _extract_fan_raw() got an unexpected keyword argument 'rfm_segment'`

- [ ] **Step 3: Implementa il minimo per farlo passare**

In `backend/services/intelligence/engine.py`, sostituisci la firma e il corpo di `_extract_fan_raw` (righe 94-124):

```python
def _extract_fan_raw(
    fan: Fan,
    past_match_dates: list[date],
    current_season: str,
    rfm_segment: str,
) -> _FanRaw:
    fan_ticket_dates = {b.data_partita for b in fan.biglietti if b.data_partita}
    presence_flags = _build_presence_flags(fan_ticket_dates, past_match_dates)

    has_sub = any(
        a.stagione == current_season for a in fan.abbonamenti
    )
    n_seasons = len({a.stagione for a in fan.abbonamenti if a.stagione})

    # Aggrega biglietti per data partita → un "acquisto" per data
    by_date: dict[date, int] = {}
    for b in fan.biglietti:
        if b.data_partita:
            by_date[b.data_partita] = by_date.get(b.data_partita, 0) + 1
    purchases = [{"date": d, "n_tickets": n, "amount": 0.0} for d, n in by_date.items()]

    return _FanRaw(
        fan_id=fan.id,
        club_id=fan.club_id,
        rfm_segment=rfm_segment,
        presence_flags=presence_flags,
        has_active_subscription=has_sub,
        n_subscription_seasons=n_seasons,
        purchases=purchases,
    )
```

(L'unica differenza dal codice attuale: nuovo parametro `rfm_segment: str` in firma, rimossa la riga `rfm_segment = _rfm_from_fan(fan)`, il parametro passa diretto a `_FanRaw`.)

- [ ] **Step 4: Esegui il test e verifica che passi**

Run: `cd backend && source .venv/bin/activate && FANIQ_JWT_SECRET=dev-local-verify-only python3 -m pytest tests/test_intelligence_engine.py::test_extract_fan_raw_usa_rfm_segment_passato -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/lorenzoponzi/Developer/faniq
git add backend/services/intelligence/engine.py backend/tests/test_intelligence_engine.py
git commit -m "refactor: _extract_fan_raw riceve rfm_segment come parametro

Primo passo per eliminare il proxy RFM interno — vedi task successivi
per chi lo chiama e da dove arriva il valore reale.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Aggiorna i due chiamanti e rimuovi `_rfm_from_fan`

Nota: dopo Task 1, `compute_fan_intelligence` e `compute_club_intelligence` chiamano ancora `_extract_fan_raw(fan, past_matches, current_season)` senza il nuovo argomento — il progetto è rotto finché questo task non è completo. Task 2, 3 e 4 vanno eseguiti nello stesso commit logico (non c'è uno stato intermedio funzionante da testare a sé).

**Files:**
- Modify: `backend/services/intelligence/engine.py:80-91` (rimozione `_rfm_from_fan`), righe `~221-241` (`compute_fan_intelligence`), righe `~244-290` (`compute_club_intelligence`)

**Interfaces:**
- Consumes: `_extract_fan_raw(..., rfm_segment: str)` da Task 1; `services.analytics.compute_fan_segments(db: Session, club_id: int) -> list[dict]` (già esistente, ogni dict ha chiavi `"id"` e `"segment"` — stesso pattern già usato in `routers/partite.py::_build_prediction_tiers`).
- Produces: nessuna nuova interfaccia pubblica — `compute_fan_intelligence`/`compute_club_intelligence` mantengono firma invariata.

- [ ] **Step 1: Rimuovi `_rfm_from_fan`**

In `backend/services/intelligence/engine.py`, elimina l'intera funzione (righe 80-91):

```python
def _rfm_from_fan(fan: Fan) -> str:
    """Calcola categoria RFM semplificata per usarla come proxy."""
    total_activities = len(fan.abbonamenti) + len(fan.biglietti) + len(fan.shop_orders)
    if len(fan.abbonamenti) >= 2 and total_activities >= 5:
        return "VIP"
    if len(fan.abbonamenti) >= 1 and total_activities >= 3:
        return "Fedele"
    if total_activities == 0:
        return "Dormiente"
    if total_activities == 1:
        return "Nuovo"
    return "Occasionale"
```

- [ ] **Step 2: Aggiungi l'import di `compute_fan_segments`**

In `backend/services/intelligence/engine.py`, aggiungi in cima al file (vicino agli altri import da `services.*`):

```python
from services.analytics import compute_fan_segments
```

- [ ] **Step 3: `compute_fan_intelligence` usa l'RFM reale**

Sostituisci il corpo di `compute_fan_intelligence` (`backend/services/intelligence/engine.py`, l'attuale blocco che va da `def compute_fan_intelligence` a `return _run_pipeline(raw)`):

```python
def compute_fan_intelligence(fan_id: int, club_id: int, db: Session) -> FanIntelligence:
    """Pipeline completa per un singolo fan."""
    fan = (
        db.query(Fan)
        .filter(Fan.id == fan_id, Fan.club_id == club_id)
        .options(
            selectinload(Fan.abbonamenti),
            selectinload(Fan.biglietti),
            selectinload(Fan.shop_orders),
        )
        .first()
    )
    if not fan:
        return FanIntelligence(fan_id=fan_id, data_quality=DataQuality.INSUFFICIENT)

    today = date.today()
    past_matches = _load_past_match_dates(club_id, today, db)
    current_season = current_season_str()

    seg_map = {f["id"]: f["segment"] for f in compute_fan_segments(db, club_id)}
    rfm_segment = seg_map.get(fan_id, "")

    raw = _extract_fan_raw(fan, past_matches, current_season, rfm_segment)
    return _run_pipeline(raw)
```

- [ ] **Step 4: `compute_club_intelligence` usa l'RFM reale (calcolato una volta)**

Sostituisci il corpo di `compute_club_intelligence` fino a prima del blocco `while offset < total:`:

```python
def compute_club_intelligence(club_id: int, db: Session) -> list[FanIntelligence]:
    """Pipeline batch per tutti i fan del club — processa INTELLIGENCE_BATCH_SIZE fan alla volta."""
    t0 = time.monotonic()

    today = date.today()
    # Partite: caricate una volta sola, condivise tra tutti i batch
    past_matches = _load_past_match_dates(club_id, today, db)
    current_season = current_season_str()

    # RFM reale calcolato una volta per l'intero club (cache-backed in
    # compute_fan_segments) — non un proxy per-fan, vedi CONTEXT_HANDOFF.
    seg_map = {f["id"]: f["segment"] for f in compute_fan_segments(db, club_id)}

    from sqlalchemy import func
    total = db.query(func.count(Fan.id)).filter(Fan.club_id == club_id).scalar() or 0
```

E dentro il loop, sostituisci la riga `raw = _extract_fan_raw(fan, past_matches, current_season)` con:

```python
            raw = _extract_fan_raw(fan, past_matches, current_season, seg_map.get(fan.id, ""))
```

(resta dentro `for fan in fans:`, stessa indentazione della riga che sostituisce)

- [ ] **Step 5: Verifica che i test esistenti passino ancora**

Run: `cd backend && source .venv/bin/activate && FANIQ_JWT_SECRET=dev-local-verify-only python3 -m pytest tests/ -v`
Expected: tutti PASS (27 test: 26 esistenti + quello di Task 1), nessun errore di import (`compute_fan_segments` importato correttamente, nessuna dipendenza circolare — `services/analytics.py` non importa nulla da `services/intelligence/`)

- [ ] **Step 6: Commit**

```bash
cd /Users/lorenzoponzi/Developer/faniq
git add backend/services/intelligence/engine.py
git commit -m "fix: motore intelligence usa RFM reale invece del proxy interno

_rfm_from_fan ignorava la recency e non poteva mai produrre 'A rischio' —
un fan mostrato ovunque nell'app come RFM reale 'A rischio' veniva
trattato dal motore come 'Fedele' se aveva >=1 abbonamento e >=3
attività, gonfiando renewal_probability fino a +10 punti percentuali
sulla componente RFM. Ora compute_fan_intelligence e
compute_club_intelligence usano compute_fan_segments (stesso RFM
mostrato in Report, export, Revenue Watch), stesso pattern già usato
in routers/partite.py.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Verifica dal vivo su dati reali (nessuna suite pytest per questo — i due entry point non hanno fixture DB nel repo)

**Files:** nessuna modifica — solo verifica.

**Interfaces:**
- Consumes: backend locale già in esecuzione su `:8000` con `FANIQ_JWT_SECRET=dev-local-verify-only`, club di test esistente (club_id noto dalla sessione), endpoint `POST /api/intelligence/club/refresh` + `GET /api/intelligence/club?per_page=5000` (esistenti, non modificati da questo piano).

- [ ] **Step 1: Trova un fan reale che dimostra il bug (RFM reale "A rischio", proxy l'avrebbe classificato "Fedele")**

Run (sostituisci `<TOKEN>` col JWT valido della sessione corrente):

```bash
cd /Users/lorenzoponzi/Developer/faniq/backend
source .venv/bin/activate
FANIQ_JWT_SECRET=dev-local-verify-only python3 -c "
from database import SessionLocal
from services.analytics import compute_fan_segments
from models import Fan

db = SessionLocal()
club_id = 2  # club di test di questa sessione
rfm = {f['id']: f['segment'] for f in compute_fan_segments(db, club_id, force=True)}

fans = db.query(Fan).filter(Fan.club_id == club_id).all()
for fan in fans:
    total_activities = len(fan.abbonamenti) + len(fan.biglietti) + len(fan.shop_orders)
    proxy_would_say_fedele = len(fan.abbonamenti) >= 1 and total_activities >= 3
    if rfm.get(fan.id) == 'A rischio' and proxy_would_say_fedele:
        print(fan.id, fan.nome, fan.cognome, '— RFM reale: A rischio, proxy diceva: Fedele')
db.close()
"
```

Expected: almeno una riga stampata (nel dataset di test di questa sessione esistono fan con questo pattern — abbonati con >=3 attività ma recency bassa, coerente con la segmentazione RFM osservata in Report.jsx durante questa sessione). Annota un `fan_id` dall'output per lo step successivo.

- [ ] **Step 2: Confronta `renewal_probability` prima/dopo per quel fan, tramite l'API reale**

Run (sostituisci `<FAN_ID>` con l'id annotato sopra, e `<TOKEN>` col JWT):

```bash
TOKEN="<TOKEN>"
curl -s -X POST -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/intelligence/club/refresh" > /dev/null
sleep 2
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/intelligence/fan/<FAN_ID>" | python3 -m json.tool
```

Expected: `renewal_probability` più basso rispetto al valore osservato PRIMA di questo piano per lo stesso fan (se vuoi il numero esatto pre-fix, esegui questo stesso comando su `git stash` del Task 2 prima di applicarlo — opzionale, il segnale principale è che il numero ora riflette un fan RFM "A rischio" reale, non gonfiato).

- [ ] **Step 3: Verifica che la distribuzione RFM/journey del club resti sensata nell'insieme**

Run:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/intelligence/club/summary" | python3 -m json.tool
```

Expected: `total_fans` invariato (50), nessun errore, `avg_renewal_probability` plausibile (tra 0 e 1) — un calo lieve della media è atteso e corretto (prima alcuni fan "A rischio" venivano trattati meglio di quanto dovessero).

- [ ] **Step 4: Verifica nel browser che Report.jsx non mostri errori**

Naviga su `http://localhost:3000/report` col club di test loggato, controlla che la tabella si carichi senza errori console e che i valori "Prob. rinnovo" siano coerenti con la colonna "Segmento" (un fan "A rischio" non dovrebbe avere probabilità di rinnovo tra le più alte della lista).

---

## Execution Handoff

Piano completo, salvato in `docs/superpowers/plans/2026-09-03-fix-rfm-proxy-intelligence.md`. Due opzioni di esecuzione:

**1. Subagent-Driven (consigliato)** — un subagent fresco per task, review tra un task e l'altro, iterazione veloce

**2. Esecuzione inline** — eseguo i task in questa sessione con executing-plans, esecuzione a blocchi con checkpoint

Quale preferisci?
