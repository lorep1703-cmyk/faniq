# Competitor Analysis — FanIQ

> ⚠️ Questo file è un template di lavoro. Non è ancora stata condotta un'analisi sistematica dei competitor.
> Per condurre l'analisi: usare il prompt `STR-01` in `prompts/prompt_library.md`.

---

## Panorama competitivo — Prima mappatura (ipotetica)

### Competitor diretti (fan intelligence / sports analytics)

| Nome | Posizionamento | Target | Note |
|------|---------------|--------|------|
| Fanbase | Fan engagement e analytics | Club Premier League / top europei | Troppo enterprise per il nostro target |
| Greenfield | Fan data platform | Club internazionali medio-grandi | Non focus Italia |
| [Da ricercare] | — | — | — |

> ⚠️ Dati non verificati — da aggiornare con ricerca sistematica.

### Competitor indiretti (CRM sportivi)

| Nome | Posizionamento | Target | Note |
|------|---------------|--------|------|
| HubSpot Sport | CRM generico | Qualsiasi settore | Non verticale sport |
| Salesforce | CRM enterprise | Enterprise | Troppo costoso e complesso |
| [Da ricercare] | — | — | — |

### Sostituti reali (cosa usano i club oggi)

- **Excel / Google Sheets** — il "competitor" più comune. Gratis, familiare, ma non scalabile.
- **Esportazioni manuali dal sistema di abbonamenti** — dati grezzi senza analisi.
- **Niente** — molti club non analizzano i dati dei tifosi affatto.

---

## Differenziatori di FanIQ (ipotesi)

1. **Verticale calcio italiano** — non un tool generico adattato
2. **Onboarding in 10 minuti** (CSV) — nessun setup lungo
3. **Business Score** — un numero comprensibile al presidente, non solo al marketing
4. **GDPR nativo** — non un'aggiunta esterna
5. **Chat AI** — query in linguaggio naturale, zero SQL

---

## Prossimo passo

Condurre analisi sistematica usando il prompt `STR-01` → aggiornare questo file con risultati reali.

---

*Aggiornato il 22 giugno 2026. Template — analisi sistematica non ancora condotta.*

---

## Aggiornamento — 2026-06-22
*Sessione: Marketing — Prima ricerca competitor sistematica (web search)*

---

### Chi NON è competitor diretto per Serie C / Lega Pro

| Nome | Cosa fanno | Perché non ci riguarda |
|------|-----------|------------------------|
| **Deltatre** | Analytics enterprise + piattaforme digitali per grandi club e broadcaster | Partner ufficiale Lega Serie A (contratto pluriennale). Prodotto costruito per club con budget da Serie A. ⭐⭐⭐⭐⭐ |
| **Fanbase** (fanbaseclub.com) | Fan engagement per club europei top | Target Premier League / club europei grandi. Nessuna presenza documentata su Lega Pro / Serie C italiana. ⭐⭐⭐ |
| **FanBase** (fanbase.gg) | Gamified fan engagement (badge, premi, token) | Prodotto diverso: gamification, non analytics su dati abbonamenti. ⭐⭐⭐ |
| **Stats Perform / Opta** | Performance analysis di campo | Dati tecnici (prestazioni giocatori). Non dati commerciali tifosi. |
| **Genius Sports** | Fan data per grandi club e federazioni | Enterprise. Nessun focus Italia Serie C. |

---

### Il vero competitor: lo status quo ⭐⭐⭐⭐⭐

> Confermato dalla ricerca. I club di Serie C sono appena passati alle **distinte digitali** (foglio squadra digitale per le partite). Analytics sui tifosi = quasi inesistenti a questo livello.

Cosa usa oggi un club di Lega Pro:
- **Export manuale da Vivaticket** — CSV grezzo con dati di biglietteria. Nessuna analisi automatica, nessuna segmentazione.
- **Excel** — il "database" ufficiale del responsabile marketing. Aggiornato quando c'è tempo.
- **Niente** — la scelta più comune. Non mancano i dati: manca il tempo e lo strumento per usarli.

---

### Vivaticket — capire il sostituto più usato

Vivaticket è il sistema di ticketing usato da Pro Vercelli (e da molti club di Lega Pro). Cosa offrono come analytics:

- Accesso in tempo reale ai dati di vendita biglietti durante le partite
- Controllo accessi allo stadio
- Export dati vendite in CSV

**Cosa NON fanno:** nessuna segmentazione comportamentale, nessuna analisi della fedeltà nel tempo, nessun punteggio di rischio abbonati, nessuna chat in italiano.

**Implicazione operativa per FanIQ:** il CSV che Pro Vercelli esporta da Vivaticket è esattamente l'input di FanIQ. Nessuna integrazione da costruire — basta caricare. Questo va detto esplicitamente nel primo outreach e nella demo.

---

### Gap di mercato confermato ⭐⭐⭐⭐⭐

Nessuno strumento di fan intelligence dedicato al mercato Lega Pro / Serie C italiano è stato identificato nella ricerca. Il mercato è:
- Completamente non presidiato da software verticali per questo target
- Gestito con strumenti generici (Excel, export manuali)
- In ritardo di anni rispetto alla Serie A

FanIQ non compete contro software: compete contro **il lunedì mattina col CSV aperto su Excel**.

---

### Cose da monitorare

- Se **Fanbase** (fanbaseclub.com) inizia a muoversi verso il mercato italiano Serie C
- Se **Lega Pro** lancia iniziative digitali centralizzate per i club (come Serie A con Deltatre)
- Presenza di startup italiane nel settore (non emerso nella ricerca — segnale positivo)

---

*Aggiornato il 22 giugno 2026. Prima analisi sistematica — web search condotta in sessione Marketing.*
