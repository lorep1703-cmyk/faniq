"""Generazione insights strutturati: Revenue Watch, Opportunità, Qualità dati."""
from sqlalchemy.orm import Session

from services.analytics import (
    compute_fan_segments,
    dashboard_cross_source,
    dashboard_revenue_breakdown,
    dashboard_stats,
)
from services.data_readiness import compute_data_readiness


def _business_score(dormienti_pct: float, rischio_pct: float, vip_fedeli_pct: float, email_pct: float) -> int:
    """Score 0-100 che misura la salute commerciale del club, non la qualità tecnica dei dati."""
    safety = (1 - rischio_pct) * 40        # 40 pt: quanto revenue è al sicuro
    engagement = (1 - dormienti_pct) * 35  # 35 pt: quanto i tifosi sono attivi
    growth = min(vip_fedeli_pct * 3, 15)   # 15 pt: % VIP + Fedeli (cap a 15)
    data = email_pct * 10                  # 10 pt: copertura email
    return max(0, min(100, round(safety + engagement + growth + data)))


def generate_insights(db: Session, club_id: int) -> dict:
    stats = dashboard_stats(db, club_id)

    if stats["total_fans"] == 0:
        return {"empty": True, "summary": "Carica i primi CSV per generare insights automatici."}

    total_fans = stats["total_fans"]
    total_revenue = stats["total_revenue"]
    spesa_media = stats["spesa_media"]

    segments = compute_fan_segments(db, club_id)
    cross = dashboard_cross_source(db, club_id)
    readiness = compute_data_readiness(db, club_id)
    rev_breakdown = dashboard_revenue_breakdown(db, club_id)

    # Raggruppa per segmento
    seg_map: dict[str, list] = {}
    for f in segments:
        seg_map.setdefault(f["segment"], []).append(f)

    # ── REVENUE WATCH ────────────────────────────────────────────────────────
    dormienti = seg_map.get("Dormiente", [])
    a_rischio = seg_map.get("A rischio", [])

    rev_dormienti = round(sum(f["total_spend"] for f in dormienti) * 0.9)
    rev_a_rischio = round(sum(f["total_spend"] for f in a_rischio) * 0.55)
    totale_a_rischio = rev_dormienti + rev_a_rischio

    revenue_watch_items = []
    if dormienti:
        revenue_watch_items.append({
            "label": f"{len(dormienti)} tifosi dormienti",
            "sublabel": "Nessuna interazione recente — rischio abbandono definitivo",
            "count": len(dormienti),
            "revenue": rev_dormienti,
            "severity": "high",
            "segment": "Dormiente",
        })
    if a_rischio:
        revenue_watch_items.append({
            "label": f"{len(a_rischio)} tifosi a rischio churn",
            "sublabel": "Erano attivi, stanno rallentando — finestra di intervento ancora aperta",
            "count": len(a_rischio),
            "revenue": rev_a_rischio,
            "severity": "medium",
            "segment": "A rischio",
        })

    # ── OPPORTUNITÀ ──────────────────────────────────────────────────────────
    vip = seg_map.get("VIP", [])
    fedeli = seg_map.get("Fedele", [])
    nuovi = seg_map.get("Nuovo", [])

    # Stima prezzo medio abbonamento dai dati reali
    abb_revenue = next((r["importo"] for r in rev_breakdown if r["fonte"] == "Abbonamenti"), 0)
    n_abbonati_totali = sum(1 for f in segments if f.get("has_abbonamento"))
    avg_abb = round(abb_revenue / n_abbonati_totali) if n_abbonati_totali else round(spesa_media * 0.8)

    fedeli_senza_abb = [f for f in fedeli if not f.get("has_abbonamento")]
    nuovi_alto = [f for f in nuovi if f["total_spend"] >= max(spesa_media * 0.6, 20)]

    opportunita = []

    if fedeli_senza_abb:
        rev_stima = round(len(fedeli_senza_abb) * avg_abb * 0.55)
        opportunita.append({
            "tipo": "abbonamento",
            "titolo": f"{len(fedeli_senza_abb)} fedeli senza abbonamento stagionale",
            "descrizione": "Vengono alle partite ma non abbonano — la proposta giusta al momento giusto può convertirli.",
            "count": len(fedeli_senza_abb),
            "revenue_stimata": rev_stima,
            "azione_label": "Esporta lista",
            "azione_segment": "Fedele",
        })

    if nuovi_alto:
        rev_stima = round(sum(f["total_spend"] for f in nuovi_alto) * 1.4)
        opportunita.append({
            "tipo": "vip_conversion",
            "titolo": f"{len(nuovi_alto)} nuovi tifosi ad alto potenziale",
            "descrizione": "Prima interazione con spesa sopra la media — coltivali ora prima che diventino occasionali.",
            "count": len(nuovi_alto),
            "revenue_stimata": rev_stima,
            "azione_label": "Esporta lista",
            "azione_segment": "Nuovo",
        })

    if vip:
        rev_stima = round(sum(f["total_spend"] for f in vip) * 0.25)
        opportunita.append({
            "tipo": "vip_experience",
            "titolo": f"{len(vip)} VIP da valorizzare con esperienze",
            "descrizione": "I tuoi top spender: hospitality, jersey personalizzata, incontro con lo staff aumentano il lifetime value.",
            "count": len(vip),
            "revenue_stimata": rev_stima,
            "azione_label": "Esporta lista",
            "azione_segment": "VIP",
        })

    # ── QUALITÀ DATABASE ─────────────────────────────────────────────────────
    email_pct = round(stats["fans_with_email"] / total_fans * 100)
    with_consent = sum(1 for f in segments if f.get("consenso_marketing"))
    fonti_attive = sum([
        readiness["sources"]["abbonati"] > 0,
        readiness["sources"]["biglietteria"] > 0,
        readiness["sources"]["shop"] > 0,
    ])

    issues = []
    if email_pct < 70:
        issues.append(f"Solo {email_pct}% ha email — raccogli contatti al gate e in cassa")
    if with_consent < total_fans * 0.4:
        issues.append(f"Solo {with_consent} consensi marketing — aggiungi raccolta consenso al prossimo acquisto")
    if fonti_attive < 3:
        issues.append("Carica tutte e 3 le fonti CSV per insights più precisi")

    qualita = {
        "score": readiness["score"],
        "email_pct": email_pct,
        "consenso_count": with_consent,
        "consenso_pct": round(with_consent / total_fans * 100),
        "fonti_attive": fonti_attive,
        "issues": issues,
    }

    # ── BUSINESS SCORE ───────────────────────────────────────────────────────
    dormienti_pct = len(dormienti) / total_fans
    rischio_pct = totale_a_rischio / total_revenue if total_revenue else 0
    vip_fedeli_pct = (len(vip) + len(fedeli)) / total_fans
    email_pct_raw = stats["fans_with_email"] / total_fans
    biz_score = _business_score(dormienti_pct, rischio_pct, vip_fedeli_pct, email_pct_raw)

    # ── KPI BAR ──────────────────────────────────────────────────────────────
    opportunita_tot = sum(o["revenue_stimata"] for o in opportunita)
    super_fans = cross["all_three"]

    # ── HINT PUNTO 2 — azioni della settimana ────────────────────────────────
    azioni_settimana = []
    if a_rischio:
        azioni_settimana.append({
            "urgenza": "alta",
            "azione": f"Contatta i {len(a_rischio)} tifosi a rischio prima della prossima partita",
            "valore": f"€{rev_a_rischio:,} da recuperare",
            "segment": "A rischio",
        })
    if fedeli_senza_abb:
        azioni_settimana.append({
            "urgenza": "media",
            "azione": f"Proponi l'abbonamento ai {len(fedeli_senza_abb)} fedeli non abbonati",
            "valore": f"Potenziale €{round(len(fedeli_senza_abb) * avg_abb * 0.55):,}",
            "segment": "Fedele",
        })
    if nuovi_alto:
        azioni_settimana.append({
            "urgenza": "media",
            "azione": f"Invia benvenuto personalizzato ai {len(nuovi_alto)} nuovi tifosi con alta spesa",
            "valore": "Fidelizzazione precoce",
            "segment": "Nuovo",
        })

    return {
        "kpi": {
            "total_fans": total_fans,
            "total_revenue": total_revenue,
            "revenue_a_rischio": totale_a_rischio,
            "opportunita_stimata": opportunita_tot,
            "business_score": biz_score,
            "data_score": readiness["score"],
            "super_fans": super_fans,
        },
        "revenue_watch": {
            "totale_a_rischio": totale_a_rischio,
            "fans_count": len(dormienti) + len(a_rischio),
            "items": revenue_watch_items,
        },
        "opportunita": opportunita,
        "qualita": qualita,
        "segment_counts": {seg: len(fans) for seg, fans in seg_map.items()},
        "azioni_settimana": azioni_settimana,
        "summary": f"Analisi su {total_fans} tifosi · Revenue totale €{total_revenue:,.0f}",
    }
