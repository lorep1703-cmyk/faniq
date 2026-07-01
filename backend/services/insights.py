"""Generazione insights strutturati: Revenue Watch con sotto-cluster, Opportunità, Azioni."""
import logging

from sqlalchemy.orm import Session

logger = logging.getLogger("faniq.insights")

from services.analytics import (
    compute_fan_segments,
    dashboard_cross_source,
    dashboard_revenue_breakdown,
    dashboard_stats,
)
from services.cache import get as cache_get, set as cache_set
from services.data_readiness import compute_data_readiness


def _apply_intelligence_penalties(score: int, segments: list, db: Session, club_id: int) -> int:
    """
    Aggiunge al Business Score i segnali del Fan Intelligence Engine.
    -10 se più del 30% dei fan ha renewal_probability < 0.4.
    -5 se più del 5% degli abbonati ha anomalie critiche.
    Lazy import per evitare dipendenza circolare.
    """
    try:
        from services.intelligence.engine import compute_club_intelligence
        from fan_intelligence import AnomalySeverity
        # Stesso lock per-club_id usato in routers/intelligence.py: questo
        # percorso calcola l'intelligence in un formato diverso (dataclass
        # raw, non serializzato) e con una cache propria, ma è comunque la
        # stessa identica computazione pesante — senza lock condiviso poteva
        # correre in parallelo con gli altri due percorsi già protetti,
        # rallentando tutto sotto carico (cache fredda dopo un riavvio).
        from routers.intelligence import _get_compute_lock

        _raw_key = f"intelligence_raw_{club_id}"
        intelligence = cache_get(_raw_key)
        if intelligence is None:
            with _get_compute_lock(club_id):
                intelligence = cache_get(_raw_key)
                if intelligence is None:
                    intelligence = compute_club_intelligence(club_id, db)
                    cache_set(_raw_key, intelligence)
        if not intelligence:
            return score

        total = len(intelligence)
        at_risk = sum(
            1 for fi in intelligence
            if fi.renewal_probability is not None and fi.renewal_probability < 0.4
        )
        critical_anomalies = sum(
            1 for fi in intelligence
            if fi.subscription_anomaly
            and fi.subscription_anomaly.severity == AnomalySeverity.CRITICA
        )
        abbonati = sum(1 for f in segments if f.get("has_abbonamento"))

        if total > 0 and at_risk / total > 0.30:
            score -= 10
        if abbonati > 0 and critical_anomalies / abbonati > 0.05:
            score -= 5
    except Exception as exc:
        logger.warning("intelligence_penalties fallback: %s", exc)

    return max(0, score)


def _business_score(dormienti_pct: float, rischio_pct: float, vip_fedeli_pct: float, email_pct: float) -> int:
    """Score 0-100 sulla salute commerciale: attività tifosi, revenue a rischio, potenziale crescita."""
    safety     = (1 - rischio_pct)    * 40
    engagement = (1 - dormienti_pct)  * 35
    growth     = min(vip_fedeli_pct * 3, 15)
    data       = email_pct            * 10
    return max(0, min(100, round(safety + engagement + growth + data)))


def _sub_cluster(recency_days: int) -> str:
    if recency_days > 540:  return "Persi"
    if recency_days > 365:  return "Freddi"
    if recency_days > 180:  return "Tiepidi"
    return "A rischio"


_CLUSTER_CFG = [
    ("Persi",     "#dc2626", "high",   0.90, "Ultima chiamata — servono offerte shock o esperienze esclusive"),
    ("Freddi",    "#ea580c", "high",   0.75, "Finestra stretta — campagna nostalgia o invito a un evento speciale"),
    ("Tiepidi",   "#d97706", "medium", 0.50, "Ancora recuperabili — sconto biglietto prossima partita"),
    ("A rischio", "#f59e0b", "medium", 0.35, "Intervieni subito — un messaggio personale può bastare"),
]


