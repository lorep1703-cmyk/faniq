"""Soglie e pesi del Fan Intelligence Engine — zero magic numbers nel codice."""
from __future__ import annotations

# ── Stadio 1: Decay Profile ────────────────────────────────────────────────
# Numero minimo di partite per calcolare il profilo con affidabilità
MIN_MATCHES_FOR_DECAY = 8

# Half-life in partite: quante pause prima di tornare (soglie inclusive)
DECAY_HALFLIFE_SLOW_MIN = 6        # ≥6 partite di pausa → LENTO
DECAY_HALFLIFE_MEDIUM_MIN = 3      # 3-5 partite di pausa → MEDIO
DECAY_HALFLIFE_MEDIUM_MAX = 5
DECAY_HALFLIFE_FAST_MIN = 1        # 1-2 partite di pausa → RAPIDO
DECAY_HALFLIFE_FAST_MAX = 2
# coefficient of variation > soglia → VOLATILE (pattern irregolare)
DECAY_VOLATILE_CV_THRESHOLD = 1.0

# ── Stadio 2: Journey Stage ────────────────────────────────────────────────
# Numero di partite per ogni metà del confronto trend
JOURNEY_WINDOW = 4   # ultime 4 vs 4 precedenti

# Soglie momentum per classificare lo stadio
JOURNEY_HIGH_MOMENTUM = 0.3    # > +0.3 → in crescita
JOURNEY_LOW_MOMENTUM = -0.3    # < -0.3 → in declino

# Soglia minima presenze recenti per "FEDELTA"
JOURNEY_FEDELTA_MIN_RATE = 0.6
JOURNEY_PICCO_MIN_RATE = 0.85

# ── Stadio 3: Subscription Anomaly ────────────────────────────────────────
# Soglie base (poi spostate da un margine adattivo — vedi sotto)
ANOMALY_CRITICAL_ABSENCES = 5   # assenze consecutive → severity CRITICA
ANOMALY_HIGH_ABSENCES = 3       # assenze consecutive → severity ALTA
ANOMALY_MEDIUM_ABSENCES = 2     # assenze consecutive → severity MEDIA

# Margine (in assenze) applicato alle soglie sopra in base al decay profile:
# un fan storicamente solido ha più margine prima di essere segnalato, uno
# volatile ne ha meno — stessa logica dei customer health score B2B tarati
# sulla tenure del cliente invece che uniformi per tutti.
ANOMALY_DECAY_MARGIN = {
    "LENTO":     2,
    "MEDIO":     0,
    "RAPIDO":   -1,
    "VOLATILE": -2,
}
# Storico abbonamenti: ogni N stagioni consecutive → +1 margine
ANOMALY_LOYALTY_SEASONS_PER_MARGIN = 2
# Cap sul margine combinato (decay + loyalty) — evita soglie troppo estreme
ANOMALY_MARGIN_MIN = -2
ANOMALY_MARGIN_MAX = 2
# Cap sulla soglia CRITICA effettiva dopo il margine
ANOMALY_CRITICAL_ABSENCES_MIN = 4
ANOMALY_CRITICAL_ABSENCES_MAX = 7

# ── Stadio 4: Ambassador Score ─────────────────────────────────────────────
# NB: la soglia "ambassador confermato" (60) non è applicata qui — il backend
# restituisce solo lo score 0-100 grezzo. La classificazione in tier vive
# lato frontend in AmbassadorBadge.jsx (getTier), unica fonte per tutta la UI.
# Pesi componenti ambassador
AMBASSADOR_WEIGHT_AVG = 0.5    # media biglietti per acquisto
AMBASSADOR_WEIGHT_VAR = 0.3    # varianza dei gruppi (porta gente diversa)
AMBASSADOR_WEIGHT_FREQ = 0.2   # frequenza acquisti con biglietti multipli
# Soglia "biglietti multipli" in un singolo acquisto
AMBASSADOR_MULTI_TICKET_MIN = 2
# Mesi di inattività oltre cui il score decade del 40%
AMBASSADOR_DECAY_MONTHS = 6

# ── Stadio 5: Renewal Probability ─────────────────────────────────────────
RENEWAL_WEIGHTS = {
    "base":        0.20,   # categoria RFM → fiducia storica
    "frequency":   0.25,   # presenze ultime 8 → predittore più forte
    "trend":       0.20,   # momentum normalizzato → direzione
    "decay":       0.15,   # profilo decay → resistenza alle pause
    "loyalty":     0.10,   # stagioni abbonamento → radici nel club
    "no_anomaly":  0.10,   # assenza anomalie critiche → continuità
}

# Mappa RFM category → float (contributo base_score)
RFM_FLOAT_MAP = {
    "VIP":        1.0,
    "Fedele":     0.75,
    "Occasionale": 0.50,
    "Nuovo":      0.40,
    "A rischio":  0.25,
    "Dormiente":  0.10,
}

# Mappa decay profile → float (contributo decay_factor)
DECAY_FLOAT_MAP = {
    "LENTO":    1.0,
    "MEDIO":    0.70,
    "RAPIDO":   0.40,
    "VOLATILE": 0.20,
}

# ── Intelligence Score — penalità hard ────────────────────────────────────
PENALTY_ANOMALY_CRITICAL = 15   # punti sottratti se anomalia CRITICA
PENALTY_DECAY_VOLATILE = 10     # punti sottratti se decay VOLATILE
CAP_DORMIENTE = 30              # cap massimo se journey DORMIENTE

# Storico abbonamenti: normalizzazione → 5 stagioni = 1.0
LOYALTY_NORMALIZATION_SEASONS = 5

# Partite analizzate per frequency signal
FREQUENCY_WINDOW = 8
