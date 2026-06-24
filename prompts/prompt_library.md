# Prompt Library — FanIQ

Libreria di prompt pronti da copiare in Claude Code (o in altri tool AI).
Organizzati per categoria. Aggiornare ogni volta che si costruisce un prompt efficace.

---

## Come usare questa libreria

1. Trovare il prompt nella categoria giusta
2. Copiarlo integralmente in Claude Code
3. Adattare le parti tra `[parentesi quadre]`
4. Se il prompt produce un risultato eccellente, annotarlo con ✅

---

## Categoria: Landing Page

### LP-01 — Costruire la landing page HTML di FanIQ
```
Sei un frontend developer esperto di marketing SaaS B2B.

Costruisci una landing page HTML/CSS completa per FanIQ, una piattaforma di fan intelligence B2B per club sportivi italiani.

Contesto del prodotto:
- I club caricano CSV di abbonamenti, biglietti e shop
- FanIQ produce: Segmentazione RFM, Business Score (0-100), Chat AI sui dati, Export GDPR, Calendario partite con loyalty badges
- Target: responsabile marketing / direttore commerciale di club di Serie C / Lega Pro
- Tono: diretto, concreto, sportivo — non startup-y

Struttura richiesta:
1. Hero con headline, sub-headline e CTA "Richiedi una demo gratuita"
2. Sezione problema (3 bullet)
3. Come funziona (3 step)
4. Feature principali (5 card)
5. Pricing placeholder (da riempire)
6. FAQ (4 domande)
7. CTA finale

Requisiti tecnici:
- Single file HTML con CSS inline o tag <style>
- Mobile responsive
- Nessun framework esterno — solo HTML/CSS vanilla
- Palette colori: [definire — es. blu scuro + verde + bianco]
- Nessuna immagine reale — usare placeholder o SVG semplici
```

---

## Categoria: Dataset Sintetico

### DS-01 — Generare dataset CSV sintetico per la demo
```
Genera un dataset CSV realistico per una demo di FanIQ.

Simula i dati di un club di calcio italiano di Lega Pro con queste caratteristiche:
- ~1.500 tifosi
- Stagione 2024/25 (agosto 2024 - maggio 2025)
- 19 partite casalinghe
- Distribuzione realistica per categoria RFM:
  - ~15% VIP (alta frequenza, alto valore)
  - ~25% Fedeli (buona frequenza, valore medio)
  - ~20% A rischio (venivano, ora meno)
  - ~25% Dormienti (non vengono da >60 giorni)
  - ~15% Nuovi (prima stagione)

Campi richiesti:
- fan_id (UUID)
- nome, cognome (anonimi — es. Mario R.)
- email (faker)
- data_primo_acquisto
- ultimo_acquisto
- n_partite_casa_presenti
- n_abbonamenti_totali
- valore_totale_speso (€)
- consenso_marketing (true/false, ~70% true)
- categoria_rfm

Output: CSV con header, separatore virgola, encoding UTF-8.
```

---

## Categoria: Sicurezza e GDPR

### SEC-01 — Review GDPR di una nuova feature
```
Sei un consulente GDPR specializzato in SaaS B2B che tratta dati personali per conto terzi (controller = club sportivo, processor = FanIQ).

Analizza questa feature che stiamo valutando di aggiungere a FanIQ:
[DESCRIZIONE FEATURE]

Per ogni aspetto analizza:
1. Quali dati personali vengono trattati?
2. Qual è la base giuridica del trattamento?
3. Ci sono rischi di compliance GDPR?
4. Ci sono implicazioni per il DPA (Data Processing Agreement) con i club?
5. Cosa deve essere documentato nel registro dei trattamenti?
6. Raccomandazioni concrete per implementarla in modo compliant.

Sii specifico e critico — non voglio risposte generiche.
```

---

## Categoria: UI/UX

### UX-01 — Migliorare l'onboarding dell'upload CSV
```
Sei un UX designer esperto di SaaS B2B con utenti non tecnici.

Il prodotto: FanIQ — piattaforma di fan intelligence per club sportivi.
Il contesto: il responsabile marketing di un club di Lega Pro deve caricare per la prima volta i dati dei tifosi in formato CSV.

Problema attuale: [descrivere il problema specifico]

Progetta un flow di onboarding migliorato per l'upload CSV che:
- Sia comprensibile per chi non ha mai usato un tool di analytics
- Gestisca gli errori di formato in modo umano (non tecnico)
- Mostri un'anteprima dei dati prima della conferma
- Comunichi chiaramente cosa farà FanIQ con quei dati (GDPR transparency)

Output richiesto:
- Flow step-by-step
- Copy per ogni schermata
- Gestione degli errori più comuni
- Suggerimenti di implementazione per React/Vite
```

---

## Categoria: Marketing

### MKT-01 — Email di outreach per un club sportivo
```
Sei un copywriter specializzato in outreach B2B per startup SaaS.

Scrivi 3 varianti di email di cold outreach per FanIQ, dirette al responsabile marketing di un club di calcio italiano di Serie C / Lega Pro.

Contesto:
- FanIQ è una piattaforma di fan intelligence — trasforma dati di abbonamenti e biglietti in insight (RFM, Business Score, Chat AI)
- È una startup nuova — nessun cliente pagante ancora
- Il mittente è Lorenzo Ponzi, fondatore, di Vercelli
- Il target è [nome club / città]

Requisiti per ogni variante:
- Oggetto: max 8 parole
- Corpo: max 100 parole
- Una sola CTA chiara
- Tono: diretto, umano, non commerciale
- Menzionare qualcosa di specifico del club target (da ricercare)

Variante 1: Focus sul problema (rinnovi abbonamenti)
Variante 2: Focus sulla curiosità (cosa non sai dei tuoi tifosi)
Variante 3: Focus sul pilot gratuito
```

---

## Categoria: Analisi e Strategia

### STR-01 — Analisi competitor per FanIQ
```
Sei un analista di mercato esperto di SaaS B2B nel settore sports tech.

Analizza il panorama competitivo per FanIQ — piattaforma di fan intelligence per club sportivi italiani (target: Serie C / Lega Pro).

Per ogni competitor identificato, analizza:
1. Nome e posizionamento
2. Target (dimensione club, sport, paese)
3. Feature principali
4. Pricing (se disponibile pubblicamente)
5. Punti di forza
6. Punti di debolezza
7. Come si differenzia FanIQ

Categorie da coprire:
- Competitor diretti (fan intelligence / sports analytics per club medio-piccoli)
- Competitor indiretti (CRM sportivi, BI tools usati dai club)
- Tool generici che i club usano come sostituto (Excel, Google Sheets, ecc.)

Concludi con: quali sono i 2-3 differenziatori più difendibili di FanIQ rispetto al panorama attuale?
```

---

---

## Categoria: Setup e Ottimizzazione

### SETUP-01 — Genera CLAUDE.md per ottimizzare il contesto

