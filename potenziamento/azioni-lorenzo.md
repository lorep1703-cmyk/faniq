# Azioni a carico di Lorenzo — fonte unica (Sessione 4, 2026-07-06)

> Questo file consolida TUTTE le azioni ancora pendenti a carico di Lorenzo, prima sparse tra STATO-PIANO.md, riepilogo-finale.md e i brief di sessione. Regola anti-divergenza: per ogni azione il **dettaglio completo resta nel documento d'origine** (linkato); qui c'è una riga di descrizione, il comando esatto, il motivo e la conseguenza dell'inazione. Se questo file e il documento d'origine divergono, vince il documento d'origine e questo file va corretto.

Ordinate per dipendenza: le prime sbloccano le successive. Le azioni senza numero di dipendenza sono indipendenti e fattibili in qualsiasi momento.

---

## 1. Adottare i commit della Sessione 4 — SBLOCCA LE DECISIONI SUCCESSIVE

**Cosa:** i documenti aggiornati in questa sessione (riepilogo corretto, questo file, checklist-merge.md, STATO-PIANO, documenti di mandato) esistono come modifiche nel tuo working tree E come commit atomici nel bundle rigenerato (elenco esatto degli hash nel recap di fine Sessione 4). Vanno portati nella storia del branch, in uno dei due modi — **scegline UNO solo**.

**Opzione A — adotti i commit atomici di Cowork (storia granulare, coerente col resto del piano):**
```bash
cd ~/Desktop/corso\ ia/faniq
git checkout -- potenziamento/riepilogo-finale.md potenziamento/STATO-PIANO.md
rm potenziamento/azioni-lorenzo.md potenziamento/checklist-merge.md potenziamento/ADDENDUM-PRE-SESSIONE4.md potenziamento/BRIEF-SESSIONE4.md
git pull potenziamento/agent-upgrade.bundle feature/agent-upgrade
```
(Il `checkout --` e gli `rm` eliminano le copie di lavoro identiche a ciò che arriva dal bundle — zero perdita di contenuto; git altrimenti rifiuta il pull.)

**Opzione B — committi tu il working tree in un colpo solo (più semplice, storia meno granulare):**
```bash
cd ~/Desktop/corso\ ia/faniq
git add potenziamento/riepilogo-finale.md potenziamento/STATO-PIANO.md potenziamento/azioni-lorenzo.md potenziamento/checklist-merge.md potenziamento/ADDENDUM-PRE-SESSIONE4.md potenziamento/BRIEF-SESSIONE4.md
git commit -m "[potenziamento] Sessione 4: autoverifica, correzioni riepilogo, azioni-lorenzo, checklist-merge"
```
⚠️ Con l'opzione B il bundle diventa obsoleto (storia divergente a contenuto identico): ignoralo o cancellalo.

**Motivo:** senza questo passo, tutto il lavoro di Sessione 4 resta modifiche non committate, esposte a perdita accidentale.
**Se non lo fai:** un `git checkout -- .` o uno stash sbagliato cancella la Sessione 4.
**NON aggiungere** in nessuno dei due casi: i file sporchi preesistenti (v. azione 2) e `potenziamento/.tmp-unlink-probe` (v. azione 3).

## 2. Decidere sui file sporchi preesistenti (ex "stash su main")

**Cosa:** le modifiche non committate preesistenti (8 file modificati tra docs marketing/context, 8 CSV demo cancellati, vari untracked) non sono mai state stashate (`git stash list` è vuoto, verificato in Sessione 4) e ora vivono sul working tree del branch, migrate col checkout.
**Comando (se vuoi accantonarle):** `git stash` — **SENZA `-u`**, per non accantonare anche gli untracked di potenziamento/ (motivazione in [STATO-PIANO.md → Anomalie storiche](STATO-PIANO.md)).
**Motivo:** working tree pulito prima del merge; riduce il rischio di commit accidentali misti.
**Se non lo fai:** nulla si rompe subito, ma ogni `git add` generoso (es. `git add .`) mescolerebbe modifiche di marketing non revisionate con il lavoro potenziamento. Contenuto delle modifiche mai revisionato da nessuno in questo ciclo: solo tu sai se vanno tenute.

## 3. Rimuovere il file residuo del test di Sessione 4

**Cosa:** `potenziamento/.tmp-unlink-probe` — file vuoto creato da Cowork per verificare (con un test reale, non per deduzione) se la cancellazione nella cartella montata fosse ancora bloccata. Lo è: il file non è rimovibile dal sandbox.
**Comando:** `rm potenziamento/.tmp-unlink-probe`
**Motivo:** pulizia; è spazzatura untracked innocua.
**Se non lo fai:** nessun effetto pratico, resta un file vuoto nascosto.

## 4. Test del blocco `git push` (nuova regola hookify, NON ancora osservata da nessuno)

