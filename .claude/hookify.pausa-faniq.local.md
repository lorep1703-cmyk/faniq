---
name: pausa-faniq-file-applicativi
enabled: true
event: file
action: block
conditions:
  - field: file_path
    operator: regex_match
    pattern: (backend/(?!tests/)|frontend/src/).*\.(py|jsx|js|css)$
---
⏸️ **FanIQ è in pausa: i file applicativi non si modificano.**

Regola TEMPORANEA del piano potenziamento (fino a chiusura ciclo): scrittura ammessa solo su skill, configurazioni `.claude/`, CLAUDE.md e cartella `potenziamento/`. Se la modifica è davvero necessaria, chiedi prima a Lorenzo.