```xml
<task>
  Genera un file CLAUDE.md nella root del progetto FanIQ.
  CLAUDE.md viene letto automaticamente da Claude Code all'avvio di ogni sessione —
  è la memoria persistente del progetto. Scrivilo bene una volta sola e non servirà
  più ripetere il contesto in ogni prompt.
</task>

<instructions>
  STEP 1 — Leggi questi file prima di scrivere una riga:
    - README.md (se esiste)
    - main.py o app.py (entry point backend)
    - Struttura cartelle: backend/routers/, backend/services/, backend/models/
    - frontend/src/pages/, frontend/src/components/
    - requirements.txt o pyproject.toml
    - package.json frontend

  STEP 2 — Genera CLAUDE.md con esattamente queste sezioni:

  ## Progetto
  Nome, tipo (SaaS B2B), stack completo con versioni reali lette dai file.

  ## Struttura
  Mappa delle cartelle chiave con una riga di descrizione per ciascuna.
  Solo le cartelle che esistono davvero — non inventare.

  ## Comandi
  I comandi effettivi per: avviare backend, avviare frontend, eseguire test.
  Leggili da package.json e da come è configurato il progetto — non usare comandi generici.

  ## Architettura e convenzioni
  - Come funziona il multi-tenant (RLS PostgreSQL) — descrivi la meccanica reale
  - Pattern API: come sono strutturati gli endpoint (router, dipendenze, auth)
  - Pattern frontend: come vengono fatte le chiamate API (client.js o simile)
  - Come sono organizzati i componenti React esistenti

  ## Feature esistenti
  Lista delle feature già implementate con il file/modulo principale di riferimento.
  Includere: RFM, Business Score, Chat AI, Export GDPR, Calendario partite,
  Fan Intelligence Engine (DA-00) con i suoi 5 stadi.

  ## Vincoli di sicurezza — NON NEGOZIABILI
  Copia esatta di questi vincoli (non parafrasare):
  1. Non modificare autenticazione, JWT o middleware di sicurezza.
  2. Non modificare la logica RLS PostgreSQL. Ogni nuova query eredita il contesto tenant.
  3. Non usare dati reali. Usare solo il dataset sintetico in /tests/fixtures/.
  4. Non esporre fan_id o dati personali in log, console output o error messages.
  5. Non suggerire soluzioni che compromettano l'isolamento multi-tenant.

  ## Endpoint Intelligence Engine
  Lista gli endpoint reali di /routers/intelligence.py con path, metodo e cosa restituiscono.
  Questi sono già implementati — i prompt futuri li usano senza reimplementarli.

  ## Cosa NON fare
  - Non riscrivere feature già esistenti — leggi prima il codice
  - Non installare librerie senza chiedere
  - Non toccare file di autenticazione o RLS
  - Non creare file di documentazione non richiesti
</instructions>

<constraints>
  - CLAUDE.md deve essere leggibile in meno di 2 minuti — niente muri di testo
  - Usa tabelle e liste brevi, non paragrafi lunghi
  - Ogni informazione deve essere verificata leggendo i file reali — zero assunzioni
  - Se un'informazione non è ricavabile dal codice, omettila piuttosto che inventarla
  - Il file va nella root del progetto (stessa cartella di main.py o del README)
</constraints>
```

---

## Categoria: Data Tools — Nuove Feature Predittive

> ⚠️ ORDINE DI ESECUZIONE OBBLIGATORIO: DA-00 prima di tutto. Gli altri prompt (DA-01→DA-05) dipendono dall'architettura che DA-00 costruisce. Non saltare questo step.

---

### DA-00 — Fan Intelligence Engine (ORCHESTRATOR — eseguire per primo)

