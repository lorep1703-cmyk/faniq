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
**File collegati:** `governance/approval_gates.md`

### D-03 — Stripe integrato ma non attivato
**Data:** Ante 2026-06-22
**Stato:** Confermata (da completare)
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** Il prodotto deve poter incassare, ma nessun cliente ancora.
**Decisione:** Stripe è integrato nel codice ma non attivato — da attivare prima della prima demo.
**Rationale:** Meglio averlo pronto che attivarlo di fretta dopo la firma.
**Impatto:** Task urgente in `product/backlog.md` (P2).
**File collegati:** `product/backlog.md`, `strategy/risks.md` (R6)

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
**Stato:** Confermata
**Chi ha deciso:** Lorenzo Ponzi
**Contesto:** Obiettivo temporale per la prima presentazione a un club reale.
**Decisione:** Tutto pronto (pricing, pitch, landing page) entro fine luglio 2026 per presentare a Pro Vercelli.
**Rationale:** Scadenza autoimposta per creare urgenza operativa.
**Impatto:** Roadmap e backlog costruiti su questa deadline.
**File collegati:** `strategy/roadmap.md`

---

*Aggiornato il 22 giugno 2026.*
