# Feature Ideas — FanIQ

Idee per funzionalità future: **unica lista** delle idee di prodotto (dal 01/10/2026 vi sono confluiti `backlog.md`, `ui_ux_notes.md`, `data_tools_roadmap.md` e le direzioni UX del ciclo "potenziamento" di luglio).
Non sono pianificate né confermate. Le questioni aperte e lo stato del lavoro stanno in `CONTEXT_HANDOFF.md`.

---

## Idee in attesa di validazione

| ID | Idea | Valore ipotetico | Priorità ipotetica | Note |
|----|------|-----------------|-------------------|------|
| F1 | Dashboard confronto stagione YoY | Vedere come cambia la fedeltà dei tifosi anno su anno | Media | Ora fattibile grazie alla normalizzazione stagione (vedi idea Dashboard #4 nell'handoff) |
| F2 | Alert automatici (es. "10 VIP non vengono da 2 partite") | Intervento proattivo senza dover cercare il dato | Alta | In parte esiste: pagina "Da contattare" (anomalie abbonati). Manca la notifica attiva |
| F3 | Template campagne (es. "Email per dormienti") | Ridurre il tempo dal segmento all'azione | Media | Possibile integrazione con Mailchimp/Brevo |
| F4 | Benchmark tra club (anonimizzato) | "Il tuo Business Score è sopra/sotto la media della categoria" | Alta | Richiede N clienti e dati cross-tenant — non ora |
| F5 | Importazione automatica da piattaforme ticketing (TicketOne, Vivaticket) | Eliminare il CSV manuale | Alta | Complessità alta, impatto alto |
| F6 | Report PDF auto-generato mensile | Qualcosa da mandare al presidente | Media | Nessuna libreria PDF installata: serve conferma |
| F7 | Multi-sport (basket, volley, rugby) | Ampliare il mercato | Bassa | Non prioritario finché non c'è trazione nel calcio |
| F8 | App mobile (view-only per lo staff) | Accesso rapido al Business Score e RFM | Bassa | Non prioritario ora |
| F9 | Monitoraggio predittivo continuo + generazione contenuti personalizzati per singolo tifoso/cluster, potenziati da agenti AI | Alert e contenuti pronti senza lavoro manuale ripetuto, sempre aggiornati | Da validare | In esplorazione: prototipazione/test di server MCP (forecasting tipo Chronulus, marketing automation con audience segmentation) affidata a Claude Code, che conosce già i vincoli del progetto (RLS, no dati reali, no librerie senza conferma). Esecuzione autonoma/continua valutata in un secondo momento su Hermes (agente self-hosted separato, fuori da questo repo) — non ancora deciso se/come collegarli. Vincolo GDPR da tenere presente: qualunque agente con accesso a dati reali di tifosi va scoperto/limitato con attenzione. Memoria dell'agente (01/10/2026): candidato [Hindsight](https://github.com/vectorize-io/hindsight) (MIT, Postgres+pgvector, MCP), **solo installato in locale/sul nostro server**, mai il loro cloud, perché estrae i fatti dalle conversazioni con un LLM. |

---

## Ritocchi di interfaccia (da giugno, verificati non ancora fatti il 01/10)

| ID | Ritocco | Perché |
|----|---------|--------|
| U1 | Domande di esempio cliccabili nella Chat AI | Oggi c'è solo "Chiedi qualcosa sui tifosi…": chi la apre non sa cosa chiedere |
| U2 | Spiegazione visiva di come si compone il Business Score | Il punteggio deve spiegarsi da solo |
| U3 | Descrizione in parole semplici di ogni segmento RFM ("Dormiente = non viene da X mesi…") | Oggi c'è solo il nome del segmento |
| U4 | Verifica che la demo funzioni da tablet | La demo potrebbe essere fatta in riunione su un tablet |

---

## Nuovi strumenti dati (dal brainstorming del 22/06)

Il livello 1 (prob. rinnovo, journey, anomalie, ambassador, decay) è stato costruito: è l'Intelligence Engine.

**Richiedono un dato in più nel CSV**
- **Heatmap per settore** (curva/tribuna/VIP): settore del biglietto
- **Sensibilità al prezzo**: settore + fascia di prezzo
- **Mappa geografica dei tifosi**: CAP di residenza
- **Fedeltà e meteo/risultati**: API meteo + risultati partite
- **Profili per generazione**: data di nascita

**Predittivi**
- **Scenario builder**: "cosa succede se faccio una campagna su questi X tifosi?"
- **Previsione ricavi per partita** (presenze + incasso di una partita futura)
- **Effetto a catena**: se perdo un VIP, rischio di perdere anche il suo gruppo
- **Indice di momentum**: direzione del trend del tifoso (il campo `momentum` è già calcolato, mai mostrato)
- **Tifosi "di ritorno"** tra stagioni diverse

---

## Direzioni di design (proposte a luglio, mai scelte)

Tutte e tre senza librerie nuove; combinabili.
1. **Terminale di club**: più densità, numeri tabulari allineati a destra, font mono per i numeri. Costo basso.
2. **Broadcast sportivo**: colore del club per ogni tenant, grafiche da telecronaca, badge a tacche invece delle emoji. La più distintiva e "vendibile", ma il colore per club tocca il backend.
3. **Quiete editoriale** (stile Linear): un solo colore d'accento, tipografia curata, bordi al posto delle ombre, filtri del Report in una sola barra. Costo minimo.

---

## Per la vendita (dai rischi di giugno)

- **Guida all'export CSV** da Vivaticket/TicketOne, per i club che non sanno come estrarre i dati
- **Prova con i loro dati veri** dopo la demo con dati sintetici: la demo sintetica da sola può non convincere

---

## Come usare questo file

- Aggiungere idee qui quando emergono, senza filtro
- Non costruire direttamente da qui: prima proposta breve a Lorenzo, poi ok, poi implementazione

---

*Aggiornato il 01/10/2026 — unificate le liste di idee sparse nel repo.*