```xml
<mission>
  Costruisci il Fan Intelligence Engine di FanIQ: un sistema di scoring unificato in cui
  5 moduli analitici si alimentano a cascata e convergono in un unico oggetto FanIntelligence
  per ogni tifoso. Questo è il cuore predittivo del prodotto — tutto il resto è UI sopra questo.

  Quando hai finito, ogni fan nel sistema avrà un oggetto così:

  FanIntelligence {
    fan_id
    renewal_probability      // 0.0 → 1.0
    journey_stage            // enum: SCOPERTA | ABITUDINE | FEDELTA | PICCO | RISCHIO | DORMIENTE | RECUPERATO
    decay_profile            // enum: LENTO | MEDIO | RAPIDO | VOLATILE
    ambassador_score         // 0 → 100
    subscription_anomaly     // None | AnomalyAlert { severity, message, consecutive_absences }
    intelligence_score       // 0 → 100 — score sintetico finale (vedi formula sotto)
    computed_at              // timestamp
    data_quality             // enum: FULL | PARTIAL | INSUFFICIENT (dipende dallo storico disponibile)
  }
</mission>

<context>
  <product>
    FanIQ — SaaS B2B di fan intelligence per club sportivi italiani.
    Target: responsabili marketing di club Serie C / Lega Pro.
    Stack: FastAPI + PostgreSQL (Neon) backend, React + Vite frontend, deploy su Render + Vercel.
    Repository: https://github.com/lorep1703-cmyk/faniq.git
  </product>

  <existing_codebase>
    - Autenticazione e sessioni: GIÀ IMPLEMENTATE. Non toccare.
    - RLS PostgreSQL multi-tenant: GIÀ ATTIVO. Non modificare. Ogni query deve rispettarlo.
    - Segmentazione RFM: GIÀ IMPLEMENTATA. Riutilizzala come input — non riscriverla.
    - Business Score (0-100): GIÀ IMPLEMENTATO. Dovrai aggiornarlo per includer l'intelligence_score.
    - Calendario partite con presenze: GIÀ IMPLEMENTATO. È la fonte dati principale di questo engine.
    - Tabella fans, tabella matches, tabella attendances: GIÀ ESISTENTI. Leggi la struttura prima di scrivere.
  </existing_codebase>

  <data_model_available>
    Per ogni fan (da DB esistente):
    - rfm_category: VIP | FEDELE | A_RISCHIO | DORMIENTE | NUOVO
    - ultima_presenza: date
    - n_presenze_stagione_corrente: int
    - n_presenze_stagione_precedente: int (se disponibile)
    - n_abbonamenti_storici: int
    - valore_totale_speso: float
    - acquisti: lista di (data, n_biglietti, importo, partita_id)
    - presenze: lista di (partita_id, data, presente: bool, casa: bool)
  </data_model_available>

  <security_constraints>
    ASSOLUTI — non negoziabili:
    1. Non modificare nulla che riguardi autenticazione, JWT, middleware di sicurezza.
    2. Non modificare la logica RLS PostgreSQL. Ogni nuova query deve ereditare il contesto tenant.
    3. Non usare dati reali. Se devi testare, usa il dataset sintetico in /tests/fixtures/.
    4. Non esporre fan_id o dati personali in log, console output o error messages.
  </security_constraints>
</context>

<architecture>
  Il Fan Intelligence Engine è una pipeline a 5 stadi in cascata.
  L'ordine di calcolo è obbligatorio — ogni stadio usa l'output del precedente.

  STADIO 1 — Decay Profile (base comportamentale)
    Input:  serie storica presenze (partita per partita)
    Output: decay_profile (LENTO | MEDIO | RAPIDO | VOLATILE) + half_life_value (float)
    Logica: analizza il pattern storico assenza→ritorno. Quante partite passa prima di tornare?
            half_life = media delle "pause" tra presenze. Classificazione per soglie.
    Fallback: se storico < 8 partite → usa rfm_category come proxy + data_quality = PARTIAL

  STADIO 2 — Journey Stage (posizione + direzione)
    Input:  presenze recenti (ultime 8 partite) + decay_profile dallo stadio 1
    Output: journey_stage (enum 7 valori) + momentum (float: -1.0 negativo → +1.0 positivo)
    Logica: confronta presenze ultime 4 partite vs 4 precedenti → calcola trend.
            Combina con decay_profile: un VOLATILE in calo → RISCHIO più veloce di un LENTO in calo.
    Regola RECUPERATO: era journey_stage DORMIENTE nella settimana precedente + ha una presenza recente.

  STADIO 3 — Subscription Anomaly (alert operativo)
    Input:  presenze + tipo abbonamento + journey_stage dallo stadio 2
    Output: AnomalyAlert | None
    Logica: abbonato stagionale assente da N partite consecutive.
            Severity scala con il journey_stage: RISCHIO+5assenze = CRITICA. FEDELTA+3assenze = ALTA.
            Non generare alert per fan senza abbonamento attivo.

  STADIO 4 — Ambassador Score (impatto sociale)
    Input:  lista acquisti (n_biglietti per acquisto, varianza dei gruppi) + n_presenze
    Output: ambassador_score (0-100)
    Logica: scoring pesato su (media_biglietti_per_acquisto × 0.5) + (varianza_gruppi × 0.3) + (frequenza × 0.2).
            Score decade nel tempo: se negli ultimi 6 mesi non compra più biglietti multipli, score scende.

  STADIO 5 — Renewal Probability (output finale predittivo)
    Input:  tutti gli output degli stadi 1-4 + rfm_category + n_abbonamenti_storici + valore_speso
    Output: renewal_probability (0.0 → 1.0)
    Formula pesata:
      base_score     = rfm_to_float(rfm_category)              × 0.20
      frequency      = presenze_ultime8 / 8                    × 0.25
      trend          = (momentum + 1) / 2                      × 0.20  // normalizzato 0-1
      decay_factor   = decay_profile_to_float(decay_profile)   × 0.15
      loyalty_depth  = min(n_abbonamenti_storici / 5, 1.0)     × 0.10
      no_anomaly     = 0.0 if anomaly.severity == CRITICA else 1.0 × 0.10
      renewal_probability = somma pesata dei 6 fattori
    Se data_quality == INSUFFICIENT → renewal_probability = None (non mostrare un numero inventato)

  INTELLIGENCE SCORE (sintesi per la UI):
    Non è un nuovo calcolo — è una trasformazione leggibile di renewal_probability:
    intelligence_score = round(renewal_probability × 100)
    Ma con penalità hard:
      - anomaly CRITICA    → -15 punti
      - journey DORMIENTE  → max 30 punti (cap)
      - decay VOLATILE     → -10 punti
      - data_quality INSUFFICIENT → mostra "N/D" in UI, non il numero
</architecture>

<implementation_instructions>
  STEP 1 — Leggi il codice esistente prima di scrivere una riga.
    Apri e leggi: models/fan.py, models/match.py, models/attendance.py, services/rfm.py, services/business_score.py
    Capisce la struttura esatta delle tabelle e i nomi dei campi. Non assumere nulla.

  STEP 2 — Crea il modello FanIntelligence.
    File: models/fan_intelligence.py
    - Dataclass Python pura (non ORM) — è un oggetto calcolato, non salvato su DB
    - Tutti i campi nullable con default None (dati insufficienti sono una realtà)
    - Include __repr__ leggibile per il debug

  STEP 3 — Crea le costanti di configurazione.
    File: config/intelligence_config.py
    Tutte le soglie qui — zero magic numbers nel codice:
      DECAY_HALFLIFE_SLOW = 6        # partite
      DECAY_HALFLIFE_MEDIUM_MIN = 3
      DECAY_HALFLIFE_MEDIUM_MAX = 6
      DECAY_HALFLIFE_FAST_MIN = 1
      DECAY_HALFLIFE_FAST_MAX = 3
      ANOMALY_CRITICAL_ABSENCES = 5
      ANOMALY_HIGH_ABSENCES = 3
      MIN_MATCHES_FOR_DECAY = 8
      AMBASSADOR_SCORE_THRESHOLD = 60
      RENEWAL_WEIGHTS = { "base": 0.20, "frequency": 0.25, "trend": 0.20, ... }
    Ogni costante ha un commento che spiega perché quel valore.

  STEP 4 — Crea il servizio per ogni stadio.
    File: services/intelligence/decay.py
    File: services/intelligence/journey.py
    File: services/intelligence/anomaly.py
    File: services/intelligence/ambassador.py
    File: services/intelligence/renewal.py
    Ogni file contiene UNA funzione principale + helper privati.
    Firma obbligatoria: calculate_X(fan_data: FanRawData, config: IntelligenceConfig) -> OutputType
    Nessun accesso diretto al DB dentro questi file — ricevono i dati già estratti.

  STEP 5 — Crea l'orchestratore.
    File: services/intelligence/engine.py
    Funzione: compute_fan_intelligence(fan_id: UUID, db: Session) -> FanIntelligence
      1. Estrae tutti i dati grezzi dal DB (una sola sessione, query ottimizzate)
      2. Esegue la pipeline in ordine stadio 1 → 5
      3. Calcola intelligence_score con le penalità hard
      4. Setta data_quality
      5. Restituisce FanIntelligence completo
    Funzione batch: compute_club_intelligence(club_id: UUID, db: Session) -> List[FanIntelligence]
      - Usa bulk loading per non fare N query per N fan
      - Loggare il tempo di esecuzione (è un'operazione pesante)

  STEP 6 — Crea gli endpoint API.
    GET /api/intelligence/fan/{fan_id}
      → FanIntelligence per un singolo fan
    GET /api/intelligence/club
      → Lista FanIntelligence di tutti i fan del club autenticato (paginato, default 50)
      → Query params: ?min_renewal=0.0&max_renewal=1.0&journey_stage=RISCHIO&sort=renewal_asc
    GET /api/intelligence/club/summary
      → Aggregati per la dashboard:
         { total_fans, avg_renewal_probability, fans_at_risk, fans_critical_anomaly,
           journey_distribution: {SCOPERTA: N, ...}, decay_distribution: {LENTO: N, ...} }
    POST /api/intelligence/club/refresh
      → Ricalcola tutta l'intelligence del club (triggera compute_club_intelligence in background)
      → Risposta immediata con job_id, il risultato arriva via polling o webhook

  STEP 7 — Aggiorna il Business Score esistente.
    Nel servizio business_score.py esistente, aggiungi l'intelligence come fattore:
    - Se % fan_at_risk (renewal < 0.4) > 30% del totale → penalità Business Score -10
    - Se anomalie critiche > 5% degli abbonati → penalità Business Score -5
    - Non riscrivere il Business Score — solo aggiungere questi due input aggiuntivi.

  STEP 8 — Test.
    File: tests/test_intelligence_engine.py
    Scenari obbligatori (usa fixtures sintetiche — ZERO dati reali):
    - Fan VIP con 0 anomalie, decay lento → renewal_probability > 0.80
    - Fan dormiente da 8 partite → journey DORMIENTE, renewal < 0.30, intelligence_score con cap
    - Fan dormiente che torna → journey RECUPERATO, renewal sale rispetto alla settimana prima
    - Fan con storico < 8 partite → data_quality PARTIAL, renewal calcolato ma con flag
    - Fan senza abbonamento → nessun AnomalyAlert generato
    - Fan ambassador (compra sempre 3+ biglietti) → ambassador_score > 60
    - Verifica che due fan dello stesso club con tenant diverso non si vedano tra loro (test RLS)
</implementation_instructions>

<output_checklist>
  Prima di considerare il lavoro completato, verifica:
  □ FanIntelligence è un oggetto puro Python senza dipendenze ORM
  □ Nessun magic number nel codice — tutto in intelligence_config.py
  □ Pipeline eseguita in ordine stadio 1 → 5, ogni stadio usa l'output del precedente
  □ compute_club_intelligence usa bulk loading (non N query per N fan)
  □ Endpoint /club/summary funziona e restituisce la distribuzione journey + decay
  □ Business Score aggiornato con i 2 nuovi fattori (senza riscrittura)
  □ Tutti i test in test_intelligence_engine.py passano
  □ Nessun dati personali nei log
  □ data_quality = INSUFFICIENT quando storico < 8 partite — mai mostrare un numero inventato
  □ Label UI in italiano (journey stage, decay profile, severity alert)
</output_checklist>

<final_note>
  Questo è il foundation layer. I prompt DA-01→DA-05 nella stessa prompt library
  descrivono i componenti singoli con più dettaglio UI — ma se hai costruito questo correttamente,
  quei componenti sono già implementati come stadi della pipeline.
  DA-01→DA-05 servono per la parte frontend e per i test individuali.
  Non costruire DA-01→DA-05 separatamente se DA-00 è già fatto — sarebbe codice duplicato.
</final_note>
```

