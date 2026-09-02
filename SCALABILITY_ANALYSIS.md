# FanIQ — Fix Scalabilità: Prompt per Claude Code
> Documento operativo: ogni sezione è un prompt autonomo da passare a Claude Code.
> Ordine consigliato: eseguire in sequenza, testare dopo ogni fix.
> Target: reggere 2.500 abbonati + 1.000 shop per club, multi-club.

---

## Contesto da premettere a OGNI prompt

Incolla questo blocco all'inizio di qualsiasi prompt prima di iniziare i fix:

> Stai lavorando su FanIQ, un SaaS B2B multi-tenant per fan intelligence di club sportivi. Il backend è FastAPI + SQLAlchemy 2.0 + PostgreSQL (Neon) con Row-Level Security attiva. NON toccare: autenticazione, JWT, middleware di sicurezza, logica RLS in `tenant.py`, `services/auth.py`, `routers/auth.py`. Prima di modificare qualsiasi file, leggilo interamente. Dopo ogni modifica, verifica che i test esistenti in `backend/tests/` passino ancora.

---

## FIX #1 + #2 — CRITICO: Refresh Intelligence rotto (sessione DB + cache)

**Contesto per Claude Code:**

Nel file `backend/routers/intelligence.py` esistono due bug collegati che rendono il refresh dell'Intelligence Engine completamente inutile.

Primo bug: la funzione `_do_refresh` calcola l'intelligence ma non salva il risultato in cache. La funzione `_get_or_compute` è quella che salva in cache, ma non viene chiamata da `_do_refresh`. Risultato: dopo ogni refresh, la prossima richiesta a `/api/intelligence/club` trova la cache vuota e ricalcola tutto da zero.

Secondo bug: la sessione database `db` viene passata a `_do_refresh` dall'endpoint FastAPI tramite `Depends(get_db)`. FastAPI chiude quella sessione quando invia la HTTP response, ma il background task gira dopo — quindi il task eredita una sessione già chiusa e fallisce silenziosamente senza loggare errori chiari.

**Cosa deve fare Claude Code:**

Leggere per intero `backend/routers/intelligence.py`. Modificare `_do_refresh` in modo che: (1) crei una sessione database propria internamente invece di riceverla come parametro, (2) salvi il risultato di `compute_club_intelligence` nella cache usando la stessa chiave usata da `_get_or_compute`, (3) chiuda la sessione nel blocco finally, (4) loggi l'eccezione in modo esplicito in caso di errore. Aggiornare di conseguenza l'endpoint `refresh_club_intelligence` rimuovendo la dipendenza `db` e aggiornando la chiamata a `background_tasks.add_task`. Verificare che il comportamento della cache dopo il refresh sia coerente con quello di `_get_or_compute`.

**Vincoli:** non cambiare la struttura degli endpoint, non cambiare il formato della response, non toccare la logica di calcolo in `services/intelligence/engine.py`.

---

## FIX #3 — ALTO: Dashboard carica tutti i fan in memoria

**Contesto per Claude Code:**

Nel file `backend/services/analytics.py`, le funzioni `dashboard_stats` e `dashboard_cross_source` usano entrambe `get_all_fans_raw`, che carica TUTTI i fan con le loro relazioni (abbonamenti, biglietti, shop_orders) in memoria Python tramite `joinedload`. Con 2.500 fan reali questa operazione crea decine di migliaia di oggetti ORM in RAM, e succede due volte separate ad ogni apertura della dashboard perché le due funzioni non condividono né cache né risultato.

Il pattern corretto è già presente nello stesso progetto: guarda `dashboard_summary` in `backend/routers/dashboard.py` — usa `func.count` e `func.sum` direttamente in SQL senza caricare nulla in Python.

**Cosa deve fare Claude Code:**

Leggere per intero `backend/services/analytics.py` e `backend/routers/dashboard.py`. Riscrivere `dashboard_stats` usando esclusivamente query SQL aggregate (COUNT, SUM) sulle tabelle `fans`, `abbonamenti`, `biglietti`, `shop_orders` filtrate per `club_id`. Il risultato finale deve avere gli stessi campi di prima: `total_fans`, `fans_with_email`, `spesa_media`, `total_revenue`. Riscrivere `dashboard_cross_source` usando query SQL aggregate per contare i fan per numero di fonti attive (abbonamento, biglietto, shop), senza caricare oggetti Fan in Python. Verificare che `get_all_fans_raw` resti disponibile perché usata da `compute_fan_segments` — non eliminarla, solo smettere di chiamarla dalle due funzioni target.

**Vincoli:** il formato della response JSON di entrambe le funzioni deve restare identico. Non modificare `compute_fan_segments`. Verificare con un test manuale che i numeri tornino coerenti con quelli precedenti.

---

## FIX #4 — ALTO: Intelligence `/club` carica i fan due volte

**Contesto per Claude Code:**

Nel file `backend/routers/intelligence.py`, l'endpoint `get_club_intelligence` chiama prima `_get_or_compute` (che calcola o legge dalla cache l'intelligence di tutti i fan) e poi fa una seconda query separata `db.query(Fan).filter(...).all()` per caricare tutti i fan di nuovo — l'unico scopo è prendere nome e cognome. Con 2.500 fan questo significa caricare 2.500 oggetti ORM aggiuntivi ad ogni richiesta, anche quando la cache intelligence è calda.

**Cosa deve fare Claude Code:**

