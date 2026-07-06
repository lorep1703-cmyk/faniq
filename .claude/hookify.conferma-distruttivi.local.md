---
name: conferma-comandi-distruttivi
enabled: true
event: bash
pattern: rm\s+-rf|git\s+push|dd\s+if=|chmod\s+-R\s+777|git\s+reset\s+--hard
action: block
---
🛑 **Comando con effetti distruttivi o su main.**

Regola del piano potenziamento: fermati, spiega a Lorenzo in linguaggio semplice cosa farebbe questo comando e quali rischi comporta, e procedi solo dopo la sua conferma esplicita.