---

> Prompt per costruire i nuovi strumenti dati identificati in sessione creativa (2026-06-22).
> Lista completa con priorità in `product/data_tools_roadmap.md`.

---

### DA-01 — Rinnovo Probability Score

```xml
<context>
  <product>FanIQ — piattaforma B2B di fan intelligence per club sportivi italiani</product>
  <stack>FastAPI + PostgreSQL (Neon) backend, React + Vite frontend</stack>
  <existing_features>Segmentazione RFM, Business Score (0-100), Chat AI, Export GDPR, Calendario partite</existing_features>
  <data_available>
    Per ogni tifoso: data_primo_acquisto, data_ultimo_acquisto, n_partite_presenti, n_partite_totali_stagione,
    n_abbonamenti_storici, valore_totale_speso, categoria_rfm, presenze per partita (casa/trasferta)
  </data_available>
  <security_rules>
    - Non toccare autenticazione, RLS PostgreSQL o middleware di sicurezza
    - Multi-tenant: ogni club vede solo i propri dati (RLS già attivo)
    - Non usare dati reali — usare il dataset sintetico esistente
  </security_rules>
</context>

<task>
  Implementa il "Rinnovo Probability Score": un punteggio da 0% a 100% che stima la probabilità
  che ogni abbonato rinnovi l'abbonamento nella stagione successiva.

  Il punteggio deve basarsi su questi segnali (in ordine di peso):
  1. Frequenza presenze ultime 8 partite (peso alto)
  2. Trend presenze: in aumento, stabile o in calo rispetto alle 8 partite precedenti (peso alto)
  3. Recency: quante partite fa è venuto l'ultima volta (peso medio)
  4. Storico rinnovi: quante stagioni consecutive ha l'abbonamento (peso medio)
  5. Valore speso nello shop: tifoso che compra merch è più fidelizzato (peso basso)

  Formula: non serve un ML model — un sistema di scoring pesato è sufficiente per V1.
  Ogni segnale contribuisce con un range normalizzato (0-1), moltiplicato per il peso.
  Score finale = media pesata → convertita in percentuale 0-100%.
</task>

<output_required>
  BACKEND:
  - Funzione Python `calculate_renewal_probability(fan_id, db_session) -> float`
  - Endpoint FastAPI: GET /api/fans/{fan_id}/renewal-score
  - Endpoint FastAPI: GET /api/fans/renewal-scores (tutti i fan del club, paginato)
  - Campo renewal_probability salvato su tabella fans o calcolato on-the-fly (valuta quale)

  FRONTEND:
  - Colonna "Prob. rinnovo" nella tabella fan esistente, con badge colorato:
    🟢 >70%  🟡 40-70%  🔴 <40%
  - Tooltip al hover: "Basato su presenze, trend e storico abbonamenti"
  - Filtro rapido: "Mostra solo tifosi a rischio rinnovo (<40%)"
  - Ordinamento per probabilità crescente (i più a rischio prima)

  TEST:
  - Unit test per la funzione di scoring con 5 profili tifoso campione (VIP, fedele, calo, dormiente, nuovo)
  - Verifica che lo score sia deterministico (stesso input = stesso output)
</output_required>

<constraints>
  - Nessuna dipendenza da librerie ML esterne (sklearn, tensorflow) — solo calcolo Python puro
  - La logica di scoring deve essere leggibile e modificabile — non una black box
  - Commenta ogni peso con il motivo: # peso 0.35 perché la frequenza recente è il predittore più forte
  - Se mancano dati per un segnale, usa il valore neutro (0.5) con flag has_incomplete_data=True
</constraints>
```

---

### DA-02 — Fan Journey Stage [FRONTEND ONLY]

