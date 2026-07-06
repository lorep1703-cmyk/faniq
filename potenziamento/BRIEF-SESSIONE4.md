# Brief Sessione 4 — Potenziamento Claude Code/Cowork su FanIQ

> Salvato nel repo da Cowork in Sessione 4, verbatim dal messaggio di Lorenzo in chat, per tracciabilità del mandato (regola del BRIEF: "niente di importante deve esistere solo nella chat"). NOTA: dove questo brief contraddice `ADDENDUM-PRE-SESSIONE4.md`, vince l'addendum (più recente, verificato con comandi reali) — le divergenze sono documentate nell'Addendum Sessione 4 di riepilogo-finale.md.

## Livello richiesto: massimo. Nessuna assunzione non verificata. Autonomia totale dove possibile, blocco esplicito dove no.

> Ordine di lettura OBBLIGATORIO e non negoziabile, in quest'ordine esatto, per intero, prima di scrivere anche un solo comando:
> 1. `potenziamento/BRIEF.md`
> 2. `potenziamento/STATO-PIANO.md`
> 3. `potenziamento/riepilogo-finale.md` (prodotto in Sessione 3 — è il documento che DEVI riverificare in questa sessione, non ri-fidarti di esso)
> 4. `potenziamento/shortlist-A.md` (per i numeri del benchmark, da NON ricalcolare da zero, solo da citare)
> 5. Questo file.
>
> Se un'istruzione qui contraddice STATO-PIANO.md o riepilogo-finale.md, **non decidere da solo quale sia corretto**: segnala la discrepanza nel recap finale come primo punto, con entrambe le versioni riportate testualmente, e procedi con l'interpretazione più cauta (quella che assume MENO lavoro già fatto, non di più).

---

## 0. Contratto di lavoro per questa sessione (leggere prima di tutto)

Tu (Fable/Cowork) sei trattato qui come un ingegnere senior a cui viene dato un contesto completo apposta per non dover mai tornare a fare domande evitabili. Questo significa due cose, non una sola:

**(a) Devi usare la piena autonomia che ti viene data.** Non fermarti a chiedere conferma per operazioni di lettura, per la creazione di file dentro `potenziamento/` e `.claude/`, per i commit nel TUO clone sandbox, per l'esecuzione di verifiche. Se un passo di questo brief dice "verifica X", verificalo tu stesso con i comandi che trovi qui o che tu stesso costruisci, senza chiedere il permesso di verificare.

**(b) L'autonomia non è mai licenza di indovinare.** Ogni volta che un'informazione non è direttamente osservabile da un file reale o dall'output di un comando che hai effettivamente lanciato, DEVI:
   - dichiararlo esplicitamente come "non verificato" o "non verificabile da me in questo ambiente",
   - proporre la soluzione più ragionevole SOLO come proposta, mai come fatto compiuto,
   - non aggiornare una checkbox o una tabella di stato a "fatto"/"verificato" finché non hai davvero l'evidenza in mano.

Un solo precedente da non ripetere: nella Sessione 2 una riga di STATO-PIANO.md è stata segnata `[x]` mentre un comando restava pendente per Lorenzo. Non è accettabile che riaccada, in nessuna forma, in nessuna delle tabelle che produci in questa sessione.

**Economia di token/interazioni:** questo brief è lungo apposta per evitarti di dover chiedere chiarimenti a metà lavoro. Se un'ambiguità residua non è risolvibile con le informazioni qui contenute o con verifiche che puoi fare tu stesso, è indicata esplicitamente più sotto come "domanda aperta per Lorenzo" — per tutto il resto, decidi e procedi tu, documentando il perché della scelta.

---

## 1. Regole di sicurezza non negoziabili (ripetute, con casi limite espliciti)

