"""Previsione spesa shop nei prossimi mesi, per fan — non parte del Fan
Intelligence Engine (non tocca FanIntelligence), è un modulo a sé perché
guarda avanti su un asse diverso (spesa merch) con dati propri (ShopOrder)."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional, TypedDict

SHOP_PROJECTION_MONTHS = 3      # orizzonte della previsione
SHOP_TREND_WINDOW_MONTHS = 3    # finestra di confronto per il trend (recente vs precedente)
SHOP_TREND_MIN = 0.5            # cap minimo sul fattore di trend — evita proiezioni assurde
SHOP_TREND_MAX = 2.0            # cap massimo
SHOP_MIN_ORDERS_FOR_FULL = 3    # sotto questa soglia la previsione è marcata PARTIAL


class ShopForecast(TypedDict):
    predicted: float
    monthly_avg: float
    trend: float
    data_quality: str   # "FULL" | "PARTIAL" | "INSUFFICIENT"


def forecast_shop_spend(orders: list[dict], today: Optional[date] = None) -> ShopForecast:
    """
    orders: [{"data": date | None, "importo": float}], ordine qualsiasi.
    Proiezione lineare sulla media mensile storica, corretta da un trend
    (spesa recente vs precedente, stessa finestra a due periodi già usata
    per il momentum del Journey Stage — coerenza con lo stile del motore).
    """
    today = today or date.today()
    dated = [o for o in orders if o.get("data") is not None]
    if not dated:
        return {"predicted": 0.0, "monthly_avg": 0.0, "trend": 1.0, "data_quality": "INSUFFICIENT"}

    dated.sort(key=lambda o: o["data"])
    first_date = dated[0]["data"]
    total_spend = sum(o["importo"] for o in dated)

    active_months = max(1.0, (today - first_date).days / 30)
    monthly_avg = total_spend / active_months

    recent_cutoff = today - timedelta(days=SHOP_TREND_WINDOW_MONTHS * 30)
    previous_cutoff = today - timedelta(days=SHOP_TREND_WINDOW_MONTHS * 2 * 30)

    recent_spend = sum(o["importo"] for o in dated if o["data"] > recent_cutoff)
    previous_spend = sum(o["importo"] for o in dated if previous_cutoff < o["data"] <= recent_cutoff)

    if previous_spend > 0:
        trend = recent_spend / previous_spend
    elif recent_spend > 0:
        trend = SHOP_TREND_MAX   # ripartito dal nulla di recente → trend positivo forte
    else:
        trend = 1.0               # nessun segnale di trend, resta sulla media pura

    trend = max(SHOP_TREND_MIN, min(SHOP_TREND_MAX, trend))
    predicted = round(monthly_avg * SHOP_PROJECTION_MONTHS * trend, 2)

    quality = (
        "FULL" if len(dated) >= SHOP_MIN_ORDERS_FOR_FULL and active_months >= SHOP_TREND_WINDOW_MONTHS * 2
        else "PARTIAL"
    )

    return {
        "predicted": predicted,
        "monthly_avg": round(monthly_avg, 2),
        "trend": round(trend, 2),
        "data_quality": quality,
    }
