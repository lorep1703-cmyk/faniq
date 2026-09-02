# Valutazione plugin `frontend-design` (Anthropic) — gerarchia del brief

**Cos'è (verificato dal sorgente):** una sola SKILL.md di 55 righe, zero codice eseguibile, zero hook. È una guida che il modello segue quando genera UI: impone processo in due passaggi (token system prima del codice, auto-critica contro i "default AI"), un elemento-firma per pagina, tipografia intenzionale. Nomina esplicitamente i tre cliché da evitare — è la contromisura diretta all'estetica da AI-builder citata nel brief.

1. **Futuribilità: alta** — Anthropic-managed, marketplace ufficiale, contenuto testuale (nessuna dipendenza fragile).
2. **Attinenza: alta** — l'obiettivo B del brief riformulato come skill. Complementare (non sovrapposto) al dossier: il dossier decide LA direzione, la skill alza la qualità dell'ESECUZIONE quando si scriverà il codice.
3. **Efficienza: massima** — un file markdown; installazione = una riga in `.claude/settings.json` già esistente; rimozione = cancellare la riga.

**Raccomandazione:** installarlo, ma la scrittura di codice UI è rimandata a fine pausa (il redesign completo era già previsto come passaggio finale). Ha senso installarlo ORA solo perché sia pronto al momento giusto ed entri nel branch. **Decisione a Lorenzo (checkpoint punto 7 della scaletta) — non installato.**
