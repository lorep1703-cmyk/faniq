# Direzione 1 — "Terminale di club" (densità da strumento finanziario)

**Tesi:** FanIQ è uno strumento di lavoro dati-intensivo per chi gestisce ricavi da tifosi: deve sembrare un terminale professionale, non un sito. Il valore percepito sale con la densità controllata.

**Riferimenti visivi concreti:** Bloomberg Terminal (densità, numeri tabulari, semantica del colore solo sui dati); Koyfin (koyfin.com — terminal look moderno e accessibile, dark-optional); tabelle di Linear (linear.app — righe compatte, hover discreto, zero ombre).

**Applicazione a componenti reali:**
- `pages/Report.jsx` (tabella fan, righe 300-425): righe da `py-2.5` a `py-1.5`; colonne numeriche (RFM, Spesa, Prob. rinnovo) allineate a destra con `tabular-nums`; zebra `odd:bg-slate-50/50` al posto del solo hover; le celle Spesa in font mono.
- `components/StatCard.jsx`: numero grande in font tabulare, label in maiuscoletto `tracking-wider`, delta con freccia colorata — griglia più fitta (4 card per riga a parità di spazio).
- `pages/Dashboard.jsx`: chart Recharts con assi in mono 10px, griglia a punti invece che a linee.

**Token proposti (tutti realizzabili in tailwind.config.js, zero librerie):**
`fontFamily.mono = "IBM Plex Mono"` (Google Fonts, gratuito) per i numerici; `fontVariantNumeric: tabular-nums` come utility; scala spacing "dense" (`py-1.5/px-2` per contesti tabellari); elevazione a bordi (`border-slate-200`) eliminando le shadow.

**Rischio/costo:** basso — nessuna libreria, solo classi e un font. Reversibile per componente.
