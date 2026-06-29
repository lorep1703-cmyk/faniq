# FanIQ — Security Audit

> **Data:** 2026-06-29
> **Scope:** analisi statica del codice sorgente — non include penetration test dinamico né analisi dei runtime di produzione
> **Versione analizzata:** branch `main`, commit più recente al momento dell'audit

---

## Punti di forza (cosa è già fatto bene)

- **JWT secret obbligatorio:** `config.py:37-39` — il backend crasha all'avvio se `FANIQ_JWT_SECRET` non è impostato. Nessun fallback hardcoded.
- **bcrypt per le password:** `services/auth.py:8` — `CryptContext(schemes=["bcrypt"])` con round automatici di passlib (12 round di default). Nessun MD5/SHA-1.
- **Token con scadenza:** `services/auth.py:21` — ogni JWT include `exp`. Il TTL di default è 7 giorni (configurabile via `FANIQ_JWT_EXPIRE_MINUTES`).
- **Dipendenza universale `get_current_club`:** ogni endpoint autenticato la usa come `Depends`. Nessun endpoint accetta `club_id` esplicito dal client.
- **RLS PostgreSQL:** `main.py:152-187` — `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` su 7 tabelle. Il `SET LOCAL` in `tenant.py:36` azzera il contesto ad ogni commit/rollback, impedendo cross-tenant leak nel pool.
- **Filtro `club_id` esplicito su SQLite:** ogni query ORM in tutti i router aggiunge `filter(...club_id == club.id)`. Coerente con la mancanza di RLS su dev.
- **Validazione `fan_id` + `club_id` su ogni endpoint:** `fans.py:20`, `renewal.py:21`, `partite.py:136`, `privacy.py:31-43` — nessuna lettura di fan di altri club tramite id.
- **Security headers:** `main.py:109-116` — `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `Referrer-Policy`, `Permissions-Policy` aggiunti a ogni risposta.
- **Dimensione upload limitata:** `upload.py:25-26` — `MAX_UPLOAD_SIZE_BYTES` (default 10 MB) verificata prima di processare il contenuto.
- **Validazione estensione file:** `upload.py:28-29` — solo file `.csv` accettati.
- **Pydantic su tutti i body POST:** `RegisterRequest`, `LoginRequest`, `ChatRequest`, `PartitaIn`, `ConsentUpdate` — nessun endpoint accetta dati raw non tipizzati.
- **Handler errori generici:** `main.py:99-105` — stack trace mai esposto al client.
- **Anonimizzazione PII nella chat AI:** `services/chat.py:18-21` — `CHAT_ANONYMIZE_PII=true` sostituisce nome/cognome con `Tifoso #ID` nel contesto inviato a OpenAI.
- **`.gitignore` corretto:** `.env`, `*.db`, `*.sqlite`, `venv/`, `.venv/` tutti esclusi.
- **Nessun secret hardcoded:** `OPENAI_API_KEY` e `FANIQ_JWT_SECRET` letti solo da env a runtime.

---

## CATEGORIA CRITICA — Vulnerabilità da correggere prima del go-live

### C-1 — CSV Formula Injection (Spreadsheet Injection)

**File:** `backend/services/csv_import.py:86-121`
**Descrizione:** Le celle del CSV importato (nome, cognome, avversario, prodotto, settore) vengono salvate nel database senza sanitizzazione. Un attaccante può caricare un CSV con una cella come `=HYPERLINK("https://evil.com","clicca")` o `=CMD|' /C calc'!A0` come nome fan. Quando un utente staff scarica l'export CSV via `GET /export/fans`, il file risultante contiene la formula. Aprendo il CSV in Excel/LibreOffice/Google Sheets, l'applicazione esegue la formula.

**Rischio concreto:** Un attaccante con accesso al pannello (es. ex-dipendente) carica dati malevoli → il CSV export scaricato da un dirigente esegue codice arbitrario o ruba credenziali tramite richieste a server esterni.

**Soluzione:** Aggiungere in `csv_import.py` una funzione di sanitizzazione che prefissa con `'` le celle che iniziano con `=`, `+`, `-`, `@`, `\t`, `\r`. Applicarla su tutti i campi di testo prima di `db.add(...)`.

