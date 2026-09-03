# FanIQ — Context Handoff
> Aggiornato: 2026-09-03 | Da leggere all'inizio della prossima sessione

---

## Stato attuale

Sessione lunga: chiuso l'intero backlog aperto di ieri (7 punti), poi un audit di coerenza generale (4 agenti in parallelo su naming, formule dati, sicurezza tenant, contratto frontend↔backend), poi chiusi tutti i problemi trovati (5 punti, uno via Superpowers Subagent-Driven Development in worktree isolato, gli altri diretti). **Tutto committato e pushato su `main`, deploy verificato live** (`faniq-backend.onrender.com/health` → `200`, frontend Vercel senza errori console) più volte durante la sessione, ultima volta dopo il commit `1192138`.

**Plugin installati oggi**: `superpowers@superpowers-dev` (13 skill: brainstorming, writing-plans, subagent-driven-development, systematic-debugging, test-driven-development, requesting-code-review, verification-before-completion, using-git-worktrees, ecc.) e `concise@concise` (modalità output compatta, `/concise` per attivare, "stop concise" per disattivare). Entrambi a livello `user` (attivi in ogni progetto, non solo FanIQ).

**Preferenza esplicita di Lorenzo (salvata in memoria)**: segnalare sempre quando una skill installata farebbe un task meglio/più rigorosamente di come lo farei di default, prima di procedere — finché non è autonomo nel capire quale skill usare quando. Concise resta attiva anche sopra le altre skill (non la sovrascrivono).

**Ambiente locale**: DB SQLite locale (`backend/faniq.db`) ha il club di test "FC Torino Nord" (club_id=2, 50 fan sintetici da `sample_csv/dashtest_*`), usato per tutte le verifiche di oggi. Non toccato il DB Postgres di produzione se non per una migrazione manuale (vedi sotto).

---

## Backlog di ieri — tutto chiuso oggi

| # | Cosa | Commit |
|---|---|---|
| 1 | RFM Distribution Widget escludeva "Occasionale" | `b745a4c` |
| 2 | Recency RFM ignorava del tutto le date abbonamento (nuova colonna `Abbonamento.data_acquisto` — **richiesta una migrazione manuale `ALTER TABLE` su Neon prod, eseguita da Lorenzo durante la sessione**) | `6d5eeb7` |
| 3 | CTA "Crea campagna" in Predizione Presenze era uno stub — ora esporta CSV reale (tier bassa/nessun_dato, filtrato per consenso marketing) | `059e9bf` |
| 4 | `JourneyStage.RECUPERATO` mai raggiungibile (`was_dormiente_last_week` hardcoded `False`) — risolto **senza** tabella di snapshot: si ricalcola lo stadio su `presence_flags[:-1]`, nessuno storico persistito serve | `8f7efee` |
| 5 | Codice morto in `journey.py::_classify_stage` (ramo if/else che ritornava sempre lo stesso valore) — trovato per caso durante il punto 4 | `050bc6d` |
| 6 | Naming collision "A rischio" tra segmento RFM, Business Score, Revenue Watch — rinominati Revenue Watch→"Caldi", Business Score→"Allarme" | `0c3ad66` |
| 7 | Upload: le 4 card CSV non aggiornavano "Storico caricamenti" dopo un upload riuscito (dovevi ricaricare la pagina a mano) | `4f4d23c` |

---

## Audit di coerenza di oggi — 4 problemi trovati, tutti chiusi

