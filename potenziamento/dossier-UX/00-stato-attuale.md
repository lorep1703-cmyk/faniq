# Stato attuale della dashboard FanIQ — analisi statica (2026-07-06)

> Solo lettura del codice, nessun server avviato. Ogni affermazione cita il file sorgente.

## Palette
- **Primario: viola-indaco** `#534AB7` con scala 50-900 (`frontend/tailwind.config.js`, unica estensione del tema). È esattamente la "palette viola-blu vista ovunque" che il brief indica come estetica AI-builder da superare.
- La stessa scala è **duplicata hardcoded** in `pages/Dashboard.jsx:17` (`COLORS = ["#534AB7", "#7F79D5", ...]`) e in `components/RfmDistributionWidget.jsx:5-12` (`SEGMENT_COLORS`), con `#534AB7` ripetuto a mano in almeno 4 altri punti di Dashboard.jsx (righe 158, 300, 369, 371).
- Neutri: `bg-slate-50` sfondo, testo `slate-800` (`src/index.css`), card bianche `rounded-xl border-slate-100 shadow-sm` (pattern ricorrente, es. `pages/Report.jsx:196`).
- Semantici: emerald/amber/red per stati (es. `RenewalBadge` in `Report.jsx:50-66`).

## Tipografia
- **Un solo font: Inter** (Google Fonts, `index.html:9`), imposto globalmente con selettore `*` (`src/index.css:5-7`) — il default de facto delle dashboard AI-generated. Nessun display face, nessun font tabulare per i numeri: RFM, spesa e probabilità usano Inter proporzionale (le cifre "ballano" in colonna).
- Scala tipografica: solo utility Tailwind di default, nessun token custom.

## Layout e densità
- Pagine con `p-8`, card spaziose, tabella fan con `py-2.5` per riga e max 100 righe renderizzate (`Report.jsx:341, 425`): densità da web app consumer, non da strumento di lavoro dati-intensivo.
- Identità visiva degli stadi journey affidata a **emoji** (🌱📈💪⭐⚠️😴🔄 in `Report.jsx:27-36` e `components/intelligence/JourneyBadge.jsx`): funzionali ma generiche, fuori controllo tipografico (rendering diverso per OS).

## Librerie presenti (da package.json — nessuna da aggiungere)
Recharts 2.12 (chart), lucide-react (icone), **framer-motion 12.41 già installato ma quasi inutilizzato** (solo `Dashboard.jsx` e `QuickActionsWidget.jsx`), Tailwind 3.4.

## Sintesi
La dashboard è pulita e coerente ma **indistinguibile da qualunque prodotto uscito da un AI-builder nel 2025-26**: Inter + viola-indaco + card bianche su slate + emoji badge. Nessun elemento visivo dice "sport", "club", o "intelligence". I tre asset su cui costruire senza nuove librerie: scala colori centralizzabile, framer-motion sottoutilizzato, Recharts personalizzabile.