```xml
<prerequisite>
  BACKEND GIÀ IMPLEMENTATO in DA-00.
  Non scrivere nessuna funzione Python, nessun endpoint, nessun modello ORM.
  Gli endpoint pronti da usare sono:
    GET /api/intelligence/fan/{fan_id}         → restituisce FanIntelligence completo (usa journey_stage)
    GET /api/intelligence/club/summary         → restituisce journey_distribution {SCOPERTA: N, ...}
    GET /api/intelligence/club?journey_stage=X → lista fan filtrata per stadio
  Se questi endpoint non esistono o danno errore, fermati e segnalalo — non reimplementare il backend.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B fan intelligence per club sportivi italiani</product>
  <stack>React + Vite frontend. Autenticazione già gestita — usa il token esistente per le chiamate API.</stack>
  <existing_frontend>
    Leggi il codice esistente prima di scrivere. Individua:
    - Il componente tabella fan (probabilmente FanTable o FansPage)
    - Il componente scheda fan singolo (FanDetail o FanCard)
    - La dashboard principale (Dashboard.jsx o simile)
    - Come vengono già mostrati RFM e Business Score — replica lo stesso pattern visivo
  </existing_frontend>
  <journey_stages>
    I 7 stadi e le loro label italiane (già definite nel backend — usale esatte):
    SCOPERTA   → "Scoperta"   → 🌱 → colore: #6366f1 (indaco)
    ABITUDINE  → "Abitudine"  → 📈 → colore: #3b82f6 (blu)
    FEDELTA    → "Fedeltà"    → 💪 → colore: #10b981 (verde)
    PICCO      → "Picco"      → ⭐ → colore: #f59e0b (oro)
    RISCHIO    → "A rischio"  → ⚠️ → colore: #f97316 (arancione)
    DORMIENTE  → "Dormiente"  → 😴 → colore: #94a3b8 (grigio)
    RECUPERATO → "Recuperato" → 🔄 → colore: #8b5cf6 (viola)
  </journey_stages>
</context>

<task>
  Costruisci i componenti React per visualizzare il Fan Journey Stage in 3 punti dell'app.
  Il backend è pronto — devi solo consumare gli endpoint e costruire la UI.
</task>

<output_required>
  COMPONENTE 1 — JourneyBadge (atomico, riutilizzabile)
    File: components/intelligence/JourneyBadge.jsx
    Props: stage (string), size ("sm" | "md" | "lg")
    Renderizza: icona + label colorata in base allo stage
    Stato INSUFFICIENTE: se stage è null o "N/D" → badge grigio "Dati insufficienti"
    Nessuna chiamata API — riceve solo i dati come props.

  COMPONENTE 2 — Colonna "Stadio" nella tabella fan esistente
    Modifica il componente tabella fan già esistente (non ricrearlo).
    Aggiungi colonna "Stadio" che usa JourneyBadge con size="sm".
    Aggiungi filtro dropdown sopra la tabella: "Tutti gli stadi | Scoperta | ... | Recuperato"
    Il filtro chiama GET /api/intelligence/club?journey_stage=X e ricarica la tabella.
    Highlight speciale per RECUPERATO: bordo sinistro viola sulla riga — sono i più caldi da contattare.

  COMPONENTE 3 — JourneyTimeline nella scheda fan singolo
    File: components/intelligence/JourneyTimeline.jsx
    Props: currentStage (string), fanId (string)
    Visualizzazione: barra orizzontale con i 7 stadi in sequenza logica.
    Lo stadio corrente è evidenziato. Gli stadi precedenti sono "completati" (opachi), i successivi grigi.
    Ordine logico della timeline: SCOPERTA → ABITUDINE → FEDELTA → PICCO → (RISCHIO) → (DORMIENTE) → RECUPERATO
    Nota: RISCHIO e DORMIENTE sono "rami negativi" — mostrali sotto la linea principale, non in sequenza.
    Tooltip su ogni stadio: descrizione breve in italiano di cosa significa quello stadio.

  COMPONENTE 4 — Widget distribuzione nella dashboard
    File: components/intelligence/JourneyDistributionWidget.jsx
    Chiama GET /api/intelligence/club/summary → legge journey_distribution
    Visualizzazione: donut chart (usa recharts se già presente nel progetto, altrimenti barre CSS pure)
    Sotto il chart: insight automatico testuale basato sui dati:
      - Se RECUPERATO > 5%  → "Hai X tifosi tornati di recente — contattali subito."
      - Se RISCHIO > 20%    → "1 tifoso su 5 è a rischio abbandono. Agisci prima dei rinnovi."
      - Se DORMIENTE > 40%  → "Quasi metà dei tuoi tifosi è dormiente. Serve una campagna di riattivazione."
      - Altrimenti           → "La distribuzione è nella norma."
    Loading state: skeleton placeholder mentre la chiamata è in corso.
    Error state: messaggio "Dati non disponibili" — mai crashare silenziosamente.
</output_required>

<constraints>
  - Zero logica di calcolo nel frontend — tutti i valori arrivano dall'API, il frontend solo li mostra
  - Se journey_stage è null (data_quality INSUFFICIENT) → mostrare badge grigio "N/D", non nascondere il fan
  - I colori degli stadi sono definiti sopra — non inventarne altri, non usare colori generici
  - Le label in UI devono essere in italiano esatte come definite sopra (es. "A rischio" non "Risk")
  - Non toccare nulla che riguardi autenticazione, routing protetto o gestione token
  - Se recharts non è già nel progetto, NON installarlo — usa barre CSS con width% calcolata
</constraints>

<output_checklist>
  □ JourneyBadge funziona con tutti e 7 gli stadi + stato null
  □ Filtro tabella chiama l'API con il parametro journey_stage corretto
  □ Highlight viola sulla riga RECUPERATO è visibile
  □ JourneyTimeline mostra RISCHIO e DORMIENTE come rami separati (non in linea principale)
  □ Widget dashboard mostra l'insight testuale corretto in base ai dati reali
  □ Tutti i componenti gestiscono loading e error state
  □ Nessun console.error silenzioso — ogni errore API è visibile in UI
</output_checklist>
```

---

### DA-03 — Anomalia Abbonamento [FRONTEND ONLY]

```xml
<prerequisite>
  BACKEND GIÀ IMPLEMENTATO in DA-00.
  Non scrivere nessuna funzione Python, nessun endpoint, nessun modello ORM.
  Gli endpoint pronti da usare sono:
    GET /api/intelligence/club?journey_stage=RISCHIO  → fan a rischio (usa per pre-filtrare)
    GET /api/intelligence/club/summary                → fans_critical_anomaly (contatore badge)
    GET /api/intelligence/fan/{fan_id}                → subscription_anomaly nel FanIntelligence
  L'endpoint specifico anomalie è: GET /api/alerts/subscription-anomalies?severity=X
  Se non esiste, usa GET /api/intelligence/club e filtra lato client su subscription_anomaly != null.
  Se gli endpoint non esistono o danno errore, fermati e segnalalo.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B fan intelligence per club sportivi italiani</product>
  <stack>React + Vite. Token auth già gestito. Non modificare routing protetto o middleware.</stack>
  <anomaly_model>
    Il campo subscription_anomaly nel FanIntelligence ha questa struttura:
    { severity: "CRITICA"|"ALTA"|"MEDIA"|"BASSA", message: string, consecutive_absences: int }
    oppure null se nessuna anomalia.
    Il messaggio (message) è già in italiano e leggibile — mostralo direttamente, non tradurlo.
  </anomaly_model>
  <severity_visual>
    CRITICA → rosso   #ef4444 → icona 🚨
    ALTA    → arancio #f97316 → icona ⚠️
    MEDIA   → giallo  #eab308 → icona 📉
    BASSA   → grigio  #94a3b8 → icona ℹ️
  </severity_visual>
</context>

<task>
  Costruisci la sezione Alert dell'app FanIQ che permette al responsabile marketing
  di vedere, filtrare e gestire le anomalie sugli abbonamenti in modo rapido e leggibile.
</task>

<output_required>
  COMPONENTE 1 — Badge alert nella navbar/header della dashboard
    Se fans_critical_anomaly > 0 dalla summary: mostra badge rosso con numero sopra l'icona campanella 🔔
    Click sul badge → porta alla pagina/sezione Alert
    Se 0 anomalie critiche: campanella senza badge (non nasconderla)

  COMPONENTE 2 — Pagina o sezione Alert
    File: pages/AlertsPage.jsx oppure sezione dentro Dashboard.jsx (valuta in base alla struttura esistente)
    Layout: header con contatori per severity ("3 Critiche · 7 Alte · 12 Medie · 5 Basse")
    Lista alert: card per ogni anomalia con:
      - Nome fan (non fan_id — mostra il nome leggibile)
      - Severity badge colorato
      - Messaggio diretto dal campo message (già in italiano — non riformularlo)
      - Data ultimo accesso
      - Bottone "Contatta" → apre email client con mailto: pre-compilato (oggetto: "Ti aspettiamo allo stadio")
      - Bottone "Archivia" → chiama PATCH /api/alerts/{alert_id}/archive o salva in localStorage se l'endpoint non esiste
    Filtro: tab o dropdown per severity (Tutte / Critiche / Alte / Medie / Basse)
    Ordinamento default: Critiche prima, poi per consecutive_absences decrescente

  COMPONENTE 3 — Inline alert nella scheda fan singolo
    Se fan ha subscription_anomaly != null: mostra banner colorato in cima alla scheda
    Esempio: banner rosso con "⚠️ Marco non viene da 5 partite. Ha un abbonamento stagionale attivo."
    Il testo viene da message — non inventare copy.
    Se anomalia = null: nessun banner (non mostrare "Nessuna anomalia" — è rumore visivo inutile)

  COMPORTAMENTO ARCHIVIA:
    Alert archiviato → scompare dalla lista
    Se l'endpoint PATCH non esiste → salva archived_alerts: [id1, id2] in localStorage
    Al caricamento, filtra gli alert archiviati dalla lista
    Un alert riarchiviato non deve ricomparire finché consecutive_absences non aumenta
</output_required>

<constraints>
  - Il testo degli alert viene SEMPRE dal campo message dell'API — mai generare copy custom nel frontend
  - NON usare le parole "anomalia", "alert", "rilevato" nell'UI rivolta all'utente
    Usa: "Tifosi da richiamare", "Situazioni da gestire", "Da contattare"
  - Il bottone "Contatta" non invia email automaticamente — apre solo il client email con mailto:
    Non serve conferma, non serve backend. È un'azione dell'utente, non del sistema.
  - Non toccare autenticazione, routing protetto o gestione token
  - Loading e error state su ogni chiamata API — mai UI vuota senza spiegazione
</constraints>

<output_checklist>
  □ Badge rosso in header mostra il numero corretto di anomalie critiche
  □ Lista alert ordinata per severity poi consecutive_absences
  □ Filtro per severity funziona senza ricaricare la pagina
  □ "Archivia" rimuove l'alert dalla lista immediatamente (ottimistic update)
  □ Banner nella scheda fan appare solo se subscription_anomaly != null
  □ Bottone "Contatta" apre mailto: con oggetto pre-compilato
  □ Le parole "anomalia" e "alert" non compaiono nell'UI visibile all'utente
</output_checklist>
```

