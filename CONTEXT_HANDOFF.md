# FanIQ — Context Handoff
> Aggiornato: 2026-06-29 | Da leggere all'inizio di ogni nuova sessione Cowork

---

## Stato attuale

Il backend è **live su Render** e il frontend su **Vercel**. Stiamo cercando di caricare i dati di test (CSV sintetici) nella piattaforma. Il caricamento degli abbonati è **in corso in background** su Render in questo momento.

**App live:** https://faniq-seven.vercel.app  
**Repository:** https://github.com/lorep1703-cmyk/faniq.git  
**Ultimo commit significativo:** `e66ad09` (batch processing intelligence engine)

---

## Problema attivo — caricamento CSV

Il caricamento dei CSV su Render Free tier (512MB RAM) è lento e complesso. Abbiamo risolto:
- ✅ Timeout HTTP → upload asincrono con `BackgroundTasks` + polling frontend
- ✅ OOM intelligence engine → batch processing 200 fan alla volta
- ✅ RLS non attiva nel background task → `SET LOCAL` nella sessione del task
- ✅ Rate limiter bloccava il polling → ora conta solo `POST /upload/`
- ⚠️ Il caricamento abbonati è in corso — attendere storico Upload prima di procedere

**Ordine corretto di caricamento CSV:**
1. Abbonati (`abbonati_test.csv`)
2. Biglietteria (`biglietteria_test.csv`) ← il più pesante, 1.2MB
3. Shop (`shop_test.csv`)
4. Partite (`partite_test.csv`)

---

## Cosa fare subito (appena abbonati finisce)

1. Verificare che lo storico Upload mostri la riga abbonati con numero importati
2. Caricare biglietteria, poi shop, poi partite nell'ordine
3. Verificare che Dashboard e Report mostrino dati
4. Verificare che Intelligence Engine mostri dati (fan > 0)

---

## Prompt pendenti in PROMPTS_CLAUDE_CODE.md

| Prompt | Stato | Priorità |
|--------|-------|----------|
| Fix messaggio timeout upload (UX per demo Pro Vercelli) | ❌ da fare | 🟡 Prima della demo |
| Batch processing `calculate_renewal_scores_bulk` | ❌ da fare | 🟡 Media |
| Streaming export CSV | ❌ da fare | 🟢 Bassa |

---

## Backlog importante (non dimenticare)

**Chat AI (bug noto):** In `services/chat.py` riga 24, `insights.get("insights", [])` restituisce sempre lista vuota — la chiave giusta è `azioni_settimana`. La chat funziona ma con contesto impoverito. Da fixare in sessione dedicata. Dettagli in `memory/backlog_chat_ai.md`.

**Redesign visivo:** Quando il prodotto è stabile, redesign completo con shadcn/ui + Tremor + Framer Motion. In `memory/feedback_visual_redesign.md`.

**Revoca token JWT:** Soluzione completa con blacklist non ancora implementata. Per ora TTL ridotto a 8 ore come mitigazione.

---

## File chiave del workspace

| File | Contenuto |
|------|-----------|
| `PROMPTS_CLAUDE_CODE.md` | Tutti i prompt pronti per Claude Code + CONTESTO OBBLIGATORIO |
| `DEAD_CODE_AUDIT.md` | Audit codice inutilizzato del 26 giugno (storico) |
| `CODEBASE_AUDIT_2.md` | Audit performance + dead code del 29 giugno |
| `SECURITY_AUDIT.md` | Security audit completo del 29 giugno |
| `CLAUDE.md` | Istruzioni tecniche complete per Claude Code |
| `sample_csv/` | 4 file CSV di test: `*_test.csv` per abbonati, biglietteria, shop, partite |

---

## Lavoro completato oggi (2026-06-29)

**Performance (Audit #2):**
- Fix renewal-scores bulk loader (da N×5 query a 5 query totali)
- Rimosso endpoint anti-pattern `/insights/fan/{id}`
- Fix SQL analytics (5 funzioni con aggregati invece di full-load)
- Cache su `compute_behavioral` + fix bypass cache intelligence
- Collegato `Calendario.jsx` al router
- Pulizia codice morto (`client.js`, imports, `stripe_customer_id`, `require_role`)

**Nuove feature:**
- Side panel scheda fan in Report (`FanDetailPanel.jsx`)
- UI consensi GDPR in Privacy (toggle marketing/profilazione)
- Simulatore collegato al router e Sidebar
- Filtro stagionale in Report
- Pulsante "Reset dati" in Upload
- Upload CSV asincrono con polling

**Security (Audit completo):**
- Formula injection CSV fixata
- Rate limiting su chat, upload, intelligence
- Fix errori esposti al client
- TTL JWT ridotto a 8 ore
- CSP, CORS restrittivo, Swagger disabilitato in prod
- Rimosso pandas, JWT payload snellito
- `FANIQ_ENV=production` impostato su Render

---

## Note operative

- **Test locali:** 29 test, 3 failure pre-esistenti per SQLAlchemy assente nel Python di sistema (non nel venv) — sono attesi
- **Deploy:** push su `main` → Render si aggiorna automaticamente
- **Render Free tier:** 512MB RAM, cold start ~30-60s dopo inattività, timeout connessioni ~30s
- **FANIQ_ENV=production** impostato su Render → Swagger UI disabilitato