**Cosa:** il 2026-07-06 hai esteso `conferma-distruttivi` a qualunque `git push` (commit `e982b8f`). Il pattern è verificato nel file, ma **nessuno ha ancora visto quel blocco attivarsi** — né in sandbox né in CLI.
**Test (30 secondi, innocuo, nella tua sessione Claude Code CLI sul progetto):** chiedi a Claude Code di eseguire:
```
git push --dry-run origin feature/agent-upgrade
```
- **Se l'hook funziona:** blocco con messaggio `[conferma-comandi-distruttivi]` PRIMA dell'esecuzione (il `--dry-run` rende comunque innocuo il caso di mancato blocco: non trasferisce nulla, ma contatta il remote).
- **Se non funziona:** il comando viene eseguito direttamente → la regola non ti protegge dai push: segnalalo nella prossima sessione e non fidarti del guardrail per i push fino a correzione.

**Riferimento — procedura del test hook già eseguita con successo il 2026-07-06** (utile come modello per testare regole future): crea cartella fittizia → chiedi `rm -rf` su di essa → verifica blocco → pulisci con `rmdir`. Dettaglio integrale in [ADDENDUM-PRE-SESSIONE4.md §5](ADDENDUM-PRE-SESSIONE4.md).

## 5. (Solo se ti serve mentre resti sul branch) Il fix launch.json non c'è sul branch

**Cosa:** il tuo commit `7c2fe43` su main (aggiunge `"cwd": "frontend"` a `.claude/launch.json`) NON è sul branch: finché lavori sul branch, l'avvio dev frontend da launch.json ha il vecchio comportamento.
**Comando (solo se il problema ti si ripresenta):** `git cherry-pick 7c2fe43` (dal branch) — oppure aspetti il merge, che lo riporterà da main.
**Se non lo fai:** nessun impatto sul piano; solo l'inconveniente dev che avevi già fixato.

## 6. Decisione merge — DIPENDE DA 1 (e idealmente da 2 e 4)

**Cosa:** leggere [checklist-merge.md](checklist-merge.md) (condizioni verificate, fatti organizzati, nessun verdetto) insieme a [riepilogo-finale.md §5](riepilogo-finale.md) e decidere: merge completo, cherry-pick parziale, o altro giro di prova sul branch.
**Prima o contestualmente al merge:** rimuovere la regola TEMPORANEA `.claude/hookify.pausa-faniq.local.md` (bloccherebbe il normale sviluppo FanIQ — dettaglio in [riepilogo-finale.md §6](riepilogo-finale.md)).
**Se non lo fai:** il branch resta in sospeso; ogni sessione FanIQ futura sul branch è bloccata dalla regola pausa-faniq.

## 7. Plugin `frontend-design` — decisione mai presa

**Cosa:** raccomandato in [dossier-UX/valutazione-frontend-design.md](dossier-UX/valutazione-frontend-design.md), ma **mai autorizzato con un OK esplicito** → mai installato (la raccomandazione non è autorizzazione). Se lo vuoi: dillo esplicitamente in una prossima sessione.
**Se non lo fai:** nessun effetto; resta una valutazione agli atti.

## 8. Area C — nessuno scope ricevuto in nessuna sessione finora

**Se la vuoi affrontare, specifica cosa deve coprire prima della prossima sessione.** Nessun contenuto è stato dedotto o inventato, per istruzione esplicita ripetuta in tre brief.

## 9. (Solo se decidi di NON adottare hookify) Rimozione del residuo globale

**Comando (in Claude Code CLI):** `/plugin uninstall hookify` — rimuove il download inerte in `~/.claude` (dettaglio in [riepilogo-finale.md §6](riepilogo-finale.md)).

---

## Autocritica su questo file (richiesta dal brief S4 §4.1)

- **Rischio duplicazione:** le azioni 2, 6, 9 esistono anche in riepilogo-finale.md e STATO-PIANO.md. Ho linkato invece di ricopiare i dettagli, ma la descrizione a una riga può comunque divergere in futuro se un documento d'origine cambia. Mitigazione dichiarata in testa: in caso di divergenza vince il documento d'origine.
- **Fragilità:** i comandi dell'azione 1 assumono che tu non modifichi i file potenziamento/ prima di eseguirli; se li modifichi, il `checkout --` cancellerebbe le TUE modifiche, non solo i mirror di Cowork. Esegui l'azione 1 prima di ogni altro intervento su quei file.
- **Percorso repo nell'azione 1:** `~/Desktop/corso ia/faniq` è dedotto dal nome della cartella montata — **non verificato** che sia il percorso reale sul tuo Mac. Se non corrisponde, adatta il `cd`.

## Futuribilità

Questo file ha senso solo fino alla chiusura delle azioni: a merge avvenuto e azioni spuntate, diventa rumore. Proposta: al merge, eliminarlo o svuotarlo lasciando una riga "tutte le azioni chiuse il [data]". Non va portato nel flusso di lavoro FanIQ normale.