def _fan_preview(fans: list, limit: int = 10) -> list:
    sorted_fans = sorted(fans, key=lambda f: (-f["total_spend"], f.get("recency_days", 0)))
    return [
        {
            "id": f["id"],
            "nome": f["nome"],
            "cognome": f["cognome"],
            "email": f.get("email"),
            "last_activity": f.get("last_activity"),
            "recency_days": f.get("recency_days", 999),
            "total_spend": f["total_spend"],
        }
        for f in sorted_fans[:limit]
    ]


def generate_insights(db: Session, club_id: int) -> dict:
    stats    = dashboard_stats(db, club_id)

    if stats["total_fans"] == 0:
        return {"empty": True, "summary": "Carica i primi CSV per generare insights automatici."}

    total_fans    = stats["total_fans"]
    total_revenue = stats["total_revenue"]
    spesa_media   = stats["spesa_media"]

    segments    = compute_fan_segments(db, club_id)
    cross       = dashboard_cross_source(db, club_id)
    readiness   = compute_data_readiness(db, club_id)
    rev_breakdown = dashboard_revenue_breakdown(db, club_id)

    seg_map: dict[str, list] = {}
    for f in segments:
        seg_map.setdefault(f["segment"], []).append(f)

    dormienti = seg_map.get("Dormiente", [])
    a_rischio = seg_map.get("A rischio", [])
    vip       = seg_map.get("VIP", [])
    fedeli    = seg_map.get("Fedele", [])
    nuovi     = seg_map.get("Nuovo", [])

    # ── SOTTO-CLUSTER (dormienti + a_rischio divisi per urgenza) ─────────────
    fans_critici = dormienti + a_rischio
    cluster_buckets: dict[str, list] = {name: [] for name, *_ in _CLUSTER_CFG}
    for f in fans_critici:
        cluster_buckets[_sub_cluster(f.get("recency_days", 999))].append(f)

    sotto_cluster = []
    totale_a_rischio = 0
    for name, color, severity, risk_factor, consiglio in _CLUSTER_CFG:
        fans_in = cluster_buckets[name]
        if not fans_in:
            continue
        rev = round(sum(f["total_spend"] for f in fans_in) * risk_factor)
        totale_a_rischio += rev
        sotto_cluster.append({
            "nome": name,
            "count": len(fans_in),
            "revenue": rev,
            "color": color,
            "severity": severity,
            "consiglio": consiglio,
            "fans": _fan_preview(fans_in),
        })

    # ── OPPORTUNITÀ ───────────────────────────────────────────────────────────
    abb_revenue       = next((r["importo"] for r in rev_breakdown if r["fonte"] == "Abbonamenti"), 0)
    n_abbonati_totali = sum(1 for f in segments if f.get("has_abbonamento"))
    avg_abb           = round(abb_revenue / n_abbonati_totali) if n_abbonati_totali else round(spesa_media * 0.8)

    fedeli_senza_abb = [f for f in fedeli if not f.get("has_abbonamento")]
    nuovi_alto       = [f for f in nuovi if f["total_spend"] >= max(spesa_media * 0.6, 20)]

    opportunita = []
    if fedeli_senza_abb:
        opportunita.append({
            "tipo": "abbonamento",
            "titolo": f"{len(fedeli_senza_abb)} fedeli senza abbonamento stagionale",
            "descrizione": "Vengono alle partite ma non abbonano — la proposta giusta al momento giusto può convertirli.",
            "count": len(fedeli_senza_abb),
            "revenue_stimata": round(len(fedeli_senza_abb) * avg_abb * 0.55),
            "azione_label": "Esporta lista",
            "azione_segment": "Fedele",
            "fans": _fan_preview(fedeli_senza_abb),
        })
    if nuovi_alto:
        opportunita.append({
            "tipo": "vip_conversion",
            "titolo": f"{len(nuovi_alto)} nuovi tifosi ad alto potenziale",
            "descrizione": "Prima interazione con spesa sopra la media — coltivali ora prima che diventino occasionali.",
            "count": len(nuovi_alto),
            "revenue_stimata": round(sum(f["total_spend"] for f in nuovi_alto) * 1.4),
            "azione_label": "Esporta lista",
            "azione_segment": "Nuovo",
            "fans": _fan_preview(nuovi_alto),
        })
    if vip:
        opportunita.append({
            "tipo": "vip_experience",
            "titolo": f"{len(vip)} VIP da valorizzare con esperienze",
            "descrizione": "I tuoi top spender: hospitality, jersey personalizzata, incontro con lo staff aumentano il lifetime value.",
            "count": len(vip),
            "revenue_stimata": round(sum(f["total_spend"] for f in vip) * 0.25),
            "azione_label": "Esporta lista",
            "azione_segment": "VIP",
            "fans": _fan_preview(vip),
        })

    # ── BUSINESS SCORE ────────────────────────────────────────────────────────
    email_pct_raw   = stats["fans_with_email"] / total_fans
    dormienti_pct   = len(dormienti) / total_fans
    rischio_pct     = totale_a_rischio / total_revenue if total_revenue else 0
    vip_fedeli_pct  = (len(vip) + len(fedeli)) / total_fans
    biz_score       = _business_score(dormienti_pct, rischio_pct, vip_fedeli_pct, email_pct_raw)
    biz_score       = _apply_intelligence_penalties(biz_score, segments, db, club_id)

    # ── QUALITÀ (solo per uso interno, non nella hero row) ───────────────────
    email_pct     = round(email_pct_raw * 100)
    with_consent  = sum(1 for f in segments if f.get("consenso_marketing"))
    fonti_attive  = sum([
        readiness["sources"]["abbonati"]    > 0,
        readiness["sources"]["biglietteria"] > 0,
        readiness["sources"]["shop"]        > 0,
    ])
    qualita = {
        "score":          readiness["score"],
        "email_pct":      email_pct,
        "consenso_count": with_consent,
        "consenso_pct":   round(with_consent / total_fans * 100),
        "fonti_attive":   fonti_attive,
    }

    # ── AZIONI CONSIGLIATE ────────────────────────────────────────────────────
    totale_critici = len(fans_critici)
    azioni_settimana = []

    if totale_critici > 0:
        azioni_settimana.append({
            "urgenza": "alta",
            "azione": f"Riattiva i {totale_critici} tifosi inattivi prima della prossima partita",
            "valore": f"€{totale_a_rischio:,} a rischio",
            "segment": "Dormiente",
        })
    if fedeli_senza_abb:
        azioni_settimana.append({
            "urgenza": "media",
            "azione": f"Proponi l'abbonamento ai {len(fedeli_senza_abb)} fedeli non ancora abbonati",
            "valore": f"Potenziale €{round(len(fedeli_senza_abb) * avg_abb * 0.55):,}",
            "segment": "Fedele",
        })
    if nuovi_alto:
        azioni_settimana.append({
            "urgenza": "media",
            "azione": f"Accogli i {len(nuovi_alto)} nuovi tifosi con alta spesa — fidelizzali subito",
            "valore": "Fidelizzazione precoce",
            "segment": "Nuovo",
        })

    opportunita_tot = sum(o["revenue_stimata"] for o in opportunita)

    return {
        "kpi": {
            "total_fans":        total_fans,
            "total_revenue":     total_revenue,
            "revenue_a_rischio": totale_a_rischio,
            "opportunita_stimata": opportunita_tot,
            "business_score":    biz_score,
            "super_fans":        cross["all_three"],
        },
        "revenue_watch": {
            "totale_a_rischio": totale_a_rischio,
            "fans_count":       totale_critici,
            "sotto_cluster":    sotto_cluster,
        },
        "opportunita":       opportunita,
        "qualita":           qualita,
        "segment_counts":    {seg: len(fans) for seg, fans in seg_map.items()},
        "azioni_settimana":  azioni_settimana,
        "summary":           f"Analisi su {total_fans} tifosi · Revenue totale €{total_revenue:,.0f}",
    }
