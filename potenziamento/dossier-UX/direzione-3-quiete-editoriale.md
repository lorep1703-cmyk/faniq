# Direzione 3 — "Quiete editoriale" (alla Linear: togliere finché non resta che il necessario)

**Tesi:** la distintività può venire dalla disciplina invece che dall'aggiunta: un solo accento, tipografia curata, motion misurata. La più rapida da eseguire e la più sicura per il test Pro Vercelli.

**Riferimenti visivi concreti:** Linear (linear.app — gerarchia tipografica al posto del colore); Vercel dashboard (vercel.com — neutri caldi, bordi, un accento); Arc browser release notes (tipografia come personalità).

**Applicazione a componenti reali:**
- `src/index.css` + `index.html`: display face distintiva SOLO per h1/numeri hero (es. "Instrument Sans" o "Geist", gratuite), Inter resta per il body — spezza l'effetto "tutto Inter" con un file e una riga di import.
- `components/Sidebar.jsx`: il viola resta SOLO sullo stato attivo; il resto diventa neutro — oggi il colore primario è distribuito ovunque e non significa nulla.
- `pages/Insights.jsx` (Business Score) e `pages/Dashboard.jsx`: shadow→border, `rounded-xl`→`rounded-lg`, motion di ingresso con framer-motion (GIÀ installato e usato solo in 2 file) standardizzata in un token unico: `fadeIn 200ms ease-out, stagger 40ms`.
- `pages/Report.jsx`: filtri (righe 196-296) raggruppati in una toolbar unica bordata invece di select sparse.

**Token proposti:** typography scale esplicita (display/body/data); elevazione border-first; motion tokens (durata 150/200/300ms, easing standard, regola "una sola animazione orchestrata per pagina" — coerente col principio del plugin frontend-design).

**Rischio/costo:** minimo — nessuna libreria nuova, nessun backend. Compatibile e combinabile con la Direzione 1 (densità) o 2 (colore club) in un secondo momento.
