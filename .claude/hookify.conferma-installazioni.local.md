---
name: conferma-installazioni-pacchetti
enabled: true
event: bash
pattern: (npm|pnpm|yarn)\s+(install|add)\s+\S|pip3?\s+install|brew\s+install|curl[^|]*\|\s*(ba)?sh
action: block
---
📦 **Installazione di pacchetti o esecuzione di script remoti.**

Il comando è **bloccato**. Elenca a Lorenzo i pacchetti e la loro funzione e dichiara DOVE finiscono (versionato / non versionato / globale): se approva, li installa lui dal suo terminale. Regola di sicurezza (installata a luglio 2026; CLAUDE.md: niente librerie senza conferma).
