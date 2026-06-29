# FanIQ — Codebase Audit #2
> Data: 2026-06-29

---

## CATEGORIA A — Codice inutilizzato

### A-1. `Response` importato ma non usato in `main.py`
- **File:** `backend/main.py`, riga 13
- **Dettaglio:** `from fastapi.responses import JSONResponse, Response` — `Response` non viene usato da nessuna parte nel file; solo `JSONResponse` è usato negli handler di eccezione.
- **Azione consigliata:** Rimuovere `Response` dall'import.

### A-2. `import secrets as _secrets` non usato in `config.py`
- **File:** `backend/config.py`, riga 36
- **Dettaglio:** Il modulo `secrets` viene importato come `_secrets` ma non viene mai chiamato. `JWT_SECRET_KEY` è letto direttamente da `os.environ.get()`. L'import è probabilmente un residuo di un'implementazione precedente che generava un segreto casuale come fallback.
- **Azione consigliata:** Rimuovere `import secrets as _secrets`.

### A-3. `require_role()` definita in `tenant.py` ma mai usata nei router
- **File:** `backend/tenant.py`, righe 51-72
- **Dettaglio:** La funzione `require_role(allowed_roles)` è implementata con documentazione completa ma nessun router la importa o la usa. Tutti gli endpoint usano solo `get_current_club` senza distinzione di ruolo.
- **Azione consigliata:** Rimuovere la funzione se non è previsto utilizzo a breve; oppure documentarla come "reserved for future use" nel backlog.

### A-4. `stripe_customer_id` nel modello `Club` mai usato
- **File:** `backend/models.py`, riga 27
- **Dettaglio:** La colonna `stripe_customer_id = Column(String(100), nullable=True)` esiste nel modello ORM ma non viene letta né scritta da nessun file Python del progetto (né router né service).
- **Azione consigliata:** Se il piano Stripe non è implementato, rimuovere la colonna dal modello e aggiungere una migration `ALTER TABLE clubs DROP COLUMN stripe_customer_id` su Neon.

### A-5. `fetchCrossSource` in `client.js` mai chiamato da nessun componente
- **File:** `frontend/src/api/client.js`, riga 41
- **Dettaglio:** La funzione `fetchCrossSource` (che chiama `GET /dashboard/cross-source`) è esportata ma non importata da nessun file `.jsx`. Il dato `cross.all_three` è usato internamente in `services/insights.py` tramite `dashboard_cross_source`, non tramite questa funzione frontend.
- **Azione consigliata:** Rimuovere `fetchCrossSource` da `client.js` oppure usarla in un componente (es. in `Dashboard.jsx` per mostrare il numero di "super fan").

### A-6. Pagina `Calendario.jsx` non collegata in `App.jsx`
- **File:** `frontend/src/pages/Calendario.jsx`
- **Dettaglio:** Il componente `Calendario` è un file completo e funzionante (308 righe, con fetch di partite, behavioral, upload CSV), ma non è importato né registrato come route in `App.jsx` e non appare nei link di `Sidebar.jsx`. È importato solo in `Upload.jsx` come stringa di testo nel campo `partite: "Calendario"` (riga 291 di Upload.jsx) che è un'etichetta UI, non un import React.
- **Azione consigliata:** Aggiungere la route `/calendario` in `App.jsx` e un link in `Sidebar.jsx`; oppure eliminare il file se la funzionalità è stata spostata altrove (upload partite è già in `Upload.jsx`).

### A-7. `_norm_email` duplicata in `analytics.py` e `csv_import.py`
- **File:** `backend/services/analytics.py`, riga 14 e `backend/services/csv_import.py`, riga 14
- **Dettaglio:** La stessa funzione privata `_norm_email(email)` (con identica implementazione) è definita in entrambi i file. Non è un import condiviso ma una copia.
- **Azione consigliata:** Spostare in un modulo `services/utils.py` e importarla da entrambi i file.

### A-8. `insights.get("insights", [])` in `chat.py` restituisce sempre lista vuota
- **File:** `backend/services/chat.py`, riga 24
- **Dettaglio:** `_build_context` chiama `generate_insights(db, club_id)` e poi accede a `insights.get("insights", [])`. La funzione `generate_insights` (in `services/insights.py`) non restituisce mai una chiave `"insights"` — le sue chiavi sono `kpi`, `revenue_watch`, `opportunita`, `qualita`, `segment_counts`, `azioni_settimana`, `summary`. Il risultato è che `insight_lines` è sempre `[]` e il contesto AI non include mai gli insight commerciali.
- **Impatto:** La chat AI riceve un contesto incompleto (mancano revenue a rischio, opportunità, business score). L'AI risponde solo con dati di segmentazione di base.
- **Azione consigliata:** Sostituire `insights.get("insights", [])[:5]` con logica che estrae dati reali, ad esempio dalle `azioni_settimana` o dalle `opportunita`:
  ```python
  insight_lines = [f"- {a['azione']}: {a['valore']}" for a in insights.get("azioni_settimana", [])[:5]]
  ```

