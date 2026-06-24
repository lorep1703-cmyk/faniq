# Dashboard Analysis v2 — FanIQ
*Aggiornato il 24 giugno 2026 — revisione post-audit prompt engineering*

---

## 1. Stato attuale della Dashboard

### Cosa c'è ora

| Sezione | Componente | API usata | Stato |
|---------|-----------|-----------|-------|
| Row 1 — KPI base | 4 StatCard | `GET /dashboard/stats` | ✅ |
| Row 2 | Top 5 città (bar) | `GET /dashboard/citta` | ✅ |
| Row 2 | Revenue per fonte (pie) | `GET /dashboard/revenue-breakdown` | ✅ |
| Row 3 | JourneyDistributionWidget | `GET /api/intelligence/club/summary` | ✅ |
| Row 3 | AmbassadorsWidget | `GET /api/intelligence/club` | ✅ |
| Row 3 | DecayDistributionWidget | `GET /api/intelligence/club/summary` | ✅ |
| Row 4 | Presenze per partita (line) | `GET /dashboard/presenze` | ✅ condicional |

### API pronte ma non usate nella Dashboard

| Endpoint | Risposta | Note |
|----------|---------|------|
| `GET /dashboard/segments` | `[{segment, count}]` | Già usata in Report.jsx |
| `GET /dashboard/top-spenders` | `[{id, nome, cognome, email, total_spend, segment}]` | Già usata in Report.jsx |
| `GET /dashboard/retention` | `[{stagione, count}]` | Non usata in nessuna pagina |
| `GET /api/intelligence/club/summary` → `fans_at_risk`, `fans_critical_anomaly`, `avg_renewal_probability` | Usata solo dentro widget, mai come KPI in primo piano |

### Gap critici per la demo

1. `fans_at_risk` e `avg_renewal_probability` — le metriche più differenzianti — non appaiono mai nella prima schermata
2. La segmentazione RFM (cuore del prodotto) non è visibile nella home
3. La dashboard è read-only: nessun percorso verso le azioni
4. `fetchRetention` non è usata in nessuna pagina dell'app

### Problemi trovati nei prompt v1 (corretti in questa versione)

- **DA-06**: `StatCard` accetta solo 4 colori (primary/green/amber/blue) — una card "pericolo" richiedeva un nuovo colore non definito
- **DA-07**: `SEGMENT_COLORS` già definito in `Report.jsx` con colore diverso da quello nel prompt (`#F59E0B` vs `#f97316`) — avrebbe creato incoerenza visiva
- **DA-09**: `fetchTopSpenders` già chiamata in `Report.jsx` — prompt avrebbe generato un secondo componente duplicato invece di estrarne uno riutilizzabile
- **DA-10**: Il link "Abbonati a rischio" puntava a `/report` senza parametri — `Report.jsx` usa stato locale, non URL params, quindi il link non attivava nessun filtro
- Tutti i prompt v1 mancavano di `<output_checklist>`, "leggi il codice prima", "fermati e segnala"

---

## 2. Nuovo layout dashboard (dopo DA-06 → DA-10)

```
┌─────────────────────────────────────────────────────────────┐
│  Row 1 — KPI Base                                           │
│  [Tifosi] [Con email] [Spesa media] [Revenue]               │
├─────────────────────────────────────────────────────────────┤
│  Row 2 — Intelligence KPI Banner (DA-06) ← NUOVO            │
│  [Tifosi da tenere d'occhio] [Da contattare] [Rinnovo medio%]│
├─────────────────────────────────────────────────────────────┤
│  Row 3 — Charts principali (esistenti)                      │
│  [Top 5 città]               [Revenue per fonte]            │
├─────────────────────────────────────────────────────────────┤
│  Row 4 — Segmenti + Retention (DA-07 + DA-08) ← NUOVO       │
│  [RFM Segment Widget]        [Abbonati per stagione]        │
├─────────────────────────────────────────────────────────────┤
│  Row 5 — Intelligence widgets (esistenti)                   │
│  [Journey Distribution] [Ambassadors] [Decay Distribution]  │
├─────────────────────────────────────────────────────────────┤
│  Row 6 — Top Spenders + Quick Actions (DA-09 + DA-10) ← NUOVO│
│  [Top 5 Spenders]            [Azioni rapide]                │
├─────────────────────────────────────────────────────────────┤
│  Row 7 — Presenze (esistente, condizionale)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Ordine di esecuzione

```
DA-06 → DA-07 → DA-08 → DA-09 → DA-10
```

Uno per sessione Claude Code. Ogni prompt è autonomo e non dipende dai precedenti (tranne DA-10 che assume Framer Motion già installato da DA-06).

---

## 4. Prompt per Claude Code (v2 — production quality)

---

### DA-06 — Intelligence KPI Banner + Framer Motion

```xml
<mission>
  Aggiungi una riga di 3 KPI card "di allerta" alla Dashboard di FanIQ,
  subito dopo le 4 card KPI esistenti (fans/email/spesa/revenue) e prima dei grafici.
  Queste card mostrano i dati di rischio del Fan Intelligence Engine
  e sono animate con Framer Motion per dare un impatto visivo immediato nella demo.
  Questo è il primo utilizzo di Framer Motion nel progetto — installa la libreria.
