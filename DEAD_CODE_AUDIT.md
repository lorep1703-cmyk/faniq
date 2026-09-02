# FanIQ — Audit Codice Inutilizzato
> Analisi completa di endpoint, funzioni API e pagine esistenti ma non collegati.
> Data: 2026-06-26

---

## Nota di sicurezza preliminare

Tutti gli endpoint backend sono protetti da Bearer token JWT + Row-Level Security PostgreSQL. Nessun endpoint esposto è accessibile senza autenticazione. Il rischio sicurezza non è "accesso non autorizzato" ma:
1. **Operazioni GDPR senza UI** — chi le chiama? Come vengono tracciate?
2. **Endpoint pesanti esposti** — un client malevolo autenticato potrebbe abusarli per saturare il backend.

---

## CATEGORIA A — Feature complete ma inaccessibili dalla UI

Queste sono pagine JSX pienamente sviluppate, con backend e API funzionanti, ma non collegate al router di `App.jsx` e assenti dalla Sidebar. L'utente non può raggiungerle in nessun modo.

### A1 — `Simulatore.jsx` (pagina simulatore presenze)

**Stato:** pagina completa, backend completo, API completa — non collegata.

Cosa fa: permette di simulare le presenze attese a una partita in base a variabili come tipo di partita, meteo, promozioni, capienza, prezzo medio abbonati. Il backend calcola una stima realistica.

File coinvolti:
- `frontend/src/pages/Simulatore.jsx` — pagina React
- `frontend/src/api/client.js` — `fetchSuggestedBase`, `fetchAttendance` (definite, non importate da nessuna pagina)
- `backend/routers/simulator.py` — `GET /simulate/base`, `GET /simulate/attendance`
- `backend/services/simulator.py` — logica di calcolo

Perché non è collegata: non c'è né una `<Route>` in `App.jsx` né una voce nella Sidebar.

Valutazione: **feature utile da collegare**. Il simulatore è rilevante per il target (club che pianificano biglietteria e marketing pre-partita). Non va eliminato — va aggiunto al router e alla Sidebar.

### A2 — `Calendario.jsx` (pagina calendario partite)

**Stato:** pagina React esistente, non collegata al router.

Cosa fa: gestione del calendario partite — visualizzazione, aggiunta, eliminazione, upload CSV. È separata dalla pagina Insights che ha già una sezione partite integrata.

File coinvolti:
- `frontend/src/pages/Calendario.jsx` — pagina React
- Le API (`fetchPartite`, `addPartita`, `deletePartita`, `uploadPartite`) sono già usate in `Insights.jsx`

Valutazione: **da valutare se duplica Insights o la arricchisce**. Prima di collegarla al router, capire se deve sostituire la sezione partite dentro Insights o affiancarla. Non è urgente.

---

## CATEGORIA B — Endpoint backend esposti senza UI corrispondente

Questi endpoint esistono, sono autenticati, funzionano — ma non c'è nessun bottone o pagina nel frontend che li chiami.

### B1 — `PATCH /privacy/fan/{id}/consent` ⚠️ Priorità alta

**Sicurezza:** operazione GDPR sensibile. Modifica il consenso marketing/profilazione di un tifoso. Ogni modifica dovrebbe essere tracciata nel `privacy_log`.

Funzione API: `updateFanConsent(id, tipo, consenso)` — definita in `client.js`, mai importata da nessuna pagina.

Valutazione: **va aggiunta una UI nella pagina Privacy prima di andare in produzione**. Un'operazione di modifica consenso senza UI significa che oggi non può essere fatta in modo tracciabile dall'operatore del club. È il tipo di azione che in caso di ispezione GDPR deve avere un audit trail chiaro.

### B2 — `GET /fans/{fan_id}/renewal-score` (singolo fan)

Endpoint per il renewal score di un singolo fan. Il frontend usa già `fetchRenewalScores` che carica la lista bulk — questo endpoint per il singolo non viene mai chiamato.

Valutazione: **utile per una futura scheda fan dettagliata**, non urgente. Tenerlo, non eliminarlo.

### B3 — `GET /dashboard/seasons`

Restituisce la lista delle stagioni presenti nel database. Funzione API `fetchSeasons` definita ma mai chiamata.

Valutazione: **dato utile** per filtri stagionali nella pagina Report. Non è un rischio, ma è una feature a metà — l'endpoint è pronto, manca il filtro nel frontend.

### B4 — `GET /dashboard/cross-source`

Restituisce il conteggio dei fan per numero di fonti attive (solo abbonamento, abbonamento + biglietti, tutte e tre). Funzione API `fetchCrossSource` definita ma mai chiamata.

