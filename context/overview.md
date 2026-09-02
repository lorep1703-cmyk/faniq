# FanIQ — Project Overview

## Identità

**Nome:** FanIQ
**Tipo:** SaaS B2B
**Settore:** Sports tech / Fan intelligence
**Mercato primario:** Club sportivi professionistici e semi-professionistici

---

## Cos'è FanIQ

FanIQ è una piattaforma di fan intelligence per club sportivi. I club caricano i dati dei loro tifosi (abbonamenti, biglietti, acquisti shop) e FanIQ li trasforma in azioni concrete.

**Il problema che risolve:** I club sportivi hanno dati sui tifosi ma non hanno gli strumenti per analizzarli, segmentarli e usarli per decisioni commerciali. I CRM generici non capiscono il contesto sportivo.

**Come lo risolve:** Pipeline di analisi verticale sul mondo sportivo, con output comprensibili anche a chi non sa fare analytics.

---

## Feature core (tutte funzionanti)

| Feature | Descrizione |
|---------|-------------|
| Segmentazione RFM | Classifica i fan in VIP, Fedeli, A rischio, Dormienti, ecc. |
| Business Score | Punteggio 0-100 sulla salute commerciale del club |
| Chat AI | Risponde a domande sui propri dati in linguaggio naturale |
| Export & GDPR | Esporta segmenti, gestisce consensi e cancellazioni |
| Calendario partite | Traccia fedeltà tifosi per partita (casa/trasferta) |
| Upload CSV | Importazione dati tifosi con validazione |
| Multi-tenant | Ogni club vede solo i propri dati (RLS PostgreSQL) |

---

## Stack tecnico

| Layer | Tecnologia | Deploy |
|-------|-----------|--------|
| Backend | FastAPI + PostgreSQL (Neon) | Render |
| Frontend | React + Vite | Vercel |
| Pagamenti | Stripe | Non attivo |
| AI | OpenAI | Attivo (Chat AI) |

**Repository:** `https://github.com/lorep1703-cmyk/faniq.git`
**App live:** `https://faniq-seven.vercel.app` (richiede login)

---

## Stato al 22 giugno 2026

- MVP completo e deployato ✅
- Zero clienti paganti ❌
- Stripe integrato ma non attivato ⚠️
- Landing page pubblica: non esiste ❌
- Primo target: Pro Vercelli — deadline fine luglio 2026 🎯

---

## Chi costruisce FanIQ

**Founder:** Lorenzo Ponzi (lorep1703@gmail.com)
**Città:** Vercelli

---

*Fonte: intervista di setup — 22 giugno 2026. Aggiornare se cambia la vision o lo stack.*