</mission>

<prerequisite>
  LEGGI IL CODICE ESISTENTE prima di scrivere una riga.
  File obbligatori da leggere:
    - frontend/src/pages/Dashboard.jsx        (struttura attuale, dove inserire la banner)
    - frontend/src/components/StatCard.jsx     (componente KPI esistente — dovrai estenderlo)
    - frontend/src/api/client.js               (fetchIntelligenceSummary già presente)
  
  L'endpoint da usare è GIÀ IMPLEMENTATO:
    GET /api/intelligence/club/summary
    Risposta: {
      total_fans: int,
      avg_renewal_probability: float (0.0 → 1.0),
      fans_at_risk: int,
      fans_critical_anomaly: int,
      journey_distribution: { SCOPERTA: N, ABITUDINE: N, FEDELTA: N, PICCO: N, RISCHIO: N, DORMIENTE: N, RECUPERATO: N },
      decay_distribution: { LENTO: N, MEDIO: N, RAPIDO: N, VOLATILE: N }
    }
  Se questo endpoint non risponde o manca, FERMATI e segnalalo — non simulare i dati.
  
  NOTA: JourneyDistributionWidget e DecayDistributionWidget chiamano già
  fetchIntelligenceSummary indipendentemente. Questa sarà la terza chiamata indipendente
  allo stesso endpoint. È accettabile per ora — non fare refactor dei widget esistenti.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B di fan intelligence per club sportivi italiani</product>
  <stack>React 18.3 · Vite · Tailwind 3.4 · lucide-react · axios · Framer Motion (da installare)</stack>
  <existing_statcard>
    StatCard.jsx accetta: label, value, sub, icon (lucide), color ("primary"|"green"|"amber"|"blue")
    I 4 colori esistenti sono tutti toni positivi/neutri.
    Per la banner di allerta serve un colore "danger" (rosso) — aggiungilo alla COLOR_MAP di StatCard.
    Aggiungi: red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-100" }
    Non riscrivere StatCard — aggiungi solo questa voce alla mappa e aggiorna il tipo del prop.
  </existing_statcard>
</context>

<implementation>
  STEP 1 — Installa Framer Motion
    cd frontend && npm install framer-motion
    Verifica che l'installazione non rompa il build (npm run build).

  STEP 2 — Estendi StatCard con il colore "red"
    Aggiungi red alla COLOR_MAP.
    Il componente non cambia struttura — solo la mappa dei colori.

  STEP 3 — Crea IntelligenceBanner come componente inline in Dashboard.jsx
    Non serve un file separato.
    
    Le 3 card:

    Card 1 — "Tifosi da tenere d'occhio"
      value: fans_at_risk (numero intero)
      icon: ShieldAlert (lucide)
      color: "red" se fans_at_risk > 0, "primary" se 0
      sub: fans_at_risk === 0 ? "Nessuna situazione critica" : "richiedono attenzione immediata"

    Card 2 — "Da contattare oggi"
      value: fans_critical_anomaly (numero intero)
      icon: AlertCircle (lucide)
      color: fans_critical_anomaly > 0 ? "amber" : "primary"
      sub: fans_critical_anomaly === 0 ? "Nessun abbonato silenzioso" : "abbonati paganti non usano il posto"

    Card 3 — "Prob. media rinnovo"
      value: avg_renewal_probability != null
               ? Math.round(avg_renewal_probability * 100) + "%"
               : "N/D"
      icon: TrendingUp (lucide)
      color: avg_renewal_probability >= 0.70 ? "green"
           : avg_renewal_probability >= 0.50 ? "amber"
           : "red"
      sub: "stima media di rinnovo abbonamenti"

  STEP 4 — Animazione con Framer Motion
    Wrappa le 3 card in un motion.div con animazione di ingresso:
    
    import { motion } from "framer-motion";
    
    const cardVariants = {
      hidden: { opacity: 0, y: 16 },
      visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
      })
    };
    
    Ogni StatCard avvolta in:
    <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible">
    
    Effetto: le 3 card appaiono in sequenza con leggero ritardo tra l'una e l'altra.
    Non aggiungere animazioni infinite o loop — solo ingresso, una volta.

  STEP 5 — Caricamento dati
    Aggiungi una chiamata fetchIntelligenceSummary() nel useEffect di Dashboard.jsx.
    Usa Promise.allSettled (non Promise.all) così se questa chiamata fallisce,
    il resto della dashboard continua a funzionare.
    Stato: const [intelligenceSummary, setIntelligenceSummary] = useState(null);
    
    Loading state della banner: 3 StatCard con value="—" e sub="" durante il caricamento.
    Error state: se la chiamata fallisce, mostra le 3 card con value="N/D" e color="primary".
    Non mostrare messaggi di errore in questo widget — silenzio visivo è meglio del rumore.

  STEP 6 — Integrazione in Dashboard.jsx
    Inserisci la IntelligenceBanner DOPO il blocco delle 4 StatCard esistenti
    e PRIMA del blocco "Charts row 1" (il commento che separa le sezioni).
    Usa la stessa griglia: grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8
