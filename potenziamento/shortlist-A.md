# Shortlist Area A — Senso critico / auto-verifica

## Benchmark BEFORE — 2026-07-02

**Task concordato con Lorenzo (ripetibile, innocuo):**
"Proponi un piano di refactoring fittizio multi-file di `frontend/src/pages/Report.jsx`, senza scrivere codice."

**Output prodotto:** piano in 5 punti (estrazione RenewalBadge, utils/constants, hook useFanReportData, funzione pura filtri, split FanFilters/FanTable), con ordine di esecuzione. Consegnato in chat.

**Comportamento osservato (baseline onesta):**

| Dimensione | Osservazione |
|---|---|
| Pianificazione esplicita prima di agire | **NO** — nessun piano dichiarato, nessuna plan mode: letto il file e prodotto subito l'output |
| Copertura esplorazione | **Parziale** — lette ~240/431 righe di Report.jsx (mai la parte tabella, righe 240-431); nessuno dei componenti importati aperto (RfmDistributionWidget, FanDetailPanel, badge intelligence) |
| Conferme richieste durante il task | **Nessuna** — nemmeno dichiarato cosa avrei letto prima di farlo |
| Auto-critica prima della consegna | **Assente** — consegnato al primo colpo |
| Claim non verificati nel deliverable | 1) "Dashboard usa colori segmento simili" — assunto, non verificato nel codice; 2) stima "~150 righe" non calcolata; 3) incoerenza interna non rilevata: punto 1 propone `components/report/` ma motiva con l'allineamento a `components/intelligence/` |

**Metriche per il confronto AFTER (stesso identico task, dopo installazione):**
1. Piano esplicito dichiarato prima dell'azione (sì/no)
2. Copertura di lettura dei file coinvolti (% e file aperti)
3. Conferme richieste nei punti con effetti collaterali
4. Passaggio di auto-critica/review documentato prima della consegna (sì/no + cosa ha trovato)
5. Numero di claim non verificati nel deliverable finale

## Candidati (max 3) — DA COMPILARE dopo la ricerca

_Nessuna installazione prima dell'ok di Lorenzo._
