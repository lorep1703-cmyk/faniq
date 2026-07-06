# Checklist di prontezza al merge `feature/agent-upgrade` → `main`

> Redatta in Sessione 4 (2026-07-06). Documento preparatorio: organizza i fatti verificati, **non contiene né sostituisce la decisione di merge, che è di Lorenzo**.

> ⚠️ **Avvertenza contro il falso senso di completezza:** questa checklist copre le condizioni note e verificabili oggi. Tutte le caselle "soddisfatte" NON significano zero rischio: hookify resta fail-open (in caso di errore l'operazione passa), il comportamento degli hook è stato osservato in una sola sessione CLI, e il valore reale del reviewer si misurerà solo sull'uso ripetuto. Una checklist misura ciò che sappiamo chiedere, non ciò che non sappiamo di non sapere.

Ogni condizione è marcata **SODDISFATTA / NON SODDISFATTA / NON VERIFICABILE DA ME**, sulla base di osservazioni reali fatte in Sessione 4 (comando indicato), non su quanto dichiarato dai documenti delle sessioni precedenti.

| # | Condizione | Stato | Evidenza (Sessione 4) |
|---|------------|-------|------------------------|
| 1 | Nessun commit del piano su `main` | **SODDISFATTA** | `git log origin/main`: tip `7c2fe43`, unico commit sopra la base `1437a0f`, autore Lorenzo, estraneo al piano (fix launch.json) |
| 2 | Tutti i commit del branch confinati a `potenziamento/` e `.claude/` | **SODDISFATTA** | `git diff --name-only origin/main..feature/agent-upgrade`: uniche directory toccate `.claude` e `potenziamento` (15 commit, zero file applicativi) |
| 3 | Smoke test frontend+backend superati sul branch | **SODDISFATTA alla Sessione 3, NON rieseguita in Sessione 4** | Esiti in riepilogo-finale.md §2. I 4 commit successivi allo smoke test (2 di Lorenzo, 2+ di Sessione 4) toccano solo markdown e una regola hookify → nessun impatto plausibile sulla build, ma la build NON è stata rilanciata: se si vuole certezza, rieseguire |
| 4 | Benchmark before/after documentato | **SODDISFATTA** | shortlist-A.md, 5 metriche, numeri non ricalcolati in S4 (istruzione del brief) |
| 5 | Hook di conferma verificati in Claude Code CLI reale | **SODDISFATTA secondo evidenza fornita da Lorenzo — NON VERIFICABILE DA ME direttamente** | Test del 2026-07-06 con blocco `rm -rf` attivato (ADDENDUM-PRE-SESSIONE4.md §5). Il mio sandbox è fisicamente separato dalla CLI e dal `~/.claude` di Lorenzo: non posso osservarlo |
| 6 | Blocco esteso a ogni `git push` funzionante | **NON SODDISFATTA (mai testato)** | Pattern verificato nel file (`git\s+push`), ma nessuno ha osservato il blocco attivarsi → azione 4 di azioni-lorenzo.md |
| 7 | Regola TEMPORANEA `pausa-faniq` rimossa | **NON SODDISFATTA** | `.claude/hookify.pausa-faniq.local.md` presente sul branch (verificato con `ls` nel clone). Va rimossa prima o contestualmente al merge, altrimenti blocca lo sviluppo FanIQ |
| 8 | Conflitto checkout da mirror risolto | **SODDISFATTA de facto** | Branch checked out nel repo reale, nessun untracked confliggente residuo su potenziamento/.claude (metodo di risoluzione non documentato) |
| 9 | Working tree pulito | **NON SODDISFATTA** | 8 file modificati + 8 CSV cancellati + untracked preesistenti, più le modifiche di Sessione 4 non ancora committate → azioni 1 e 2 di azioni-lorenzo.md |
| 10 | Commit di Sessione 4 adottati nella storia del branch | **NON SODDISFATTA (pendente)** | Esistono nel bundle e come modifiche al working tree → azione 1 di azioni-lorenzo.md |
| 11 | Merge tecnicamente pulito | **SODDISFATTA (previsione verificabile, non garanzia)** | Branch e main divergono (15 vs 1 commit dalla base comune): merge reale, non fast-forward; nessun file toccato da entrambi i lati → nessun conflitto atteso. La previsione andrà confermata dal merge stesso |
| 12 | Anomalia render.yaml 3.9.18 vs 3.11 | **APERTA ma NON bloccante per questo merge** | Preesistente al piano, su file mai toccato dal branch; da gestire in una sessione FanIQ |

## Rischi residui noti (indipendenti dalle caselle sopra)

1. **hookify è fail-open:** se lo script della regola va in errore, l'operazione PASSA. È un guardrail contro la distrazione, non una cassaforte contro i fallimenti.
2. **Gli hook agiscono solo in Claude Code CLI**, non nelle sessioni Cowork (verificato empiricamente in Sessione 2): in Cowork la protezione equivalente è disciplina di processo, non meccanica.
3. **`pausa-faniq` (condizione 7):** se dimenticata dopo il merge, ogni modifica a backend/frontend verrà bloccata — il sintomo sembrerà un malfunzionamento di Claude Code.
4. **Blocco push mai osservato (condizione 6):** fino al test, considerare la protezione sui push come non esistente.
5. **Reviewer testato su un solo task** (il benchmark): l'efficacia su task diversi da un piano di refactoring non è misurata.

## Autocritica su questo documento (richiesta dal brief S4 §4.4)

Il formato tabellare invita a "contare le caselle verdi" — è esattamente il falso senso di completezza contro cui avverte l'intestazione. In particolare la condizione 3 (smoke test) è verde per fiducia nella Sessione 3 più un ragionamento di plausibilità, non per un test rilanciato oggi: è la casella più debole della tabella.

## Futuribilità

Utile solo fino alla decisione di merge. Dopo: le condizioni 6 (test push) e 7 (pausa-faniq) restano rilevanti anche post-merge; il resto diventa storico. Proposta: dopo il merge, trasferire 6 e 7 dove verranno viste (es. CLAUDE.md o azioni residue) e archiviare questo file.
