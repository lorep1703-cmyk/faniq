# FanIQ — Context Handoff
> Aggiornato: 2026-10-01 | Da leggere all'inizio della prossima sessione
> **Fonte unica** per stato e questioni aperte. Le regole stabili stanno in `CLAUDE.md`: qui non vanno ripetute.

---

## Stato attuale

Tutto il lavoro fino al 30/09 è **su `origin/main` e in produzione** (PR #2 e #3). Test backend: 49/49 passano (01/10).

Approccio che Lorenzo apprezza: verificare che i dati mostrati **rispecchino la realtà** (non solo che la pagina non crashi), lavorare **un passo alla volta**, dicendo dopo ciascuno cosa è cambiato e cosa ci si guadagna, e discutere brevemente il design (proposta in chat → ok → implementazione) prima di aggiungere UI nuova.

---

## Fatto dal 24/09 al 30/09

| Commit | Cosa |
|---|---|
| `774c427` | "Da contattare": nuovo `GET /api/intelligence/club/alerts-context`; se non ci sono abbonati della stagione corrente la pagina lo spiega, invece di dire "Tutto sotto controllo" (+ test) |
| `db84afd`, `cb4748f` | Recupero password del club: link email monouso valido 60 min, nessuna tabella nuova, rate limit autorizzato da Lorenzo. Pagine `RecuperaPassword.jsx`/`ReimpostaPassword.jsx` (+ test) |
| `57abdce` | CLAUDE.md: le email **non partono in produzione** perché Render free blocca l'SMTP. Si sblocca al primo club (Render a pagamento oppure dominio + Brevo); nel frattempo i reset si fanno a mano |

---

## Fatto il 23/09: sessione di test end-to-end (~1844 fan sintetici, numeri incrociati con il DB)

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
2. **"Da contattare" (AlertsPage)** — vuota nonostante il dataset abbia fan "a rischio". Dal 24/09 la pagina almeno **spiega** il vuoto (mancano abbonati della stagione corrente, `774c427`), ma la causa di fondo, cioè le date (vedi pattern sotto), resta. La revisione da fare insieme non c'è ancora stata.
3. **Profili senza nome (29% nel dataset di test)** — spiegato: il CSV shop ha solo `email,prodotto,importo,data`, quindi chi ha solo acquisti shop nasce senza nome/città. Scenario realistico anche per club veri. Mitigato in UI (fallback email + filtro) ma restano da decidere eventuali altri passi (es. non contarli come "Tifosi identificati" nel KPI principale).
4. **7 idee feature Dashboard del 03/09** — ancora da scremare (brainstorming Superpowers interrotto; elenco sotto). Nota: l'idea #2 "indicatore affidabilità dati" esiste già in parte (badge `DataHealthPill` su Report/Intelligence). Prima di costruire l'idea "Prossima partita" serve capire come gestire il calendario (vedi pattern sotto).
5. **F9 in `product/feature_ideas.md`** (monitoraggio predittivo continuo + contenuti personalizzati via agenti/MCP; Hermes/Klaviyo come piste) — parcheggiata, Lorenzo ha detto di tenere Hermes da parte per ora.

### Pattern di bug ricorrente: `date.today()` come riferimento di "recente"
Calendario & Presenze (zero predizioni: nessuna partita futura), "Da contattare" (zero anomalie), Ambassador Score (penalità universale) ancorano "recente/futuro" alla **data reale di sistema** invece che alle date dei dati del club. Con dati demo/storici o in pausa estiva falliscono silenziosamente. **Prima di dare per buono un "non c'è nulla da mostrare", controllare se il codice usa `date.today()`.**
Punti censiti l'01/10: `services/intelligence/ambassador.py:48`, `services/intelligence/engine.py:222/237/313`, `services/behavioral.py:38`, `routers/partite.py:60`, `services/analytics.py:133`, `services/spending_forecast.py:30` (quest'ultimo accetta già `today` come parametro).

---

## Ambiente locale (per riprendere i test)

- **Avvio backend**: `cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000` (ora legge `backend/.env`; il file locale è gitignored, JWT secret generato). **Frontend**: `cd frontend && npm run dev` (porta 3000; c'è `.claude/launch.json` con `faniq-frontend`). I test pytest richiedono `FANIQ_JWT_SECRET` esportato nella shell (nessun conftest).
- **DB**: `backend/faniq.db` (SQLite, gitignored). Club di test **`test-demo`** (club_id=3, "FC Test Demo"): ~1844 fan da `sample_csv/*_demo`, `*_esempio`, `*_test` caricati via API + **inserimenti manuali**: 3 fan (id 1892-1894, "Giada Neri", "Tommaso Vitale", "Beatrice Longo") e 4 partite sintetiche 2025-05-25/06-01/06-08/06-15 create apposta per ottenere lo stadio Journey **Scoperta** (prima assente nei dati: serve presenza in 1 sola delle ultime 4 partite, *non* nelle ultime 2, altrimenti scatta RECUPERATO). Password del club: chiederla a Lorenzo, oppure registrare un nuovo club dall'UI.
- **Upload CSV**: il drag&drop non è pilotabile dal browser automatico → usare `curl` con login (`POST /auth/login` → token → `POST /upload/{abbonati|biglietteria|shop}` e `POST /partite/upload`, campo `file`).
- **Cache intelligence in-memory** (TTL 900s): dopo modifiche dirette al DB, forzare `POST /api/intelligence/club/refresh` (un altro processo Python non può invalidare la cache del server).
- **Console del browser di test**: `read_console_messages` accumula errori vecchi tra navigazioni — verificare lo stato con screenshot, non fidarsi solo dello storico.

## Pulizia in corso (01/10)

1. ✅ Memoria e handoff senza doppioni: lo stato del progetto sta solo qui, la memoria di Claude tiene solo le preferenze di lavoro.
2. ✅ `AGENTS.md` è un collegamento a `CLAUDE.md`: Codex e Claude Code leggono lo stesso file. Hindsight valutato e annotato in F9 (`product/feature_ideas.md`).
3. ✅ Sicurezza push e Codex: hook `.githooks/pre-push` (conferma umana, vale per ogni agente); `.codex/` versionato con isolamento senza rete + `.codex/rules/faniq.rules` (verificati nel sandbox reale). Backup DB del 02/09 nel Cestino, `*.db.bak*` in `.gitignore`. **Da fare (Lorenzo):** segnare `~/Developer/faniq` come trusted in Codex, altrimenti la config di progetto non viene letta. Blocco lato GitHub rinviato: repo privato → servirebbe piano a pagamento, e comunque non distingue Lorenzo dagli agenti.
4. ⏳ Rami già uniti da cancellare (`claude/sleepy-williams-e87eb2`, `feature/agent-upgrade` con uno stash da guardare, remoto `claude/sleepy-thompson-bt6kf5`).
5. ⏳ Documenti di giugno nella root (`CONTEXT.md`, `PROJECT_STRUCTURE.md`, `instructions.md`, audit…) da archiviare.

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
- Plugin attivi: `superpowers` e `concise`. Le preferenze d'uso sono nella memoria di Claude Code, le regole del progetto in `CLAUDE.md`.
