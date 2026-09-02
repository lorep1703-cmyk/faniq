# FanIQ — Prompt Claude Code

---

## CONTESTO OBBLIGATORIO (da incollare sempre all'inizio di ogni sessione)

> Stai lavorando su FanIQ, SaaS B2B multi-tenant FastAPI + React 18 + Tailwind. Backend su Python 3.11, SQLAlchemy 2.0, PostgreSQL con RLS attiva. NON toccare mai: `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`, logica RLS. Prima di modificare qualsiasi file, leggilo interamente. Dopo ogni modifica, verifica che i 29 test in `backend/tests/` passino ancora.

> Nota test: 3 failure pre-esistenti su `test_intelligence_engine.py` per SQLAlchemy assente nel Python di sistema (non nel venv). Sono attesi e non vanno contati come regressioni. I test autonomi che passano sono 20.

---

## Log interventi completati (2026-06-26 / 2026-06-29)

| # | Cosa | File toccati | Data |
|---|------|-------------|------|
| 1 | Fix double-load `renewal-scores`: query mirata su `id/nome/cognome/email` invece di caricare oggetti Fan completi | `routers/renewal.py` | 26 giu |
| 2 | Rimosso endpoint anti-pattern `GET /insights/fan/{fan_id}` (caricava tutti i fan per servirtene uno) + rimossa `fetchFanDetail` da `client.js` | `routers/insights.py`, `client.js` | 29 giu |
| 3 | UI modifica consensi GDPR in Privacy: toggle pill per `consenso_marketing` e `consenso_profilazione`, aggiornamento stato locale senza reload | `pages/Privacy.jsx` | 29 giu |
| 4 | Collegato Simulatore al router e alla Sidebar (`TrendingUp`) — nessuna modifica a `Simulatore.jsx` | `App.jsx`, `Sidebar.jsx` | 29 giu |
| 5 | Filtro stagionale in Report: param `?stagione=` su `GET /dashboard/fans`, dropdown nel frontend, fetch server-side al cambio stagione | `routers/dashboard.py`, `client.js`, `pages/Report.jsx` | 29 giu |
| 6 | Pulizia `client.js`: rimossi `downloadTemplate` e `fetchFansBySegment` (codice morto) | `client.js` | 29 giu |
| 7 | Side panel scheda fan in Report: `GET /fans/{id}/detail` + `FanDetailPanel.jsx` con intelligence, abbonamenti, stat biglietti/shop | `routers/fans.py`, `main.py`, `client.js`, `components/FanDetailPanel.jsx`, `pages/Report.jsx` | 29 giu |

---

## PROMPT — Self-audit codebase (solo analisi, zero modifiche)

> **Questo prompt non deve produrre nessuna modifica al codice.** L'output è esclusivamente un file di audit markdown.

> Esegui un'analisi sistematica dell'intero codebase FanIQ. L'obiettivo è trovare: (1) codice inutilizzato, (2) anti-pattern di performance, (3) opportunità di ottimizzazione. Non toccare nessun file sorgente — solo leggere e analizzare.
>
> **Cosa leggere — backend (in questo ordine):**
> Leggi per intero: `main.py`, `config.py`, `database.py`, `models.py`, `tenant.py`, poi tutti i file in `routers/` e `services/` (inclusa la sottocartella `services/intelligence/`).
>
> **Cosa leggere — frontend (in questo ordine):**
> Leggi per intero: `frontend/src/App.jsx`, `frontend/src/api/client.js`, tutti i file in `frontend/src/pages/`, tutti i file in `frontend/src/components/` (incluse le sottocartelle).
>
> **Cosa cercare — codice inutilizzato:**
> - Funzioni definite in `client.js` non importate da nessun `.jsx`
> - Componenti React definiti ma non importati da nessuna pagina o altro componente
> - Pagine in `pages/` non collegate in `App.jsx`
> - Endpoint backend (router `@router.get/post/patch/delete`) non chiamati da nessuna funzione in `client.js`
> - Import Python nei file router/service che non vengono usati nel corpo del file
> - Funzioni Python nei service che non vengono importate da nessun router
>
> **Cosa cercare — anti-pattern di performance:**
> - Query che caricano tutti i record di una tabella quando servono solo alcuni campi o un sottoinsieme (pattern: `db.query(Model).filter(Model.club_id == club.id).all()` seguito da elaborazione Python sulla lista)
> - Endpoint che chiamano funzioni pesanti come `compute_fan_segments` o `calculate_renewal_scores_bulk` per servire un singolo record
> - Chiamate API nel frontend dentro `useEffect` senza dipendenze corrette, o chiamate ridondanti che fetchano gli stessi dati più volte al mount
> - Componenti che ri-fetchano dati ad ogni render invece di usare stato
>
> **Cosa cercare — opportunità di ottimizzazione:**
> - Endpoint che potrebbero beneficiare della cache già esistente in `services/cache.py` ma non la usano
> - Query SQL che fanno più round-trip al database quando potrebbero usare un JOIN o una subquery
> - Logica duplicata tra due file service diversi (stessa computazione riscritta due volte)
>
> **Output richiesto:**
> Crea il file `CODEBASE_AUDIT_2.md` nella root del progetto con questa struttura:
>
> ```
> # FanIQ — Codebase Audit #2
> > Data: [oggi]
>
> ## CATEGORIA A — Codice inutilizzato
> Per ogni elemento: nome, file, riga, perché è inutilizzato, azione consigliata (rimuovere / tenere per uso futuro / collegare)
>
> ## CATEGORIA B — Anti-pattern di performance
> Per ogni elemento: file, riga, descrizione del problema, impatto stimato (basso/medio/alto), soluzione consigliata
>
> ## CATEGORIA C — Opportunità di ottimizzazione
> Per ogni elemento: file, descrizione, beneficio atteso
>
> ## Riepilogo priorità
> Tabella con colonne: elemento | categoria | priorità (🔴 Alta / 🟡 Media / 🟢 Bassa) | azione
> ```
>
> Se una categoria non ha elementi da segnalare, scrivi esplicitamente "Nessun elemento trovato" — non omettere la sezione. Sii preciso sui numeri di riga. Non speculare: se non sei certo che una funzione sia inutilizzata, cercala esplicitamente in tutti i file prima di segnalarla.

