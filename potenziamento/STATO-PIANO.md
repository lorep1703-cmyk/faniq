# STATO-PIANO — Potenziamento Claude Code + Cowork

> Memoria del piano. Aggiornato a ogni checkpoint e a ogni fine sessione.
> A inizio sessione: leggere PRIMA `potenziamento/BRIEF.md`, poi questo file.

**Ultimo aggiornamento:** 2026-07-02 — Sessione 1 conclusa (uscita raggiunta)

---

## Setup tecnico — LEGGERE PER PRIMO A OGNI NUOVA SESSIONE

Il sandbox Cowork **non può cancellare file** nella cartella montata `faniq` (permesso negato da Lorenzo, due volte, decisione definitiva — **non richiederlo più**). Git necessita di cancellare i propri lock temporanei, quindi le operazioni Git di scrittura falliscono nella cartella montata.

**Soluzione adottata (funzionante):**
1. Clone di lavoro nel sandbox: `~/faniq-work` (pieni permessi, branch `feature/agent-upgrade` attivo qui). Il sandbox NON persiste tra sessioni.
2. Il branch persiste tramite **bundle**: `potenziamento/agent-upgrade.bundle` nella cartella montata, rigenerato a ogni commit.
3. **Ripristino a inizio nuova sessione:**
   git clone --no-hardlinks <mnt>/faniq ~/faniq-work
   cd ~/faniq-work
   git fetch <mnt>/faniq/potenziamento/agent-upgrade.bundle feature/agent-upgrade:refs/heads/feature/agent-upgrade
   git checkout feature/agent-upgrade
4. I deliverable sono **mirrorati** nella cartella montata `faniq/potenziamento/` (copie di convenienza per Lorenzo — la fonte di verità è il branch nel bundle).
5. Lettura git nella cartella montata: usare `git --no-optional-locks` per evitare lock orfani.
6. Lorenzo può importare il branch nel suo repo quando vuole:
   git fetch potenziamento/agent-upgrade.bundle feature/agent-upgrade:feature/agent-upgrade

**Lock orfani nel repo di Lorenzo** (da mio test fallito, bloccano il SUO git, da rimuovere a mano):
rm -f .git/index.lock .git/packed-refs.lock .git/refs/heads/test-write-check.lock

---

## Sessioni

### Sessione 1 — 2026-07-02 (in corso)
- [x] Prerequisito zero: repo valido, monorepo unico (frontend+backend), origin github.com/lorep1703-cmyk/faniq
- [x] Connector MCP GitHub: **non disponibile** nel registry → ricerca candidati via web (previsto dal brief, non bloccante)
- [x] Mappa struttura presentata a Lorenzo (checkpoint 1)
- [x] Branch feature/agent-upgrade creato (nel clone sandbox), BRIEF.md + STATO-PIANO.md al primo commit
- [x] Benchmark before definito con Lorenzo (task: piano refactoring fittizio Report.jsx) ed eseguito → baseline onesta in shortlist-A.md (5 metriche di confronto)
- [x] Ricerca area A: marketplace ufficiale Anthropic → 3 candidati in shortlist-A.md (feature-dev, hookify, soluzione nativa zero-dipendenze)
- [x] Uscita sessione: shortlist presentata a Lorenzo → **OK ricevuto** su hookify + reviewer nativo (v. Decisioni). Condizione d'ingresso Sessione 2 soddisfatta.
- [x] Nota area B: trovato plugin ufficiale Anthropic `frontend-design` ("avoids generic AI aesthetics") — non installato, da valutare in Sessione 2