Leggere per intero `backend/routers/intelligence.py`. Modificare `_get_or_compute` in modo che, al momento di calcolare e salvare in cache l'intelligence del club, carichi anche nome e cognome di ogni fan con una query SQL mirata (solo le colonne `id`, `nome`, `cognome` — non l'oggetto Fan completo) e li includa già nella struttura serializzata che viene salvata in cache. Aggiornare `get_club_intelligence` in modo che non esegua più la seconda query sui fan — i dati di nome e cognome devono già essere presenti in ciò che restituisce `_get_or_compute`. Assicurarsi che `_do_refresh` (dopo il Fix #1) segua lo stesso pattern, così la cache aggiornata dal refresh contenga già nome e cognome.

**Vincoli:** il formato della response JSON dell'endpoint `/club` deve restare identico. Non modificare `_serialize`. Non toccare `compute_club_intelligence` in `engine.py`.

---

## FIX #5 — MEDIO: Doppio trigger del refresh per lo stesso club

**Contesto per Claude Code:**

Nel file `backend/routers/intelligence.py`, l'endpoint `POST /club/refresh` non ha nessun controllo per evitare che parta due volte in parallelo per lo stesso club. Se due richieste arrivano in rapida successione (es. doppio click, due tab aperte), partono due background task che eseguono lo stesso calcolo pesante in contemporanea, saturando il worker.

**Cosa deve fare Claude Code:**

Leggere l'endpoint `refresh_club_intelligence` in `backend/routers/intelligence.py`. Aggiungere un controllo all'inizio dell'endpoint: se `_refresh_jobs` già registra uno stato `"queued"` o `"running"` per quel `club_id`, restituire immediatamente la risposta con lo stato attuale invece di accodare un nuovo task. Il formato della response deve restare compatibile con quello già esistente.

**Vincoli:** non usare lock o semafori — il semplice check sul dizionario `_refresh_jobs` è sufficiente per ora. Non cambiare la struttura dell'endpoint.

---

## FIX #6 — MEDIO: TTL cache troppo breve

**Contesto per Claude Code:**

Nel file `backend/config.py`, la variabile `ANALYTICS_CACHE_TTL` ha default 300 secondi (5 minuti). Su Render Free il server si spegne dopo 15 minuti di inattività e la cache in-memory si azzera ad ogni riavvio. Con un TTL breve, anche in condizioni normali la cache scade spesso e ogni accesso successivo alla scadenza rifà il calcolo pesante.

**Cosa deve fare Claude Code:**

Cambiare il valore di default di `ANALYTICS_CACHE_TTL` in `backend/config.py` da `300` a `900` secondi. Aggiungere un commento che spiega il ragionamento: cache più lunga = meno calcoli ripetuti tra un riavvio e l'altro. Verificare che la variabile d'ambiente `FANIQ_CACHE_TTL` continui a permettere l'override dall'esterno (comportamento già presente, non va modificato).

**Vincoli:** nessuna altra modifica a `config.py`. Non toccare la logica di cache in `services/cache.py`.

---

## FIX #7 — BASSO: `per_page` max fuorviante su endpoint intelligence

**Contesto per Claude Code:**

Nel file `backend/routers/intelligence.py`, il parametro `per_page` dell'endpoint `/club` ha un limite massimo di 5.000. Questo valore è fuorviante: la paginazione avviene in memoria Python su una lista già completamente caricata — non c'è nessuna query SQL con LIMIT. Il cap a 5.000 non porta nessun beneficio di performance e crea aspettative sbagliate su come funziona l'endpoint.

**Cosa deve fare Claude Code:**

Nel file `backend/routers/intelligence.py`, ridurre il limite massimo del parametro `per_page` da `5000` a `200`, allineandolo al valore già usato nell'endpoint renewal in `backend/routers/renewal.py`. Aggiungere un commento inline che documenta che la paginazione è attualmente in-memory e che la paginazione DB-level è un'ottimizzazione futura.

---

## Riepilogo priorità e dipendenze

| Fix | Priorità | Dipende da | File coinvolti |
|-----|----------|------------|----------------|
| #1 + #2 | 🔴 CRITICO — fare per primo | — | `routers/intelligence.py` |
| #3 | 🟠 ALTO — fare subito dopo | — | `services/analytics.py` |
| #4 | 🟠 ALTO — fare subito dopo | Fix #1 (stessa cache) | `routers/intelligence.py` |
| #5 | 🟡 MEDIO | Fix #1 | `routers/intelligence.py` |
| #6 | 🟡 MEDIO | — | `config.py` |
| #7 | 🟢 BASSO | — | `routers/intelligence.py` |

Fix #1/#2 e Fix #3 si possono assegnare a due sessioni Claude Code in parallelo — lavorano su file diversi.
Fix #4 e #5 vanno fatti dopo il #1 perché modificano lo stesso file con logica che dipende dal refresh fixato.

---

## Cosa NON toccare (ricordarlo sempre a Claude Code)

- `tenant.py`, `services/auth.py`, `routers/auth.py`, middleware in `main.py`
- Logica RLS PostgreSQL
- `services/intelligence/engine.py`, `decay.py`, `journey.py`, `anomaly.py`, `ambassador.py`, `renewal.py`
- `fan_intelligence.py`, `intelligence_config.py`
- Qualsiasi test in `backend/tests/` — solo verificare che passino, mai modificarli per far passare i test

---

## Infrastruttura — quando fare l'upgrade (non codice, decisioni operative)

| Trigger | Azione | Costo aggiuntivo |
|---------|--------|-----------------|
| Primo club reale onboarded | Render Starter — server sempre sveglio, no cold start | +$7/mese |
| 3+ club attivi con uso quotidiano | Neon Launch — più compute ore DB | +$19/mese |
| 5+ club attivi | Upstash Redis free tier — cache condivisa tra worker | $0 |
| 10+ club attivi | Render Standard + worker dedicato intelligence | +$18/mese |

Vercel resta gratuito fino a decine di club — frontend statico, non è un problema.