```python
_FORMULA_CHARS = ('=', '+', '-', '@', '\t', '\r')

def _sanitize_cell(value: str | None) -> str | None:
    if value and value[0] in _FORMULA_CHARS:
        return "'" + value
    return value
```

---

### C-2 — Nessuna revoca token post-logout

**File:** `frontend/src/api/client.js:20-22`, `backend/services/auth.py:19-25`
**Descrizione:** Il logout è esclusivamente client-side (`localStorage.removeItem`). Il JWT rimane crittograficamente valido fino alla scadenza (7 giorni). Non esiste nessuna blacklist, refresh token o meccanismo di invalidazione lato server.

**Rischio concreto:** Se un token viene intercettato (XSS, network sniffing su HTTP, dispositivo condiviso), l'attaccante può autenticarsi per i successivi 7 giorni anche dopo che l'utente legittimo ha fatto logout. Scenario critico: un dipendente viene licenziato e fa logout, ma il token rubato in precedenza è ancora valido.

**Soluzione:** Implementare una blacklist in-memory (con TTL pari alla scadenza del token) o ridurre drasticamente `JWT_EXPIRE_MINUTES` (es. 15 min) introducendo un refresh token con revoca.

---

## CATEGORIA ALTA — Da correggere prima del primo cliente pagante

### A-1 — Nessun rate limiting sull'endpoint `/chat/`

**File:** `backend/routers/chat.py:22-25`, `backend/main.py:35-38`
**Descrizione:** Il rate limiting è attivo solo su `/auth/register` (5 req/min) e `/auth/login` (10 req/min). L'endpoint `POST /chat/` chiama OpenAI a ogni richiesta senza alcun throttling.

**Rischio concreto:** Un attaccante autenticato (o con token rubato) può inviare migliaia di richieste in loop, generando costi OpenAI illimitati (`CHAT_MAX_TOKENS=2048` per chiamata). A $0.005/1K token output, 10.000 chiamate = ~$100+ in pochi minuti.

**Soluzione:** Aggiungere `/chat/` ai `_RATE_LIMITS` in `main.py` (es. 20 req/min per IP) o implementare un rate limit per `club_id` estratto dal JWT.

---

### A-2 — Nessun rate limiting sugli endpoint computazionalmente pesanti

**File:** `backend/routers/intelligence.py:96-133`, `backend/routers/upload.py:14-34`, `backend/routers/export.py:24-58`
**Descrizione:** Gli endpoint `GET /api/intelligence/club` (calcola intelligence su tutti i fan), `POST /upload/{type}` (import CSV + ricalcolo analytics) e `GET /export/fans` (materializza tutti i fan in CSV) non hanno throttling.

**Rischio concreto:** Un attaccante autenticato può triggherare ripetutamente il bulk intelligence compute (`/api/intelligence/club/refresh`), saturando CPU e memoria su Render Free tier (512 MB RAM). L'upload endpoint accetta fino a 10 MB per request senza limiti di frequenza.

**Soluzione:** Aggiungere `/api/intelligence/club/refresh` e `/upload/` al rate limiter (es. 3 req/min). Per l'export, limitare a 10 req/min.

---

### A-3 — Errori eccezione OpenAI esposti al client

**File:** `backend/services/chat.py:72`
**Codice:** `return {"reply": f"Errore AI: {str(e)}", "model": OPENAI_MODEL}`
**Descrizione:** In caso di errore OpenAI (timeout, quota esaurita, errore API), il messaggio di eccezione grezzo viene restituito al client nella risposta JSON.

**Rischio concreto:** `str(e)` su un'eccezione OpenAI può contenere: il modello usato, dettagli sulle quote dell'account, header HTTP di risposta. Più rilevante: se `OPENAI_API_KEY` è malformata, il messaggio di errore potrebbe includere parti della chiave.

**Soluzione:** Sostituire con un messaggio generico: `"Errore durante la comunicazione con l'AI. Riprova."` e loggare l'eccezione completa server-side.

---

### A-4 — Credenziali demo hardcoded nel seed di migrazione

