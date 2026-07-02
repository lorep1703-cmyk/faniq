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

### Sessione 2 — non iniziata
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

## Anomalie aperte

1. Lock orfani in .git/ del repo di Lorenzo — attende rm -f da parte sua.
2. Stash scelto ma non confermato come eseguito.
3. A fine ciclo: ricordare a Lorenzo l'eventuale git stash pop.

## Prossimo passo previsto

Sessione 2 (ingresso OK):
1. Installazione hookify — checkpoint prima dell'installazione; leggere per intero gli script Python del plugin prima di attivarlo (cautela di sicurezza del brief); abilitazione solo project-level; verifica subito dopo con azione banale che l'hook si comporti come atteso.
2. Creazione `.claude/agents/reviewer.md` (subagente reviewer, planModeBehavior force) — commit atomico separato.
3. Benchmark AFTER: stesso identico task (piano refactoring fittizio Report.jsx) + confronto sulle 5 metriche in shortlist-A.md.
4. Verifica da fare: capire se gli hook di hookify agiscono anche nelle sessioni Cowork o solo in Claude Code CLI — documentare l'esito.
5. Analisi statica dashboard (area B) + ricerca riferimenti; valutare plugin ufficiale `frontend-design`.