1. Mai scrittura o commit su `main`. Solo su `feature/agent-upgrade`, nel tuo clone sandbox `~/faniq-work`.
2. Mai installazione di plugin/skill a livello utente globale senza permesso esplicito già dato da Lorenzo per iscritto in un documento del piano. **Caso limite**: il plugin `frontend-design` è stato "raccomandato" nel dossier-UX ma MAI approvato esplicitamente da Lorenzo con un "OK" — quindi resta NON installabile in questa sessione, punto. Non interpretare "raccomandato da un documento precedente" come "autorizzato".
3. Il sandbox NON deve chiedere né tentare di ottenere permesso di cancellazione file nella cartella montata `faniq` — è stato negato due volte, è definitivo. Se un'azione sembra richiederlo, la soluzione è sempre: farla nel clone sandbox, mai nella cartella montata.
4. Prima di ogni comando distruttivo anche nel TUO sandbox (dove hai pieni permessi): verifica con comandi di sola lettura PRIMA di agire. Nessuna eccezione, nemmeno per operazioni che "sai già" essere sicure.
5. Lorenzo esegue lui i comandi Git che scrivono nel SUO repo reale. Tu prepari comandi esatti (copiabili e incollabili, zero placeholder ambigui) e verifichi gli output da remoto sulla cartella montata (in sola lettura). *(Aggiornato da `regole-autonomia-commit.md`, commit `41c3e1e`: commit locali nel clone sandbox delegati a Cowork; push e cambio branch restano sempre di Lorenzo.)*
6. Il sandbox non persiste tra sessioni: si riparte sempre dal ripristino (§2).
7. **Caso limite nuovo per questa sessione**: qualunque cosa tu non possa osservare direttamente (es. cosa succede su una CLI che gira sulla macchina fisica di Lorenzo, fuori dal tuo sandbox) non va MAI dedotta per analogia o "probabilità". Va dichiarata come "fuori dalla mia visibilità" con la motivazione tecnica esatta del perché (non genericamente "non lo so").
8. Se durante l'autoverifica (Blocco A) trovi una discrepanza rispetto a quanto riepilogo-finale.md dichiara, NON correggere silenziosamente il documento senza segnalarlo: la correzione va fatta E segnalata esplicitamente nel recap come "correzione rispetto alla Sessione 3", con il valore vecchio e quello nuovo entrambi riportati.

---

## 2. Ripristino ambiente sandbox (sempre il primo passo tecnico)

```bash
# 2.1 — verifica che non esista già un clone residuo (non dovrebbe, sandbox nuovo)
ls -la ~/faniq-work 2>&1
# 2.2 — clone pulito dalla cartella montata (fonte: cartella reale di Lorenzo, sola lettura per te)
git clone --no-hardlinks <mnt>/faniq ~/faniq-work
cd ~/faniq-work
# 2.3 — fetch del branch dal bundle più recente (fonte di verità del lavoro già fatto)
git fetch <mnt>/faniq/potenziamento/agent-upgrade.bundle feature/agent-upgrade:refs/heads/feature/agent-upgrade
# 2.4 — checkout
git checkout feature/agent-upgrade
```

**Non proseguire oltre finché questi 4 comandi non hanno dato output pulito.** Se anche uno fallisce, questo è un blocco totale della sessione: documentalo per intero (comando, errore esatto, ultime 15 righe) come primo punto del recap e fermati — non tentare workaround creativi su un ambiente che non è quello atteso.

*(Nota di esecuzione, Sessione 4: il passo 2.3 non era eseguibile — il bundle non esiste più, rimosso da Lorenzo dopo aver importato e checked out il branch nel repo reale. Il branch è arrivato direttamente col clone del passo 2.2: fine raggiunto per via diversa, discrepanza documentata nell'Addendum Sessione 4 e nel recap, come richiesto dall'ordine di lettura in testa a questo brief.)*

---

## 3. BLOCCO A — Autoverifica obbligatoria (da fare PRIMA di qualunque nuovo lavoro)

