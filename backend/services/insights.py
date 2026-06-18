"""Generazione insights automatici sui dati del club."""
from sqlalchemy.orm import Session

from services.analytics import (
    compute_fan_segments,
    dashboard_cross_source,
    dashboard_stats,
    get_all_fans_raw,
)


def generate_insights(db: Session, club_id: int) -> dict:
    stats = dashboard_stats(db, club_id)
    segments = compute_fan_segments(db, club_id)
    cross = dashboard_cross_source(db, club_id)

    if stats["total_fans"] == 0:
        return {
            "insights": [],
            "summary": "Carica i primi CSV per generare insights automatici.",
        }

    seg_counts = {}
    for s in segments:
        seg_counts[s["segment"]] = seg_counts.get(s["segment"], 0) + 1

    insights = []

    email_pct = round(stats["fans_with_email"] / stats["total_fans"] * 100) if stats["total_fans"] else 0
    if email_pct < 70:
        insights.append({
            "type": "warning",
            "title": "Email incomplete",
            "body": f"Solo {email_pct}% dei tifosi ha un'email. Migliora la raccolta al gate o nello shop per campagne più efficaci.",
            "priority": "high",
        })
    else:
        insights.append({
            "type": "success",
            "title": "Base email solida",
            "body": f"{email_pct}% dei tifosi è raggiungibile via email — ottimo per comunicazioni e marketing.",
            "priority": "low",
        })

    dormienti = seg_counts.get("Dormiente", 0)
    if dormienti > 0:
        pct = round(dormienti / stats["total_fans"] * 100)
        insights.append({
            "type": "alert",
            "title": f"{dormienti} tifosi dormienti",
            "body": f"{pct}% del database non interagisce da tempo. Considera una campagna di riattivazione con offerta biglietto.",
            "priority": "high",
        })

    vip = seg_counts.get("VIP", 0)
    if vip > 0:
        insights.append({
            "type": "opportunity",
            "title": f"{vip} tifosi VIP",
            "body": "I tuoi top spender meritano attenzione: esperienze esclusive, hospitality o abbonamenti premium.",
            "priority": "medium",
        })

    a_rischio = seg_counts.get("A rischio", 0)
    if a_rischio > 0:
        insights.append({
            "type": "warning",
            "title": f"{a_rischio} tifosi a rischio churn",
            "body": "Erano attivi ma non tornano. Un contatto personalizzato prima della prossima partita può fare la differenza.",
            "priority": "high",
        })

    if cross["multi_source"] > 0:
        pct = round(cross["multi_source"] / stats["total_fans"] * 100)
        insights.append({
            "type": "info",
            "title": "Cross-canale",
            "body": f"{pct}% dei tifosi interagisce su più fonti (abbonamento + biglietti + shop). Punta a unificare l'identità con email.",
            "priority": "medium",
        })

    if cross["all_three"] > 0:
        insights.append({
            "type": "success",
            "title": f"{cross['all_three']} super-fan",
            "body": "Tifosi presenti su tutte e tre le fonti: il segmento più fedele e redditizio del club.",
            "priority": "low",
        })

    fans = get_all_fans_raw(db, club_id)
    with_consent = sum(1 for f in fans if f.consenso_marketing is True)
    if with_consent > 0:
        insights.append({
            "type": "info",
            "title": "Consenso marketing",
            "body": f"{with_consent} tifosi hanno dato consenso marketing — usali per campagne GDPR-compliant.",
            "priority": "medium",
        })

    insights.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(x["priority"], 3))

    return {
        "insights": insights,
        "summary": f"Analisi su {stats['total_fans']} tifosi — revenue totale {stats['total_revenue']:.0f} €",
        "segment_counts": seg_counts,
    }