</implementation>

<ux_constraints>
  - NON usare "anomalia", "alert", "critico" come label visibili nella UI
    Usa: "Tifosi da tenere d'occhio", "Da contattare oggi", "Prob. media rinnovo"
  - NON mostrare decimali nel renewal probability — solo percentuale intera (es. "72%")
  - Se tutti e 3 i valori sono 0 o null (dataset vuoto), mostra le card ugualmente con "—"
    Non nasconderle — la loro assenza dalla dashboard confonde l'utente
  - L'animazione Framer Motion deve essere sottile — non deve distrarre, deve dare fluidità
</ux_constraints>

<security_constraints>
  1. Non modificare autenticazione, JWT o middleware di sicurezza
  2. Non modificare la logica RLS PostgreSQL
  3. Non usare dati reali — solo dataset sintetico
  4. Non esporre fan_id in log o console
  5. Non toccare tenant.py, services/auth.py, routers/auth.py, middleware in main.py
</security_constraints>

<output_checklist>
  □ framer-motion installato e build non rotto (npm run build passa)
  □ StatCard.jsx ha il colore "red" aggiunto alla COLOR_MAP
  □ IntelligenceBanner mostra 3 card con i valori corretti dell'API
  □ Card 1 diventa rossa se fans_at_risk > 0, blu primario se 0
  □ Card 3 cambia colore in base alla soglia (verde/giallo/rosso)
  □ Animazione di ingresso visibile: le card appaiono in sequenza
  □ Loading state mostra "—" senza crashare
  □ Error state silenzioso: mostra "N/D" non un messaggio di errore
  □ La banner è posizionata tra le 4 KPI card e i chart
  □ Se fetchIntelligenceSummary fallisce, il resto della dashboard funziona normalmente
  □ Nessun termine "anomalia" o "critico" visibile nell'UI
</output_checklist>
```

---

### DA-07 — RFM Distribution Widget (riutilizzabile — Dashboard + Report)

```xml
<mission>
  Crea un componente React riutilizzabile RfmDistributionWidget che mostra
  la distribuzione dei tifosi per segmento RFM (VIP, Fedele, A rischio, Dormiente, Nuovo).
  Il componente va usato SIA nella Dashboard SIA nel Report.jsx (che già recupera
  questi dati ma non li mostra con un widget dedicato).
  L'obiettivo è DRY: un solo componente, usato in due pagine.
</mission>

<prerequisite>
  LEGGI IL CODICE ESISTENTE prima di scrivere una riga.
  File obbligatori da leggere:
    - frontend/src/pages/Report.jsx
      → Cerca SEGMENT_COLORS (già definito — riusalo, non ridefinirlo)
      → Cerca fetchSegments (già importato e chiamato)
      → Cerca dove viene renderizzato il BarChart dei segmenti (esiste già un grafico RFM in Report)
    - frontend/src/components/intelligence/DecayDistributionWidget.jsx
      → Questo è il riferimento visivo: barre orizzontali, stessa struttura
    - frontend/src/api/client.js
      → fetchSegments() già presente → GET /dashboard/segments

  L'endpoint è GIÀ IMPLEMENTATO:
    GET /dashboard/segments
    Risposta: [{ segment: "VIP", count: 42 }, { segment: "Fedele", count: 130 }, ...]
    Segmenti possibili: "VIP", "Fedele", "A rischio", "Dormiente", "Nuovo"
  Se questo endpoint non risponde, FERMATI e segnalalo.

  IMPORTANTE: SEGMENT_COLORS è già definito in Report.jsx con questi valori:
    VIP: "#534AB7", Fedele: "#7F79D5", Occasionale: "#AAA6E3",
    "A rischio": "#F59E0B", Dormiente: "#94A3B8", Nuovo: "#34D399"
  Usa esattamente questi valori — non ridefinire colori diversi.
  Estrai SEGMENT_COLORS in un file condiviso se è più pulito, altrimenti importalo da Report.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B di fan intelligence per club sportivi italiani</product>
  <stack>React 18.3 · Vite · Tailwind 3.4 · lucide-react · axios</stack>
  <reference_visual>
    Guarda DecayDistributionWidget.jsx — replica la stessa struttura visiva:
    barre orizzontali in CSS puro (div con width% dinamica), icona + label + numero + percentuale.
    NON usare Recharts BarChart per questo widget — usa barre CSS come DecayDistributionWidget.
  </reference_visual>
