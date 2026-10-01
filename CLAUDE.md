# FanIQ — Guida per gli agenti AI (Claude Code; Codex la legge tramite AGENTS.md)

**A inizio sessione leggi `CONTEXT_HANDOFF.md`**: stato attuale, questioni aperte, note dell'ambiente di test. Questo file contiene solo regole stabili.

## Progetto

SaaS B2B di fan intelligence per club di calcio italiani (Serie C / Lega Pro). Multi-tenant: ogni club vede solo i propri dati.

- **Backend**: FastAPI + SQLAlchemy (`backend/`). **Frontend**: React + Vite + Tailwind + Recharts (`frontend/src/`). Versioni in `requirements.txt` / `package.json`.
- **Database**: PostgreSQL su Neon in produzione (RLS attivo); SQLite in locale se `FANIQ_DATABASE_URL` non è impostato.
- **Deploy**: Render (backend) e Vercel (frontend), automatico al push su `main`.
- **Chat AI**: OpenAI, con anonimizzazione dei dati personali (`services/chat.py`).
- Dove guardare: `routers/` = endpoint, `services/` = logica, `services/intelligence/` = Fan Intelligence Engine, `frontend/src/api/client.js` = tutte le chiamate API.

## Comandi

```bash
./start.sh                                     # backend :8000 + frontend :3000
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
cd backend && source .venv/bin/activate && FANIQ_JWT_SECRET=test python -m pytest tests/ -v   # serve il venv (Python 3.11); senza il secret i test non partono
cd frontend && npm run build
```

**Variabili d'ambiente del backend**
- `FANIQ_JWT_SECRET` — obbligatoria, senza il backend non parte.
- `FANIQ_DATABASE_URL` (default SQLite), `FANIQ_CORS_ORIGINS` (default localhost:3000,5173), `FANIQ_OPENAI_MODEL` (default gpt-4o).
- `FANIQ_FRONTEND_URL` — obbligatoria in prod: base dei link nelle email di recupero password.
- `FANIQ_SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` e `FANIQ_MAIL_FROM` (`FanIQ <indirizzo@gmail.com>`, uguale all'utente SMTP) — servono per inviare email. Su Render: Gmail dedicato, `smtp.gmail.com:587` + password per app.
- `FANIQ_PASSWORD_RESET_MINUTES` — validità del link di recupero, default 60.

## Convenzioni

- **Ogni endpoint autenticato** usa `club: Club = Depends(get_current_club)`: valida il JWT e attiva l'RLS con `SET LOCAL app.current_club_id`, **una sola volta per richiesta**. `SET LOCAL` si azzera al `commit()`/`rollback()`: su Postgres le query dopo un commit a metà endpoint, o in un task in background, non hanno più il contesto del club.
- **Filtra sempre esplicitamente** `Model.club_id == club.id` su ogni query di tabelle tenant, anche in delete e update: su SQLite (in locale) l'RLS non esiste, e su Postgres è una seconda difesa per i casi sopra.
- **"Recente" va misurato sui dati del club, non su `date.today()`**: con dati storici o in pausa estiva le funzioni ancorate alla data di sistema non mostrano nulla senza errori (elenco dei punti noti nell'handoff).
- **Rate limiting**: middleware custom in `main.py` (`_RATE_LIMITS`), non slowapi. Nuove righe solo con l'ok di Lorenzo.
- **Frontend**: niente context globale (state locale per pagina), solo classi Tailwind, chart solo Recharts, icone solo lucide-react. Le chiamate API stanno in `client.js`: restituisce già il `.data`, su 401 fa logout, e gli altri errori arrivano già leggibili in `error.userMessage` (non riscrivere la gestione degli errori nelle pagine). Unica eccezione: login e registrazione in `Login.jsx` usano `fetch` diretto. È flusso di autenticazione, quindi non toccarlo.
- **Non riscrivere feature esistenti: leggi prima il codice.** Sono complete, tra le altre: RFM, Business Score, Fan Intelligence Engine (5 stadi), import CSV, privacy GDPR, export, partite/predizione, recupero password. `services/intelligence/renewal.py` è l'**unica fonte** della probabilità di rinnovo in tutta l'app.

## Vincoli di sicurezza — NON NEGOZIABILI

1. Non modificare autenticazione, JWT o middleware di sicurezza: `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`.
2. Non modificare la logica RLS PostgreSQL. Ogni nuova query eredita il contesto tenant.
3. Non usare dati reali. Solo i dataset sintetici in `sample_csv/`.
4. Non esporre fan_id o dati personali in log, console output o messaggi di errore.
5. Non suggerire soluzioni che compromettano l'isolamento multi-tenant.
6. Non installare librerie senza conferma esplicita di Lorenzo.

## Note operative

- Python **3.11** in produzione (`backend/.python-version`): non passare a 3.12.
- `Base.metadata.create_all()` non altera colonne esistenti su Neon: per nuove colonne serve un `ALTER TABLE` manuale nel SQL Editor di Neon.
- **Le email di recupero password non partono in produzione** (decisione di Lorenzo, 30/09/2026): Render free blocca l'SMTP in uscita, e nei log compare `Invio email '...' fallito: OSError`. Codice e variabili sono già a posto. Al primo club: **A)** Render a pagamento (nessuna modifica al codice), oppure **B)** dominio proprio + Brevo via API HTTPS (piccola modifica a `services/email.py`). **Sconsigliato** Brevo senza dominio proprio: riscrive il mittente Gmail e le email rischiano lo spam. Nel frattempo i reset si fanno a mano.
- Su Render l'IP nei log è quello reale del client: il rate limit per IP distingue gli utenti.

## Commit e push

- **Committa sempre** a fine fix o sessione: niente modifiche lasciate in sospeso.
- **Il push lo fa solo Lorenzo**, dal suo terminale (`git push origin main` fa partire il deploy). Gli agenti annunciano cosa c'è da pushare, commit inclusi, e si fermano lì. Due blocchi tecnici, da non aggirare in nessun modo (niente flag alternativi, niente comandi equivalenti, niente `--no-verify`):
  - **hookify** (`.claude/hookify.conferma-distruttivi.local.md`, solo Claude Code): blocca ogni push, tranne quello non forzato su un ramo `claude/...` delle sessioni cloud (lì il lavoro va salvato e non parte nessun deploy). Vale anche se Lorenzo dice "vai" in chat.
  - **`.githooks/pre-push`** (ogni agente, Codex incluso; si attiva con `git config core.hooksPath .githooks` su ogni nuovo clone): per un push su `main`, un push forzato o la cancellazione di un ramo remoto chiede di scrivere `si` in un terminale. Gli agenti non hanno un terminale, quindi vengono bloccati. Vietato modificarlo o disattivarlo senza richiesta di Lorenzo.
- Lo stesso hookify blocca per Claude Code anche `rm -rf`, `git reset --hard`, `dd if=`, `chmod -R 777`, e `.claude/hookify.conferma-installazioni.local.md` blocca le installazioni (npm/pip/brew, `curl | sh`): se servono, li esegue Lorenzo.
- Codex ha in più il suo isolamento senza rete e le regole in `.codex/` (`config.toml`, `rules/faniq.rules`): `git push` vietato, `rm -rf` e `reset --hard` solo dopo la conferma di Lorenzo.
- **Non creare file di documentazione** non richiesti (README, ADR, ecc.): lo stato va in `CONTEXT_HANDOFF.md`, le idee in `product/feature_ideas.md`.
