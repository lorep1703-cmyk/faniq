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
4. Presenza di un passaggio di revisione esplicito e separato prima della consegna finale a Lorenzo (sì/no + cosa ha trovato) — riformulata su richiesta di Lorenzo (2026-07-02): misura ciò che gli strumenti offrono davvero (review dopo la stesura, prima della consegna), non un'auto-critica "prima della scrittura" che nessun candidato soddisfa alla lettera
5. Numero di claim non verificati nel deliverable finale

## Candidati (max 3) — ricerca 2026-07-02

Fonte primaria: marketplace ufficiale Anthropic `anthropics/claude-plugins-official` (built-in in Claude Code, ~101 plugin, mantenuto attivamente). Community valutata e scartata (v. fondo).

### Candidato 1 — Plugin ufficiale `feature-dev` (Anthropic)
Workflow di sviluppo con agenti specializzati: esplorazione codebase → design architetturale → **quality review**. Copre 2 dei 3 obiettivi A: disciplina di pianificazione prima di modifiche multi-file + reviewer separato dall'esecutore.
- **Futuribilità: alta** — Anthropic-managed, nel marketplace ufficiale.
- **Attinenza: alta** — è esattamente "pianifica, poi fai criticare l'output".
- **Efficienza: media** — installazione via marketplace; abilitazione per-progetto in `.claude/settings.json` (versionato ✓), ma la cache del plugin vive in `~/.claude` (globale — da dichiarare a Lorenzo prima).

### Candidato 2 — Plugin ufficiale `hookify` (Anthropic)
Crea hook da regole scritte in semplici file markdown: "prima di scrivere file / eseguire shell / installare, chiedi conferma". Copre il terzo obiettivo A (conferme prima di azioni con effetti collaterali).
- **Futuribilità: alta** — Anthropic-managed.
- **Attinenza: alta** — regole di conferma senza scrivere codice hook a mano.
- **Efficienza: alta** — le regole markdown sono file di progetto versionabili ✓. Stessa nota cache `~/.claude` del candidato 1.
- Complementare al candidato 1 o 3 (non si sovrappongono → possono convivere, come da brief).

### Candidato 3 — Soluzione nativa zero-dipendenze (nessun plugin)
Solo feature native documentate di Claude Code, tutte in file versionati nel branch:
- `.claude/agents/reviewer.md` — subagente reviewer custom con `planModeBehavior: "force"` (sempre in sola-lettura/critica, mai esecuzione);
- hook `PreToolUse` minimale scritto a mano in `.claude/settings.json` che chiede conferma su Write/Edit/Bash;
- plan mode incoraggiata via CLAUDE.md per modifiche multi-file.
- **Futuribilità: massima** — nessun codice di terzi, solo API native documentate.
- **Attinenza: alta** — copre tutti e 3 gli obiettivi A, ma al livello di sofisticazione che scriviamo noi.
- **Efficienza: media** — costo iniziale di scrittura nostro; zero dipendenze da mantenere; tutto rimovibile buttando il branch ✓.

### Scartati
- `code-review` / `pr-review-toolkit` (Anthropic): ottimi ma centrati su review di PR GitHub — FanIQ non usa PR nel flusso attuale; attinenza minore di feature-dev.
- `VoltAgent/awesome-claude-code-subagents` e simili raccolte community (100+ subagenti generici): futuribilità e qualità disomogenee vs canali ufficiali; attinenza dispersiva.

### Nota per l'area B (trovata durante questa ricerca, NON installata)
Plugin ufficiale Anthropic `frontend-design`: "create distinctive frontend interfaces… avoids generic AI aesthetics" — descrizione perfettamente sovrapponibile all'obiettivo B del brief. Registrata qui e in STATO-PIANO.md per la Sessione 2.

### Raccomandazione
**hookify + candidato 3** (convivono, coprono tutti gli obiettivi A, massima quota di file versionati) oppure **feature-dev da solo** se si preferisce un solo strumento mantenuto da Anthropic. Decide Lorenzo.

---

## Benchmark AFTER — 2026-07-06 (stesso task, dopo installazione hookify + reviewer)

**Processo eseguito:** piano esplicito in 6 passi dichiarato PRIMA di ogni lettura → lettura completa dei file → stesura piano v1 → **revisione separata del subagente reviewer** → correzioni → consegna.

**Esito revisione (il cuore del confronto):** il reviewer ha risposto **DA RIVEDERE** con 7 problemi verificati file alla mano, tra cui: un mio claim errato (fmtEur "in 6 file": in realtà 5 funzioni + 1 uso inline con firma diversa in FanDetailPanel righe 148-152), un off-by-one (RenewalBadge è a righe 50-66, non 51-67), 3 firme incomplete (filterAndSortFans, useFanReportData, standardizzazione fmtEur) e una race condition preesistente su loadIntelligence segnalata come issue separata. Tutti incorporati nel piano finale prima della consegna.

**Confronto sulle 5 metriche:**

| # | Metrica | BEFORE | AFTER |
|---|---------|--------|-------|
| 1 | Piano esplicito dichiarato prima dell'azione | NO | **SÌ** (6 passi dichiarati a Lorenzo prima delle letture) |
| 2 | Copertura lettura file coinvolti | ~240/431 righe di Report.jsx, 0 file collegati aperti | **431/431** + Dashboard.jsx, RfmDistributionWidget.jsx verificati con grep mirato; il reviewer ha aperto anche Insights, Simulatore, TopSpendersWidget, FanDetailPanel |
| 3 | Conferme richieste su azioni con effetti | Nessuna | n/a nel task (nessuna azione con effetti); hook hookify testati funzionalmente 6/6 nel sandbox ma NON attivi nelle sessioni Cowork → verifica in Claude Code CLI PENDENTE (dichiarato, non spuntato) |
| 4 | Revisione esplicita e separata prima della consegna finale | Assente | **SÌ** — reviewer separato, verdetto DA RIVEDERE, 7 problemi, tutti gestiti |
| 5 | Claim non verificati nel deliverable finale | 3 (colori Dashboard assunti; ~150 righe non calcolate; incoerenza report/ vs intelligence/ non rilevata) | **0** — il claim errato del draft (fmtEur×6) è stato intercettato dal reviewer e corretto PRIMA della consegna |

**Scoperte extra dell'after assenti nel before** (misura indiretta della qualità): SEGMENT_COLORS in Report.jsx:37 è codice morto (il before proponeva di "estrarlo"); l'intero import recharts di Report.jsx:5 è inutilizzato; RfmDistributionWidget.jsx:5 esporta già SEGMENT_COLORS (il before proponeva di crearlo da zero); Dashboard.jsx hardcoda #534AB7 in 5 punti.

**Limite onesto del confronto:** le metriche 1, 2, 4, 5 migliorano per effetto del reviewer e della disciplina di processo; la metrica 3 dipende da hookify, che in Cowork non è attivo — il suo effetto reale va osservato in Claude Code CLI sulla macchina di Lorenzo (regole già nel branch, test funzionale 6/6 superato).