</context>

<implementation>
  STEP 1 — Crea il componente standalone
    File: frontend/src/components/RfmDistributionWidget.jsx
    
    Props:
      - data: array di {segment, count} (opzionale — se non passato, il componente fa il fetch da solo)
      - showFetch: boolean (default true) — se false, usa i dati passati via props senza fetch
    
    Questo pattern permette a Dashboard di far fare il fetch al widget, mentre Report
    può passare i dati già caricati (evitando una chiamata API duplicata).

  STEP 2 — Struttura visiva
    Ordine segmenti da mostrare (top → bottom):
      VIP → Fedele → Nuovo → A rischio → Dormiente
    
    Per ogni segmento:
      [dot colorato] [label]    [barra orizzontale proporzionale]    [count] ([pct]%)
    
    Barra: div con width calcolata su totale, transition-all duration-700, rounded-full
    Altezza barra: h-2.5 (identico a DecayDistributionWidget)
    
    Header: "Segmenti RFM" + testo piccolo con totale fans analizzati
    
    Insight testuale automatico in fondo (stessa logica di JourneyDistributionWidget):
    - Se (A rischio + Dormiente) > totale * 0.50 →
        "Oltre metà dei tuoi tifosi necessita di attenzione. Pianifica una campagna di riattivazione."
    - Se (VIP + Fedele) > totale * 0.60 →
        "Base solida: il {X}% dei tuoi tifosi è fedele o VIP. Focus sulla retention."
    - Altrimenti → "Distribuzione nella norma."
    Stile insight: identico a DecayDistributionWidget (text-xs, border-t, pt-3)

  STEP 3 — Aggiorna Report.jsx per usare il nuovo componente
    In Report.jsx:
    - Rimuovi il BarChart inline dei segmenti se esiste (sostituiscilo con RfmDistributionWidget)
    - Passa i dati già caricati: <RfmDistributionWidget data={segments} showFetch={false} />
    - segments è già nello stato di Report.jsx
    NON rimuovere nessun'altra logica da Report.jsx — solo il chart dei segmenti.

  STEP 4 — Aggiungi alla Dashboard
    In Dashboard.jsx:
    - Importa RfmDistributionWidget
    - Crea una nuova riga a 2 colonne DOPO la riga dei chart città/revenue:
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RfmDistributionWidget />
        {/* DA-08 andrà qui — per ora lascia solo RfmDistributionWidget con lg:col-span-1 */}
      </div>
    - RfmDistributionWidget senza props fa il suo fetch autonomamente
</implementation>

<states>
  Loading: 5 righe animate-pulse (identico a DecayDistributionWidget)
  Error: "Dati segmentazione non disponibili" — testo piccolo, non banner
  Empty (tutti count = 0): usa EmptyState component già presente nel progetto
</states>

<ux_constraints>
  - Labels dei segmenti in italiano: "VIP", "Fedele", "Nuovo", "A rischio", "Dormiente"
    Non usare sigle, codici o termini inglesi nell'UI visibile
  - Non mostrare il segmento "Occasionale" se SEGMENT_COLORS lo include ma l'API non lo restituisce
    Filtra i segmenti ricevuti dall'API — non mostrare righe con count = 0
  - Percentuali arrotondate all'intero (Math.round) — no decimali
</ux_constraints>

<security_constraints>
  1. Non modificare autenticazione, JWT o middleware di sicurezza
  2. Non modificare la logica RLS PostgreSQL
  3. Non usare dati reali — solo dataset sintetico
  4. Non esporre fan_id in log o console
  5. Non toccare tenant.py, services/auth.py, routers/auth.py, middleware in main.py
</security_constraints>

