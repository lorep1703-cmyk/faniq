# FanIQ — Context Handoff
> Aggiornato: 2026-09-24 | Da leggere all'inizio della prossima sessione

---

## Stato attuale

Il 23/09 sessione lunga di **test end-to-end** (non di sviluppo feature): caricati dataset sintetici combinati (~1844 fan) su un club di test locale, esplorate tutte le pagine, incrociati i numeri mostrati con query dirette su SQLite. Trovati e risolti 6 bug reali + 2 miglioramenti UI. **Tutto committato in locale, NON pushato** (`main` è 8 commit avanti a `origin/main`; il push lo fa Lorenzo, vedi CLAUDE.md). Test backend: 36/36 passano.

Approccio che Lorenzo apprezza: verificare che i dati mostrati **rispecchino la realtà** (non solo che la pagina non crashi), lavorare **un fix alla volta con feedback dopo ciascuno**, e discutere brevemente il design (proposta in chat → ok → implementazione) prima di aggiungere UI nuova.

---

## Fatto il 23/09 (commit in ordine)

| Commit | Cosa |
|---|---|
| `17a654a` | `main.py`: `load_dotenv()` era chiamato dopo `from config import ...`, ma `config.py` legge le env var a import-time → il `.env` non veniva mai letto in tempo |
| `d051b0f` | `_norm_stagione()` in `services/utils.py`, applicato all'import abbonamenti: "2024/25" e "2024/2025" erano stagioni diverse in filtri/aggregazioni (+ 5 test) |
| `b65743f` | `data_readiness.py`: il punteggio "Affidabilità dati" ignorava il nome mancante (mostrava 100% con 29% di profili senza nome). Aggiunto check "Nome presente" (soglia 80%), pesi ribilanciati (+ 2 test) |
| `d354546`, `2ab6c70` | `Report.jsx`: il taglio fisso `slice(0,100)` rendeva invisibili i fan oltre il 100°. Ora bottone "Carica altri N" (N = min(100, rimasti)), reset al cambio filtro |
| `690c469` | `Report.jsx`: colonna Nome mostra email + icona ⚠️ quando manca il nome; nuovo filtro "Qualità dati" (Senza nome / Senza email); bottone flottante "Torna su" (lo scroll è sulla `window`, non su un div interno) |
| `27c9087` | **Bug serio**: `routers/auth.py::_warmup_intelligence` (background task dopo ogni login) scriveva oggetti `FanIntelligence` grezzi nella chiave di cache `intelligence_{club_id}`, che `routers/intelligence.py` legge come dict serializzati → `GET /api/intelligence/club` andava in 500 (frontend: "Backend non raggiungibile", fuorviante). Ora riusa `_build_cache` (+ 2 test) |

---

## Questioni APERTE (da qui ripartire)

1. **Ambassador Score ("Community", icona 🧍/👥 + numero in Report)** — Lorenzo è scettico, "forse non la manterrei". Verificato: max 28/100 su 1844 fan, 82% tra 0-9 (schiacciato). Cause: (a) la penalità -40% "nessun acquisto multiplo negli ultimi 6 mesi" usa `date.today()`, quindi con dati 2023-25 colpisce **tutti**; (b) limite strutturale: il "gruppo" è dedotto raggruppando biglietti per stessa data+persona, non osservato (due amici con email diverse = due persone sole). **Decisione da prendere**: rimuovere / tenere ma segnalare come sperimentale / fixare la data e rivalutare.
2. **"Da contattare" (AlertsPage)** — vuota nonostante il dataset abbia fan "a rischio". Lorenzo ha detto di rivederla insieme; mai fatto. Sospetto: stesso problema di date (vedi pattern sotto).
3. **Profili senza nome (29% nel dataset di test)** — spiegato: il CSV shop ha solo `email,prodotto,importo,data`, quindi chi ha solo acquisti shop nasce senza nome/città. Scenario realistico anche per club veri. Mitigato in UI (fallback email + filtro) ma restano da decidere eventuali altri passi (es. non contarli come "Tifosi identificati" nel KPI principale).
4. **7 idee feature Dashboard del 03/09** — ancora da scremare (brainstorming Superpowers interrotto; elenco sotto). Nota: l'idea #2 "indicatore affidabilità dati" esiste già in parte (badge `DataHealthPill` su Report/Intelligence). Prima di costruire l'idea "Prossima partita" serve capire come gestire il calendario (vedi pattern sotto).
5. **F9 in `product/feature_ideas.md`** (monitoraggio predittivo continuo + contenuti personalizzati via agenti/MCP; Hermes/Klaviyo come piste) — parcheggiata, Lorenzo ha detto di tenere Hermes da parte per ora.