---

## Prossimi prompt — Audit #2 (da completare prima del test dati)

> Eseguire nell'ordine indicato. I prompt marcati **[parallelo]** possono girare in sessioni Claude Code separate in contemporanea perché toccano file diversi.

---

### PROMPT A — Fix critico: `calculate_renewal_scores_bulk` N×5 query [🔴 Alta]

> Leggi per intero `backend/services/renewal.py` e `backend/routers/renewal.py`.
>
> Il problema è in `calculate_renewal_scores_bulk`: chiama `calculate_renewal_probability` per ogni fan in un loop. Ogni chiamata esegue 5 query DB separate (Fan, Partita, Biglietto, Abbonamento, ShopOrder). Con 2.500 fan = 12.500 query al database per una singola richiesta della pagina Report.
>
> Refactora `calculate_renewal_scores_bulk` con un bulk loader: prima carica tutti i dati del club in memoria con una query per tabella (5 query totali), poi calcola tutti i punteggi in-memory senza ulteriori accessi al DB. Il pattern di riferimento è già implementato in `backend/services/intelligence/engine.py` — guarda come `_bulk_load` carica i dati e come il loop successivo li usa senza query aggiuntive.
>
> I dati da precaricare sono:
> - Tutti i `Fan` del club (id, nome, cognome, email, data_nascita)
> - Tutti gli `Abbonamento` del club (fan_id, stagione, stato, importo_pagato)
> - Tutti i `Biglietto` del club (fan_id, data_partita)
> - Tutti gli `ShopOrder` del club (fan_id, importo, data_ordine)
> - Tutte le `Partita` del club (data, tipo)
>
> Costruisci dizionari indicizzati per `fan_id` e passa i dati pre-caricati a `calculate_renewal_probability` (adatta la firma della funzione se necessario, ma mantieni la stessa logica di calcolo — non cambiare i pesi o le formule).
>
> Il formato della response JSON di `GET /fans/renewal-scores` deve restare identico.
>
> Verifica che i 29 test passino dopo la modifica.

---

### PROMPT B — Fix `get_predizione` carica biglietti due volte [🔴 Alta] **[parallelo con A]**

> Leggi per intero `backend/routers/partite.py`.
>
> L'endpoint `GET /partite/predizione/{partita_id}` ha un caricamento ridondante: chiama `compute_behavioral` (che carica già tutti i biglietti del club internamente), poi esegue una seconda query separata su `Biglietto` per costruire `fan_ticket_dates`. I dati sono già disponibili nel risultato di `compute_behavioral`.
>
> Studia la struttura del dizionario restituito da `compute_behavioral` (leggi `backend/services/behavioral.py` per capire quali chiavi contiene). Estrai `fan_ticket_dates` direttamente da quel dizionario invece di rieseguire la query su `Biglietto`. Se la struttura di `compute_behavioral` non espone già i dati necessari nel formato giusto, adatta solo la parte di estrazione in `get_predizione` senza modificare `compute_behavioral`.
>
> Non modificare la logica di predizione né il formato della response. Verifica che i 29 test passino.

---

### PROMPT C — Fix SQL analytics: aggregati invece di full-load [🟡 Media] **[parallelo con A e B]**

> Leggi per intero `backend/services/analytics.py`.
>
> Ci sono quattro funzioni che caricano tutti i record in memoria per fare operazioni che SQL può fare direttamente. Correggile tutte e quattro in questa sessione.
>
> **1. `dashboard_citta`:** Sostituisci `db.query(Fan).filter(...).all()` con `db.query(Fan.citta, func.count(Fan.id)).filter(Fan.club_id == club_id).group_by(Fan.citta).all()`. Adatta la logica successiva al nuovo formato (non più oggetti Fan, ma tuple `(citta, count)`).
>
> **2. `dashboard_presenze`:** Sostituisci il caricamento di tutti i `Biglietto` con:
> ```python
> rows = db.query(Biglietto.data_partita, func.count(Biglietto.id))\
>     .filter(Biglietto.club_id == club_id, Biglietto.data_partita.isnot(None))\
>     .group_by(Biglietto.data_partita).order_by(Biglietto.data_partita).all()
> return [{"data": d.isoformat(), "presenze": n} for d, n in rows]
> ```
>
> **3. `dashboard_revenue_breakdown`:** Sostituisci i tre `.all()` con query `func.sum()`:
> ```python
> from sqlalchemy import func
> abbonamenti = db.query(func.sum(Abbonamento.importo_pagato)).filter(Abbonamento.club_id == club_id).scalar() or 0
> biglietti   = db.query(func.sum(Biglietto.prezzo)).filter(Biglietto.club_id == club_id).scalar() or 0
> shop        = db.query(func.sum(ShopOrder.importo)).filter(ShopOrder.club_id == club_id).scalar() or 0
> ```
> Verifica che `func` sia già importato in cima al file; se non lo è, aggiungilo.
>
> **4. `dashboard_retention` e `dashboard_seasons`:** In `dashboard_retention`, sostituisci il full-load di `Abbonamento` con `db.query(Abbonamento.stagione, func.count(Abbonamento.id)).filter(Abbonamento.club_id == club_id).group_by(Abbonamento.stagione).all()`. In `dashboard_seasons`, sostituisci il full-load con `db.query(Abbonamento.stagione.distinct()).filter(Abbonamento.club_id == club_id).order_by(Abbonamento.stagione.desc()).all()` e adatta l'estrazione del valore (da tupla a stringa).
>
> Per ogni modifica verifica che il formato JSON restituito sia identico a prima. Verifica che i 29 test passino.

---

### PROMPT D — Cache per `compute_behavioral` e fix bypass intelligence [🟡 Media]

