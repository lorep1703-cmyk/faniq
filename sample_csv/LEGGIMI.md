# Dataset campione — FanIQ

Questa cartella contiene due set di dati CSV per testare e fare demo del prodotto.

---

## ✅ USA QUESTI per la demo (Pro Vercelli style)

| File | Contenuto | Righe |
|------|-----------|-------|
| `abbonati_demo.csv` | 70 abbonati stagione 2024/25 | 70 |
| `biglietteria_demo.csv` | Presenze partita per partita, con settore e prezzo | ~1.090 |
| `shop_demo.csv` | Acquisti merchandise | 74 |
| `partite_demo.csv` | 19 partite casalinghe Serie C 2024/25 | 19 |

**Perché questi:** costruiti per mostrare tutti i segmenti del Fan Intelligence Engine.
Città piemontesi (Vercelli, Novara, Biella...), avversari Serie C reali, stagione completa.

### Distribuzione segmenti nel dataset demo

| Segmento | N. fan | Comportamento nel dataset |
|----------|--------|--------------------------|
| VIP | 15 | >15 presenze, spesso 2-3 biglietti per partita, acquisti shop |
| Fedele | 20 | 10-15 presenze, qualche acquisto shop |
| A rischio | 18 | Prime 10 partite presenti, ultime 9 quasi assenti → anomalia visibile |
| Dormiente | 17 | Solo prime 3 partite, poi spariti → alert critico |
| Nuovo | 10 | Max 4 biglietti singoli, seconda metà stagione |

### Ordine di caricamento consigliato

1. `partite_demo.csv` — prima le partite (servono come riferimento)
2. `abbonati_demo.csv` — poi gli abbonati
3. `biglietteria_demo.csv` — poi i biglietti
4. `shop_demo.csv` — infine lo shop

---

## 📁 File originali (non usare per la demo)

| File | Contenuto | Problema |
|------|-----------|---------|
| `abbonati_esempio.csv` | ~96 fan generici | Avversari Serie B, nessun segmento definito |
| `biglietteria_esempio.csv` | ~115 righe | Collegato agli abbonati_esempio |
| `partite_esempio.csv` | 30 partite Serie B | Stagione e campionato sbagliati |
| `shop_esempio.csv` | 4 righe soltanto | Troppo scarno |

---

*Dataset demo generato il 2026-06-22. Dati completamente sintetici — zero dati reali.*