**File:** `backend/main.py:214`
**Codice:** `demo = Club(..., password_hash=hash_password("demo1234"))`
**Descrizione:** Se esiste un deployment PostgreSQL con fan orfani (migrazione da SQLite), `_seed_default_club()` crea un club con password `demo1234`. Il WARNING nel log (`cambia la password dal pannello!`) è l'unica protezione.

**Rischio concreto:** Se questa funzione viene eseguita in produzione e il log non viene monitorato, un aggressore che conosce lo slug `demo` può autenticarsi con password `demo1234` e accedere a dati reali dei tifosi. Il club creato non ha email, rendendo il reset password impossibile.

**Soluzione:** Generare una password casuale (es. `secrets.token_urlsafe(16)`) invece di `"demo1234"`, loggarla chiaramente come WARNING, e/o bloccare il login per club senza email verificata.

---

## CATEGORIA MEDIA — Miglioramenti consigliati

### M-1 — Header injection in Content-Disposition (export fans)

**File:** `backend/routers/export.py:53-57`
**Codice:** `filename = f"faniq_{segment or 'tutti'}{suffix}.csv"` → `Content-Disposition: attachment; filename={filename}`
**Descrizione:** Il parametro `segment` viene passato come query string `GET /export/fans?segment=...`. La normalizzazione (`.lower().replace(" ", "_")`) non rimuove `\r`, `\n`, `"` o `;`. Un valore come `segment=tutti%0d%0aX-Custom-Header:%20injected` potrebbe iniettare header HTTP aggiuntivi in alcuni framework/proxy.

**Rischio concreto:** Header injection. Nella pratica FastAPI/uvicorn sanitizza gli header, ma il pattern è scorretto e dipende dall'implementazione del server.

**Soluzione:** Usare `urllib.parse.quote(filename, safe='')` o validare `segment` contro una whitelist di valori ammessi prima di usarlo nel filename.

---

### M-2 — Errori eccezione CSV esposti al client in upload partite

**File:** `backend/routers/partite.py:122`
**Codice:** `errors.append(f"Riga {i}: {e}")`
**Descrizione:** In caso di eccezione durante il parsing del CSV partite, il `str(e)` dell'eccezione viene incluso nella risposta JSON all'utente.

**Rischio concreto:** Messaggio di errore potenzialmente tecnico (es. stack trace abbreviato, nome di classe Python) esposto al browser.

**Soluzione:** Catturare solo `ValueError` e `KeyError` con messaggi controllati; loggare le eccezioni unexpected server-side.

---

### M-3 — Mancanza del Content-Security-Policy header

**File:** `backend/main.py:109-116`
**Descrizione:** Il middleware `security_headers` imposta 5 header ma omette `Content-Security-Policy`. L'app React è una SPA che esegue JavaScript, e CSP è la principale difesa contro XSS.

**Rischio concreto:** In assenza di CSP, un eventuale XSS ha accesso illimitato al DOM, a `localStorage` (dove è salvato il JWT) e può exfiltrare il token.

**Soluzione:** Aggiungere almeno `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` al middleware (la modalità `unsafe-inline` è necessaria per Tailwind CDN o stili inline; rimuoverla se usi build statici).

---

### M-4 — Rate limiter in-memory non distribuito

**File:** `backend/main.py:34-68`
**Descrizione:** `_rate_store` è un dizionario Python in memoria. Su Render con più worker (o restart frequenti su Free tier), ogni processo ha il proprio contatore indipendente.

**Rischio concreto:** Con N worker, il limite effettivo diventa N × limite configurato. Un attaccante con client HTTP che parallelizza le richieste può aggirare il rate limiting.

**Soluzione:** Usare Redis come backend per il rate limiter (es. `slowapi` con Redis store) oppure configurare Render per girare su singolo worker (`--workers 1`).

---

### M-5 — `python-jose` non più mantenuto attivamente

**File:** `backend/requirements.txt:11`
**Versione:** `python-jose[cryptography]>=3.3.0`
**Descrizione:** `python-jose` ha avuto CVE di media gravità in passato (CVE-2024-33663: algoritmo `none` accettato in alcune configurazioni) e il progetto riceve aggiornamenti sporadici. L'uso di `algorithms=[JWT_ALGORITHM]` nel decode (`services/auth.py:29`) mitiga il CVE specifico, ma la libreria rimane un rischio a lungo termine.

