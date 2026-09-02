---
name: conferma-installazioni-pacchetti
enabled: true
event: bash
pattern: (npm|pnpm|yarn)\s+(install|add)\s+\S|pip3?\s+install|brew\s+install|curl[^|]*\|\s*(ba)?sh
action: block
---
📦 **Installazione di pacchetti o esecuzione di script remoti.**

Prima di installare: elenca a Lorenzo i pacchetti e la loro funzione, dichiara DOVE finiscono (versionato / non versionato / globale) e attendi conferma. Regola di sicurezza del brief potenziamento.
