# Approval Gates — FanIQ

Policy operativa che definisce cosa l'AI assistant può fare autonomamente e cosa richiede approvazione esplicita di Lorenzo Ponzi.

---

## Puoi fare senza approvazione

- Aggiornare qualsiasi file in questo workspace
- Aggiungere domande aperte in `decisions/open_questions.md`
- Aggiungere ipotesi in `context/assumptions.md`
- Aggiungere rischi in `strategy/risks.md`
- Aggiungere idee in `product/feature_ideas.md` o `product/backlog.md`
- Creare bozze di copy (outreach, landing page, pitch, one-pager)
- Proporre prompt da aggiungere in `prompts/prompt_library.md`
- Fare research su competitor e mercato (web search)
- Aggiornare `reviews/changelog.md`
- Segnalare problemi, criticità o rischi
- Proporre struttura di nuovi file o cartelle
- Aggiornare `research/club_profiles.md` con dati pubblici

---

## Devi chiedere approvazione prima

- Modificare il posizionamento ufficiale in `marketing/positioning.md` (oltre la bozza)
- Marcare una decisione come definitivamente confermata in `decisions/decisions_log.md`
- Cambiare roadmap o milestone in `strategy/roadmap.md`
- Modificare o eseguire operazioni su repository GitHub
- Modificare configurazioni Stripe, Render, Vercel o Neon
- Contattare prospect o partner (es. redigere il messaggio finale per Pro Vercelli)
- Pubblicare qualsiasi contenuto pubblico (sito, social, email)
- Eliminare file o sezioni importanti dal workspace
- Cambiare pricing o condizioni commerciali
- Approvare un contratto o una proposta commerciale

---

## Non devi mai fare

- Inventare dati, metriche, clienti, revenue, partner o decisioni
- Usare o registrare dati reali di tifosi (nomi, email, comportamenti)
- Usare o registrare credenziali, API key, token JWT o file `.env`
- Cancellare decisioni storiche da `decisions/decisions_log.md`
- Sovrascrivere fonti senza aggiornare il changelog
- Agire su tool o sistemi esterni (GitHub, Stripe, Render, Vercel) senza approvazione
- Suggerire soluzioni che compromettano l'isolamento multi-tenant o le policy RLS
- Toccare autenticazione, RLS PostgreSQL o middleware di sicurezza

---

## Regole di sicurezza non negoziabili

1. Se compaiono dati personali reali di tifosi → segnalare immediatamente, non elaborare, non salvare.
2. Se compaiono credenziali, API key o file `.env` → segnalare immediatamente, non usare, non salvare.
3. Qualsiasi modifica ad autenticazione o RLS richiede approvazione esplicita e deve essere documentata in `decisions/decisions_log.md`.
4. Il GDPR è una feature del prodotto — ogni idea che coinvolge dati tifosi deve considerare le implicazioni di compliance. Usare prompt `SEC-01` in `prompts/prompt_library.md` per review GDPR.
5. In caso di dubbio sulla sicurezza di un'azione, non agire — chiedere prima.

---

*Aggiornato il 22 giugno 2026.*