> Leggi per intero `backend/services/behavioral.py`, `backend/services/cache.py`, `backend/services/insights.py`, `backend/routers/intelligence.py`.
>
> **Parte 1 — Cache per `compute_behavioral`:**
> La funzione `compute_behavioral` non usa la cache ma viene chiamata da due endpoint distinti nella stessa sessione utente. Aggiungi caching con lo stesso pattern già usato in `compute_fan_segments`: all'inizio della funzione controlla `cache_get(f"behavioral_{club_id}")`, se presente restituiscilo; altrimenti calcola, salva con `cache_set(f"behavioral_{club_id}", result)` e restituisci. Aggiungi la chiave `f"behavioral_{club_id}"` alla funzione `invalidate(club_id)` in `cache.py` se esiste tale funzione (o dove vengono invalidate le altre chiavi).
>
> **Parte 2 — Fix bypass cache intelligence in `insights.py`:**
> La funzione `_apply_intelligence_penalties` in `services/insights.py` chiama `compute_club_intelligence` direttamente, bypassando la cache gestita in `routers/intelligence.py` tramite `_get_or_compute`. Studia come `_get_or_compute` gestisce la cache (chiave, TTL) e replica lo stesso check cache/compute in `_apply_intelligence_penalties`: prima cerca in cache, se non trovato chiama `compute_club_intelligence` e salva in cache con la stessa chiave usata dal router.
>
> Non modificare la logica di calcolo di nessuna delle due funzioni. Verifica che i 29 test passino.

---

### PROMPT E — Collega `Calendario.jsx` al router e alla Sidebar [🟡 Media] **[parallelo con D]**

> Leggi per intero `frontend/src/App.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/pages/Calendario.jsx`, `frontend/src/pages/Insights.jsx`.
>
> Prima di collegare `Calendario.jsx`, capisci esattamente cosa fa e come si sovrappone con `Insights.jsx`: cerca in `Insights.jsx` se esiste già una sezione dedicata alle partite (upload, visualizzazione, gestione). L'obiettivo è capire se `Calendario.jsx` duplica funzionalità già presenti o le arricchisce con qualcosa di diverso.
>
> Se `Calendario.jsx` aggiunge funzionalità che `Insights.jsx` non ha, collegala come pagina separata: aggiungi `import Calendario from './pages/Calendario'` e `<Route path="/calendario" element={<Calendario />} />` in `App.jsx`; aggiungi la voce `{ to: "/calendario", label: "Calendario", icon: Calendar }` nell'array `links` di `Sidebar.jsx` (icona `Calendar` di lucide-react).
>
> Se invece `Calendario.jsx` duplica completamente quello che c'è in `Insights.jsx`, segnalalo nel tuo report finale senza collegarlo — la decisione di eliminarlo spetta al team.
>
> Non modificare il contenuto di `Calendario.jsx`. Verifica che i 29 test passino.

---

### PROMPT F — Pulizia codice morto (import, funzioni, colonne inutilizzate) [🟢 Bassa] **[parallelo con E]**

> Esegui tutte le seguenti rimozioni in un'unica sessione. Per ognuna, verifica prima con una ricerca che l'elemento non sia usato altrove, poi rimuovi.
>
> **A-1 — `main.py`:** Rimuovi `Response` dall'import `from fastapi.responses import JSONResponse, Response`. Verifica che `Response` non compaia nel corpo del file.
>
> **A-2 — `config.py`:** Rimuovi la riga `import secrets as _secrets`. Verifica che `_secrets` non compaia nel corpo del file.
>
> **A-3 — `tenant.py`:** La funzione `require_role(allowed_roles)` è definita ma non importata da nessun router. Cerca `require_role` in tutti i file `routers/*.py` e `main.py`. Se confermato che non è usata, rimuovila da `tenant.py`. **Attenzione: `tenant.py` è un file protetto — rimuovi SOLO `require_role` e nient'altro. Non toccare `get_current_club`, `get_db`, né nessun'altra funzione o import nel file.**
>
> **A-4 — `models.py`:** La colonna `stripe_customer_id = Column(String(100), nullable=True)` nel modello `Club` non viene letta né scritta da nessun file Python. Cercala in tutti i file `routers/*.py`, `services/*.py` e `main.py`. Se confermato che non è usata, rimuovila da `models.py`. Non creare nessuna migration SQL — la colonna resterà nel database su Neon finché non verrà rimossa manualmente.
>
> **A-5 — `client.js`:** La funzione `fetchCrossSource` è esportata ma non importata da nessun `.jsx`. Cercala in tutti i file in `frontend/src/`. Se confermato, rimuovila da `client.js`.
>
> **A-7 — `analytics.py` e `csv_import.py`:** La funzione privata `_norm_email` è definita identicamente in entrambi i file. Crea `backend/services/utils.py` con solo quella funzione esportata. Poi sostituisci la definizione locale in `analytics.py` con `from services.utils import _norm_email` e fai lo stesso in `csv_import.py`. Verifica che non ci siano altri file che importano `_norm_email` direttamente.
>
> Verifica che i 29 test passino dopo tutte le modifiche.

---

### Ordine di esecuzione e parallelizzazione

| Prompt | Priorità | Può girare in parallelo con |
|--------|----------|-----------------------------|
| A — Renewal bulk loader | 🔴 | B, C, E, F |
| B — Fix predizione doppio load | 🔴 | A, C, E, F |
| C — Fix SQL analytics | 🟡 | A, B, E, F |
| D — Cache behavioral + intelligence | 🟡 | E, F (non con C) |
| E — Collega Calendario | 🟡 | A, B, C, D, F |
| F — Pulizia codice morto | 🟢 | A, B, E (non con C o D) |

**Suggerimento:** Manda A + B + E in tre sessioni parallele adesso. Poi C da solo. Poi D. Poi F per ultimo.

---

## PROMPT — Security audit (solo analisi, zero modifiche)

> **Questo prompt non deve produrre nessuna modifica al codice.** L'output è esclusivamente un file di audit markdown chiamato `SECURITY_AUDIT.md` nella root del progetto.