| # | Cosa | Come | Commit |
|---|---|---|---|
| 1 | **Fan Intelligence Engine usava un RFM "proxy" interno** (solo conteggi, ignora recency, non può mai produrre "A rischio") invece dell'RFM reale — un fan mostrato ovunque come "A rischio" veniva trattato dal motore come categoria più sana, `renewal_probability` gonfiata fino a +15 punti nei casi di churn imminente. Il più serio trovato oggi. | **Superpowers Subagent-Driven Development completo**: piano scritto (`docs/superpowers/plans/2026-09-03-fix-rfm-proxy-intelligence.md`), worktree isolato, 3 task ognuno con implementer+reviewer dedicati, poi review finale sull'intero branch, merge locale in `main` | `a2d87ed`, `bbd559b`, `2c2f50d` |
| 2 | `/api/intelligence/club` non includeva mai `email` — bottone "Contatta" in AlertsPage sempre vuoto per ogni fan, anche con email in anagrafica | Fix diretto + review leggera (`requesting-code-review`) | `d7542e1` |
| 3 | "rischio" ripetuto 3 volte su Report.jsx per concetti diversi (RFM, Journey, prob. rinnovo) + un testo che vanificava il rename di ieri | Fix diretto | `14b4ec4` |
| 4 | "Critico/Critica" per Business Score (club) vs Anomaly Severity (singolo fan) | Business Score → "Grave" | `9757655` |
| 5 (bassa priorità) | `undo_upload` senza filtro `club_id` esplicito nelle delete (non sfruttabile, difesa in profondità) | Fix diretto | `1192138` |

**Non ha senso usare Superpowers/piano per ogni fix** — solo il punto 1 (motore "completo", rischio alto) ha giustificato tutto il processo. Gli altri sono stati fix diretti con verifica dal vivo, coerenti con lo stile di ieri.

---

## Idee feature Dashboard — generate ma NON scelte, da scremare domani

Lorenzo ha chiesto di generare idee per nuove feature sulla Dashboard, tenerle tutte, eventualmente aggiungerne altre, e decidere domani quale/i approfondire. Nessuna ancora discussa/approvata nel dettaglio (skill `brainstorming` di Superpowers avviata ma non completata — resta da fare: chiarimenti one-by-one, poi design, poi approvazione, PRIMA di scrivere codice).

1. **Widget "Momentum"** — fan in traiettoria positiva/negativa (campo `momentum`, già calcolato per ogni fan, mai aggregato/mostrato). Segnale precoce prima che un fan diventi "Dormiente".
2. **Indicatore di affidabilità dati** — quanti fan hanno `data_quality` FULL/PARTIAL/INSUFFICIENT, per capire quanto fidarsi dei numeri.
3. **"Prossima partita" in anteprima su Dashboard** — la predizione presenze (già in Calendario & Presenze) come widget compatto qui.
4. **Confronto stagione su stagione** — revenue/presenze anno corrente vs precedente (estende "Abbonati per stagione").
5. **Export "report per il board"** — PDF/riepilogo stampabile dei KPI, per riunioni con dirigenza/sponsor.
6. **Cohort di acquisizione** — curva di retention per anno di primo acquisto (derivabile da dati esistenti, nessuna tabella nuova).
7. **Partite che performano meglio** — revenue/presenze per tipo partita (derby/standard/finale) o giorno settimana, usando `Partita`+`Biglietto` già esistenti.

Scartate per ora (richiedono dati cross-tenant o storico non disponibile): benchmark tra club, "cosa è cambiato questa settimana" (richiede snapshot storici, stesso blocco già risolto diversamente per RECUPERATO ma qui servirebbe davvero uno storico persistito).

---

## File chiave del workspace

| File | Contenuto |
|------|-----------|
| `docs/superpowers/plans/2026-09-03-fix-rfm-proxy-intelligence.md` | Piano SDD del fix motore RFM — utile come esempio di formato piano per prossimi task grossi |
| `sample_csv/dashtest_*.csv` | Dataset 50 fan sintetici, ora con colonna `data_acquisto` aggiunta (anche su `abbonati_demo.csv`, `abbonati_test.csv`) |
| `backend/faniq.db.bak-20260902144342` | Backup pre-esistente, non toccato |

---

## Prima di continuare

1. Tutto pushato e verificato live — nessuna azione di deploy in sospeso.
2. Riprendere il brainstorming Dashboard da dove si è fermato: presentare le 7 idee sopra a Lorenzo, farne scremare 1-2, poi seguire il processo completo della skill `brainstorming` (chiarimenti → design → approvazione) prima di scrivere qualunque codice.
3. Nessun bug noto aperto sul resto dell'app.