<output_checklist>
  □ File creato: frontend/src/components/RfmDistributionWidget.jsx
  □ Componente accetta prop data (opzionale) + showFetch (default true)
  □ Colori identici a SEGMENT_COLORS già in Report.jsx — nessun colore ridefinito
  □ Ordine segmenti: VIP → Fedele → Nuovo → A rischio → Dormiente
  □ Barre CSS orizzontali proporzionali (non Recharts)
  □ Insight testuale cambia in base ai dati reali
  □ Report.jsx usa il nuovo componente (passando data, showFetch={false})
  □ Dashboard.jsx usa il nuovo componente (senza props — fetch autonomo)
  □ Loading, error, empty state gestiti
  □ Nessun segmento con count = 0 mostrato
  □ Nessun termine tecnico inglese visibile nell'UI
</output_checklist>
```

---

### DA-08 — Retention per stagione

```xml
<mission>
  Aggiungi un grafico "Abbonati per stagione" alla Dashboard di FanIQ.
  Mostra l'andamento degli abbonamenti stagione per stagione con un BarChart Recharts.
  Va nella stessa riga di RfmDistributionWidget (DA-07) — griglia 2 colonne.
</mission>

<prerequisite>
  LEGGI IL CODICE ESISTENTE prima di scrivere una riga.
  File obbligatori da leggere:
    - frontend/src/pages/Dashboard.jsx
      → Identifica la nuova riga a 2 colonne creata da DA-07 — questo chart va nella colonna destra
    - frontend/src/api/client.js
      → fetchRetention() già presente → GET /dashboard/retention

  L'endpoint è GIÀ IMPLEMENTATO:
    GET /dashboard/retention
    Risposta: [{ stagione: "2023/24", count: 312 }, { stagione: "2024/25", count: 287 }]
    Ordinata per stagione crescente. Stagione può essere null se non impostata nel CSV.
    Se l'array è vuoto (dataset senza campo stagione) → il componente mostra uno stato vuoto,
    non crasha.
  Se questo endpoint non risponde, FERMATI e segnalalo — non simulare i dati.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B di fan intelligence per club sportivi italiani</product>
  <stack>React 18.3 · Vite · Tailwind 3.4 · Recharts 2.12 (già installato) · lucide-react</stack>
  <reference_charts>
    Guarda i BarChart e LineChart già in Dashboard.jsx — replica lo stesso stile:
    height={220}, tooltip, XAxis/YAxis con fontSize: 12, colore primario #534AB7
  </reference_charts>
</context>

<requirements>
  Struttura del componente (inline in Dashboard.jsx — non serve file separato):
  
  Header:
    - Titolo: "Abbonati per stagione"
    - Sub-label variazione YoY:
        Se almeno 2 stagioni disponibili:
          variazione = ((ultima.count - penultima.count) / penultima.count) * 100
          Se > 0 → testo verde: "+{X}% vs stagione precedente" + TrendingUp icon
          Se < 0 → testo rosso: "{X}% vs stagione precedente" + TrendingDown icon
          Se = 0 → testo slate: "Stabile rispetto alla stagione precedente"
        Se 1 sola stagione → testo slate: "Prima stagione disponibile"
        Se 0 stagioni → nessun sub-label
  
  Chart:
    BarChart Recharts, height={220}
    XAxis: dataKey="stagione", tick={{ fontSize: 11 }}
    YAxis: allowDecimals={false}, tick={{ fontSize: 12 }}
    Tooltip: formatter={(v) => [v, "Abbonati"]}
    Bar: dataKey="count", name="Abbonati", radius={[4, 4, 0, 0]}
      Colore: tutte le barre #534AB7 ECCETTO l'ultima (stagione più recente) che prende #10b981
      Usa il prop fill su ogni Cell di Recharts (vedi pattern in Dashboard.jsx per i PieChart)
    CartesianGrid: strokeDasharray="3 3" stroke="#f1f5f9"
  
  Stati:
    Loading: skeleton (h-4 w-1/3 + h-40 animate-pulse)
    Empty (array vuoto o tutte stagioni null): usa EmptyState component con
      title="Dati stagionali non disponibili"
      subtitle="Assicurati che il CSV abbonamenti includa il campo 'stagione'"
    
  Integrazione in Dashboard.jsx:
    fetchRetention() aggiunta alla Promise.allSettled esistente
    (o useEffect separato — usa lo stesso pattern degli altri dati della pagina)
    Posizione: colonna destra della riga creata da DA-07
</requirements>

<ux_constraints>
  - Formato stagione in input: "2023/24" — mostralo così com'è, non riformattare
  - Stagioni con valore "N/D" (null nel DB) → escludile dal chart (filtra prima del render)
  - Non mostrare numeri con decimali sull'asse Y — solo interi
  - TrendingUp/TrendingDown: importa da lucide-react (già presente nel progetto)