### Sessione 2 — 2026-07-02 (aperta, stessa giornata)
Richieste di Lorenzo all'ingresso (tutte registrate):
- [x] Metrica 4 del benchmark riformulata come da sua indicazione (v. shortlist-A.md)
- [x] **Roundtrip bundle VERIFICATO**: feature/agent-upgrade importato nel repo reale di Lorenzo, 5 commit [potenziamento] presenti sopra 1437a0f
- [x] Lock orfani rimossi da Lorenzo. NUOVA anomalia minore: il suo `git branch -D test-write-check` è fallito ricreando `refs/heads/test-write-check.lock` → per Lorenzo: `rm -f .git/refs/heads/test-write-check.lock && git branch -D test-write-check` (non bloccante)
- [ ] Stash → richiesto a Lorenzo nel recap finale (comando suo: `git stash` SENZA -u; serve solo se/quando lavorerà sul branch nella cartella reale)
- [x] **Benchmark AFTER eseguito e confrontato** (v. shortlist-A.md): piano esplicito SÌ, copertura 431/431+file collegati, reviewer separato con verdetto DA RIVEDERE e 7 problemi intercettati (incluso 1 claim errato corretto prima della consegna), claim non verificati 3→0. Metrica 3 (hook) pendente in Claude Code CLI.
- [x] **Area B completata**: `dossier-UX/00-stato-attuale.md` (analisi statica: Inter globale, viola #534AB7 triplicato hardcoded, emoji badge, densità consumer) + 3 direzioni ancorate a file reali (terminale-di-club, broadcast-sportivo, quiete-editoriale) + valutazione frontend-design (raccomandato, NON installato — decisione a Lorenzo).
- [x] **Hookify INSTALLATO** — checkpoint eseguito: 896 righe di Python lette per intero (stdlib pura, zero rete/scritture/subprocess, legge solo `.claude/hookify.*.local.md` del cwd). Sorprese dichiarate a Lorenzo: (1) fail-open — in caso di errore dello script l'operazione PASSA (guardrail, non cassaforte); (2) le regole devono chiamarsi `*.local.md`, non escluse dal .gitignore di FanIQ → versionate nel branch. Test funzionale: 6/6 casi ok (deny su rm -rf / push main / npm install / scrittura frontend-src; pass su potenziamento/, backend/tests/, npm run build).
- [x] **DOVE installato**: `.claude/settings.json` (enabledPlugins hookify@claude-plugins-official — VERSIONATO) + 3 regole `.claude/hookify.*.local.md` (VERSIONATE): conferma-distruttivi, conferma-installazioni, pausa-faniq (quest'ultima TEMPORANEA, da rimuovere a fine ciclo). Codice plugin: scaricato da Claude Code in ~/.claude alla prima sessione sulla macchina di Lorenzo (globale ma inerte, rimozione: /plugin uninstall hookify).
- [x] **Reviewer nativo creato**: `.claude/agents/reviewer.md` (VERSIONATO) — sola lettura (Read/Grep/Glob), planModeBehavior force, checklist: claim non verificati, coerenza interna, copertura, vincoli CLAUDE.md, rischi.
- [x] **Verifica Cowork vs CLI (punto 4)**: gli hook di hookify NON agiscono nella sessione Cowork corrente (test empirico: comando contenente il pattern eseguito senza blocco — il plugin non è caricato dal sandbox). Agiranno in Claude Code CLI sulla macchina di Lorenzo alla prossima apertura del progetto sul branch (download plugin al primo avvio). CONSEGUENZA per il benchmark after: misurabili qui le metriche 1-2-4-5 (pianificazione, copertura, revisione separata, claim); la metrica 3 (conferme via hook) va verificata da Lorenzo in Claude Code CLI — annotato come pendente, non dichiarato "fatto".
### Sessione 3 — non iniziata

---

## Mappa FanIQ (checkpoint 1 — presentata)

- **Monorepo unico**: frontend/ (React 18 + Vite + Tailwind + Recharts) + backend/ (FastAPI + SQLAlchemy) → un solo branch.
- **Deploy verificati dai file**: Vercel (frontend/vercel.json), Render (backend/render.yaml), Neon PostgreSQL (backend/.env.example), OpenAI API (opzionale, chat).
- **Anomalie segnalate**: render.yaml dichiara PYTHON_VERSION=3.9.18 vs CLAUDE.md che impone 3.11 (solo segnalato, FanIQ in pausa); working tree di main sporco (docs marketing modificati, CSV demo cancellati, ~12 untracked — preesistenti, non miei).

## Decisioni di Lorenzo

| Data | Decisione | Nota |
|------|-----------|------|
| 07-02 | Permesso cancellazione file: **NEGATO** (definitivo) | Non richiederlo più. Workaround clone+bundle adottato. |
| 07-02 | Modifiche non committate su main: **stash** | Scelto da Lorenzo; esecuzione non confermata. Irrilevante per il clone (parte da main committato). |
| 07-02 | Stile di lavoro: **autonomia con avvisi sui pericoli** | Lorenzo non vuole fare da esecutore comando-per-comando. Checkpoint solo su decisioni vere (installazioni, scelte). Spiegare i rischi in linguaggio semplice, poi procedere. |
| 07-02 | **Shortlist A: OK esplicito** su hookify + reviewer nativo | Divisione senza sovrapposizioni: conferme→hookify, critica→subagente reviewer nativo, pianificazione→plan mode. L'hook di conferma scritto a mano (parte del candidato 3) è ESCLUSO per non duplicare hookify. Vincolo verificato da fonti primarie e promesso a Lorenzo: abilitazione hookify SOLO nel `.claude/settings.json` di progetto (versionato) — MAI a livello utente; regole in `.claude/hookify.*.md` nel branch; unico residuo globale = download inerte in ~/.claude, rimovibile con `/plugin uninstall hookify`. |

## Cosa è installato e dove

Niente ancora. (Regola: dichiarare sempre "questo va in [percorso], che è [versionato/non versionato/globale]".)

## Anomalie aperte (aggiornate a fine Sessione 2)

**NUOVA — conflitto checkout futuro (colpa del mirroring, mia):** i file mirror nella cartella reale (`potenziamento/*`, `.claude/settings.json`, `.claude/hookify.*.local.md`, `.claude/agents/reviewer.md`) sono untracked su main ma identici a file tracciati nel branch → `git checkout feature/agent-upgrade` verrà RIFIUTATO da git ("untracked working tree files would be overwritten"). Rimedio quando Lorenzo vorrà lavorare sul branch: cancellare prima i mirror (`rm -rf potenziamento && rm .claude/settings.json .claude/hookify.*.local.md && rm -r .claude/agents`) — nessuna perdita: sono copie identiche di file nel branch. Io non posso farlo (niente permesso di cancellazione).

## Anomalie storiche

1. Lock orfani in .git/ del repo di Lorenzo — **scadenza: subito**, bloccano il fetch del roundtrip (un file .lock preesistente fa fallire ogni operazione git anche sulla sua macchina).
2. Stash non confermato — **scadenza: entro fine Sessione 2**. ATTENZIONE: consigliare `git stash` SENZA `-u`: con `-u` verrebbero accantonati anche i file untracked di potenziamento/ (bundle incluso!). Gli untracked preesistenti sono inerti, possono restare.
3. A fine ciclo: ricordare a Lorenzo l'eventuale git stash pop.

**Hookify e non-persistenza del sandbox (risposta alla richiesta 4 di Lorenzo):** il download in ~/.claude del sandbox svanisce a ogni sessione, ed è previsto: ciò che conta è versionato (abilitazione in `.claude/settings.json` di progetto + regole `.claude/hookify.*.md`). Sulla macchina di Lorenzo, Claude Code legge quei file e scarica il plugin una volta nel SUO ~/.claude, che persiste. Nel sandbox Cowork la riattivazione a inizio sessione — se necessaria — è un passo previsto del ripristino, non una scoperta a metà sessione. Punto ancora da verificare all'installazione: se gli hook dei plugin agiscono nelle sessioni Cowork o solo in Claude Code CLI; se solo CLI, il benchmark after andrà eseguito lì e lo si documenta.

## Prossimo passo previsto

Sessione 2 (ingresso OK):
1. Installazione hookify — checkpoint prima dell'installazione; leggere per intero gli script Python del plugin prima di attivarlo (cautela di sicurezza del brief); abilitazione solo project-level; verifica subito dopo con azione banale che l'hook si comporti come atteso.
2. Creazione `.claude/agents/reviewer.md` (subagente reviewer, planModeBehavior force) — commit atomico separato.
3. Benchmark AFTER: stesso identico task (piano refactoring fittizio Report.jsx) + confronto sulle 5 metriche in shortlist-A.md.
4. Verifica da fare: capire se gli hook di hookify agiscono anche nelle sessioni Cowork o solo in Claude Code CLI — documentare l'esito.
5. Analisi statica dashboard (area B) + ricerca riferimenti; valutare plugin ufficiale `frontend-design`.
