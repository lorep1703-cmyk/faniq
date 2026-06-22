"""
Rinnovo Probability Score — scoring pesato per stimare la probabilità
che un abbonato rinnovi nella stagione successiva.

Segnali e pesi:
  frequenza_recente  0.35  — presenze ultime 8 partite (predittore più forte)
  trend_presenze     0.25  — confronto ultime 8 vs precedenti 8 (momentum)
  recency            0.20  — quante partite fa è venuto l'ultima volta
  storico_rinnovi    0.15  — stagioni consecutive di abbonamento
  shop_spend         0.05  — spesa merch indica fidelizzazione emotiva
"""
from __future__ import annotations

from datetime import date
from typing import TypedDict

from sqlalchemy.orm import Session

from models import Abbonamento, Biglietto, Fan, Partita, ShopOrder


class RenewalResult(TypedDict):
    fan_id: int
    score: float          # 0.0 – 1.0
    score_pct: int        # 0 – 100
    has_incomplete_data: bool
    detail: dict          # breakdown per segnale


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def calculate_renewal_probability(fan_id: int, club_id: int, db: Session) -> RenewalResult:
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club_id).first()
    if not fan:
        return RenewalResult(fan_id=fan_id, score=0.5, score_pct=50,
                             has_incomplete_data=True, detail={})

    incomplete = False

    # ── Calendario partite passate (ordinate dal più recente) ─────────────────
    partite = (
        db.query(Partita)
        .filter(Partita.club_id == club_id, Partita.data <= date.today())
        .order_by(Partita.data.desc())
        .all()
    )
    partite_dates = [p.data for p in partite]

    # Date biglietti del fan
    biglietti = db.query(Biglietto).filter(
        Biglietto.fan_id == fan_id, Biglietto.club_id == club_id
    ).all()
    fan_dates = {b.data_partita for b in biglietti if b.data_partita}

    # ── Segnale 1: frequenza ultime 8 partite (peso 0.35) ────────────────────
    recenti = partite_dates[:8]
    if len(recenti) < 4:
        sig_frequenza = 0.5
        incomplete = True
    else:
        sig_frequenza = _clamp(sum(1 for d in recenti if d in fan_dates) / len(recenti))

    # ── Segnale 2: trend presenze (peso 0.25) ─────────────────────────────────
    precedenti = partite_dates[8:16]
    if len(recenti) < 4 or len(precedenti) < 4:
        sig_trend = 0.5
        incomplete = True
    else:
        rate_recente    = sum(1 for d in recenti    if d in fan_dates) / len(recenti)
        rate_precedente = sum(1 for d in precedenti if d in fan_dates) / len(precedenti)
        diff = rate_recente - rate_precedente
        # +0.3 → in aumento, 0 → stabile, -0.3 → in calo — normalizzato 0-1
        sig_trend = _clamp(0.5 + diff * 1.5)

    # ── Segnale 3: recency (peso 0.20) ────────────────────────────────────────
    if not partite_dates or not fan_dates:
        sig_recency = 0.5
        incomplete = True
    else:
        past_dates = [d for d in partite_dates if d in fan_dates]
        if not past_dates:
            sig_recency = 0.0
        else:
            ultima_presenza = past_dates[0]  # già ordinate desc
            idx = next((i for i, d in enumerate(partite_dates) if d == ultima_presenza), None)
            if idx is None:
                sig_recency = 0.5
                incomplete = True
            else:
                # 0 partite fa → 1.0, 8+ → 0.0
                sig_recency = _clamp(1.0 - idx / 8)

    # ── Segnale 4: storico rinnovi — stagioni consecutive (peso 0.15) ─────────
    abbonamenti = (
        db.query(Abbonamento)
        .filter(Abbonamento.fan_id == fan_id, Abbonamento.club_id == club_id)
        .all()
    )
    n_stagioni = len({a.stagione for a in abbonamenti if a.stagione})
    if n_stagioni == 0:
        sig_rinnovi = 0.3  # abbonato senza storico → bassa fiducia
        incomplete = True
    else:
        # 1 stagione → 0.3, 3+ → 1.0
        sig_rinnovi = _clamp(0.3 + (n_stagioni - 1) * 0.35)

    # ── Segnale 5: shop spend (peso 0.05) ────────────────────────────────────
    shop_total = sum(
        o.importo for o in db.query(ShopOrder).filter(
            ShopOrder.fan_id == fan_id, ShopOrder.club_id == club_id
        ).all()
    ) or 0.0
    # soglia: 0 → 0.0, 50€+ → 1.0
    sig_shop = _clamp(shop_total / 50.0)

    # ── Score finale — media pesata ────────────────────────────────────────────
    score = (
        sig_frequenza * 0.35
        + sig_trend    * 0.25
        + sig_recency  * 0.20
        + sig_rinnovi  * 0.15
        + sig_shop     * 0.05
    )

    return RenewalResult(
        fan_id=fan_id,
        score=round(score, 4),
        score_pct=round(score * 100),
        has_incomplete_data=incomplete,
        detail={
            "frequenza_recente": round(sig_frequenza, 3),
            "trend_presenze":    round(sig_trend, 3),
            "recency":           round(sig_recency, 3),
            "storico_rinnovi":   round(sig_rinnovi, 3),
            "shop_spend":        round(sig_shop, 3),
            "n_stagioni_abb":    n_stagioni,
            "n_partite_recenti": sum(1 for d in recenti if d in fan_dates),
            "n_partite_totali":  len(recenti),
        },
    )


def calculate_renewal_scores_bulk(club_id: int, db: Session) -> list[RenewalResult]:
    fans = db.query(Fan).filter(Fan.club_id == club_id).all()
    return [calculate_renewal_probability(f.id, club_id, db) for f in fans]