</ux_constraints>

<security_constraints>
  1. Non modificare autenticazione, JWT o middleware di sicurezza
  2. Non modificare la logica RLS PostgreSQL
  3. Non usare dati reali — solo dataset sintetico
  4. Non esporre fan_id in log o console
  5. Non toccare tenant.py, services/auth.py, routers/auth.py, middleware in main.py
</security_constraints>

<output_checklist>
  □ Chart posizionato nella colonna destra della riga con RfmDistributionWidget
  □ Barra dell'ultima stagione in verde (#10b981), le altre in #534AB7
  □ Sub-label variazione YoY corretta (verde se positiva, rossa se negativa)
  □ Stagioni con valore null filtrate prima del render
  □ Empty state mostra il messaggio su campo "stagione" nel CSV
  □ Loading skeleton visibile durante il fetch
  □ fetchRetention() non rompe la pagina se l'endpoint fallisce
  □ Nessun decimale sull'asse Y
</output_checklist>
```

---

### DA-09 — Top Spenders Widget (riutilizzabile — Dashboard + Report)

```xml
<mission>
  Crea un componente React riutilizzabile TopSpendersWidget che mostra
  i 5 tifosi con la spesa totale più alta, con badge del segmento RFM.
  Come RfmDistributionWidget (DA-07), il componente va usato SIA nella Dashboard
  SIA in Report.jsx che già recupera questi dati.
  Obiettivo DRY: un componente, due pagine.
</mission>

<prerequisite>
  LEGGI IL CODICE ESISTENTE prima di scrivere una riga.
  File obbligatori da leggere:
    - frontend/src/pages/Report.jsx
      → fetchTopSpenders è già importata e chiamata
      → topSpenders è già nello stato → stato: const [topSpenders, setTopSpenders] = useState([])
      → Verifica se esiste già un rendering di topSpenders nel Report — se sì, sostituiscilo
        con il nuovo componente; se no, aggiungilo senza togliere nulla
    - frontend/src/components/intelligence/AmbassadorsWidget.jsx
      → Riferimento visivo: lista con righe, stessa struttura compatta
    - frontend/src/api/client.js
      → fetchTopSpenders() → GET /dashboard/top-spenders (top 10 dal backend, mostriamo 5)

  L'endpoint è GIÀ IMPLEMENTATO:
    GET /dashboard/top-spenders
    Risposta: [
      { id: int, nome: "Marco", cognome: "Rossi", email: "...", total_spend: 1240.50, segment: "VIP" },
      ...
    ]
    Già ordinata per total_spend decrescente. Restituisce max 10 — mostrare solo i primi 5.
  Se questo endpoint non risponde, FERMATI e segnalalo — non simulare i dati.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B di fan intelligence per club sportivi italiani</product>
  <stack>React 18.3 · Vite · Tailwind 3.4 · lucide-react · axios</stack>
  <segment_colors>
    Usa esattamente SEGMENT_COLORS da Report.jsx (o dal file condiviso creato in DA-07):
    VIP: "#534AB7", Fedele: "#7F79D5", "A rischio": "#F59E0B", Dormiente: "#94A3B8", Nuovo: "#34D399"
  </segment_colors>
</context>

<implementation>
  STEP 1 — Crea il componente standalone
    File: frontend/src/components/TopSpendersWidget.jsx

    Props:
      - data: array di fan (opzionale — se non passato, fetch autonomo)
      - showFetch: boolean (default true)
      - limit: int (default 5) — quanti mostrare
    
    Stesso pattern di RfmDistributionWidget: se showFetch={false} usa data, altrimenti chiama fetchTopSpenders.

  STEP 2 — Struttura visiva
    Header: icona Trophy (lucide) + "Top Spender" + count tra parentesi es. "(5)"
    
    Lista (max 5 righe), ogni riga:
      [medaglia posizione] [nome + badge segmento]    [spesa formattata]
    
    Medaglie:
      1° → "🥇" colore #f59e0b (oro)
      2° → "🥈" colore #94a3b8 (argento)
      3° → "🥉" colore #b45309 (bronzo)
      4°, 5° → numero normale, colore slate
    
    Nome: "{nome} {cognome[0]}." — mostrare solo l'iniziale del cognome (es. "Marco R.")
    Badge segmento: pill piccolo colorato (bg-opacity-20 del colore del segmento + testo)
      Esempio: segment="VIP" → sfondo viola chiaro + testo viola scuro + label "VIP"
    Spesa: formattata in EUR con Intl.NumberFormat it-IT (identico a fmtEur in Dashboard.jsx)
    
    Separatore tra righe: border-b border-slate-50 last:border-0
    
    Footer: piccolo testo grigio
      "Spesa cumulata: abbonamenti · biglietti · shop"

  STEP 3 — Aggiorna Report.jsx
    Importa TopSpendersWidget.
    Passa i dati già caricati: <TopSpendersWidget data={topSpenders} showFetch={false} limit={5} />
    Posizionalo in modo logico rispetto alla struttura esistente del Report.
    Non rimuovere nessun'altra logica da Report.jsx.

  STEP 4 — Aggiungi alla Dashboard
    In Dashboard.jsx, crea una nuova riga a 2 colonne DOPO la riga dei widget Intelligence (Journey/Ambassadors/Decay):
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopSpendersWidget />
        {/* QuickActionsWidget (DA-10) andrà nella colonna destra */}
      </div>
    TopSpendersWidget senza props → fetch autonomo
