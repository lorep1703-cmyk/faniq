---
name: conferma-comandi-distruttivi
enabled: true
event: bash
pattern: rm\s+-rf|git\s+push(?:(?!.*claude/)|(?=.*\bmain\b)|(?=.*(?:--force|\s-f\b)))|dd\s+if=|chmod\s+-R\s+777|git\s+reset\s+--hard
action: block
---
🛑 **Comando con effetti distruttivi o su main.**

Regola di sicurezza (installata a luglio 2026, vedi CLAUDE.md, Deploy): fermati, spiega a Lorenzo in linguaggio semplice cosa farebbe questo comando e quali rischi comporta, e procedi solo dopo la sua conferma esplicita.