---

### DA-04 — Ambassador Score [FRONTEND ONLY]

```xml
<prerequisite>
  BACKEND GIÀ IMPLEMENTATO in DA-00.
  Non scrivere nessuna funzione Python, nessun endpoint, nessun modello ORM.
  Gli endpoint pronti da usare sono:
    GET /api/intelligence/fan/{fan_id}   → ambassador_score nel FanIntelligence (0-100)
    GET /api/intelligence/club           → lista con ambassador_score per ogni fan
    GET /api/intelligence/club/summary   → non include ambassador direttamente, calcola lato client
  Se ambassador_score non è nel response, fermati e segnalalo — non simulare il dato.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B fan intelligence per club sportivi italiani</product>
  <stack>React + Vite. Token auth già gestito. Non modificare routing protetto o middleware.</stack>
  <ambassador_tiers>
    >60  → Ambassador  → 🤝 → #8b5cf6 viola  → "Porta spesso altri allo stadio"
    30-60 → Social fan → 👥 → #3b82f6 blu    → "Viene occasionalmente con altri"
    <30  → Fan solo    → 🧍 → #94a3b8 grigio → "Viene principalmente da solo"
    null → N/D         → —  → #e2e8f0 grigio chiaro → "Dati insufficienti"
  </ambassador_tiers>
</context>

<task>
  Costruisci i componenti React per visualizzare l'Ambassador Score.
  Focus su chiarezza e sul valore per il responsabile marketing:
  sapere chi sono i suoi "canali umani" è una info di valore alto, non un numero astratto.
</task>

<output_required>
  COMPONENTE 1 — AmbassadorBadge (atomico, riutilizzabile)
    File: components/intelligence/AmbassadorBadge.jsx
    Props: score (number | null)
    Renderizza: icona + tier label + score numerico tra parentesi (es. "🤝 Ambassador (74)")
    Se score = null → badge grigio "N/D" senza numero
    Nessuna chiamata API — solo display.

  COMPONENTE 2 — Colonna nella tabella fan
    Aggiungi colonna "Impatto" nella tabella fan esistente usando AmbassadorBadge size="sm"
    Mostra solo icona + score numerico (senza label testuale — spazio limitato in tabella)
    Tooltip al hover: mostra la label completa + spiegazione del tier
    Colonna ordinabile per score decrescente

  COMPONENTE 3 — Widget "I tuoi Ambassador" nella dashboard
    File: components/intelligence/AmbassadorsWidget.jsx
    Chiama GET /api/intelligence/club → filtra lato client per ambassador_score > 60 → prendi top 10
    Visualizzazione: lista compatta con nome fan, score, AmbassadorBadge
    Header widget: "Ambassador (X)" dove X è il totale fan con score >60
    Footer: "Questi tifosi portano altri allo stadio — trattali come canali, non solo come fan."
    Se 0 ambassador: stato vuoto con messaggio "Nessun ambassador identificato ancora.
      Servono almeno 8 partite di dati per calcolarlo."

  COMPONENTE 4 — Sezione nella scheda fan singolo
    Sotto la sezione RFM esistente, aggiungi "Impatto comunitario"
    Mostra: AmbassadorBadge grande + spiegazione testuale del tier
    Tooltip/info: "Calcolato in base agli acquisti di gruppo — potrebbe non essere accurato al 100%"
    (Questo disclaimer è obbligatorio — vedi constraints)
    Se score = null: non mostrare la sezione (non aggiunge valore mostrare "Dati insufficienti" nella scheda)
</output_required>

<constraints>
  - Il disclaimer "Calcolato in base agli acquisti" DEVE essere visibile nella scheda fan — non solo nel tooltip
  - Non usare la parola "ambassador" come se fosse un titolo ufficiale — è un'inferenza comportamentale
    Usare sempre tono prudente: "porta spesso altri", "tende a venire in gruppo"
  - La colonna in tabella è opzionale — se la tabella è già affollata di colonne, mettila come colonna nascosta
    attivabile dall'utente (pattern "mostra/nascondi colonne" se già esiste nel progetto)
  - Non toccare autenticazione, routing protetto o gestione token
  - Nessuna logica di calcolo nel frontend — ambassador_score arriva sempre dall'API
</constraints>

<output_checklist>
  □ AmbassadorBadge gestisce null senza crashare
  □ Widget dashboard mostra solo fan con score >60, ordinati per score desc
  □ Stato vuoto del widget ha messaggio esplicativo (non UI bianca)
  □ Disclaimer visibile nella scheda fan singolo
  □ Tooltip colonna tabella mostra tier label completa al hover
  □ Nessun calcolo di ambassador_score nel frontend
</output_checklist>
```

---

### DA-05 — Loyalty Decay Curve [FRONTEND ONLY]

