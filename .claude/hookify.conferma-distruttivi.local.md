---
name: conferma-comandi-distruttivi
enabled: true
event: bash
pattern: rm\s+-rf|git\s+push(?:(?!.*claude/)|(?=.*\bmain\b)|(?=.*(?:--force|\s-f\b|--delete|\s-d\b|\s:\S)))|dd\s+if=|chmod\s+-R\s+777|git\s+reset\s+--hard
action: block
---
🛑 **Comando con effetti distruttivi o su main.**

Il comando è **bloccato** e non può partire, nemmeno con un "vai" in chat. Spiega a Lorenzo in linguaggio semplice cosa farebbe e quali rischi comporta: se lo approva, lo esegue lui dal suo terminale. Regola di sicurezza installata a luglio 2026 (CLAUDE.md, "Commit e push").
