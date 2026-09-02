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

---

## 2026-07-13 — Weekly Founder Review (automatica)

**Tipo:** Review
**Autore:** AI assistant (sessione schedulata — utente non presente)
**Stato generale:** 🔴 Rosso — M1 (22 luglio) a rischio concreto

### Osservazioni
- Nessuna entry di changelog tra il 24 giugno e oggi, nonostante `decisions/open_questions.md`, `gtm/pitch.md`, `marketing/brand_identity.md`, `marketing/landing_page.md`, `marketing/positioning.md` risultino modificati il 9 luglio — modifiche non tracciate qui, da verificare con Lorenzo.
- Q-01/Q-02 (pricing €299/mese, 3 mesi gratuiti) proposti il 24/06 con scadenza "URGENTE entro 28 giugno" — ancora in stato "proposta da validare" 15 giorni dopo la scadenza.
- Backlog P1 (dataset sintetico), P2 (Stripe), P3 (pricing) risultano ancora 🔴 Da fare secondo l'ultimo aggiornamento datato del file (22 giugno).
- Bozza email outreach a Pro Vercelli creata il 24/06, non ancora inviata.
- Nessun elemento di brand identity (mission, vision, tagline, tono di voce) approvato da Lorenzo.

### File aggiornati
- `reviews/changelog.md` — questa riga di weekly review

### Nessuna modifica a roadmap o decisioni (solo lettura/segnalazione, come da regole).

---

## 2026-07-15 — Sessione Marketing settimanale (automatica)

**Tipo:** Marketing
**Autore:** AI assistant (sessione schedulata — utente non presente)
**Fase rilevata:** URGENCY PHASE (16 giorni al 31 luglio 2026)

### Verifica priorità 1 (Outreach/Sales, obbligatoria in questa fase)
- Bozza Gmail a Pro Vercelli (ID `r-6590928301483137746`, creata 24/06) verificata: **ancora presente come bozza, mai inviata**. Nessuna risposta ricevuta — perché nessun messaggio è mai partito.
- Nessun'altra voce della checklist pre-invio risulta completata dal 24/06 (pricing, landing page, LinkedIn, Calendly tutti ancora aperti).

### File aggiornati
- `sales_assets/outreach_pro_vercelli.md` — aggiunta sezione di verifica stato + raccomandazione di inviare l'email senza aspettare landing page/Calendly, dato il tempo residuo.
- `decisions/open_questions.md` — escalation Q-01/Q-02/Q-03 (pricing, ferme da 21 giorni) con nuova scadenza richiesta 17 luglio 2026.

### Azioni esterne
- Nessuna nuova bozza Gmail creata (quella esistente resta valida e in attesa di approvazione — non duplicata per non generare confusione).

### Rischio principale
🔴 Il collo di bottiglia non è più il copy o il pricing — è l'approvazione e invio dell'email da parte di Lorenzo. Con 16 giorni alla deadline, ogni giorno di ritardo nell'invio riduce il tempo disponibile per demo e proposta commerciale.

### Prossima priorità marketing
Lorenzo approva e fa inviare l'email a Pro Vercelli entro il 17-18 luglio — nessun'altra attività di marketing ha priorità finché questo non è sbloccato.

---

## 2026-07-17 — Sessione Brand Identity settimanale (automatica)

**Tipo:** Brand Identity
**Autore:** AI assistant (sessione schedulata — utente non presente)
**Fase deadline:** URGENCY PHASE (14 giorni al 31 luglio 2026) → solo audit coerenza + fix urgenti, nessuna nuova definizione di brand.
**Fase maturità brand:** 1/2 — elementi tutti definiti come proposta, nessuno approvato dopo 25 giorni.

### Audit di coerenza eseguito
- `gtm/pitch.md`, `sales_assets/outreach_pro_vercelli.md`, `marketing/landing_page.md` → tutti coerenti con brand voice (nessuna parola vietata, tono calcistico rispettato).

### File aggiornati
- `context/overview.md` — fix inline: "insight azionabili" → "azioni concrete" (chiude Q-08).
- `decisions/open_questions.md` — Q-08 chiusa; aggiunta escalation su approvazioni brand ferme da 25 giorni.
- `marketing/brand_identity.md` — aggiunto marcatore sessione con esito audit, nessun elemento nuovo proposto.

### Rischio principale
🟡 Le proposte di brand identity (mission, vision, valori, tono, tagline) sono ferme da 25 giorni in attesa di una conferma di Lorenzo che non richiede lavoro — stesso pattern di stallo già visto su pricing (Q-01/02/03) e outreach. Non blocca l'audit di oggi, ma blocca la costruzione di materiali pubblici ufficiali (landing, one-pager) se si aspetta l'approvazione formale.

### Prossima priorità brand
Lorenzo approva (o modifica) mission/vision/valori/tono/tagline in `marketing/brand_identity.md` — azione a costo zero, sblocca la produzione di materiali pubblici.
