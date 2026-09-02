# SCAL-01 — Scalabilità Intelligence Engine per 5.000+ fan

*Generato il 24 giugno 2026 — audit pre-demo Pro Vercelli*

---

```xml
<mission>
  Analizza le prestazioni dell'Intelligence Engine di FanIQ sotto carico realistico
  (obiettivo: 5.000 fan, estendibile a 10.000+).
  Il sistema deve reggere senza degradazione visibile nell'UI e senza timeout.
  
  Questo prompt ha 3 fasi obbligatorie in sequenza:
    FASE 1 — Analisi e benchmark (misura il problema, non assumere)
    FASE 2 — Implementazione fix in ordine di priorità
    FASE 3 — Verifica benchmark + commit git
  
  Non saltare nessuna fase. Non implementare fix prima di aver misurato.
</mission>

<prerequisite>
  LEGGI questi file PRIMA di qualsiasi altra cosa — in questo ordine:

  1. backend/routers/intelligence.py          — endpoint /club e /club/summary
  2. backend/services/intelligence/engine.py  — compute_club_intelligence e compute_fan_intelligence
  3. backend/services/cache.py                — implementazione cache in-memory
  4. backend/models.py                        — ORM e index definiti
  5. frontend/src/api/client.js               — timeout globale e per_page usati dal frontend
  6. frontend/src/components/intelligence/JourneyDistributionWidget.jsx
  7. frontend/src/components/intelligence/DecayDistributionWidget.jsx
  8. frontend/src/pages/Dashboard.jsx         — quante volte fetchIntelligenceSummary viene chiamata

  Non procedere alla Fase 1 finché non hai letto tutti e 8.
</prerequisite>

<!-- ═══════════════════════════════════════════════════════════════════
     FASE 1 — ANALISI E BENCHMARK
     ═══════════════════════════════════════════════════════════════════ -->

<fase_1_analisi>
  Esegui questa analisi in modo sistematico. Per ogni problema trovato,
  riporta: (a) dove si trova nel codice, (b) impatto a 1.500 fan, (c) impatto a 5.000 fan.

  STEP 1.1 — Benchmark compute_club_intelligence
    Scrivi un mini-script Python standalone (NON modificare il codice del progetto):
    
    File: backend/tests/bench_intelligence.py
    
    Lo script deve:
    - Creare una lista sintetica di N FanRawData (oggetti in-memory, senza DB)
    - Eseguire _run_pipeline() su ognuno e misurare il tempo totale
    - Ripetere per N = 100, 500, 1000, 2000, 5000
    - Stampare: N fan | tempo totale | tempo medio per fan | stima per 5000 fan
    
    Importa _run_pipeline e le strutture dati necessarie dall'engine esistente.
    Se _run_pipeline non è esportabile direttamente, replica la logica di chiamata
    da compute_fan_intelligence per misurare il tempo reale della pipeline.
    
    Esegui lo script e riporta i risultati completi.

  STEP 1.2 — Conta le chiamate a compute_club_intelligence per page load
    Analizza il codice e rispondi con precisione:
    - Quante volte viene chiamata compute_club_intelligence quando l'utente apre /dashboard?
    - Quante volte quando apre /report?
    - Ogni chiamata è indipendente o condivide risultati cachati?
    - La cache in services/cache.py è usata nell'intelligence router? Mostra le righe esatte.
    
    Riporta il numero esatto di recompute completi per page load.

  STEP 1.3 — Verifica il problema per_page
    Trova nel codice:
    - Il valore di per_page richiesto dal frontend in ogni chiamata a fetchClubIntelligence
    - Il valore massimo accettato dal backend (parametro le= nel Query())
    - L'effetto concreto: quanti fan vengono restituiti con 5.000 fan nel DB?
    
    Identifica tutti i componenti che usano fetchClubIntelligence o fetchAlertsRaw
    e sono quindi affetti da questo limite.

  STEP 1.4 — Verifica joinedload vs selectinload
    In engine.py, la query usa joinedload per caricare abbonamenti, biglietti e shop_orders.
    Calcola (stimando):
    - Con 5.000 fan × media 20 biglietti: quante righe restituite da un LEFT JOIN?
    - Qual è la differenza di comportamento tra joinedload e selectinload in questo caso?
    - C'è rischio di out-of-memory su Render free tier (512MB RAM)?

  STEP 1.5 — Verifica timeout frontend
    Il client axios ha un timeout globale di 15 secondi.
    Se compute_club_intelligence per 5.000 fan impiega più di 15 secondi:
    - Quali endpoint colpisce questo timeout?
    - Quale è il comportamento visibile nell'UI (crash silenzioso? spinner infinito? errore?)
    - Il timeout di 60s per l'upload è sufficiente per importare biglietteria con 50.000 righe?

  STEP 1.6 — Riporta la lista completa dei problemi trovati
    Al termine della Fase 1, produci una tabella così:

    | # | Problema | File | Severità a 5K fan | Fix proposto |
    |---|----------|------|--------------------|--------------|
    | 1 | ...      | ...  | CRITICA/ALTA/MEDIA | ...          |

    Ordina per severità. Non procedere alla Fase 2 finché non hai questa tabella.
</fase_1_analisi>

<!-- ═══════════════════════════════════════════════════════════════════
     FASE 2 — IMPLEMENTAZIONE FIX (in ordine di priorità)
     ═══════════════════════════════════════════════════════════════════ -->

<fase_2_fix>
  Implementa i fix nell'ordine esatto indicato.
  Non riordinare. Non saltare. Non implementare fix non trovati nella Fase 1.

  ── FIX 1 (CRITICO) — Aggiungere cache all'Intelligence Router ──────────────

  Problema: compute_club_intelligence viene chiamata N volte per page load senza cache.
  
  In backend/routers/intelligence.py:
  - Importa la cache: from services.cache import get as cache_get, set as cache_set
  - Crea una chiave cache dedicata per l'intelligence:
      def _intelligence_cache_key(club_id: int) -> str:
          return f"intelligence_{club_id}"
  
  In get_club_intelligence() e get_club_summary():
    PRIMA di chiamare compute_club_intelligence:
      cached = cache_get(_intelligence_cache_key(club.id))
      if cached is not None:
          results = cached
      else:
          results = compute_club_intelligence(club.id, db)
          cache_set(_intelligence_cache_key(club.id), results)
  
  TTL della cache: usa ANALYTICS_CACHE_TTL (già configurato in config.py).
  Per produzione il TTL dovrebbe essere almeno 300 secondi (5 minuti) —
  verifica il valore attuale in config.py e se è < 300, aggiungilo come default:
    ANALYTICS_CACHE_TTL = int(os.environ.get("FANIQ_CACHE_TTL", "300"))
  
  IMPORTANTE: la cache deve essere invalidata quando viene fatto un upload CSV
  (già gestito da cache.invalidate(club_id) in csv_import.py — verifica che funzioni
  anche per la chiave "intelligence_{club_id}").
  Verifica che invalidate() nel cache.py usi il suffisso corretto per matchare
  la chiave "intelligence_{club_id}" — la funzione cerca chiavi che terminano con "_{club_id}".

  ── FIX 2 (CRITICO) — Alzare il limite per_page ────────────────────────────

  In backend/routers/intelligence.py:
    Cambia: per_page: int = Query(50, ge=1, le=200)
    Con:    per_page: int = Query(50, ge=1, le=5000)
  
  In frontend/src/api/client.js:
    Cambia: fetchClubIntelligence = (params = {}) =>
              api.get("/api/intelligence/club", { params: { per_page: 500, ...params } })
    Con:    fetchClubIntelligence = (params = {}) =>
              api.get("/api/intelligence/club", { params: { per_page: 5000, ...params } })
    
    Stesso aggiornamento per fetchAlertsRaw:
    Cambia: params: { per_page: 500 }
    Con:    params: { per_page: 5000 }
    
    E per fetchRenewalScores:
    Cambia: params: { per_page: 500, ...params }
    Con:    params: { per_page: 5000, ...params }

  ── FIX 3 (ALTO) — Sostituire joinedload con selectinload ──────────────────

  In backend/services/intelligence/engine.py:
    Cambia: from sqlalchemy.orm import Session, joinedload
    Con:    from sqlalchemy.orm import Session, selectinload
    
    In compute_club_intelligence(), sostituisci:
      .options(
          joinedload(Fan.abbonamenti),
          joinedload(Fan.biglietti),
          joinedload(Fan.shop_orders),
      )
    Con:
      .options(
          selectinload(Fan.abbonamenti),
          selectinload(Fan.biglietti),
          selectinload(Fan.shop_orders),
      )
    
    Motivo: joinedload fa LEFT JOIN che moltiplica le righe (5000 fan × 20 biglietti = 100K righe
    in un'unica query). selectinload fa query separate efficienti (4 query totali invece di 1 enorme).
    Questo riduce il picco di memoria e migliora le prestazioni con dataset grandi.
    
    Applica la stessa modifica anche in compute_fan_intelligence() se usa joinedload.

  ── FIX 4 (ALTO) — Aumentare timeout frontend per intelligence ─────────────

  In frontend/src/api/client.js:
    Il timeout globale axios è 15.000ms — troppo basso per il primo calcolo su 5.000 fan.
    
    NON modificare il timeout globale (potrebbe rompere altre UX).
    Invece, aggiungi un timeout specifico nelle funzioni intelligence:
    
    export const fetchIntelligenceSummary = () =>
      api.get("/api/intelligence/club/summary", { timeout: 60000 }).then((r) => r.data);
    
    export const fetchClubIntelligence = (params = {}) =>
      api.get("/api/intelligence/club", { params: { per_page: 5000, ...params }, timeout: 60000 })
        .then((r) => r.data);
    
    export const fetchAlertsRaw = () =>
      api.get("/api/intelligence/club", { params: { per_page: 5000 }, timeout: 60000 })
        .then((r) => r.data.items.filter((fi) => fi.subscription_anomaly != null));

  ── FIX 5 (MEDIO) — Aggiungere endpoint /club/refresh automatico al login ──

  Il problema: la prima chiamata dopo un restart di Render calcola tutto da zero
  e può impiegare 30-60 secondi per 5.000 fan. Gli utenti vedono uno spinner lungo.
  
  Soluzione: warm-up della cache al login.
  
  In backend/routers/auth.py (SOLO aggiungere, non modificare la logica esistente):
    Dopo il login riuscito, aggiungi un BackgroundTask che pre-calcola l'intelligence:
    
    from fastapi import BackgroundTasks
    from services.intelligence.engine import compute_club_intelligence
    from services.cache import get as cache_get, set as cache_set
    
    def _warmup_intelligence(club_id: int, db: Session):
        key = f"intelligence_{club_id}"
        if cache_get(key) is None:
            results = compute_club_intelligence(club_id, db)
            cache_set(key, results)
    
    Nel login endpoint, aggiungi background_tasks: BackgroundTasks come parametro
    e chiama: background_tasks.add_task(_warmup_intelligence, club.id, db)
    
    VINCOLO ASSOLUTO: non modificare nessuna altra logica in auth.py — solo aggiungere
    il background task DOPO che il token è già stato generato e la risposta è pronta.
    Se questa modifica richiede di toccare la struttura del login, SALTA questo fix
    e segnalalo — la sicurezza ha priorità assoluta sull'ottimizzazione.
</fase_2_fix>

<!-- ═══════════════════════════════════════════════════════════════════
     FASE 3 — VERIFICA E COMMIT
     ═══════════════════════════════════════════════════════════════════ -->

<fase_3_verifica>
  STEP 3.1 — Riesegui il benchmark
    Riesegui backend/tests/bench_intelligence.py dopo i fix.
    Confronta i risultati con quelli della Fase 1.
    Il tempo per 5.000 fan deve essere < 10 secondi alla prima chiamata
    e < 100ms dalla seconda (cache hit).
    Riporta la tabella comparativa prima/dopo.

  STEP 3.2 — Test funzionale
    Esegui i test esistenti per verificare che i fix non abbiano rotto nulla:
      cd backend && python -m pytest tests/ -v
    
    Se un test fallisce a causa dei fix (es. per_page diverso), aggiorna il test.
    Se un test fallisce per motivi non correlati ai fix, segnalalo ma non bloccarlo.

  STEP 3.3 — Verifica invalidazione cache
    Dopo i fix, verifica manualmente (o con un test) che:
    - Dopo un upload CSV, la chiave "intelligence_{club_id}" venga invalidata
    - La chiamata successiva a /club/summary ricalcola (non usa la cache vecchia)
    
    Traccia il comportamento leggendo invalidate() in cache.py e confermando
    che il pattern di chiave "intelligence_{club_id}" sia matchato correttamente
    dalla logica che usa il suffisso "_{club_id}".

  STEP 3.4 — Build frontend
    cd frontend && npm run build
    Zero errori. Zero warning nuovi rispetto al build precedente.

  STEP 3.5 — Commit e push git
    Segui il template GIT-01 dalla prompt_library.md con questi messaggi:

    COMMIT 1 (codice):
    git add backend/routers/intelligence.py
    git add backend/services/intelligence/engine.py
    git add backend/config.py
    git add backend/routers/auth.py
    git add backend/tests/bench_intelligence.py
    git add frontend/src/api/client.js
    git add .gitignore
    
    git commit -m "perf: scalabilità Intelligence Engine per 5000+ fan (SCAL-01)

    - Fix 1: cache su /club e /club/summary — da N recompute a 1 per TTL
    - Fix 2: per_page alzato a 5000 su backend (le=5000) e frontend
    - Fix 3: joinedload → selectinload per evitare prodotto cartesiano
    - Fix 4: timeout 60s specifico per endpoint intelligence nel frontend
    - Fix 5: warm-up cache intelligence al login (background task)
    - bench_intelligence.py: script di benchmark pre/post"

    git push origin main
</fase_3_verifica>

<security_constraints>
  1. Non modificare autenticazione, JWT o middleware di sicurezza
     ECCEZIONE: Fix 5 aggiunge un background task in auth.py ma NON modifica
     la logica di autenticazione, generazione token, validazione password
  2. Non modificare la logica RLS PostgreSQL
  3. Non usare dati reali — solo dataset sintetico per i test
  4. Non esporre fan_id in log, console o messaggi di errore
  5. Non toccare tenant.py, services/auth.py (solo routers/auth.py per Fix 5),
     middleware in main.py
  6. Non fare git push --force
</security_constraints>

<output_checklist>
  FASE 1:
  □ bench_intelligence.py eseguito con risultati per N=100,500,1000,2000,5000
  □ Numero esatto di recompute per page load documentato
  □ Problema per_page identificato con impatto concreto (quanti fan persi)
  □ joinedload vs selectinload analizzato con stima memoria
  □ Timeout frontend verificato su tutti gli endpoint intelligence
  □ Tabella problemi/severità/fix prodotta
  
  FASE 2:
  □ Fix 1: cache.get/cache.set in get_club_intelligence() e get_club_summary()
  □ Fix 1: ANALYTICS_CACHE_TTL default 300s in config.py
  □ Fix 1: invalidazione cache verificata compatibile con chiave "intelligence_{club_id}"
  □ Fix 2: backend le=5000, frontend per_page=5000 su fetchClubIntelligence, fetchAlertsRaw, fetchRenewalScores
  □ Fix 3: selectinload in compute_club_intelligence() e compute_fan_intelligence()
  □ Fix 4: timeout 60000ms su fetchIntelligenceSummary, fetchClubIntelligence, fetchAlertsRaw
  □ Fix 5: background task warm-up in routers/auth.py (se implementabile senza toccare logica auth)
  
  FASE 3:
  □ Benchmark post-fix: prima chiamata < 10s per 5000 fan
  □ Benchmark post-fix: cache hit < 100ms
  □ pytest passa (o fallimenti documentati e non correlati ai fix)
  □ Invalidazione cache verificata
  □ npm run build: zero errori
  □ git push origin main completato
  □ git status: "nothing to commit, working tree clean"
</output_checklist>
```

---

## Note per il prossimo step

Dopo SCAL-01, il sistema è dimensionato per 5.000 fan con:
- Primo calcolo: ~5-10 secondi (una volta per TTL)
- Chiamate successive: < 100ms (cache hit)
- Nessun timeout frontend
- Tutti i 5.000 fan visibili in ogni widget

Se il benchmark Fase 1 rivela problemi ulteriori non coperti dai 5 fix,
Claude Code deve documentarli e proporre soluzioni aggiuntive prima del commit.

*Generato il 24 giugno 2026 — da inviare a Claude Code come prompt singolo.*
