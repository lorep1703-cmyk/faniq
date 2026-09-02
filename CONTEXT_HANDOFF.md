# FanIQ — Context Handoff
> Aggiornato: 2026-09-02 | Da leggere all'inizio della prossima sessione

---

## Stato attuale

Sessione lunghissima di audit + fix sul Fan Intelligence Engine e sulla coerenza generale dell'app. **Nessun commit fatto oggi** — tutte le modifiche sono ancora locali (24 file modificati, 3 eliminati, 4 nuovi). Da committare prima di continuare o deployare — vedi in fondo.

**Ambiente locale**: la cartella è stata spostata da iCloud (`~/Desktop/corso ia/faniq`, causa di rallentamenti gravi) a `~/Developer/faniq`, non più sincronizzata. Il venv del backend era rotto dopo lo spostamento (path assoluti nei binari) — **ricreato**, ora funziona. Il DB SQLite locale (`backend/faniq.db`) è stato ricreato da zero durante il fix di uno schema disallineato — è **vuoto** salvo un club di test creato oggi per le verifiche ("Verify E2E", 50 fan sintetici da `sample_csv/dashtest_*`).

---

## Fix critici di oggi (i più importanti)

| Cosa | Impatto |
|---|---|
| `_current_season()` generava "2026/27" invece di "2026/2027" (formato reale in DB) | **Lo Stadio 3 (Subscription Anomaly) non ha mai generato un alert, per nessun fan, in nessun club, da sempre.** Fix da 1 riga in `engine.py`. Sul club di test: alert 0 → 10 immediatamente. |
| Due motori indipendenti di "Probabilità di rinnovo" (`services/renewal.py` vecchio + Fan Intelligence Engine Stadio 5) | Stessa scheda fan mostrava due numeri diversi sotto lo stesso nome. Consolidati su un solo motore (Stadio 5); `services/renewal.py`/`routers/renewal.py`/test relativi **eliminati**. |
| Chat AI: `services/chat.py` leggeva `insights["insights"]`, chiave che non esiste mai | Il contesto "Insights" per il modello era sempre vuoto, silenziosamente. Fixato per leggere Business Score/Revenue Watch/Opportunità/Azioni reali. |
| RFM Distribution Widget esclude "Occasionale" dalla `DISPLAY_ORDER` | **24 fan su 50 (quasi metà del club test) invisibili** in "Segmenti RFM" — su Dashboard e Report. "N tifosi analizzati" e tutte le percentuali sono sbagliate. **Trovato ma non ancora fixato.** |

---

## Lavoro completato oggi

**Riorganizzazione Calendario/Intelligence/Simulatore:**
- Calendario + Predizione Presenze uniti in "Calendario & Presenze"
- Simulatore ritirato come pagina standalone (`/simulatore` ora redirige), unito come sezione "Scenario ipotetico" dentro Calendario & Presenze — parte dai numeri reali (non più da una media storica indovinata)
- Scoperto: "Presenze stimate" non includeva mai gli abbonati (solo `Biglietto`, mai `Abbonamento`) — ora mostrato onesto: biglietti singoli + abbonati stagione separati

**Coerenza taxonomy/copy:**
- Journey Stage "RISCHIO" rinominato "Declino" ovunque (badge, filtri, messaggi di anomalia) — non più identico al segmento RFM "A rischio"
- "Da contattare" (badge Sidebar + card Dashboard) allineato alla pagina Alerts (tutte le severità, non solo CRITICA)
- QuickActionsWidget: soglia dichiarata corretta (era 50%, applicata 40%)
- Ambassador: nome vero al posto di "Fan #N" (bug `fan_name` inesistente in API); soglia 60 consolidata su un'unica fonte (`getTier`), rimossa la copia morta nel config backend

**Soglie adattive Anomaly (Stadio 3):**
- La severity ora dipende da decay profile + storico abbonamenti, non più fissa per journey stage — un fan fedele ha più margine prima di essere segnalato critico, uno nuovo/volatile meno. Progettata con casi concreti, verificata sui dati reali.

**5 feature predittive nuove:**
1. `half_life_value` esposto — frase predittiva "torna entro N partite" (dato già calcolato, mai mostrato prima)
2. Revenue biglietteria previsto per la prossima partita (per-tier)
3. Spesa shop attesa nei prossimi 3 mesi (trend recente vs precedente)
4. Simulatore unito a Calendario & Presenze (vedi sopra)
5. Valore futuro atteso (CLV = renewal_probability × spesa storica recente) in FanDetailPanel + widget "Potenziale dormienti" in Dashboard — **ridefinito rispetto all'idea originale**: "Simulazione di riattivazione" basata su storico di campagne non era costruibile (FanIQ non traccia campagne), sostituita con un numero onesto (valore storico dei dormienti, nessuna % di risposta inventata)

**Pulizia:**
- 4 import Python morti pre-esistenti rimossi (non causati oggi, trovati durante l'audit finale)

Tutto verificato punto per punto con dati reali nel browser (non solo unit test) — 24/24 test passano.

---

## Backlog aperto — niente di questo è stato toccato

| # | Cosa | Perché non fatto |
|---|---|---|
| 1 | **RFM Distribution Widget esclude "Occasionale"** | Trovato nell'ultimissima analisi, non ancora fixato — priorità alta, impatto su Dashboard e Report |
| 2 | Abbonamento senza data corrompe anche la recency RFM (non solo la finestra di rinnovo) | Stesso limite di dati di sotto, conseguenza mai notata prima |
| 3 | CTA "Crea campagna" in Predizione Presenze | Ancora uno stub "Presto" — serve un modo di esportare/contattare per tier di una partita specifica (l'export attuale filtra solo per segmento RFM) |
| 4 | Business Score "A rischio" + sub-cluster Revenue Watch "A rischio" | Quarta e quinta occorrenza della stessa parola per concetti diversi — solo segnalate |
| 5 | Finestra di rinnovo prevista | Bloccata: `Abbonamento` non ha nessuna data di acquisto/rinnovo, solo `stagione` come stringa — serve modifica al modello + CSV import |
| 6 | `was_dormiente_last_week` hardcoded `False` in `engine.py` | `JourneyStage.RECUPERATO` non è mai raggiungibile — serve uno storico di snapshot settimanali (nuova tabella + job periodico), non un fix puntuale |
| 7 | Upload — 4 card CSV con comportamento diverso (polling vs sincrono) | Bassa priorità, motivo tecnico valido (cold-start Render) ma incoerente visivamente |

---

## File chiave del workspace

| File | Contenuto |
|------|-----------|
| `CLAUDE.md` | Istruzioni tecniche — aggiornato oggi (router/feature table, schema risposta intelligence) |
| `sample_csv/dashtest_*.csv` | Dataset 50 fan sintetici usato per tutte le verifiche di oggi |
| `backend/faniq.db.bak-20260902144342` | Backup del DB prima del fix schema — non tracciato in git |

---

## Prima di continuare

1. **Committare** le modifiche di oggi (CLAUDE.md dice sempre di non lasciare sessioni con modifiche pendenti) — non ancora fatto su richiesta esplicita, chiedere conferma.
2. Il DB locale è vuoto — ricaricare `sample_csv/dashtest_*` sul club di test se serve continuare a verificare dal vivo, o registrarne uno nuovo.
3. Riprendere dal backlog aperto sopra, punto per punto, con lo stesso approccio di oggi (analisi → discussione → fix → verifica dal vivo).