```xml
<prerequisite>
  BACKEND GIÀ IMPLEMENTATO in DA-00.
  Non scrivere nessuna funzione Python, nessun endpoint, nessun modello ORM.
  Gli endpoint pronti da usare sono:
    GET /api/intelligence/fan/{fan_id}    → decay_profile nel FanIntelligence
    GET /api/intelligence/club            → decay_profile per ogni fan
    GET /api/intelligence/club/summary    → decay_distribution {LENTO: N, MEDIO: N, RAPIDO: N, VOLATILE: N}
  Se decay_profile non è nel response, fermati e segnalalo — non simulare il dato.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B fan intelligence per club sportivi italiani</product>
  <stack>React + Vite. Token auth già gestito. Non modificare routing protetto o middleware.</stack>
  <decay_profiles>
    LENTO    → "Solido"    → 🪨 → #10b981 verde   → "Non molla facilmente. Resiste alle assenze."
    MEDIO    → "Regolare"  → 📊 → #3b82f6 blu     → "Comportamento nella norma."
    RAPIDO   → "Reattivo"  → ⚡ → #f59e0b giallo  → "Si perde e si recupera velocemente."
    VOLATILE → "Volatile"  → 🌊 → #ef4444 rosso   → "Ogni assenza è un rischio reale."
    null     → "N/D"       → —  → #e2e8f0 grigio  → "Storico insufficiente (< 8 partite)"
  </decay_profiles>
  <important_ux_note>
    Mai mostrare "half-life", "decay", "curva" o termini tecnici all'utente finale.
    Il responsabile marketing di un club di Lega Pro non sa cosa è una half-life.
    Ogni label deve essere in italiano semplice come definito sopra.
  </important_ux_note>
</context>

<task>
  Costruisci i componenti React per il Profilo Fedeltà (Loyalty Decay).
  L'obiettivo UX è far capire al responsabile marketing in 2 secondi:
  "Questi tifosi spariscono alla prima assenza — quelli altri no."
</task>

<output_required>
  COMPONENTE 1 — DecayBadge (atomico, riutilizzabile)
    File: components/intelligence/DecayBadge.jsx
    Props: profile (string | null), size ("sm" | "md" | "lg")
    Renderizza: icona + label italiana colorata
    Se profile = null → badge grigio "N/D" con tooltip "Storico insufficiente"
    Nessuna chiamata API.

  COMPONENTE 2 — Colonna "Fedeltà" nella tabella fan
    Aggiungi colonna "Fedeltà" nella tabella fan esistente usando DecayBadge size="sm"
    Tooltip al hover: mostra la descrizione del profilo (es. "Non molla facilmente. Resiste alle assenze.")
    Colonna ordinabile — ordine: VOLATILE prima (i più a rischio), poi RAPIDO, MEDIO, LENTO, null ultimi

  COMPONENTE 3 — Widget distribuzione nella dashboard
    File: components/intelligence/DecayDistributionWidget.jsx
    Chiama GET /api/intelligence/club/summary → legge decay_distribution
    Visualizzazione: 4 barre orizzontali proporzionali (una per profilo), con icona + label + percentuale
    Esempio:
      🌊 Volatile  ████░░░░░░  34%
      ⚡ Reattivo  ███░░░░░░░  24%
      📊 Regolare  ██░░░░░░░░  18%
      🪨 Solido    █░░░░░░░░░  12%
      —  N/D       █░░░░░░░░░  12%
    Insight testuale automatico sotto le barre:
      - Se VOLATILE > 30% → "Il {X}% dei tuoi tifosi abbandona facilmente. Contattali alla prima assenza."
      - Se SOLIDO > 40%   → "La tua base è solida: {X}% dei tifosi resiste alle assenze."
      - Altrimenti         → "Distribuzione nella norma."
    Loading skeleton mentre la chiamata è in corso.

  COMPONENTE 4 — Sezione "Profilo fedeltà" nella scheda fan singolo
    Sotto la sezione Journey Stage, aggiungi "Profilo fedeltà"
    DecayBadge size="lg" + descrizione completa del profilo
    Sotto: frase contestuale personalizzata:
      VOLATILE → "Questo tifoso tende ad allontanarsi dopo ogni assenza. Contattalo entro la prima partita saltata."
      RAPIDO   → "Si perde rapidamente ma si recupera anche in fretta. Reagisce bene alle campagne."
      MEDIO    → "Comportamento standard. Nessuna urgenza particolare."
      LENTO    → "Fan solido. Puoi permetterti di aspettare senza rischiare di perderlo."
      null     → non mostrare la sezione (dati insufficienti non aggiungono valore)
    Nessun numero tecnico (non mostrare half_life_value all'utente)
</output_required>

<constraints>
  - ZERO termini tecnici in UI: no "half-life", no "decay", no "curva", no "coefficiente"
  - L'ordine delle colonne in tabella mette VOLATILE prima — i più a rischio devono essere visibili subito
  - Se data_quality = INSUFFICIENT nel FanIntelligence → DecayBadge mostra "N/D", non crashare
  - Le barre del widget sono CSS puro (width calcolata in % sul totale) — non installare librerie chart se non già presenti
  - Non toccare autenticazione, routing protetto o gestione token
  - La frase contestuale nella scheda fan è hardcoded per profilo — non generarla dinamicamente con AI
</constraints>

<output_checklist>
  □ DecayBadge gestisce null senza crashare e mostra "N/D" con tooltip
  □ Colonna tabella ordina VOLATILE prima per default
  □ Barre nel widget sono proporzionali ai dati reali (non statiche)
  □ Insight testuale varia in base alla distribuzione reale
  □ Frase contestuale nella scheda è diversa per ogni profilo
  □ Nessun termine tecnico visibile nell'UI
  □ Sezione scheda fan nascosta se profile = null
</output_checklist>
```

---

*Aggiornato il 22 giugno 2026. Prompt DA-01→DA-05 generati in sessione creativa data analysis.*
*Lista completa tool e priorità: `product/data_tools_roadmap.md`*

---

## Categoria: Git — Deploy e Versioning

> ⚠️ REGOLA FISSA: ogni prompt di feature (DA-XX, LP-XX, ecc.) deve terminare con la sezione
> GIT-PUSH copiata da GIT-01. Non lasciare mai lavoro non committato.

### GIT-01 — Commit e push completo (template riutilizzabile)

```xml
<mission>
  Fai il commit di tutto il lavoro completato in questa sessione e pusha su GitHub.
  Claude Code esegue tutti i comandi git — Lorenzo verifica solo che Vercel e Render
  siano andati online dopo il push.
</mission>

<prerequisite>
  LEGGI LO STATO GIT prima di fare qualsiasi cosa:
    git status
    git log --oneline -5
    git remote -v
  
  Verifica di essere sul branch corretto (main) e che il remote origin punti a:
    git@github.com:lorep1703-cmyk/faniq.git
  Se il remote è diverso o il branch è sbagliato, FERMATI e segnalalo.
</prerequisite>

<gitignore_check>
  Prima di fare git add, verifica che questi path siano in .gitignore.
  Se non ci sono, aggiungili TU al .gitignore prima del commit:
  
    frontend/.claude/        # config interna di Claude Code — non va in repo
    .env                     # già presente ma ricontrolla
    .env.local               # già presente ma ricontrolla
    backend/.venv/           # già presente ma ricontrolla
    __pycache__/             # già presente ma ricontrolla
  
  Dopo aver aggiornato .gitignore, esegui:
    git rm -r --cached frontend/.claude/ 2>/dev/null || true
  (Rimuove il tracking se era già stato aggiunto per errore — il || true evita errori se non era tracciato)
</gitignore_check>

<commit_instructions>
  Esegui 2 commit separati per mantenere una storia git leggibile.

  COMMIT 1 — Codice (backend + frontend)
  Staging esplicito — solo file di codice, niente workspace:
    git add backend/
    git add frontend/src/
    git add frontend/package.json
    git add frontend/package-lock.json
    git add CLAUDE.md
    git add sample_csv/
  
  Poi esegui il commit con il messaggio fornito sotto (adattalo alla sessione corrente):
    git commit -m "[MESSAGGIO_COMMIT_1]"

  COMMIT 2 — Workspace e documentazione
  Staging del resto:
    git add product/
    git add prompts/
    git add research/
    git add sales_assets/
    git add context/
    git add decisions/
    git add strategy/
    git add gtm/
    git add marketing/
    git add governance/
    git add reviews/
    git add instructions.md
    git add PROJECT_STRUCTURE.md
  
  Poi:
    git commit -m "[MESSAGGIO_COMMIT_2]"
  
  Se qualcuno di questi path non esiste, salta quel git add senza errori.
</commit_instructions>

<push>
  Dopo i 2 commit:
    git push origin main
  
  Se il push fallisce per divergenza (non-fast-forward):
    1. NON fare git push --force senza chiedere
    2. Esegui git pull --rebase origin main
    3. Poi riprova git push origin main
    4. Se il rebase produce conflitti, FERMATI e segnala i file in conflitto
</push>

<verification>
  Dopo il push, esegui:
    git log --oneline -5
    git status
  
  Output atteso:
    - git status mostra "nothing to commit, working tree clean"
    - git log mostra i 2 nuovi commit in cima
  
  Riporta il link diretto al commit su GitHub:
    https://github.com/lorep1703-cmyk/faniq/commit/[HASH]
  
  Lorenzo verificherà manualmente:
    - Vercel: https://faniq-seven.vercel.app (deploy automatico al push)
    - Render: dashboard Render per conferma build backend
</verification>

<security_constraints>
  1. Non committare mai file .env, .env.local o file con credenziali
  2. Non committare frontend/.claude/ (config Claude Code interna)
  3. Non fare git push --force senza esplicita approvazione
  4. Non modificare branch diversi da main senza chiedere
  5. Non toccare la history di git (no rebase interattivo, no reset --hard)
</security_constraints>

<output_checklist>
  □ .gitignore aggiornato con frontend/.claude/ se non era presente
  □ Commit 1 contiene solo file di codice (backend/ frontend/ CLAUDE.md sample_csv/)
  □ Commit 2 contiene solo file di workspace (product/ prompts/ ecc.)
  □ git push origin main eseguito con successo
  □ git status finale: "nothing to commit, working tree clean"
  □ Link al commit GitHub riportato nell'output
  □ Nessun file .env o credenziale incluso nel commit
</output_checklist>
```

