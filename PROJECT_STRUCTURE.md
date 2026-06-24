# PROJECT_STRUCTURE.md — Guida al workspace FanIQ

Questo file spiega come è organizzato il workspace, a cosa serve ogni cartella e come evitare duplicazioni e conflitti.

---

## Struttura generale

```
faniq/
├── README.md                    ← Stato del progetto, obiettivi, quick reference
├── PROJECT_STRUCTURE.md         ← Questo file
├── instructions.md              ← Istruzioni operative per l'AI assistant
│
├── context/                     ← Identità fissa del progetto
├── strategy/                    ← Direzione a medio termine
├── gtm/                         ← Go-to-market: primo cliente, pricing, pitch
├── marketing/                   ← Posizionamento, landing page, messaggi
├── sales_assets/                ← Materiali per vendere (outreach, demo)
├── product/                     ← Idee prodotto, UI/UX, backlog
├── prompts/                     ← Libreria prompt pronti per Claude Code
├── research/                    ← Mercato, competitor, profili club
├── decisions/                   ← Decisioni prese e domande aperte
├── reviews/                     ← Changelog e review periodiche
└── governance/                  ← Regole operative e sicurezza
```

---

## Cartelle — dettaglio

### `context/`
**Cosa contiene:** L'identità stabile del progetto — cosa è FanIQ, a chi si rivolge, quali assunzioni guidano il lavoro.
**Quando aggiornare:** Solo quando cambia qualcosa di fondamentale (pivot, nuovo mercato target, cambio di vision).
**Non mettere qui:** Task operativi, idee non validate, numeri provvisori.
**File:**
- `overview.md` — descrizione del progetto, value proposition, stack, stato
- `assumptions.md` — ipotesi non ancora confermate che guidano le decisioni

### `strategy/`
**Cosa contiene:** Roadmap a 30-90 giorni e mappa dei rischi.
**Quando aggiornare:** Fine mese (Monthly Strategy Reset) o quando cambia la direzione.
**Non mettere qui:** Task granulari, idee di feature, copy.
**File:**
- `roadmap.md` — obiettivi e milestone con scadenze
- `risks.md` — rischi identificati con probabilità e impatto

### `gtm/`
**Cosa contiene:** Tutto ciò che serve per acquisire il primo cliente — ICP, pricing, pitch.
**Quando aggiornare:** Ogni volta che avanza il lavoro commerciale sul primo club.
**Non mettere qui:** Copy del sito (va in `marketing/`), codice.
**File:**
- `icp.md` — profilo del club ideale
- `pricing.md` — modello di pricing (da definire)
- `pitch.md` — struttura e contenuto della presentazione per Pro Vercelli

### `marketing/`
**Cosa contiene:** Posizionamento ufficiale, messaggi chiave, testi per la landing page.
**Quando aggiornare:** Quando si lavora sulla landing page o si ridefinisce il posizionamento.
**Non mettere qui:** Strategie di vendita diretta (vanno in `gtm/`), copy per email singole (vanno in `sales_assets/`).
**File:**
- `positioning.md` — messaggio principale, tagline, differenziatori
- `landing_page.md` — struttura e testo della landing page

### `sales_assets/`
**Cosa contiene:** Materiali pratici per la vendita: messaggi di outreach, script per la demo.
**Quando aggiornare:** Prima e dopo ogni contatto commerciale.
**Non mettere qui:** Strategia (va in `gtm/`), posizionamento (va in `marketing/`).
**File:**
- `outreach_pro_vercelli.md` — primo messaggio per Pro Vercelli
- `demo_script.md` — struttura della demo live

### `product/`
**Cosa contiene:** Idee di feature, note UI/UX, backlog non tecnico.
**Quando aggiornare:** Ogni volta che emerge un'idea prodotto o si riceve feedback.
**Non mettere qui:** Codice, PR, issue tecniche (restano su GitHub).
**File:**
- `feature_ideas.md` — idee future non ancora pianificate
- `ui_ux_notes.md` — osservazioni su esperienza utente
- `backlog.md` — lista prioritizzata di cosa fare sul prodotto

### `prompts/`
**Cosa contiene:** Libreria di prompt pronti da copiare in Claude Code.
**Quando aggiornare:** Ogni volta che si costruisce o usa un prompt efficace.
**Non mettere qui:** Conversazioni intere, output di Claude Code.
**File:**
- `prompt_library.md` — prompt organizzati per categoria

### `research/`
**Cosa contiene:** Analisi di mercato, competitor, profili dei club target.
**Quando aggiornare:** Quando si fa una nuova ricerca o si aggiornano dati esistenti.
**Non mettere qui:** Decisioni strategiche basate sulla ricerca (vanno in `strategy/`).
**File:**
- `competitor_analysis.md` — competitor diretti e indiretti
- `club_profiles.md` — profili dei club target con note commerciali

### `decisions/`
**Cosa contiene:** Registro delle decisioni prese e delle domande ancora aperte.
**Quando aggiornare:** Dopo ogni decisione importante o quando emerge un dubbio rilevante.
**Non mettere qui:** Idee non ancora valutate (vanno in `product/` o `gtm/`).
**File:**
- `decisions_log.md` — decisioni confermate con data e rationale
- `open_questions.md` — domande aperte con priorità

### `reviews/`
**Cosa contiene:** Changelog del workspace e note delle review periodiche.
**Quando aggiornare:** Ogni settimana (Weekly Review) e fine mese.
**File:**
- `changelog.md` — log cronologico delle modifiche al workspace

### `governance/`
**Cosa contiene:** Regole operative su cosa l'AI può fare autonomamente e cosa richiede approvazione.
**Quando aggiornare:** Solo se cambiano le regole operative del progetto.
**File:**
- `approval_gates.md` — policy di autonomia e sicurezza

---

## Regole anti-duplicazione

| Se vuoi registrare... | Mettilo in... |
|----------------------|---------------|
| Una decisione presa | `decisions/decisions_log.md` |
| Un dubbio o domanda aperta | `decisions/open_questions.md` |
| Un'ipotesi non confermata | `context/assumptions.md` |
| Un rischio identificato | `strategy/risks.md` |
| Un'idea di feature | `product/feature_ideas.md` |
| Un task sul prodotto | `product/backlog.md` |
| Un prompt per Claude Code | `prompts/prompt_library.md` |
| Dati su un competitor | `research/competitor_analysis.md` |
| Note su un club target | `research/club_profiles.md` |

---

## Come trattare fonti storiche o in conflitto

- Se un file contiene informazioni obsolete, aggiungere una nota `> ⚠️ Dato non verificato — aggiornare` invece di cancellare.
- Se due file sono in conflitto, segnalarlo in `decisions/open_questions.md` con riferimento ai file coinvolti.
- Non sovrascrivere mai una decisione storica: aggiungere una nuova voce in `decisions_log.md` con data aggiornata.

---

*Aggiornato il 22 giugno 2026.*
