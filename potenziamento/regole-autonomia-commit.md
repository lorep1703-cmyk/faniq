# Regole di autonomia sui commit — decisione Sessione 4 (2026-07-06)

> Questo documento aggiorna e specifica una regola già presente nei brief precedenti ("Lorenzo esegue lui i comandi Git che modificano il SUO repo reale"). Non la contraddice: la rende più precisa distinguendo due azioni che il brief trattava come un blocco unico ma che hanno rischio molto diverso.

---

## 0. Perché questo cambiamento

Nei brief di Sessione 3 e 4, ogni operazione Git che scrive nel repo reale era riservata a Lorenzo, senza distinzioni. In pratica questo significava: anche il commit di un singolo file markdown dentro potenziamento/ richiedeva che Lorenzo aprisse il terminale e lanciasse git add/git commit a mano.

Un git commit locale, non pushato, e tra le operazioni Git piu reversibili che esistano: si annulla con git reset o git commit --amend in un secondo, e finche non viene pushato non lascia il sandbox/repo locale di Lorenzo. Il vero punto in cui un errore diventa difficile da annullare o visibile ad altri e il push o il checkout verso un altro branch.

---

## 1. Cosa Cowork puo fare da solo, senza chiedere conferma

- git add e git commit in locale, sul proprio clone sandbox, esclusivamente sul branch feature/agent-upgrade, su file dentro potenziamento/ e .claude/
- Creazione, modifica, lettura di file dentro potenziamento/ e .claude/

## 2. Cosa resta SEMPRE riservato a Lorenzo

- git push, di qualunque tipo, verso qualunque branch
- git checkout o git switch verso un branch diverso
- Comandi gia coperti da hookify (rm -rf, chmod -R 777, dd, git reset --hard)
- Qualunque scrittura fuori da potenziamento/ e .claude/

## 3. Supporto tecnico (hookify aggiornato)

Lorenzo ha aggiornato manualmente la regola hookify.conferma-distruttivi.local.md estendendo il blocco a qualunque git push, non solo force/main. Verificato con grep/cat nel file reale. Non ancora testato con un push reale: da verificare alla prossima sessione CLI.

## 4. Scadenza

Questa regola decade automaticamente al momento del merge di feature/agent-upgrade in main. Va ridiscussa da zero dopo il merge.

## 5. Casi limite

Se emerge un caso ambiguo, Cowork si ferma e chiede, non decide per estensione o analogia.