Dopo il Fix #3 questa funzione è già stata ottimizzata con SQL aggregate. Valutazione: **dato interessante per la Dashboard**, probabilmente era presente in una versione precedente e poi rimosso dall'UI senza rimuovere l'endpoint.

---

## CATEGORIA C — Codice morto puro (da rimuovere)

### C1 — `fetchFanDetail` + `GET /insights/fan/{fan_id}`

**Doppio problema: codice morto + anti-pattern di performance.**

`fetchFanDetail` è definita in `client.js` ma non importata da nessuna pagina.

L'endpoint backend `GET /insights/fan/{fan_id}` fa questo internamente:
```
carica TUTTI i fan del club via compute_fan_segments (full load in memoria)
→ filtra la lista per trovare il singolo fan_id
→ restituisce quell'uno
```
È il modo più costoso possibile per restituire un singolo record: carica 2.500 oggetti per servirtene uno.

Valutazione: **endpoint da rimuovere o riprogettare completamente**. Se in futuro servirà una scheda fan dettagliata, andrà fatto con una query SQL diretta su `Fan.id`, non passando da `compute_fan_segments`. Per ora va tolto.

### C2 — `downloadTemplate` in `client.js`

Funzione che usa axios per scaricare i template CSV. Non viene mai chiamata da nessuna pagina — le card di Upload usano direttamente un tag `<a href={API_URL}/upload/template/...>` per lo stesso scopo.

Valutazione: **codice duplicato inutilizzato**. Da rimuovere da `client.js`.

### C3 — `fetchFansBySegment` in `client.js`

Chiama `GET /dashboard/fans?segment=...`. Non importata da nessuna pagina. La pagina Report usa `fetchAllFans` e filtra lato client.

Valutazione: **da rimuovere**. Se mai si vorrà filtrare server-side, andrà riprogettato.

---

## CATEGORIA D — Performance: stesso bug del Fix #4 in `renewal.py`

### D1 — `GET /fans/renewal-scores` carica i fan due volte

File: `backend/routers/renewal.py`, righe 43–55.

`get_renewal_scores` fa:
1. `calculate_renewal_scores_bulk(club.id, db)` — calcola i renewal score
2. `db.query(Fan).filter(Fan.club_id == club.id).all()` — carica TUTTI i fan di nuovo solo per nome/cognome/email

È esattamente lo stesso pattern risolto con il Fix #4 su `intelligence.py`. Con 2.500 fan = 2.500 oggetti Fan in RAM extra ad ogni chiamata.

Valutazione: **da fixare con lo stesso approccio del Fix #4** — query SQL mirata su `id, nome, cognome, email` invece del full object load.

---

## Riepilogo e priorità

| # | Elemento | Tipo | Priorità | Azione |
|---|----------|------|----------|--------|
| A1 | `Simulatore.jsx` non collegato | Feature nascosta | 🟡 Media | Aggiungere a router + Sidebar |
| A2 | `Calendario.jsx` non collegato | Feature nascosta | 🟢 Bassa | Valutare prima di collegare |
| B1 | `updateFanConsent` senza UI | GDPR ⚠️ | 🟠 Alta | Aggiungere UI in Privacy prima del go-live |
| B2 | `renewal-score` singolo fan | Endpoint orfano | 🟢 Bassa | Tenere per scheda fan futura |
| B3 | `dashboard/seasons` | Endpoint orfano | 🟢 Bassa | Usare per filtri stagionali in Report |
| B4 | `dashboard/cross-source` | Endpoint orfano | 🟢 Bassa | Valutare reinserimento in Dashboard |
| C1 | `fetchFanDetail` + endpoint | Codice morto + anti-pattern | 🟠 Alta | Rimuovere entrambi |
| C2 | `downloadTemplate` | Codice morto | 🟢 Bassa | Rimuovere da client.js |
| C3 | `fetchFansBySegment` | Codice morto | 🟢 Bassa | Rimuovere da client.js |
| D1 | `renewal-scores` double-load | Performance | 🟠 Alta | Fix identico al Fix #4 |

**Cosa fare subito (prima del test con dati reali):**
- D1 — fix performance renewal-scores (stesso impatto del Fix #4)
- C1 — rimuovere `fetchFanDetail` e riprogettare l'endpoint `/insights/fan/{id}`
- B1 — aggiungere UI per modifica consenso in Privacy (non blocca il test, ma blocca il go-live)

**Cosa fare dopo il test:**
- A1 — collegare il Simulatore al router
- C2, C3 — pulizia codice morto in client.js
