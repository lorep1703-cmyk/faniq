# Direzione 2 — "Broadcast sportivo" (l'identità viene dal calcio, non dal SaaS)

**Tesi:** il solo linguaggio visivo che nessun competitor SaaS generico può copiare è quello del calcio televisivo: grafiche da telecronaca, colori sociali del club, semantica da scoreboard. FanIQ è multi-tenant: il colore primario può diventare **il colore del club**, trasformando un limite estetico in feature commerciale ("la dashboard con i tuoi colori sociali").

**Riferimenti visivi concreti:** grafiche match-day Opta/StatsPerform (lower-third, barre contrapposte); dashboard xG di StatsBomb (statsbomb.com — dati densi con identità sportiva fortissima); scoreboard broadcast Serie A/C (blocchi colore netti, angoli tagliati, numeri giganti).

**Applicazione a componenti reali:**
- `tailwind.config.js` + `models.py::Club` (campo colore già ipotizzabile, NON ora — FanIQ in pausa): scala `primary` generata da CSS variable per-tenant (`--club-color`), fallback all'attuale. Primo passo senza backend: token CSS var in `index.css`.
- `components/intelligence/JourneyBadge.jsx` (righe con emoji 🌱→🔄): sostituire le emoji con **tacche di forma** da scoreboard (blocco pieno / mezzo / vuoto / barrato) coerenti cross-OS, colore semantico.
- `components/StatCard.jsx`: variante "lower-third" — barra laterale spessa nel colore club, label in maiuscolo condensed.
- `pages/Dashboard.jsx` chart presenze (righe 360-375): area chart con riempimento nel colore club al 10%, linea spessa 2.5px, stile xG timeline.

**Token proposti:** `--club-color` + scala derivata; display face condensed per titoli e numeri (es. "Archivo" o "Barlow Condensed", gratuiti — richiamano i font da maglia/scoreboard); radius ridotto (8→4px) per un look più "squadrato" da grafica TV.

**Rischio/costo:** medio — la palette per-tenant tocca in prospettiva il backend (rimandato a fine pausa); tutto il resto è frontend puro. È la direzione più distintiva e più "vendibile" ai club.