</implementation>

<states>
  Loading: 5 righe animate-pulse (h-8 bg-slate-100 rounded-lg, identico ad AmbassadorsWidget)
  Error: testo piccolo "Dati non disponibili"
  Empty (lista vuota): stesso empty state di AmbassadorsWidget:
    "Nessun dato disponibile. Importa i CSV per vedere i top spender."
</states>

<ux_constraints>
  - PRIVACY: mostrare solo nome + iniziale cognome. Non mostrare email. Non mostrare fan_id.
  - Non usare "ID", "user_id", "fan_id" in nessun testo visibile
  - Badge segmento: testo leggibile — contrasto sufficiente tra bg e testo
  - Spesa: formato italiano (es. "€1.240" non "$1,240")
</ux_constraints>

<security_constraints>
  1. Non modificare autenticazione, JWT o middleware di sicurezza
  2. Non modificare la logica RLS PostgreSQL
  3. Non usare dati reali — solo dataset sintetico
  4. Non esporre fan_id in log, console o UI visibile
  5. Non toccare tenant.py, services/auth.py, routers/auth.py, middleware in main.py
</security_constraints>

<output_checklist>
  □ File creato: frontend/src/components/TopSpendersWidget.jsx
  □ Componente accetta props data + showFetch + limit
  □ Report.jsx usa il componente passando data={topSpenders} showFetch={false}
  □ Dashboard.jsx usa il componente senza props (fetch autonomo)
  □ Medaglie oro/argento/bronzo sulle prime 3 posizioni
  □ Cognome mostrato solo come iniziale (es. "R.")
  □ Nessuna email visibile in UI
  □ Nessun fan_id in log o console
  □ Spesa formattata in EUR formato italiano
  □ Loading, error, empty state gestiti
  □ Separatore tra righe visibile
</output_checklist>
```

---

### DA-10 — Quick Actions Strip + fix Report.jsx URL param

```xml
<mission>
  Aggiungi una "Quick Actions" card alla Dashboard di FanIQ con 4 bottoni
  che portano alle azioni più comuni del responsabile marketing.
  Questo trasforma la dashboard da schermata read-only a punto di partenza operativo.
  ATTENZIONE: questo prompt include anche una modifica a Report.jsx per supportare
  un filtro via URL param (?filter=at_risk), necessario perché uno dei bottoni
  deve pre-attivare il filtro "Solo a rischio" nel Report.
</mission>

<prerequisite>
  LEGGI IL CODICE ESISTENTE prima di scrivere una riga.
  File obbligatori da leggere:
    - frontend/src/App.jsx
      → Rotte esistenti: / /insights /report /upload /privacy /alerts
    - frontend/src/pages/Report.jsx
      → Cerca soloRischio e setSoloRischio — c'è già un filtro "Solo a rischio" locale
      → Verifica se useSearchParams è già importato — quasi certamente no
    - frontend/src/api/client.js
      → exportFans(segment, soloConsenzienti) già presente
    - frontend/src/pages/AlertsPage.jsx
      → Conferma che il path /alerts esiste e funziona
    - frontend/src/components/intelligence/TopSpendersWidget.jsx
      → Dovrebbe già esistere (creato in DA-09) — la card "Esporta VIP" usa la stessa logica di export
  
  Se Framer Motion è già installato (installato in DA-06), usalo per l'hover dei bottoni.
  Se non è installato, usa solo Tailwind transition — non installare Framer Motion qui.
</prerequisite>

<context>
  <product>FanIQ — SaaS B2B di fan intelligence per club sportivi italiani</product>
  <stack>React 18.3 · Vite · Tailwind · lucide-react · react-router-dom · axios</stack>
</context>