---

### GIT-02 — Commit e push sessione DA-06→DA-10 (24 giugno 2026)

Questo è il prompt specifico per il push del lavoro accumulato fino al 24 giugno 2026.
Usa GIT-01 come template con i messaggi di commit già compilati.

```xml
<mission>
  Fai il commit di tutto il lavoro non ancora committato nel repository FanIQ
  e pusha su GitHub. Questo include il Fan Intelligence Engine (DA-00),
  tutti i componenti frontend intelligence (DA-01→DA-05),
  e la Dashboard v2 con i nuovi widget (DA-06→DA-10).
  Claude Code esegue tutti i comandi — Lorenzo verifica solo Vercel e Render.
</mission>

<prerequisite>
  LEGGI LO STATO GIT prima di fare qualsiasi cosa:
    git status
    git log --oneline -5
    git remote -v
  
  Verifica:
    - Branch: main
    - Remote origin: git@github.com:lorep1703-cmyk/faniq.git
    - Ultimo commit locale: "Rinnovo Probability Score: scoring pesato 0-100% per ogni abbonato"
  
  Se lo stato non corrisponde, FERMATI e segnalalo.
</prerequisite>

<gitignore_check>
  Controlla che frontend/.claude/ sia in .gitignore.
  Se non c'è, aggiungilo:
    echo "frontend/.claude/" >> .gitignore
  Poi esegui:
    git rm -r --cached frontend/.claude/ 2>/dev/null || true
</gitignore_check>

<commit_1_code>
  Staging esplicito dei file di codice:
    git add backend/main.py
    git add backend/services/insights.py
    git add backend/fan_intelligence.py
    git add backend/intelligence_config.py
    git add backend/routers/intelligence.py
    git add backend/services/intelligence/
    git add backend/tests/test_intelligence_engine.py
    git add frontend/package.json
    git add frontend/package-lock.json
    git add frontend/src/App.jsx
    git add frontend/src/api/client.js
    git add frontend/src/components/Sidebar.jsx
    git add frontend/src/components/StatCard.jsx
    git add frontend/src/components/QuickActionsWidget.jsx
    git add frontend/src/components/RfmDistributionWidget.jsx
    git add frontend/src/components/TopSpendersWidget.jsx
    git add frontend/src/components/intelligence/
    git add frontend/src/pages/Dashboard.jsx
    git add frontend/src/pages/Report.jsx
    git add frontend/src/pages/AlertsPage.jsx
    git add CLAUDE.md
    git add sample_csv/
    git add .gitignore

  Commit:
    git commit -m "feat: Fan Intelligence Engine + Dashboard v2 (DA-00→DA-10)

- DA-00: Fan Intelligence Engine — pipeline 5 stadi (decay, journey, anomaly, ambassador, renewal)
- DA-01: Renewal Probability Score con endpoint /fans/renewal-scores
- DA-02: Journey Stage — JourneyBadge, JourneyTimeline, JourneyDistributionWidget
- DA-03: Subscription Anomaly — AlertsPage, badge sidebar, FanAnomalyBanner
- DA-04: Ambassador Score — AmbassadorBadge, AmbassadorsWidget, FanCommunityImpact
- DA-05: Loyalty Decay — DecayBadge, DecayDistributionWidget, FanDecayProfile
- DA-06: Intelligence KPI Banner + Framer Motion (fans_at_risk, anomalie, renewal medio)
- DA-07: RfmDistributionWidget — condiviso tra Dashboard e Report, barre CSS
- DA-08: SeasonChart — abbonati per stagione con variazione YoY
- DA-09: TopSpendersWidget — condiviso tra Dashboard e Report, medaglie, privacy cognome
- DA-10: QuickActionsWidget + Report useSearchParams (?filter=at_risk)"
</commit_1_code>

<commit_2_workspace>
  Staging dei file di workspace e documentazione:
    git add product/
    git add prompts/
    git add research/
    git add sales_assets/
    git add context/
    git add decisions/
    git add strategy/
    git add gtm/
    git add marketing/
    git add governance/
    git add reviews/
    git add instructions.md
    git add PROJECT_STRUCTURE.md
    git add README.md

  (Se qualcuno di questi path non esiste, salta il git add relativo senza errori)

  Commit:
    git commit -m "docs: workspace FanIQ — product, prompts, research, sales, strategy"
</commit_2_workspace>

<push>
  git push origin main
  
  Se fallisce per non-fast-forward:
    git pull --rebase origin main
    git push origin main
  Se il rebase produce conflitti, FERMATI e riporta i file in conflitto.
</push>

<verification>
  Esegui:
    git log --oneline -5
    git status
  
  Riporta:
    1. Output di git log (i 2 nuovi commit devono essere i primi)
    2. Output di git status (deve essere "nothing to commit, working tree clean")
    3. Link ai commit:
       https://github.com/lorep1703-cmyk/faniq/commits/main
</verification>

<security_constraints>
  1. Non committare file .env, .env.local o file con credenziali o API key
  2. Non committare frontend/.claude/ (già escluso da .gitignore dopo il check)
  3. Non fare git push --force
  4. Non modificare branch diversi da main
  5. Non toccare la history di git
</security_constraints>

<output_checklist>
  □ .gitignore ha frontend/.claude/ — aggiunto se mancava
  □ Commit 1 "feat:" contiene tutti i file di codice elencati
  □ Commit 2 "docs:" contiene i file di workspace
  □ git push origin main eseguito con successo
  □ git status: "nothing to commit, working tree clean"
  □ git log mostra i 2 nuovi commit in cima alla history
  □ Nessun file .env o credenziale incluso
</output_checklist>
```

*Aggiornato il 24 giugno 2026.*
*GIT-01 = template riutilizzabile. GIT-02 = push specifico sessione odierna.*