**Soluzione:** Valutare la migrazione a `PyJWT` (maintainer attivi, API simile) dopo verifica di compatibilità con `python-jose`.

---

### M-6 — CORS: metodi e header illimitati

**File:** `backend/main.py:119-125`
**Codice:** `allow_methods=["*"], allow_headers=["*"]`
**Descrizione:** Tutti i metodi HTTP (inclusi `CONNECT`, `TRACE`) e tutti gli header sono consentiti nelle richieste cross-origin.

**Rischio concreto:** `TRACE` abilitato su alcune configurazioni nginx può facilitare attacchi XST (Cross-Site Tracing) per leggere cookie `HttpOnly`. `allow_headers=["*"]` amplia la superficie di attacco.

**Soluzione:** Restringere a: `allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]`, `allow_headers=["Authorization", "Content-Type"]`.

---

### M-7 — Dettagli eccezione dal parser CSV nel log

**File:** `backend/main.py:101`
**Codice:** `logger.error("Errore non gestito su %s: %s", request.url, exc, exc_info=True)`
**Descrizione:** Il generic error handler logga l'URL completo della richiesta insieme allo stack trace. L'URL può contenere query parameter con dati sensibili (es. `?segment=email@dominio.it`).

**Rischio concreto:** I log di Render (accessibili all'interno del team) potrebbero contenere email o dati personali dei tifosi, creando un problema GDPR di data minimization.

**Soluzione:** Loggare solo `request.url.path` (senza query string) negli error handler.

---

## CATEGORIA BASSA — Nice to have

### B-1 — `pandas` in `requirements.txt` non usato

**File:** `backend/requirements.txt:4`
**Descrizione:** `pandas>=2.0.0` è listato come dipendenza ma non risulta importato in nessun file Python del progetto (i CSV vengono parsati con il modulo stdlib `csv`). Pandas è una dipendenza molto pesante (~30 MB) che allarga la superficie di attacco senza essere necessaria.

**Soluzione:** Rimuovere da `requirements.txt` e verificare con `pip check`.

---

### B-2 — Algoritmo JWT HS256 (simmetrico)

**File:** `backend/services/auth.py:24`, `config.py`
**Descrizione:** HS256 usa la stessa chiave per firmare e verificare i token. È appropriato se il backend è un singolo servizio. Se in futuro si introducono microservizi o webhook che devono verificare i token, HS256 richiede di condividere il secret.

**Rischio concreto:** Basso nell'architettura attuale. Diventa rilevante in caso di espansione a multi-servizio.

**Soluzione:** Nessun cambio urgente. Considerare RS256 se si prevede verifica token in servizi terzi.

---

### B-3 — Prompt injection nel chat AI

**File:** `backend/services/chat.py:47-49`
**Descrizione:** I messaggi utente vengono passati direttamente a OpenAI senza sanitizzazione. Un utente malintenzionato potrebbe tentare prompt injection ("Ignora le istruzioni precedenti e...") per estrarre il contesto di sistema (che contiene statistiche del club).

**Rischio concreto:** Basso — il contesto di sistema contiene solo statistiche aggregate, non PII (se `CHAT_ANONYMIZE_PII=true`). Non è possibile ottenere credenziali o accedere al database tramite la chat.

**Soluzione:** Valutare l'aggiunta di un filtro base sui messaggi utente (max lunghezza, rimozione pattern noti di jailbreak). Non critico con l'anonimizzazione attiva.

---

### B-4 — `passlib` in stato di manutenzione ridotta

**File:** `backend/requirements.txt:13`
**Descrizione:** `passlib` è sostanzialmente unmaintained dall'ultimo release (1.7.4, 2020). Non ci sono CVE noti attivi, ma la libreria potrebbe non ricevere patch future per eventuali vulnerabilità di bcrypt.

**Soluzione:** Monitorare `pip audit`. Alternativa a lungo termine: `argon2-cffi` (Argon2 è superiore a bcrypt contro attacchi GPU).

---

### B-5 — `/health` endpoint non autenticato espone info di versione

**File:** `backend/main.py:141-143`
**Codice:** `return {"status": "ok"}`
**Descrizione:** L'endpoint è corretto per il monitoring, ma `FastAPI` espone anche `/docs` (Swagger UI) e `/redoc` in sviluppo, che rivelano l'intera struttura dell'API.

**Soluzione:** In produzione, disabilitare Swagger UI: `FastAPI(docs_url=None, redoc_url=None)` o proteggerla con basic auth.

---

### B-6 — Token JWT contiene `slug` e `nome` del club

**File:** `backend/services/auth.py:22`
**Descrizione:** Il payload JWT include `slug` e `nome` del club oltre al `sub` (club_id). Questo non è un rischio di sicurezza diretto (JWT è firmato), ma espone dati non necessari all'interno del token, che è decodificabile da chiunque abbia il token.

**Soluzione:** Rimuovere `slug` e `nome` dal payload JWT (il backend li legge comunque dal DB tramite `club_id`). Riduce anche la dimensione del token.

---

## Riepilogo

| # | Finding | Categoria | File principale | Soluzione sintetica |
|---|---------|-----------|-----------------|---------------------|
| C-1 | CSV Formula Injection | **CRITICA** | `services/csv_import.py:86-121` | Prefissare celle che iniziano con `=`,`+`,`-`,`@` con `'` |
| C-2 | Nessuna revoca token post-logout | **CRITICA** | `services/auth.py:19-25` | Blacklist JWT o refresh token con revoca |
| A-1 | No rate limit su `/chat/` | **ALTA** | `routers/chat.py:22-25` | Aggiungere `/chat/` a `_RATE_LIMITS` in `main.py` |
| A-2 | No rate limit su endpoint pesanti | **ALTA** | `routers/intelligence.py`, `upload.py` | Throttling su `/upload/` e `/api/intelligence/club/refresh` |
| A-3 | Eccezione OpenAI esposta al client | **ALTA** | `services/chat.py:72` | Messaggio generico + log server-side |
| A-4 | Password demo hardcoded nel seed | **ALTA** | `main.py:214` | Generare password casuale con `secrets.token_urlsafe()` |
| M-1 | Header injection in Content-Disposition | **MEDIA** | `routers/export.py:53-57` | `urllib.parse.quote(filename)` o whitelist segment |
| M-2 | Eccezione CSV esposta al client | **MEDIA** | `routers/partite.py:122` | Catch esplicito + messaggio controllato |
| M-3 | Mancanza Content-Security-Policy | **MEDIA** | `main.py:109-116` | Aggiungere header CSP al middleware |
| M-4 | Rate limiter in-memory non distribuito | **MEDIA** | `main.py:34-68` | Redis store o singolo worker |
| M-5 | `python-jose` poco mantenuto | **MEDIA** | `requirements.txt:11` | Valutare migrazione a `PyJWT` |
| M-6 | CORS metodi e header illimitati | **MEDIA** | `main.py:119-125` | Restringere `allow_methods` e `allow_headers` |
| M-7 | URL con query params nei log di errore | **MEDIA** | `main.py:101` | Loggare solo `request.url.path` |
| B-1 | `pandas` non usato in `requirements.txt` | **BASSA** | `requirements.txt:4` | Rimuovere la dipendenza |
| B-2 | JWT HS256 simmetrico | **BASSA** | `services/auth.py:24` | Nessun cambio urgente; valutare RS256 in futuro |
| B-3 | Prompt injection nella chat AI | **BASSA** | `services/chat.py:47-49` | Filtro lunghezza/pattern sui messaggi utente |
| B-4 | `passlib` poco mantenuto | **BASSA** | `requirements.txt:13` | Monitorare `pip audit`; valutare `argon2-cffi` |
| B-5 | Swagger UI esposta in produzione | **BASSA** | `main.py:27-31` | `FastAPI(docs_url=None, redoc_url=None)` in prod |
| B-6 | JWT payload contiene dati non necessari | **BASSA** | `services/auth.py:22` | Rimuovere `slug`/`nome` dal payload |