---

## CATEGORIA B — Anti-pattern di performance

### B-1. `calculate_renewal_scores_bulk` esegue N×5 query per N fan
- **File:** `backend/services/renewal.py`, righe 145-147
- **Descrizione:** `calculate_renewal_scores_bulk` chiama `calculate_renewal_probability` per ogni fan in un loop. Ogni chiamata esegue 5 query DB separate (Fan, Partita, Biglietto, Abbonamento, ShopOrder). Per un club con 500 fan = 2500 query. Questo endpoint viene chiamato dalla pagina Report con `per_page: 5000`.
- **Impatto:** ALTO — timeout frequenti su dataset > 200 fan. Il frontend imposta un timeout di 15s e questo è uno degli endpoint più lenti.
- **Soluzione consigliata:** Implementare un bulk loader simile a quello in `services/intelligence/engine.py`: caricare tutti i dati del club in memoria (un'unica query per tabella con `filter(club_id == ...)`) e poi calcolare i punteggi in-memory. Le 5 query diventano 5 query totali invece di N×5.

### B-2. `dashboard_citta` carica tutti gli oggetti `Fan` per contare solo la città
- **File:** `backend/services/analytics.py`, righe 191-194
- **Descrizione:** `dashboard_citta` esegue `db.query(Fan).filter(...).all()` e poi usa Python `Counter` per aggregare le città. Carica tutti i campi di ogni Fan (nome, cognome, email, ecc.) quando basterebbe leggere solo la colonna `citta`.
- **Impatto:** MEDIO — query più pesante del necessario; su 5000 fan trasferisce decine di KB non necessari dal DB.
- **Soluzione consigliata:** Usare `db.query(Fan.citta).filter(Fan.club_id == club_id).all()` oppure `func.count()` con `group_by(Fan.citta)` direttamente in SQL.

### B-3. `dashboard_presenze` carica tutti i `Biglietto` per aggregare per data
- **File:** `backend/services/analytics.py`, righe 197-204
- **Descrizione:** Carica tutti i biglietti del club in memoria e usa Python `Counter` per fare il group-by per data. La stessa operazione è fattibile con una singola query SQL `GROUP BY data_partita`.
- **Impatto:** MEDIO — su dataset di 10.000 biglietti, trasferisce tutti i record quando basta un aggregato.
- **Soluzione consigliata:**
  ```python
  rows = db.query(Biglietto.data_partita, func.count(Biglietto.id))\
    .filter(Biglietto.club_id == club_id, Biglietto.data_partita.isnot(None))\
    .group_by(Biglietto.data_partita).order_by(Biglietto.data_partita).all()
  return [{"data": d.isoformat(), "presenze": n} for d, n in rows]
  ```

### B-4. `dashboard_revenue_breakdown` fa 3 query separate con `.all()` solo per sommare
- **File:** `backend/services/analytics.py`, righe 207-224
- **Descrizione:** Carica tutti i record di `Abbonamento`, `Biglietto` e `ShopOrder` del club per sommare `importo_pagato`, `prezzo` e `importo`. Basterebbero 3 query `func.sum()`.
- **Impatto:** MEDIO — proporzionale al volume dati; totalmente evitabile.
- **Soluzione consigliata:** Sostituire con:
  ```python
  abbonamenti = db.query(func.sum(Abbonamento.importo_pagato)).filter(Abbonamento.club_id == club_id).scalar() or 0
  biglietti   = db.query(func.sum(Biglietto.prezzo)).filter(Biglietto.club_id == club_id).scalar() or 0
  shop        = db.query(func.sum(ShopOrder.importo)).filter(ShopOrder.club_id == club_id).scalar() or 0
  ```
  (Nota: `dashboard_stats` già usa questa forma corretta — allineare le due implementazioni.)

### B-5. `dashboard_retention` e `dashboard_seasons` caricano tutti gli abbonamenti per estrarre solo la stagione
- **File:** `backend/services/analytics.py`, righe 291-303
- **Descrizione:** `dashboard_retention` esegue `db.query(Abbonamento).filter(...).all()` e poi conta per stagione con `Counter`. `dashboard_seasons` fa lo stesso per estrarre i valori distinti di `stagione`. Entrambe le operazioni sono realizzabili con `GROUP BY stagione` o `SELECT DISTINCT stagione`.
- **Impatto:** BASSO-MEDIO — inutile per dataset piccoli, rilevante su > 1000 abbonamenti.
- **Soluzione consigliata:** Usare `db.query(Abbonamento.stagione, func.count()).group_by(Abbonamento.stagione).all()` per `dashboard_retention`, e `db.query(Abbonamento.stagione.distinct()).filter(...)` per `dashboard_seasons`.

### B-6. `get_predizione` chiama `compute_behavioral` + `compute_fan_segments` + query di tutti i biglietti
- **File:** `backend/routers/partite.py`, righe 181-273
- **Descrizione:** L'endpoint `GET /partite/predizione/{partita_id}` chiama tre operazioni pesanti in sequenza: `compute_behavioral` (query di tutti i biglietti + partite del club), `compute_fan_segments` (query di tutti i fan con joinedload), e poi una query separata di tutti i biglietti per costruire `fan_ticket_dates`. I dati di biglietteria vengono caricati due volte.
- **Impatto:** ALTO — uno degli endpoint più lenti; doppio carico dei biglietti.
- **Soluzione consigliata:** Estrarre `fan_ticket_dates` da `behavioral["fan_scores"]` che li contiene già, evitando la terza query a riga 221. Valutare anche la cache per `compute_behavioral`.

### B-7. `dashboard_summary` in `routers/dashboard.py` non usa la cache
- **File:** `backend/routers/dashboard.py`, righe 89-142
- **Descrizione:** L'endpoint `GET /dashboard/summary` esegue query su `Fan` e `ShopOrder` ad ogni chiamata, senza passare dalla cache. È chiamato dalla `Dashboard.jsx` ad ogni mount del componente.
- **Impatto:** BASSO — le query sono aggregati SQL (`func.count`, `func.sum`) quindi veloci, ma potrebbe beneficiare di caching in scenari di traffico elevato.
- **Soluzione consigliata:** Wrappare il risultato in `cache_get`/`cache_set` con chiave `f"dashboard_summary_{club_id}"`.

### B-8. `compute_behavioral` non usa la cache ed è chiamata da due endpoint
- **File:** `backend/services/behavioral.py`, riga 23; chiamata da `routers/partite.py` righe 147 e 198
- **Descrizione:** `compute_behavioral` non ha caching. Viene chiamata sia da `GET /partite/behavioral` che da `GET /partite/predizione/{id}`, entrambi potenzialmente invocati dalla stessa sessione utente.
- **Impatto:** MEDIO — duplica il carico DB (query di tutte le partite + tutti i biglietti) per ogni chiamata.
- **Soluzione consigliata:** Aggiungere caching in `compute_behavioral` con chiave `f"behavioral_{club_id}"` e invalidazione in `invalidate(club_id)`.

---

## CATEGORIA C — Opportunità di ottimizzazione

### C-1. `generate_insights` chiama `compute_fan_segments` e `dashboard_stats`/`dashboard_cross_source`/`dashboard_revenue_breakdown` senza coordinarsi con la cache
- **File:** `backend/services/insights.py`, righe 94-107
- **Descrizione:** `generate_insights` chiama 4 funzioni di analytics. `compute_fan_segments` usa la cache, ma `dashboard_cross_source`, `dashboard_revenue_breakdown` e `dashboard_stats` no. Quando la pagina Insights carica, queste 4 query vengono eseguite ogni volta. La funzione è anche chiamata da `chat.py` nella stessa sessione, duplicando il lavoro.
- **Beneficio atteso:** Riduzione del carico DB sulla pagina Insights e sulla Chat.

### C-2. Logica di calcolo RFM duplicata tra `services/analytics.py` e `services/intelligence/engine.py`
- **File:** `backend/services/intelligence/engine.py`, righe 79-89 (`_rfm_from_fan`); `backend/services/analytics.py`, righe 49-93 (`_rfm_scores`)
- **Descrizione:** L'engine di intelligence ha una propria implementazione semplificata di RFM (`_rfm_from_fan`) usata come proxy quando i dati storici sono insufficienti. Il servizio analytics ha l'implementazione completa RFM a quintili. Le due implementazioni possono produrre classificazioni diverse per lo stesso fan (es. `_rfm_from_fan` non ha "A rischio" come categoria, mentre `_rfm_scores` sì).
- **Beneficio atteso:** Allineamento delle categorie RFM; possibilità di passare il segmento RFM completo all'engine invece di ricalcolarlo.

### C-3. `_apply_intelligence_penalties` in `services/insights.py` chiama `compute_club_intelligence` senza usare la cache già gestita in `routers/intelligence.py`
- **File:** `backend/services/insights.py`, righe 17-51; `backend/routers/intelligence.py`, righe 23-49
- **Descrizione:** La cache per l'intelligence è gestita in `_get_or_compute` nel router, ma `_apply_intelligence_penalties` in `insights.py` chiama `compute_club_intelligence` direttamente, bypassando la cache. Ogni visita alla pagina Insights ricalcola l'intera pipeline intelligence (potenzialmente costosa su molti fan).
- **Beneficio atteso:** Riutilizzo della cache intelligence nella pagina Insights; risparmio significativo su cluster > 500 fan.

### C-4. `calculate_renewal_scores_bulk` e `compute_club_intelligence` calcolano dati sovrapposti senza condividere i risultati
- **File:** `backend/services/renewal.py` e `backend/services/intelligence/renewal.py`
- **Descrizione:** L'Intelligence Engine (Stadio 5) calcola già una `renewal_probability` per ogni fan. Il servizio `services/renewal.py` calcola uno score di rinnovo separato con algoritmo diverso. La pagina Report chiama entrambi (`fetchRenewalScores` da `renewal.py`, `fetchClubIntelligence` da `intelligence.py`). I due score hanno metodi diversi ma l'utente vede solo quello del router `renewal`.
- **Beneficio atteso:** Unificare i due calcoli o documentare chiaramente la distinzione per evitare confusione. A lungo termine, il router `renewal` potrebbe leggere direttamente dalla cache intelligence.

### C-5. `dashboard_top_spenders` e `dashboard_segments` chiamano `compute_fan_segments` separatamente
- **File:** `backend/services/analytics.py`, righe 227-246
- **Descrizione:** Entrambe le funzioni chiamano `compute_fan_segments` che — grazie alla cache — è efficiente al secondo accesso. Tuttavia, quando la cache è fredda (primo accesso o dopo invalidazione), entrambe le chiamate ravvicinate dal `Dashboard.jsx` triggherano il calcolo completo.
- **Beneficio atteso:** Il problema è mitigato dalla cache; ma se si vuole eliminare la race condition nella prima chiamata, si potrebbe pre-riscaldare la cache al login (già fatto per intelligence in `routers/auth.py`, ma non per `fan_segments`).

---

## Riepilogo priorità

| Elemento | Categoria | Priorità | Azione |
|----------|-----------|----------|--------|
| A-8 — `insights.get("insights", [])` sempre vuoto in `chat.py` | A (bug funzionale) | 🔴 Alta | Fix immediato: usare `azioni_settimana` o `opportunita` |
| B-1 — `calculate_renewal_scores_bulk` N×5 query | B | 🔴 Alta | Refactor bulk loader |
| B-6 — `get_predizione` carica biglietti due volte | B | 🔴 Alta | Eliminare query ridondante a riga 221 |
| A-6 — `Calendario.jsx` non raggiungibile dall'utente | A | 🟡 Media | Aggiungere route e link Sidebar |
| B-3 — `dashboard_presenze` carica tutti i biglietti | B | 🟡 Media | Sostituire con `GROUP BY` SQL |
| B-4 — `dashboard_revenue_breakdown` carica tutti i record | B | 🟡 Media | Sostituire con `func.sum()` |
| B-8 — `compute_behavioral` senza cache | B | 🟡 Media | Aggiungere cache con invalidazione |
| C-3 — `_apply_intelligence_penalties` bypassa cache intelligence | C | 🟡 Media | Usare la cache dal router intelligence |
| B-2 — `dashboard_citta` carica tutti i Fan | B | 🟢 Bassa | Query `SELECT citta` invece di `SELECT *` |
| B-5 — `dashboard_retention`/`dashboard_seasons` caricano tutti gli abbonamenti | B | 🟢 Bassa | Usare `GROUP BY` / `DISTINCT` |
| B-7 — `dashboard_summary` senza cache | B | 🟢 Bassa | Aggiungere cache opzionale |
| A-1 — `Response` importato inutilizzato in `main.py` | A | 🟢 Bassa | Rimuovere dall'import |
| A-2 — `import secrets` inutilizzato in `config.py` | A | 🟢 Bassa | Rimuovere |
| A-3 — `require_role()` non usata | A | 🟢 Bassa | Rimuovere o documentare nel backlog |
| A-4 — `stripe_customer_id` nel modello mai usato | A | 🟢 Bassa | Rimuovere colonna se Stripe non è in roadmap |
| A-5 — `fetchCrossSource` non usato nel frontend | A | 🟢 Bassa | Rimuovere o usare in Dashboard |
| A-7 — `_norm_email` duplicata | A | 🟢 Bassa | Unificare in `services/utils.py` |
| C-1 — `generate_insights` chiama 4 funzioni senza cache coordinator | C | 🟢 Bassa | Cache per risultato complessivo degli insights |
| C-2 — Logica RFM duplicata (analytics vs intelligence engine) | C | 🟢 Bassa | Allineamento a lungo termine |
| C-4 — Due score di rinnovo diversi coesistenti | C | 🟢 Bassa | Documentare distinzione o unificare |
| C-5 — Race condition cache fredda su `compute_fan_segments` | C | 🟢 Bassa | Pre-riscaldamento cache al login |