Questo blocco esiste per un motivo preciso: il documento `riepilogo-finale.md` della Sessione 3 contiene affermazioni che nessuno ha ri-controllato in modo indipendente da allora. Il tuo compito qui non è fidarti di quel documento — è verificarlo come lo verificherebbe un secondo ingegnere in code review, riga per riga dove possibile.

### 3.1 — Verifica conteggio commit (chiude l'anomalia 6 del riepilogo Sessione 3)

```bash
git log feature/agent-upgrade --oneline
git log feature/agent-upgrade --oneline | wc -l
git log feature/agent-upgrade --oneline --grep="potenziamento"
```

Produci una tabella: hash breve | messaggio | corrisponde a quale deliverable dichiarato nella tabella §1 di riepilogo-finale.md (sì/no/dubbio). Il totale REALE va scritto esplicitamente, confrontato sia con "12" (numero del brief Sessione 3, quasi certamente un mio errore) sia con "11" (numero dichiarato nel riepilogo-finale.md stesso). **Verdetto atteso**: dichiara quale dei due numeri è corretto sulla base del conteggio reale, non sulla base di quale sembra "più probabile".

### 3.2 — Verifica fisica di ogni file dichiarato installato

Per OGNI riga della tabella "§1 — Cosa è stato installato" di `riepilogo-finale.md`, esegui la verifica corrispondente. Non fidarti della tabella: apri il file.

```bash
# hookify — abilitazione
cat .claude/settings.json
# hookify — regole (tutte e 3)
cat .claude/hookify.conferma-distruttivi.local.md
cat .claude/hookify.conferma-installazioni.local.md
cat .claude/hookify.pausa-faniq.local.md
# reviewer nativo
cat .claude/agents/reviewer.md
# deliverable del piano
ls -la potenziamento/
cat potenziamento/shortlist-A.md
ls -la potenziamento/dossier-UX/
```

Per ciascun file: esiste sì/no, contenuto coerente con quanto descritto nel riepilogo (sì/no/parzialmente — specificare cosa non torna se "parzialmente"). Se un file manca o il contenuto non corrisponde a quanto dichiarato, questo è un errore grave da riportare in cima al recap, non in fondo.

### 3.3 — Verifica stato lock `test-write-check` (sola lettura sulla cartella montata reale)

```bash
git --no-optional-locks -C <mnt>/faniq branch --list test-write-check
ls -la <mnt>/faniq/.git/refs/heads/test-write-check.lock 2>&1
ls -la <mnt>/faniq/.git/refs/heads/test-write-check 2>&1
```

Dichiara lo stato reale attuale (branch ancora presente sì/no, lock ancora presente sì/no) — questo determina se l'anomalia 3 del riepilogo Sessione 3 è ancora aperta o se Lorenzo l'ha già risolta senza aggiornare i documenti.

### 3.4 — Verifica coerenza cronologica di STATO-PIANO.md

Confronta le date dichiarate in STATO-PIANO.md (Sessione 2 chiusa il 2026-07-02) con la data reale del dossier-UX (`potenziamento/dossier-UX/00-stato-attuale.md`, datato 2026-07-06 secondo il riepilogo Sessione 3) e con la data di questa sessione. **Non limitarti a segnalare l'incoerenza**: correggi tu stesso STATO-PIANO.md nel tuo clone (aggiungendo una nota di correzione visibile, non riscrivendo silenziosamente la storia — es. "Nota di correzione (Sessione 4): la chiusura Sessione 2 riportata come 07-02 è incoerente con la data reale del dossier-UX prodotto nella stessa sessione, 07-06. La sessione si è probabilmente estesa su più giorni senza essere ridatata.") e committa questa correzione separatamente dal resto.