> Esegui un'analisi di sicurezza sistematica del codebase FanIQ. L'obiettivo è identificare vulnerabilità reali o potenziali, superfici di attacco non presidiate e configurazioni rischiose. Non speculare: ogni finding deve essere ancorato a codice specifico con numero di riga.
>
> **Cosa leggere — in questo ordine:**
> `backend/main.py`, `backend/config.py`, `backend/tenant.py`, `backend/database.py`, `backend/models.py`, `backend/services/auth.py`, `backend/routers/auth.py`, `backend/routers/upload.py`, `backend/services/csv_import.py`, tutti gli altri file in `backend/routers/`, `backend/services/chat.py`, `frontend/src/api/client.js`, `frontend/src/App.jsx`.
>
> **Aree da analizzare:**
>
> **1. Autenticazione e JWT**
> - Il JWT secret è letto da env (`FANIQ_JWT_SECRET`) o ha un fallback hardcoded? Se ha un fallback, qual è?
> - L'algoritmo JWT usato (HS256/RS256) è appropriato?
> - I token hanno scadenza (`exp`)? Qual è il TTL?
> - Esiste un meccanismo di revoca dei token (blacklist, refresh token)? Se no, cosa succede dopo il logout?
> - Le password sono hashate con bcrypt? Quanti round?
>
> **2. Autorizzazione e isolamento multi-tenant**
> - Ogni endpoint autenticato usa `get_current_club` come dipendenza? Ci sono endpoint che accettano un `club_id` esplicito dal client invece di leggerlo dal token?
> - RLS è attivo su PostgreSQL. Cosa succede su SQLite (dev)? Le query SQLite usano `filter(club_id == ...)` in modo consistente?
> - Esiste un endpoint che potrebbe permettere a un club di leggere o modificare dati di un altro club, anche indirettamente (es. passando un `fan_id` di un altro club)?
>
> **3. Validazione input e injection**
> - I body delle richieste POST/PATCH usano modelli Pydantic con validazione? Ci sono endpoint che accettano dati raw senza schema?
> - I file CSV in upload vengono sanitizzati? Ci sono controlli su dimensione massima, tipo MIME, contenuto delle celle (formula injection `=CMD()`)? Chi può caricare file?
> - Le query SQLAlchemy usano sempre l'ORM o ci sono query raw con f-string che potrebbero essere vulnerabili a SQL injection?
>
> **4. HTTP security headers e CORS**
> - Quali header di sicurezza sono impostati (HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy)? Ci sono middleware FastAPI che li aggiungono?
> - La configurazione CORS in `main.py`: quali origini sono permesse? È usato `allow_origins=["*"]`? Quali metodi e header sono consentiti?
>
> **5. Rate limiting e protezione endpoint**
> - Il rate limiting è attivo solo su `/auth/register` e `/auth/login` o copre altri endpoint? Gli endpoint pesanti (intelligence bulk, upload CSV, export) sono protetti?
> - Ci sono endpoint che eseguono operazioni costose (calcolo intelligence, export di tutti i fan) senza nessuna forma di throttling o autenticazione aggiuntiva?
>
> **6. Gestione errori e information disclosure**
> - I messaggi di errore espongono stack trace, nomi di tabelle, query SQL o altri dettagli tecnici che potrebbero aiutare un attaccante?
> - I log di FastAPI o Python loggano dati personali (fan_id, email, nomi)?
>
> **7. Dipendenze**
> - Leggi `backend/requirements.txt` (o `pyproject.toml`) e `frontend/package.json`. Segnala dipendenze con versioni notoriamente vulnerabili se le conosci, oppure indica quali dovrebbero essere verificate con `pip audit` / `npm audit`.
>
> **8. Secrets e configurazione**
> - Ci sono API key, secret o credenziali hardcoded in qualsiasi file Python o JS (non nelle variabili d'ambiente)?
> - Il file `.gitignore` esclude correttamente i file `.env`?
>
> **Output richiesto — `SECURITY_AUDIT.md`:**
> ```
> # FanIQ — Security Audit
> > Data: [oggi]
> > Scope: analisi statica del codice — non include penetration test dinamico
>
> ## Punti di forza (cosa è già fatto bene)
>
> ## CATEGORIA CRITICA — Vulnerabilità da correggere prima del go-live
> Per ogni finding: descrizione, file + riga, rischio concreto (cosa può fare un attaccante), soluzione consigliata
>
> ## CATEGORIA ALTA — Da correggere prima del primo cliente pagante
>
> ## CATEGORIA MEDIA — Miglioramenti consigliati
>
> ## CATEGORIA BASSA — Nice to have
>
> ## Riepilogo
> Tabella: finding | categoria | file | soluzione
> ```
>
> Se un'area non ha problemi, scrivi "Nessun problema rilevato" — non omettere la sezione. Sii conservativo: se non sei sicuro che qualcosa sia vulnerabile, mettila in Categoria Bassa con una nota di incertezza piuttosto che ignorarla.

---

## Security fix — Prompt da eseguire in ordine

> Eseguire nell'ordine indicato. I prompt marcati **[parallelo]** possono girare in sessioni separate in contemporanea.

---

### SEC-1 — Fix critici: formula injection CSV + password demo hardcoded [🔴 Critica]

> Leggi per intero `backend/services/csv_import.py` e `backend/main.py`.
>
> **Parte 1 — Formula injection (C-1):**
> In `csv_import.py`, prima di ogni `db.add(...)` i valori stringa delle celle vengono salvati senza sanitizzazione. Un CSV con una cella come `=HYPERLINK("https://evil.com","clicca")` come nome fan viene salvato nel DB e poi riesportato nel CSV export, dove Excel/Google Sheets lo eseguirebbe come formula.
>
> Aggiungi questa funzione in cima a `csv_import.py` (dopo gli import):
> ```python
> _FORMULA_PREFIXES = ('=', '+', '-', '@', '\t', '\r')
> def _sanitize_cell(value: str | None) -> str | None:
>     if value and isinstance(value, str) and value[0] in _FORMULA_PREFIXES:
>         return "'" + value
>     return value
> ```
> Applica `_sanitize_cell()` su tutti i campi stringa di testo libero prima di assegnarli all'oggetto ORM: campi come `nome`, `cognome`, `avversario`, `prodotto`, `settore`, `descrizione`. Non applicarla su campi con formato controllato (date, numeri, enum come `stato` o `tipo`).
>
> **Parte 2 — Password demo hardcoded (A-4):**
> In `main.py`, la funzione `_seed_default_club()` crea un club con password `"demo1234"` hardcoded. Sostituiscila con una password casuale:
> ```python
> import secrets
> demo_password = secrets.token_urlsafe(16)
> demo = Club(..., password_hash=hash_password(demo_password))
> logger.warning("SEED: club demo creato con password temporanea: %s — CAMBIALA SUBITO", demo_password)
> ```
> Importa `secrets` solo se non è già presente. Non modificare nessun'altra parte di `_seed_default_club`.
>
> Verifica che i 29 test passino.

---

### SEC-2 — Rate limiting su chat, upload e intelligence refresh [🔴 Alta] **[parallelo con SEC-1]**

> Leggi per intero `backend/main.py` — in particolare la sezione `_RATE_LIMITS` e il middleware di rate limiting.
>
> Aggiungi i seguenti tre endpoint al dizionario `_RATE_LIMITS` (o struttura equivalente usata dal middleware):
> - `"/chat/"` → 20 richieste al minuto (protezione costi OpenAI)
> - `"/upload/"` → 5 richieste al minuto (upload CSV pesanti)
> - `"/api/intelligence/club/refresh"` → 3 richieste al minuto (bulk compute)
>
> Studia come sono definiti gli entry esistenti (`/auth/register`, `/auth/login`) e replica esattamente lo stesso pattern — non cambiare la logica del middleware, solo aggiungi le nuove chiavi.
>
> Verifica che i 29 test passino.

---

### SEC-3 — Fix errori esposti al client + URL nei log [🔴 Alta] **[parallelo con SEC-1 e SEC-2]**

> Leggi per intero `backend/services/chat.py`, `backend/routers/partite.py`, `backend/main.py`.
>
> **Parte 1 — Eccezione OpenAI esposta (A-3):**
> In `services/chat.py`, il blocco `except` che gestisce gli errori OpenAI restituisce `f"Errore AI: {str(e)}"` al client. Sostituisci con un messaggio generico: `"Si è verificato un errore. Riprova tra qualche momento."`. Aggiungi `logger.error("Errore OpenAI: %s", e)` server-side (il logger è già importato nel file, verificalo).
>
> **Parte 2 — Eccezione CSV in partite esposta (M-2):**
> In `routers/partite.py`, il blocco che costruisce `errors` con `f"Riga {i}: {e}"` può contenere messaggi tecnici di eccezione. Cambia il catch in modo da catturare `ValueError` e `KeyError` con messaggi controllati, e per ogni altra eccezione aggiungere un messaggio generico `f"Riga {i}: errore di formato imprevisto"` loggando l'eccezione completa server-side.
>
> **Parte 3 — URL con query params nei log (M-7):**
> In `main.py`, il generic error handler logga `request.url` che può contenere query string con dati personali. Sostituisci `request.url` con `request.url.path` in tutti i punti dell'error handler.
>
> Verifica che i 29 test passino.

---

### SEC-4 — Mitigazione revoca token: riduzione TTL [🔴 Critica → mitigazione] **[parallelo con SEC-1, 2, 3]**

> Leggi per intero `backend/config.py` e `backend/services/auth.py`.
>
> Il logout in FanIQ è solo client-side (rimozione del token da localStorage). Il token rimane valido lato server fino alla scadenza. Il TTL attuale è 7 giorni (`FANIQ_JWT_EXPIRE_MINUTES = 10080`).
>
> Come mitigazione immediata (soluzione completa con blacklist verrà implementata successivamente), riduci il TTL di default da 10080 a 480 minuti (8 ore) in `config.py`. Questo limita la finestra di esposizione in caso di token rubato.
>
> Cambia solo il valore di default: se `FANIQ_JWT_EXPIRE_MINUTES` è impostato come variabile d'ambiente, quel valore ha precedenza — non toccarlo. Non modificare nessun'altra logica di autenticazione.
>
> Verifica che i 29 test passino.

---

### SEC-5 — Hardening HTTP: CSP, CORS, Swagger UI in prod [🟡 Media]

> Leggi per intero `backend/main.py`.
>
> Applica le tre modifiche seguenti:
>
> **1. Content-Security-Policy (M-3):**
> Nel middleware `security_headers` che aggiunge i response header, aggiungi:
> ```python
> "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"
> ```
> `unsafe-inline` è necessario per il modo in cui Vite/React serve gli stili in produzione; non rimuoverlo.
>
> **2. CORS più restrittivo (M-6):**
> Nella configurazione `CORSMiddleware`, sostituisci:
> ```python
> allow_methods=["*"], allow_headers=["*"]
> ```
> con:
> ```python
> allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
> allow_headers=["Authorization", "Content-Type", "Accept"],
> ```
>
> **3. Disabilita Swagger UI in produzione (B-5):**
> L'inizializzazione di `FastAPI(...)` deve disabilitare docs e redoc quando l'app gira in produzione. Aggiungi in `config.py` una variabile `FANIQ_ENV: str = os.environ.get("FANIQ_ENV", "development")`. Poi in `main.py`, inizializza FastAPI condizionalmente:
> ```python
> from config import FANIQ_ENV
> app = FastAPI(
>     docs_url="/docs" if FANIQ_ENV != "production" else None,
>     redoc_url="/redoc" if FANIQ_ENV != "production" else None,
> )
> ```
> Su Render, imposta la variabile d'ambiente `FANIQ_ENV=production`.
>
> Verifica che i 29 test passino.

---

### SEC-6 — Fix minori: Content-Disposition, pandas, JWT payload, export URL [🟢 Bassa]

> Leggi per intero `backend/routers/export.py`, `backend/requirements.txt`, `backend/services/auth.py`.
>
> **1. Header injection Content-Disposition (M-1):**
> In `export.py`, il parametro `segment` viene usato direttamente nel `filename`. Aggiungi `import re` in cima al file e sanifica il valore prima di usarlo nel filename:
> ```python
> safe_segment = re.sub(r'[^a-zA-Z0-9_\-]', '_', segment) if segment else 'tutti'
> filename = f"faniq_{safe_segment}{suffix}.csv"
> ```
>
> **2. Rimuovi `pandas` da `requirements.txt` (B-1):**
> Cerca `pandas` in tutti i file Python del progetto con una ricerca. Se confermato che non è importato da nessuna parte, rimuovi la riga `pandas>=2.0.0` da `requirements.txt`.
>
> **3. Rimuovi dati non necessari dal JWT payload (B-6):**
> In `services/auth.py`, il payload JWT include `slug` e `nome` del club. Questi non servono lato server (vengono letti dal DB tramite `club_id`). Rimuovili dal dizionario `data` passato a `create_access_token`. Prima di rimuoverli, verifica che nessun router o service legga `slug` o `nome` direttamente dal token decodificato (cerca `token_data.get("slug")` e `token_data.get("nome")` in tutto il backend).
>
> Verifica che i 29 test passino.

---

### Ordine di esecuzione e parallelizzazione

| Prompt | Priorità | Può girare in parallelo con |
|--------|----------|-----------------------------|
| SEC-1 — Formula injection + password demo | 🔴 | SEC-2, SEC-3, SEC-4 |
| SEC-2 — Rate limiting chat/upload/intelligence | 🔴 | SEC-1, SEC-3, SEC-4 |
| SEC-3 — Fix errori esposti al client | 🔴 | SEC-1, SEC-2, SEC-4 |
| SEC-4 — Riduzione TTL JWT | 🔴 | SEC-1, SEC-2, SEC-3 |
| SEC-5 — CSP, CORS, Swagger | 🟡 | SEC-6 (non con SEC-2 o SEC-4) |
| SEC-6 — Fix minori | 🟢 | SEC-5 |

**Suggerimento:** Manda SEC-1 + SEC-2 + SEC-3 + SEC-4 tutti in parallelo adesso. Poi SEC-5. Poi SEC-6.

---

## PROMPT — Pulsante "Reset dati" nella pagina Upload

> Leggi per intero `backend/routers/upload.py`, `backend/models.py`, `frontend/src/pages/Upload.jsx`, `frontend/src/api/client.js`.
>
> **Backend — nuovo endpoint `DELETE /upload/reset-all`:**
>
> Aggiungi in `routers/upload.py` un endpoint `DELETE /upload/reset-all` che:
> - Usa `get_current_club` come dipendenza (JWT + RLS)
> - Cancella in sequenza, nell'ordine corretto per rispettare le foreign key, tutti i record del club: `ShopOrder`, `Biglietto`, `Abbonamento`, `Partita`, `UploadHistory`, `Fan`
> - Usa `db.query(Model).filter(Model.club_id == club.id).delete(synchronize_session=False)` per ogni tabella
> - Invalida la cache dopo la cancellazione: chiama `cache.invalidate(club.id)` se la funzione esiste in `services/cache.py`, altrimenti chiama le singole invalidazioni già usate negli endpoint di upload
> - Fa `db.commit()` una volta sola alla fine, dopo tutte le delete
> - Restituisce `{"deleted": True, "message": "Tutti i dati del club sono stati eliminati"}`
> - In caso di errore fa `db.rollback()` e restituisce 500
>
> **Frontend — funzione API e pulsante:**
>
> In `client.js`, aggiungi:
> ```js
> export const resetAllData = () => api.delete('/upload/reset-all').then(r => r.data)
> ```
>
> In `Upload.jsx`, aggiungi un pulsante "Reset dati" con queste caratteristiche:
> - Posizionato in fondo alla pagina, separato visivamente dal resto (es. sezione con bordo rosso o sfondo rosso tenue)
> - Colore rosso, label "Reset dati" con icona `Trash2` di lucide-react
> - Al click apre una finestra di conferma `window.confirm("Sei sicuro? Questa azione elimina TUTTI i fan, abbonamenti, biglietti, shop e partite del club. Non è reversibile.")` — solo se l'utente conferma, chiama `resetAllData()`
> - Durante la chiamata mostra un indicatore di caricamento e disabilita il pulsante
> - Al successo: mostra un messaggio verde "Dati eliminati con successo" e ricarica la pagina dopo 1.5 secondi (`window.location.reload()`)
> - In caso di errore: mostra messaggio rosso "Errore durante il reset. Riprova."
> - Usa solo classi Tailwind e componenti già presenti nella pagina
>
> Verifica che i 29 test passino.

---

## PROMPT — Upload CSV asincrono (fix timeout Render)

> **Contesto del problema:** L'endpoint `POST /upload/{type}` elabora il CSV in modo sincrono — il backend legge il file, importa tutte le righe nel DB, ricalcola analytics e intelligence, e solo alla fine risponde al client. Con file di centinaia di KB e migliaia di righe, questa elaborazione supera i 30 secondi che Render concede prima di chiudere forzatamente la connessione HTTP. Il risultato è che il frontend riceve un errore di connessione anche se il backend sta ancora lavorando correttamente. La soluzione è lo stesso pattern già usato da `POST /api/intelligence/club/refresh`: il server accetta il file, risponde subito `202 Accepted` con un `job_id`, e processa in background con `BackgroundTasks` di FastAPI.
>
> **Leggi per intero questi file prima di toccare qualsiasi cosa:**
> `backend/routers/upload.py`, `backend/routers/intelligence.py`, `backend/services/csv_import.py`, `backend/services/cache.py`, `frontend/src/pages/Upload.jsx`, `frontend/src/api/client.js`.
>
> Studia attentamente come `routers/intelligence.py` implementa il pattern job asincrono con `BackgroundTasks`: come salva lo stato del job, come lo espone tramite un endpoint di status, e come il frontend fa polling per sapere quando è finito. Replica esattamente lo stesso pattern per l'upload.
>
> ---
>
> **Step 1 — Backend: rendi `POST /upload/{type}` asincrono**
>
> In `routers/upload.py`:
>
> - Aggiungi `from fastapi import BackgroundTasks` agli import se non presente.
> - Aggiungi un dizionario in-memory per lo stato dei job (stesso pattern di intelligence): `_upload_jobs: dict[str, dict] = {}` con stati `"queued"`, `"running"`, `"done"`, `"error"`.
> - Modifica `POST /upload/{type}` per:
>   1. Leggere e validare il file (dimensione, estensione) come ora — questo avviene in sincrono prima di rispondere
>   2. Generare un `job_id = str(uuid.uuid4())` — aggiungi `import uuid` se non presente
>   3. Registrare il job come `"queued"` in `_upload_jobs`
>   4. Aggiungere la funzione di import come background task: `background_tasks.add_task(_run_upload, job_id, upload_type, contents, club_id, db)`
>   5. Rispondere immediatamente con `{"job_id": job_id, "status": "queued"}` e HTTP 202
> - Crea la funzione `_run_upload(job_id, upload_type, contents, club_id, db)` che:
>   1. Imposta `_upload_jobs[job_id]["status"] = "running"`
>   2. Esegue il codice di import CSV che era inline nell'endpoint (spostalo qui senza modificare la logica)
>   3. Al termine imposta `"done"` con i campi `imported`, `errors`, `warnings` già presenti nella risposta originale
>   4. In caso di eccezione imposta `"error"` con il messaggio loggato server-side (non esposto al client)
>   5. **Importante:** `BackgroundTasks` gira dopo che la response è stata inviata ma nella stessa sessione DB — verifica che la `db` session sia ancora utilizzabile o crea una nuova sessione con `SessionLocal()` dentro `_run_upload` se quella passata viene chiusa prima.
> - Aggiungi un endpoint `GET /upload/status/{job_id}` che restituisce `_upload_jobs.get(job_id)` o 404 se non trovato.
>
> ---
>
> **Step 2 — Frontend: polling dello stato in `Upload.jsx`**
>
> Studia come il frontend già gestisce il polling per l'intelligence refresh (cerca in `Upload.jsx` o altrove se esiste già un pattern di polling) prima di scrivere il nuovo codice.
>
> In `client.js`, aggiungi:
> ```js
> export const getUploadStatus = (jobId) => api.get(`/upload/status/${jobId}`).then(r => r.data)
> ```
>
> In `Upload.jsx`, modifica la funzione che gestisce l'upload per:
> 1. Dopo aver ricevuto `{ job_id, status: "queued" }`, avviare un polling ogni 2 secondi su `getUploadStatus(job_id)`
> 2. Mostrare uno stato di avanzamento durante il polling: "Caricamento in corso..." con uno spinner — niente percentuali
> 3. Quando lo status diventa `"done"`: fermare il polling, mostrare il messaggio di successo con `imported` e `errors` come già faceva prima, aggiornare lo storico upload
> 4. Quando lo status diventa `"error"`: fermare il polling, mostrare messaggio di errore generico "Errore durante l'importazione. Riprova."
> 5. Timeout di sicurezza: se dopo 5 minuti il job non è ancora terminato, fermare il polling e mostrare "L'operazione sta richiedendo più tempo del previsto. Controlla lo storico tra qualche minuto."
> 6. Il pulsante di upload deve essere disabilitato durante il polling per evitare doppi invii
>
> ---
>
> **Vincoli obbligatori:**
> - Non modificare la logica di import CSV in `services/csv_import.py` — spostala solo, non cambiarla
> - Non modificare `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`
> - Usa solo componenti e classi Tailwind già presenti in `Upload.jsx`
> - Il formato finale dei dati di risposta (`imported`, `errors`, `warnings`) deve restare identico — cambia solo il momento in cui arriva (via polling invece che inline)
> - Verifica che i 29 test passino — se alcuni test testano la response sincrona dell'upload, aggiornali per aspettarsi `202` con `job_id`

---

## PROMPT — Fix RLS nel background task upload + fix 422 intelligence

> **Contesto — due bug da risolvere in questa sessione:**
>
> **Bug 1 — RLS non attiva nel background task (critico):**
> L'upload CSV asincrono introdotto nel commit precedente crea una nuova sessione DB con `SessionLocal()` dentro `_run_upload`. Il problema è che questa sessione non esegue `SET LOCAL app.current_club_id = :club_id` prima di fare le query. Su PostgreSQL con RLS attiva, senza quella riga tutte le scritture vengono bloccate silenziosamente: il task termina senza errori, ma nessun dato viene salvato nel database. Per questo lo storico upload è vuoto e la dashboard non mostra dati dopo il caricamento.
>
> **Bug 2 — Limite `per_page` troppo basso sull'endpoint intelligence (422):**
> `GET /api/intelligence/club?per_page=500` restituisce `422 Unprocessable Entity`. Il frontend richiede 500 fan ma il validatore Pydantic in `routers/intelligence.py` ha un limite `le=200`. Con club che hanno più di 200 fan questo endpoint è inutilizzabile dalla pagina Report.
>
> ---
>
> **Leggi per intero prima di modificare:**
> `backend/routers/upload.py`, `backend/tenant.py`, `backend/database.py`, `backend/routers/intelligence.py`.
>
> ---
>
> **Fix 1 — Attivare RLS nella sessione del background task:**
>
> In `tenant.py`, studia esattamente come `get_current_club` attiva la RLS — cerca la riga che esegue `SET LOCAL app.current_club_id` e capisce in quale punto della transazione viene chiamata.
>
> In `routers/upload.py`, nella funzione `_run_upload`, dopo aver aperto la sessione con `db = SessionLocal()`, aggiungi l'attivazione manuale della RLS prima di qualsiasi query:
> ```python
> from sqlalchemy import text
> db.execute(text("SET LOCAL app.current_club_id = :cid"), {"cid": str(club_id)})
> ```
> Questa riga deve essere eseguita **all'interno della stessa transazione** delle query successive — non fare `db.commit()` tra questa riga e le query di import. Verifica che il blocco `try/except` sia strutturato in modo che il `db.commit()` finale avvenga solo dopo che tutte le operazioni di import sono completate con successo.
>
> Se il database è SQLite (ambiente dev), `SET LOCAL` non è supportato — aggiungi una guardia condizionale usando `_IS_POSTGRES` già importato da `database.py`:
> ```python
> from database import _IS_POSTGRES
> if _IS_POSTGRES:
>     db.execute(text("SET LOCAL app.current_club_id = :cid"), {"cid": str(club_id)})
> ```
>
> **Fix 2 — Alzare il limite `per_page` sull'endpoint intelligence:**
>
> In `routers/intelligence.py`, cerca il parametro `per_page` nella firma dell'endpoint `GET /api/intelligence/club`. Il validatore Pydantic o il `Query(...)` ha un `le=200` che blocca valori superiori. Alzalo a `le=5000` — un club non avrà mai 5000 abbonati in questa fase, ma è un margine sicuro.
>
> Non modificare nessun'altra logica dell'endpoint.
>
> ---
>
> **Vincoli:**
> - Non toccare `tenant.py` oltre a leggere come funziona il SET LOCAL — non modificare `get_current_club` né nessun'altra funzione in quel file
> - Non modificare `services/csv_import.py`
> - Verifica che i 29 test passino

---

## PROMPT — Batch processing nell'Intelligence Engine (fix OOM Render)

> **Contesto del problema:** L'intelligence engine in `services/intelligence/engine.py` usa una funzione `_bulk_load` che carica in memoria tutti i fan del club + tutti i loro abbonamenti + tutti i biglietti + tutti gli shop orders in una sola volta. Su Render Free tier (512MB RAM), con dataset di 2.500+ fan questo supera il limite e il processo viene killato con OOM (Out of Memory), causando il crash del backend e il riavvio del servizio. Il fix è processare i fan a batch — es. 200 alla volta — in modo che il picco di RAM sia sempre quello di 200 fan, non dell'intero dataset.
>
> **Leggi per intero prima di modificare:**
> `backend/services/intelligence/engine.py`, `backend/services/intelligence/decay.py`, `backend/services/intelligence/journey.py`, `backend/services/intelligence/anomaly.py`, `backend/services/intelligence/ambassador.py`, `backend/services/intelligence/renewal.py`, `backend/fan_intelligence.py`, `backend/models.py`.
>
> Studia come `_bulk_load` costruisce i dizionari indicizzati per `fan_id` e come il loop principale li usa per calcolare `FanIntelligence` per ogni fan. Capisci quali dati sono necessari per processare un singolo fan prima di progettare il batch loader.
>
> ---
>
> **Modifica da applicare — batch processing in `compute_club_intelligence`:**
>
> Invece di caricare tutti i dati del club in memoria con `_bulk_load`, processa i fan a batch di dimensione configurabile (default: 200, costante `INTELLIGENCE_BATCH_SIZE = 200` da aggiungere in cima al file).
>
> Il nuovo flusso deve essere:
> 1. Conta il totale fan del club con una query `func.count()` — non caricarli tutti
> 2. Per ogni batch (offset 0, 200, 400, ...):
>    a. Carica solo gli `id` dei fan del batch con `db.query(Fan.id).filter(...).offset(offset).limit(INTELLIGENCE_BATCH_SIZE).all()`
>    b. Estrai la lista di `fan_ids` del batch
>    c. Carica solo i dati necessari per quei fan_ids: `Abbonamento`, `Biglietto`, `ShopOrder` filtrati con `Model.fan_id.in_(fan_ids)` + i dati `Fan` completi con `Fan.id.in_(fan_ids)`
>    d. Carica le `Partita` del club una volta sola fuori dal loop (sono dati condivisi, non per fan)
>    e. Calcola `FanIntelligence` per ogni fan del batch esattamente come fa ora il loop esistente
>    f. Aggiungi i risultati alla lista finale
>    g. **Chiudi esplicitamente gli oggetti ORM del batch** con `db.expunge_all()` dopo aver estratto i dati necessari, oppure usa query con `yield_per()` — l'obiettivo è che alla fine del batch la RAM venga liberata
> 3. Restituisci la lista completa di `FanIntelligence` come prima
>
> Il formato del valore di ritorno di `compute_club_intelligence` deve essere **identico** a prima — stessa struttura, stessi campi. Solo il meccanismo interno cambia.
>
> **Attenzione alle `Partita`:** le partite sono condivise tra tutti i fan del club (non per fan_id). Caricale una volta sola prima del loop dei batch e riusale per ogni batch senza ricaricarle.
>
> **Attenzione alla sessione DB nel background task:** `compute_club_intelligence` viene chiamata sia dall'endpoint sincrono che dal background task di `routers/upload.py`. La sessione DB passata deve restare aperta per tutta la durata del processing a batch. Verifica che la gestione della sessione nel background task (`_run_upload`) non chiuda la sessione tra un batch e l'altro.
>
> **Vincoli:**
> - Non modificare le funzioni nei file `decay.py`, `journey.py`, `anomaly.py`, `ambassador.py`, `renewal.py` — solo `engine.py`
> - Non modificare `fan_intelligence.py` né i modelli ORM
> - Non modificare `routers/intelligence.py` — l'interfaccia pubblica dell'engine non cambia
> - Verifica che i 29 test passino

---

## PROMPT — Fix rate limiter upload (blocca solo POST, non il polling)

> **Contesto del problema:** Il rate limiter in `main.py` è configurato con la chiave `"/upload/"` che viene confrontata come prefisso del path della richiesta. Questo significa che sia `POST /upload/abbonati` (il caricamento vero) che `GET /upload/status/{job_id}` (il polling ogni 2 secondi che il frontend usa per sapere se il job è finito) vengono contati nello stesso bucket. Il limite è 5 richieste al minuto: con il polling ogni 2 secondi, il bucket si esaurisce in 10 secondi e blocca tutti i caricamenti successivi con un 429 Too Many Requests. L'utente non riesce a caricare più di un file per minuto.
>
> **Leggi per intero prima di modificare:** `backend/main.py` — studia interamente la logica del middleware di rate limiting: come confronta il path della richiesta con `_RATE_LIMITS`, se controlla anche il metodo HTTP (`request.method`), e dove avviene il controllo.
>
> **Fix da applicare:**
>
> Il rate limit su `/upload/` deve scattare solo per le richieste `POST`, non per le `GET`. Modifica il middleware in modo che, quando controlla se una richiesta ricade in un bucket di rate limiting, consideri anche il metodo HTTP oltre al path. In pratica: una richiesta `GET /upload/status/abc123` non deve essere contata nel bucket `/upload/`, mentre una `POST /upload/abbonati` sì.
>
> Il modo più pulito per farlo dipende da come è strutturato il middleware — studia il codice e scegli l'approccio meno invasivo tra questi due:
> - **Opzione A:** Cambia la chiave in `_RATE_LIMITS` da `"/upload/"` a `"POST:/upload/"` e aggiorna il middleware per costruire la chiave di lookup come `f"{request.method}:{request.url.path}"` (o con il prefisso).
> - **Opzione B:** Aggiungi una condizione nel middleware che salta il rate limiting per le richieste `GET` sui path che iniziano con `/upload/`.
>
> Scegli l'opzione più coerente con il codice esistente. Non cambiare i limiti numerici (req/min) di nessun endpoint. Non toccare il rate limiting di `/auth/register`, `/auth/login`, `/chat/` e `/api/intelligence/club/refresh` — quelli devono restare invariati.
>
> Verifica che i 29 test passino.
