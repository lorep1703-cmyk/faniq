# Decisions Log — FanIQ

Registro delle decisioni confermate. Ogni decisione ha data, rationale e fonte.
**Non cancellare mai una voce — aggiungere una nuova voce se la decisione cambia.**

---

## Formato

```
### [D-XX] — [Titolo decisione]
**Data:** YYYY-MM-DD
**Stato:** Confermata / Rivista / Superata
**Chi ha deciso:** [Nome]
**Contesto:** [Perché era necessario decidere]
**Decisione:** [Cosa è stato deciso]
**Rationale:** [Perché questa opzione e non altre]
**Impatto:** [Cosa cambia]
**File collegati:** [link ai file rilevanti]
```

---

## Decisioni tecniche

### D-01 — Stack tecnologico
**Data:** Ante 2026-06-22 (decisione precedente al workspace)
**Stato:** Confermata
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** Scelta dello stack per costruire FanIQ MVP
**Decisione:** FastAPI + PostgreSQL (Neon) per il backend, React + Vite per il frontend, Render + Vercel per il deploy.
**Rationale:** Stack familiare al founder, costi iniziali bassi, buona scalabilità per MVP.
**Impatto:** Tutte le decisioni tecniche successive dipendono da questo stack.
**File collegati:** `context/overview.md`

### D-02 — Architettura multi-tenant con RLS
**Data:** Ante 2026-06-22
**Stato:** Confermata
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** FanIQ serve club diversi — ogni club deve vedere solo i propri dati.
**Decisione:** Row-Level Security (RLS) su PostgreSQL per l'isolamento dei dati.
**Rationale:** Soluzione nativa a livello di database — più sicura di filtri applicativi.
**Impatto:** Ogni modifica al database richiede attenzione alle policy RLS. Non toccare senza approvazione.
**File collegati:** `CLAUDE.md` (vincoli di sicurezza)

### D-03 — Stripe integrato ma non attivato
**Data:** Ante 2026-06-22
**Stato:** Superata da D-06
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** Il prodotto deve poter incassare, ma nessun cliente ancora.
**Decisione:** Stripe è integrato nel codice ma non attivato — da attivare prima della prima demo.
**Rationale:** Meglio averlo pronto che attivarlo di fretta dopo la firma.
**Impatto:** —

---

## Decisioni di go-to-market

### D-04 — Primo target: Pro Vercelli
**Data:** 2026-06-22
**Stato:** Confermata
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** Primo club da approcciare per la prima vendita.
**Decisione:** Pro Vercelli — club della città di Vercelli, stesso territorio del fondatore.
**Rationale:** Vantaggio geografico e potenzialmente relazionale. Buon fit con ICP.
**Impatto:** Tutto il lavoro GTM dei prossimi 5 settimane è orientato a questo target.
**File collegati:** `gtm/icp.md`, `research/club_profiles.md`, `sales_assets/outreach_pro_vercelli.md`

### D-05 — Deadline primo cliente: fine luglio 2026
**Data:** 2026-06-22
**Stato:** Superata da D-07
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** Obiettivo temporale per la prima presentazione a un club reale.
**Decisione:** Tutto pronto (pricing, pitch, landing page) entro fine luglio 2026 per presentare a Pro Vercelli.
**Rationale:** Scadenza autoimposta per creare urgenza operativa.
**Impatto:** Roadmap e backlog costruiti su questa deadline.

### D-06 — Nessun sistema di pagamento nel prodotto
**Data:** 2026-10-01
**Stato:** Confermata (constatazione)
**Chi ha deciso:** verifica sul codice durante la pulizia del repo
**Contesto:** D-03 diceva "Stripe integrato ma non attivato".
**Decisione:** Stripe non è nel codice: c'era solo la colonna `stripe_customer_id`, rimossa come codice morto (commit `2e460a4`). Il sistema di pagamento è da scegliere e collegare prima del primo incasso.
**Impatto:** Supera D-03.

### D-07 — Deadline di fine luglio superata
**Data:** 2026-10-01
**Stato:** Aperta — nuova roadmap da definire con Lorenzo
**Contesto:** D-05 fissava presentazione a Pro Vercelli entro fine luglio 2026. Al 15/07 l'email di primo contatto era ancora una bozza non inviata.
**Decisione:** La deadline è superata; roadmap e backlog di giugno rimossi dal repo. Nuova roadmap da rifare (questione 7 in `CONTEXT_HANDOFF.md`).
**Impatto:** Supera D-05.

---

*Aggiornato il 1 ottobre 2026.*