*(Nota di esecuzione, Sessione 4: punto NON applicato — l'ipotesi di incoerenza era infondata, verificato con grep reale da Lorenzo, v. ADDENDUM-PRE-SESSIONE4.md §4.)*

### 3.5 — Cosa NON puoi autoverificare, e perché (dichiarazione esplicita obbligatoria)

Scrivi esplicitamente, senza tentare workaround: "Non posso verificare se gli hook di hookify si attivano correttamente in Claude Code CLI sulla macchina di Lorenzo, perché il mio ambiente sandbox è isolato dal suo `~/.claude` globale e dalla sua sessione CLI reale — sono ambienti fisicamente separati, non ho visibilità né accesso." Non sostituire questa dichiarazione con un esito dedotto per analogia dal test nel sandbox (quel test ha già dimostrato SOLO che l'hook non si attiva in Cowork, non dice nulla sul comportamento in CLI).

---

## 4. BLOCCO B — Passi da fare in Sessione 4 (con autocritica e sguardo al futuro)

Per ognuno dei passi seguenti: dichiara ESPLICITAMENTE, oltre al lavoro fatto, (i) un'autocritica onesta — cosa potrebbe essere fragile, sbagliato, o fatto in modo subottimale in quello che hai appena prodotto — e (ii) una nota di futuribilità — cosa succederà a questo artefatto quando FanIQ riprenderà lo sviluppo normale, se resterà utile o diventerà rumore da ripulire.

### 4.1 — Consolidamento "azioni-lorenzo.md"

Le azioni pendenti per Lorenzo sono oggi sparse su tre documenti diversi (handoff originale, STATO-PIANO.md, riepilogo-finale.md), con rischio concreto che lui ne perda una per strada. Crea `potenziamento/azioni-lorenzo.md` con TUTTE le azioni ancora a suo carico, in un solo posto, in ordine di dipendenza (quali bloccano quali), ognuna con: descrizione in una riga, comando esatto copiabile, motivo per cui serve, cosa succede se non la fa. Includi anche le azioni emerse dal Blocco A qui sopra (es. se il lock risulta ancora presente).

*Autocritica richiesta*: verifica che questo nuovo file non duplichi in modo inconsistente le stesse azioni già descritte altrove — se STATO-PIANO.md o riepilogo-finale.md restano la fonte "originale" di un'azione, linka ad essi invece di ricopiare, per evitare che in futuro i due testi divergano.

### 4.2 — Pacchetto di test pronto per l'hook in CLI (zero ambiguità, 30 secondi di lavoro per Lorenzo)

Poiché questo test non è delegabile a te, il tuo compito è ridurre al minimo assoluto lo sforzo richiesto a Lorenzo. Scrivi in `azioni-lorenzo.md` un blocco "Test hook in Claude Code CLI" con: il comando ESATTO e innocuo da provare (es. un `rm -rf` su una cartella di test fittizia creata apposta, non su nulla di reale), il risultato atteso se l'hook funziona (blocco con messaggio di conferma) e quello se non funziona (esecuzione diretta), e cosa fare in entrambi i casi.

*(Nota di esecuzione, Sessione 4: test già eseguito da Lorenzo con esito positivo — v. ADDENDUM-PRE-SESSIONE4.md §5. La procedura è documentata in azioni-lorenzo.md come riferimento per regole future, più il nuovo test per il blocco `git push` mai osservato.)*

### 4.3 — Area C

Resta non definita. Non dedurre lo scope. Scrivi in `azioni-lorenzo.md`, come voce a sé stante e ben visibile: "Area C: nessuno scope ricevuto in nessuna sessione finora — se la vuoi affrontare, specifica cosa deve coprire prima della prossima sessione." Non inventare contenuto.

### 4.4 — Checklist di prontezza al merge (documento preparatorio, NON una decisione)

Crea `potenziamento/checklist-merge.md`: elenco puntuale di condizioni, ognuna marcata SODDISFATTA / NON SODDISFATTA / NON VERIFICABILE DA ME, sulla base di quanto hai osservato nel Blocco A (non su quanto riepilogo-finale.md affermava prima della tua verifica). Aggiungi in fondo, come sezione separata, i rischi residui noti (fail-open di hookify, regola pausa-faniq da rimuovere, conflitto mirror da risolvere prima di qualunque checkout) — SENZA concludere "pronto per il merge" o "non pronto": quella è una lettura che spetta a Lorenzo, tu fornisci solo i fatti organizzati.

*Autocritica richiesta*: chiediti se la checklist rischia di dare un falso senso di completezza (spuntare tutte le caselle non significa zero rischio) — se sì, scrivilo esplicitamente come avvertenza in cima al documento.

### 4.5 — Autocritica sull'intero ciclo (Sessioni 1-4)

Sezione dedicata, onesta, non celebrativa: cosa faresti diversamente se ripartissi da zero? Esempi di domande a cui rispondere davvero, non retoricamente: il mirroring dei file nella cartella reale (causa nota di un conflitto futuro) era evitabile fin dall'inizio con un'architettura diversa? La scelta di non poter cancellare nulla nella cartella montata ha causato più friction di quanta ne valesse la pena rispetto a un permesso più granulare? Il fail-open di hookify è un rischio accettabile per il contesto (solo-founder, nessun team) o andrebbe riconsiderato prima del merge? Rispondi con la stessa onestà che chiederesti a un collega, non con toni rassicuranti.

---

## 5. BLOCCO C — Struttura obbligatoria del recap finale

Aggiorna (non sostituire silenziosamente) `potenziamento/riepilogo-finale.md` aggiungendo una sezione "Addendum Sessione 4" con questa struttura esatta:

```markdown
## Addendum Sessione 4 (autoverifica)
### A. Esiti autoverifica (Blocco A)
- Conteggio commit: [numero reale] — discrepanza con Sessione 3: [sì/no, dettaglio]
- File dichiarati installati: [tabella esiste/contenuto coerente per ognuno]
- Stato lock test-write-check: [presente/assente, con timestamp del controllo]
- Coerenza date STATO-PIANO: [corretto sì/no, nota aggiunta sì/no]
- Non verificabile da me: [elenco con motivazione tecnica, non genericamente "non so"]
### B. Nuovi artefatti prodotti
[tabella: file | percorso | scopo | sostituisce/integra quale documento precedente]
### C. Autocritica sull'intero ciclo
[risposta onesta alle domande del §4.5, non un elenco di meriti]
### D. Cosa resta APERTO per Lorenzo, in un solo posto
[rimanda a azioni-lorenzo.md, non ripetere qui i dettagli — solo l'elenco puntato dei titoli con link al file]
### E. Incertezze dichiarate esplicitamente in questa sessione
[elenco di ogni punto in cui hai scritto "non so" o "non verificabile" — deve essere non vuoto se sei stato onesto: se risulta vuoto, ricontrolla di non aver arrotondato qualcosa per eccesso di sicurezza]
```

**Vincolo finale**: la sezione E non può restare vuota per convenzione — se non hai nulla di davvero incerto da dichiarare, è un segnale che probabilmente hai arrotondato qualcosa da qualche parte nel Blocco A. Ricontrolla prima di consegnare.

---

## 6. Checkpoint che richiedono comunque l'OK esplicito di Lorenzo

- [ ] Qualunque installazione nuova (incluso `frontend-design`, anche se "raccomandato" in un documento precedente — la raccomandazione non è autorizzazione).
- [ ] Qualunque modifica a file fuori da `potenziamento/` e `.claude/`.
- [ ] Se l'autoverifica (Blocco A) rivela una discrepanza grave (es. un commit dichiarato non esiste davvero, o un file installato ha contenuto sostanzialmente diverso da quanto descritto) — fermarsi e segnalarlo prima di proseguire con il Blocco B, non proseguire come se nulla fosse.

## 7. Cosa NON serve chiedere

- Lettura, verifica, conteggio, confronto — tutto il Blocco A è autonomo.
- Creazione dei nuovi file del Blocco B dentro `potenziamento/`.
- Commit nel tuo clone sandbox.
- Correzione di STATO-PIANO.md con nota visibile (non silenziosa) — è esplicitamente autorizzata qui.
