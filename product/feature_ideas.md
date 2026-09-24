# Feature Ideas — FanIQ

Idee per funzionalità future. Non sono pianificate, non sono confermate.
Le idee validate dal feedback del primo cliente passano in `product/backlog.md`.

---

## Idee in attesa di validazione

| ID | Idea | Valore ipotetico | Priorità ipotetica | Note |
|----|------|-----------------|-------------------|------|
| F1 | Dashboard confronto stagione YoY | Vedere come cambia la fedeltà dei tifosi anno su anno | Media | Richiede dati storici multi-stagione |
| F2 | Alert automatici (es. "10 VIP non vengono da 2 partite") | Intervento proattivo senza dover cercare il dato | Alta | Richiede sistema di notifiche |
| F3 | Template campagne (es. "Email per dormienti") | Ridurre il tempo dal segmento all'azione | Media | Possibile integrazione con Mailchimp/Brevo |
| F4 | Benchmark tra club (anonimizzato) | "Il tuo Business Score è sopra/sotto la media della categoria" | Alta | Richiede N clienti sul piano — non ora |
| F5 | Importazione automatica da piattaforme ticketing (TicketOne, Vivaticket) | Eliminare il CSV manuale | Alta | Complessità alta, impatto alto |
| F6 | Report PDF auto-generato mensile | Qualcosa da mandare al presidente | Media | Semplice da implementare |
| F7 | Multi-sport (basket, volley, rugby) | Ampliare il mercato | Bassa | Non prioritario finché non c'è trazione nel calcio |
| F8 | App mobile (view-only per lo staff) | Accesso rapido al Business Score e RFM | Bassa | Non prioritario ora |
| F9 | Monitoraggio predittivo continuo + generazione contenuti personalizzati per singolo tifoso/cluster, potenziati da agenti AI | Alert e contenuti pronti senza lavoro manuale ripetuto, sempre aggiornati | Da validare | In esplorazione: prototipazione/test di server MCP (forecasting tipo Chronulus, marketing automation con audience segmentation) affidata a Claude Code, che conosce già i vincoli del progetto (RLS, no dati reali, no librerie senza conferma). Esecuzione autonoma/continua valutata in un secondo momento su Hermes (agente self-hosted separato, fuori da questo repo) — non ancora deciso se/come collegarli. Vincolo GDPR da tenere presente: qualunque agente con accesso a dati reali di tifosi va scoperto/limitato con attenzione. |

---

## Come usare questo file

- Aggiungere idee qui quando emergono, senza filtro
- Non costruire mai da questo file direttamente — prima validare con utenti reali
- Le idee validate si spostano in `product/backlog.md` con priorità assegnata

---

*Aggiornato il 22 giugno 2026 — F9 aggiunta il 9 settembre 2026.*
