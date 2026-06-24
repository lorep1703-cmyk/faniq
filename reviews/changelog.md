# Changelog — Workspace FanIQ

Log cronologico delle modifiche al workspace. Non è il changelog del codice (che sta su GitHub) — è il changelog delle decisioni, strategie e aggiornamenti documentali.

---

## 2026-06-22 — Setup iniziale workspace

**Tipo:** Setup
**Autore:** AI assistant (setup guidato da Lorenzo Ponzi)

### Creato
- Struttura completa del workspace (11 cartelle)
- `README.md` — stato del progetto e quick reference
- `PROJECT_STRUCTURE.md` — guida al workspace
- `instructions.md` — istruzioni operative per l'AI assistant
- `context/overview.md` — identità del progetto
- `context/assumptions.md` — ipotesi non confermate
- `strategy/roadmap.md` — roadmap Q3 2026
- `strategy/risks.md` — mappa dei rischi
- `gtm/icp.md` — Ideal Customer Profile
- `gtm/pricing.md` — opzioni di pricing
- `gtm/pitch.md` — struttura pitch per Pro Vercelli
- `marketing/positioning.md` — posizionamento e messaggi
- `marketing/landing_page.md` — struttura landing page
- `sales_assets/outreach_pro_vercelli.md` — bozza outreach
- `sales_assets/demo_script.md` — script demo live
- `product/feature_ideas.md` — idee feature future
- `product/ui_ux_notes.md` — note UI/UX
- `product/backlog.md` — backlog prioritizzato
- `prompts/prompt_library.md` — libreria prompt per Claude Code
- `research/competitor_analysis.md` — analisi competitor (template)
- `research/club_profiles.md` — profili club target
- `decisions/decisions_log.md` — log decisioni (5 decisioni registrate)
- `decisions/open_questions.md` — domande aperte (7 domande)
- `reviews/changelog.md` — questo file
- `governance/approval_gates.md` — policy autonomia e sicurezza

### Informazioni raccolte nell'intervista
- Ruolo AI: co-founder operativo / marketing strategist / research analyst / PM / technical advisor
- Prodotto: MVP completo, deployato, zero clienti
- Obiettivo: primo cliente (Pro Vercelli) entro fine luglio 2026
- Stack: FastAPI + PostgreSQL (Neon) / React + Vite / Render + Vercel / Stripe (non attivo)
- Vincoli sicurezza: no dati reali, no credenziali, no toccare auth/RLS senza approvazione

---

---

## 2026-06-22 — Sessione Brand Identity (prima sessione settimanale)

**Tipo:** Brand Identity
**Autore:** AI assistant (sessione schedulata autonoma)

### File aggiornati
- `marketing/brand_identity.md` — aggiunta sezione Tagline (PROPOSTA: "Conosci i tuoi tifosi. Davvero.") + marcatore sessione con audit qualità proposte esistenti
- `marketing/landing_page.md` — fix inline: parola vietata "insight" nella FAQ originale → sostituita con copy concreto
- `decisions/open_questions.md` — aggiunta Q-08: fix parola vietata "insight" in context/overview.md (gravità bassa, da risolvere prossima sessione)

### Fase deadline
EARLY PHASE — 39 giorni al 31 luglio 2026

### Fase maturità brand
FASE 1 — Identità parziale (tutti gli elementi proposti, nessuno approvato da Lorenzo)

### Elementi proposti oggi
- Tagline: "Conosci i tuoi tifosi. Davvero." → in attesa approvazione

### Incoerenze rilevate
- landing_page.md FAQ: "insight" (parola vietata) → corretto inline (gravità bassa)
- context/overview.md: "insight azionabili" (parola vietata) → registrato in Q-08, da correggere (gravità bassa, doc interno)

### Prossima priorità brand
Lorenzo: approvare o rifiutare gli elementi di brand proposti (mission, vision, valori, tagline, tono di voce) in `marketing/brand_identity.md` — senza approvazione, nessun elemento può essere usato ufficialmente nei materiali GTM.

---

*Il changelog va aggiornato ogni volta che si modifica struttura o contenuto importante del workspace.*

---

## 2026-06-24 — Sessione Marketing settimanale (automatica)

**Tipo:** Marketing
**Autore:** AI assistant (sessione schedulata — utente non presente)
**Fase rilevata:** EARLY PHASE (37 giorni al 31 luglio 2026)
**Focus settimana corrente (roadmap):** Pricing + Posizionamento

### File aggiornati
- `gtm/pricing.md` — proposta pricing concreta per pilot: €299/mese, 3 mesi gratuiti per Pro Vercelli in cambio di testimonianza. Risposta alle Q-01/Q-02/Q-03 (tutte PROPOSTA DA VALIDARE).
- `sales_assets/outreach_pro_vercelli.md` — email migliorata con hook estivo (campagna abbonamenti), gancio Vivaticket, follow-up email + script telefonico. Checklist pre-invio aggiornata.
- `decisions/open_questions.md` — escalation urgenza Q-01/Q-02 a URGENTE con scadenza 28 giugno 2026. Q-03 aggiornata con proposta collegata.

### Azioni esterne
- Bozza Gmail creata (ID: r-6590928301483137746) — Oggetto: "Pro Vercelli — chi rischia di non rinnovare l'abbonamento?" — Destinatario: marketing@fcprovercelli.it. **NON INVIARE senza approvazione Lorenzo.**

### Decisioni urgenti richieste a Lorenzo (entro 28 giugno)
- Q-01: confermare €299/mese come pricing base
- Q-02: confermare 3 mesi gratuiti per pilot Pro Vercelli
- Q-03: collegato a Q-01 e Q-02

### Prossima priorità marketing
Settimana 29 giu–5 lug: pitch deck / one-pager PDF + avvio costruzione landing page.

---

## 2026-06-22 — Sessione Marketing settimanale (automatica)

**Tipo:** Marketing
**Autore:** AI assistant (sessione schedulata — utente non presente)
**Fase rilevata:** EARLY PHASE (39 giorni al 31 luglio)

### File aggiornati
- `marketing/positioning.md` — tagline raccomandata (Q-04), sub-headline ufficiale, hook di posizionamento, riscrittura differenziatori senza gergo tecnico
- `marketing/landing_page.md` — riscrittura completa copy calcistico (hero, problema, 3 step, feature, FAQ, CTA finale) + note operative
- `research/competitor_analysis.md` — prima analisi sistematica post web search; gap di mercato confermato; profilo Vivaticket aggiornato
- `decisions/open_questions.md` — Q-04 aggiornata con proposta tagline da validare

### Insight chiave
1. **Gap confermato:** nessun tool di fan intelligence esiste per Lega Pro/Serie C in Italia. Deltatre presidia Serie A, non scende.
2. **Vivaticket è una porta aperta:** Pro Vercelli usa già Vivaticket. Il loro CSV è l'input di FanIQ — da usare nell'outreach.
3. **Serie C è ancora all'Excel:** i club hanno appena introdotto distinte digitali. Valida il posizionamento anti-Excel di FanIQ.

### Prossima priorità
Settimana 29 giu–5 lug: costruire landing page HTML e bozza pitch. Landing live entro 6-12 luglio.