<implementation>
  PARTE A — Modifica Report.jsx per supportare URL param

  Aggiungi a Report.jsx:
    import { useSearchParams } from "react-router-dom";
    const [searchParams] = useSearchParams();
    
  Nel useEffect iniziale (o in un useEffect separato), leggi il param:
    useEffect(() => {
      if (searchParams.get("filter") === "at_risk") {
        setSoloRischio(true);
      }
    }, [searchParams]);
  
  Questo non richiede altre modifiche a Report.jsx — soloRischio già gestisce il filtro.
  Verifica che il comportamento sia: navigando a /report?filter=at_risk, la tabella
  mostra già i fan con probabilità di rinnovo bassa senza che l'utente debba cliccare nulla.

  PARTE B — Crea QuickActionsWidget

    File: frontend/src/components/QuickActionsWidget.jsx
    
    Struttura: card con header + griglia 2×2 di bottoni
    
    Header: icona Zap (lucide) + "Azioni rapide"
    
    I 4 bottoni:

    Bottone 1 — "Vedi anomalie critiche"
      Icona: AlertCircle, colore rosso (#ef4444)
      Azione: navigate("/alerts")
      Descrizione sotto: "Abbonati che non usano il posto"
      
    Bottone 2 — "Abbonati a rischio rinnovo"
      Icona: RefreshCw, colore arancione (#f97316)
      Azione: navigate("/report?filter=at_risk")
      Descrizione sotto: "Probabilità rinnovo < 50%"
      
    Bottone 3 — "Esporta fan VIP"
      Icona: Download, colore viola (#8b5cf6)
      Azione: chiama exportFans("VIP") da api/client.js
      Stato loading: isExporting (boolean) — durante il download l'icona diventa
        <Loader2 className="animate-spin" /> (lucide) e il bottone è disabilitato
      Dopo il download: ripristina lo stato normale (nessun toast, nessun messaggio)
      Descrizione sotto: "CSV pronto per la campagna"
      
    Bottone 4 — "Carica nuovi dati"
      Icona: Upload, colore blu (#3b82f6)
      Azione: navigate("/upload")
      Descrizione sotto: "Aggiorna abbonamenti, biglietti, shop"
    
    Layout ogni bottone:
      <button className="flex items-center gap-3 p-3 rounded-xl border border-slate-100
        hover:bg-slate-50 transition-colors w-full text-left">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </button>
    
    Se Framer Motion è disponibile, aggiungi whileHover={{ scale: 1.01 }} su ogni bottone.
    Se non è disponibile, usa solo hover:bg-slate-50 Tailwind.

  PARTE C — Integrazione in Dashboard.jsx
    Nella riga 2 colonne creata in DA-09:
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopSpendersWidget />
        <QuickActionsWidget />
      </div>
</implementation>

<ux_constraints>
  - Label bottoni: concise, in italiano, orientate all'azione ("Vedi", "Esporta", "Carica")
  - NON mostrare messaggi di successo dopo l'export — il download del browser è feedback sufficiente
  - NON mostrare messaggi di errore se l'export fallisce — silenzio visivo (log in console OK)
  - Il bottone 3 deve essere disabilitato visivamente durante il loading (opacity-60 + cursor-not-allowed)
  - Non usare "alert", "anomalia", "critico" nei label — già corretti nel testo proposto
</ux_constraints>

<security_constraints>
  1. Non modificare autenticazione, JWT o middleware di sicurezza
  2. Non modificare la logica RLS PostgreSQL
  3. Non usare dati reali — solo dataset sintetico
  4. Non esporre fan_id in log o console
  5. Non toccare tenant.py, services/auth.py, routers/auth.py, middleware in main.py
</security_constraints>

<output_checklist>
  □ Report.jsx importa useSearchParams e legge il param "filter"
  □ Navigare a /report?filter=at_risk pre-attiva il filtro soloRischio=true
  □ File creato: frontend/src/components/QuickActionsWidget.jsx
  □ Bottone 1 naviga a /alerts
  □ Bottone 2 naviga a /report?filter=at_risk (non solo /report)
  □ Bottone 3 chiama exportFans("VIP") e mostra spinner durante il download
  □ Bottone 3 disabilitato durante il loading (no doppio click)
  □ Bottone 4 naviga a /upload
  □ QuickActionsWidget posizionato nella colonna destra accanto a TopSpendersWidget
  □ Hover visibile su ogni bottone (sia Framer Motion che Tailwind fallback)
  □ Nessun messaggio di successo/errore dopo l'export
</output_checklist>
```

---

*Versione 2 — Generata il 24 giugno 2026 dopo audit prompt engineering completo.*
*Versione 1 archiviata — non usarla.*
*Prompt DA-00→DA-05: vedi prompt_library.md*