### Pattern di bug ricorrente: `date.today()` come riferimento di "recente"
Calendario & Presenze (zero predizioni: nessuna partita futura), "Da contattare" (zero anomalie), Ambassador Score (penalità universale) ancorano "recente/futuro" alla **data reale di sistema** invece che alle date dei dati del club. Con dati demo/storici o in pausa estiva falliscono silenziosamente. **Prima di dare per buono un "non c'è nulla da mostrare", controllare se il codice usa `date.today()`.**

---

## Ambiente locale (per riprendere i test)

- **Avvio backend**: `cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000` (ora legge `backend/.env`; il file locale è gitignored, JWT secret generato). **Frontend**: `cd frontend && npm run dev` (porta 3000; c'è `.claude/launch.json` con `faniq-frontend`). I test pytest richiedono `FANIQ_JWT_SECRET` esportato nella shell (nessun conftest).
- **DB**: `backend/faniq.db` (SQLite, gitignored). Club di test **`test-demo`** (club_id=3, "FC Test Demo"): ~1844 fan da `sample_csv/*_demo`, `*_esempio`, `*_test` caricati via API + **inserimenti manuali**: 3 fan (id 1892-1894, "Giada Neri", "Tommaso Vitale", "Beatrice Longo") e 4 partite sintetiche 2025-05-25/06-01/06-08/06-15 create apposta per ottenere lo stadio Journey **Scoperta** (prima assente nei dati: serve presenza in 1 sola delle ultime 4 partite, *non* nelle ultime 2, altrimenti scatta RECUPERATO). Password del club: chiederla a Lorenzo, oppure registrare un nuovo club dall'UI.
- **Upload CSV**: il drag&drop non è pilotabile dal browser automatico → usare `curl` con login (`POST /auth/login` → token → `POST /upload/{abbonati|biglietteria|shop}` e `POST /partite/upload`, campo `file`).
- **Cache intelligence in-memory** (TTL 900s): dopo modifiche dirette al DB, forzare `POST /api/intelligence/club/refresh` (un altro processo Python non può invalidare la cache del server).
- **Console del browser di test**: `read_console_messages` accumula errori vecchi tra navigazioni — verificare lo stato con screenshot, non fidarsi solo dello storico.
- Non pushato: 8 commit locali (vedi sopra + `d9d1e9f` handoff precedente). `product/feature_ideas.md` (riga F9) committato a parte.
- Untracked non nostri, non toccati: `.codex/`, `AGENTS.md`, `backend/faniq.db.bak-20260902144342`.

---

## Idee feature Dashboard (03/09) — generate ma NON scelte

1. **Widget "Momentum"** — fan in traiettoria positiva/negativa (campo `momentum` già calcolato, mai aggregato/mostrato in UI; confermato il 23/09).
2. **Indicatore affidabilità dati** — parzialmente già presente (`DataHealthPill`), rivalutare cosa manca.
3. **"Prossima partita" in anteprima su Dashboard** — dipende dal calendario con partite future (vedi pattern `date.today()`).
4. **Confronto stagione su stagione** — ora fattibile senza spezzare i dati grazie alla normalizzazione stagione; esiste già un indice DB `ix_abbonamenti_club_stagione` pensato per la retention per stagione.
5. **Export "report per il board"** — PDF: **nessuna libreria PDF installata**, servirebbe conferma esplicita per aggiungerne una (regola CLAUDE.md).
6. **Cohort di acquisizione** — curva di retention per anno di primo acquisto.
7. **Partite che performano meglio** — revenue/presenze per tipo partita o giorno.

Scartate per ora: benchmark tra club (dati cross-tenant), "cosa è cambiato questa settimana" (serve storico persistito).

---

## Altre note

- **Hermes Agent** (agente open source Nous Research) esplorato in sessioni precedenti come possibile motore always-on per FanIQ (monitoraggio + contenuti per cluster). Clonato in `~/Developer/hermes-agent` (spostato da `~/Desktop` per problemi iCloud con git). Messo da parte per ora; nessuna azione in sospeso. Se si riprende: dati reali di tifosi + agenti autonomi = tema GDPR, accesso solo via API con token scoped, mai DB diretto.
- Plugin attivi: `superpowers` (brainstorming, subagent-driven-development, ecc.) e `concise`. Preferenze salvate in memoria: segnalare quando una skill fitterebbe meglio il task; restare concisi anche usando le skill.
- Regole invariate (CLAUDE.md): niente modifiche a auth/JWT/RLS/middleware, niente dati reali, niente librerie nuove senza conferma, **il push su main lo esegue solo Lorenzo**.
