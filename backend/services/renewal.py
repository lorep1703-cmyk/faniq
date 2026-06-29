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

from collections import defaultdict
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


def _score_from_data(
    fan_id: int,
    partite_dates: list[date],
    fan_ticket_dates: set[date],
    fan_stagioni: set[str],
    fan_shop_total: float,
) -> RenewalResult:
    """Calcola il renewal score da dati già in memoria — zero query DB."""
    incomplete = False

    # ── Segnale 1: frequenza ultime 8 partite (peso 0.35) ────────────────────
    recenti = partite_dates[:8]
    if len(recenti) < 4:
        sig_frequenza = 0.5
        incomplete = True
    else:
        sig_frequenza = _clamp(sum(1 for d in recenti if d in fan_ticket_dates) / len(recenti))

    # ── Segnale 2: trend presenze (peso 0.25) ─────────────────────────────────
    precedenti = partite_dates[8:16]
    if len(recenti) < 4 or len(precedenti) < 4:
        sig_trend = 0.5
        incomplete = True
    else:
        rate_recente    = sum(1 for d in recenti    if d in fan_ticket_dates) / len(recenti)
        rate_precedente = sum(1 for d in precedenti if d in fan_ticket_dates) / len(precedenti)
        diff = rate_recente - rate_precedente
        sig_trend = _clamp(0.5 + diff * 1.5)

    # ── Segnale 3: recency (peso 0.20) ────────────────────────────────────────
    if not partite_dates or not fan_ticket_dates:
        sig_recency = 0.5
        incomplete = True
    else:
        past_dates = [d for d in partite_dates if d in fan_ticket_dates]
        if not past_dates:
            sig_recency = 0.0
        else:
            ultima_presenza = past_dates[0]  # già ordinate desc
            idx = next((i for i, d in enumerate(partite_dates) if d == ultima_presenza), None)
            if idx is None:
                sig_recency = 0.5
                incomplete = True
            else:
                sig_recency = _clamp(1.0 - idx / 8)

    # ── Segnale 4: storico rinnovi — stagioni consecutive (peso 0.15) ─────────
    n_stagioni = len(fan_stagioni)
    if n_stagioni == 0:
        sig_rinnovi = 0.3
        incomplete = True
    else:
        sig_rinnovi = _clamp(0.3 + (n_stagioni - 1) * 0.35)

    # ── Segnale 5: shop spend (peso 0.05) ────────────────────────────────────
    sig_shop = _clamp(fan_shop_total / 50.0)

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
            "n_partite_recenti": sum(1 for d in recenti if d in fan_ticket_dates),
            "n_partite_totali":  len(recenti),
        },
    )


def calculate_renewal_probability(fan_id: int, club_id: int, db: Session) -> RenewalResult:
    """Calcolo per singolo fan — usato dall'endpoint /{fan_id}/renewal-score."""
    fan = db.query(Fan).filter(Fan.id == fan_id, Fan.club_id == club_id).first()
    if not fan:
        return RenewalResult(fan_id=fan_id, score=0.5, score_pct=50,
                             has_incomplete_data=True, detail={})

    partite = (
        db.query(Partita)
        .filter(Partita.club_id == club_id, Partita.data <= date.today())
        .order_by(Partita.data.desc())
        .all()
    )
    partite_dates = [p.data for p in partite]

    biglietti = db.query(Biglietto).filter(
        Biglietto.fan_id == fan_id, Biglietto.club_id == club_id
    ).all()
    fan_ticket_dates = {b.data_partita for b in biglietti if b.data_partita}

    abbonamenti = db.query(Abbonamento).filter(
        Abbonamento.fan_id == fan_id, Abbonamento.club_id == club_id
    ).all()
    fan_stagioni = {a.stagione for a in abbonamenti if a.stagione}

    shop_total = float(
        sum(
            o.importo for o in db.query(ShopOrder).filter(
                ShopOrder.fan_id == fan_id, ShopOrder.club_id == club_id
            ).all()
        ) or 0.0
    )

    return _score_from_data(fan_id, partite_dates, fan_ticket_dates, fan_stagioni, shop_total)


def calculate_renewal_scores_bulk(club_id: int, db: Session) -> list[RenewalResult]:
    """
    Calcolo bulk — 5 query totali indipendentemente dal numero di fan.

    Pattern:
      1. carica tutti i dati del club in memoria (5 query)
      2. costruisce indici per fan_id
      3. itera sui fan senza ulteriori accessi al DB
    """
    today = date.today()

    # ── 1. Partite del club (uguali per tutti i fan) ──────────────────────────
    partite_dates: list[date] = [
        p.data
        for p in db.query(Partita)
        .filter(Partita.club_id == club_id, Partita.data <= today)
        .order_by(Partita.data.desc())
        .all()
    ]

    # ── 2. Fan del club ────────────────────────────────────────────────────────
    fans = db.query(Fan.id).filter(Fan.club_id == club_id).all()
    fan_ids = [row[0] for row in fans]

    # ── 3. Biglietti → set di date per fan_id ─────────────────────────────────
    ticket_dates_by_fan: dict[int, set[date]] = defaultdict(set)
    for b in db.query(Biglietto).filter(Biglietto.club_id == club_id).all():
        if b.data_partita:
            ticket_dates_by_fan[b.fan_id].add(b.data_partita)

    # ── 4. Abbonamenti → set di stagioni per fan_id ───────────────────────────
    stagioni_by_fan: dict[int, set[str]] = defaultdict(set)
    for a in db.query(Abbonamento).filter(Abbonamento.club_id == club_id).all():
        if a.stagione:
            stagioni_by_fan[a.fan_id].add(a.stagione)

    # ── 5. Shop → totale spesa per fan_id ─────────────────────────────────────
    shop_total_by_fan: dict[int, float] = defaultdict(float)
    for o in db.query(ShopOrder).filter(ShopOrder.club_id == club_id).all():
        shop_total_by_fan[o.fan_id] += float(o.importo or 0)

    # ── Calcolo in-memory — zero query aggiuntive ─────────────────────────────
    return [
        _score_from_data(
            fan_id=fid,
            partite_dates=partite_dates,
            fan_ticket_dates=ticket_dates_by_fan[fid],
            fan_stagioni=stagioni_by_fan[fid],
            fan_shop_total=shop_total_by_fan[fid],
        )
        for fid in fan_ids
    ]
