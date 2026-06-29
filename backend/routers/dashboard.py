from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Abbonamento, Club, Fan, ShopOrder
from tenant import get_current_club
from services.analytics import (
    compute_fan_segments,
    dashboard_citta,
    dashboard_cross_source,
    dashboard_presenze,
    dashboard_retention,
    dashboard_revenue_breakdown,
    dashboard_seasons,
    dashboard_segments,
    dashboard_stats,
    dashboard_top_spenders,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_stats(db, club.id)


@router.get("/citta")
def get_citta(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_citta(db, club.id)


@router.get("/presenze")
def get_presenze(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_presenze(db, club.id)


@router.get("/revenue-breakdown")
def get_revenue_breakdown(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_revenue_breakdown(db, club.id)


@router.get("/retention")
def get_retention(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_retention(db, club.id)


@router.get("/segments")
def get_segments(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_segments(db, club.id)


@router.get("/top-spenders")
def get_top_spenders(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_top_spenders(db, club.id)


@router.get("/cross-source")
def get_cross_source(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_cross_source(db, club.id)


@router.get("/seasons")
def get_seasons(db: Session = Depends(get_db), club: Club = Depends(get_current_club)):
    return dashboard_seasons(db, club.id)


@router.get("/fans")
def get_fans(
    stagione: str | None = Query(None, description="Filtra per stagione abbonamento"),
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    fans = compute_fan_segments(db, club.id)
    if stagione:
        fan_ids = {
            row[0]
            for row in db.query(Abbonamento.fan_id)
            .filter(Abbonamento.club_id == club.id, Abbonamento.stagione == stagione)
            .all()
        }
        fans = [f for f in fans if f["id"] in fan_ids]
    return fans


@router.get("/summary")
def get_summary(
    club: Club = Depends(get_current_club),
    db: Session = Depends(get_db),
):
    """KPI aggregati per la schermata principale della dashboard."""
    cid = club.id

    total_fans = (
        db.query(func.count(Fan.id))
        .filter(Fan.club_id == cid)
        .scalar() or 0
    )

    revenue_rows = (
        db.query(
            ShopOrder.data,
            func.sum(ShopOrder.importo).label("totale"),
        )
        .filter(ShopOrder.club_id == cid)
        .group_by(ShopOrder.data)
        .all()
    )
    revenue_totale = sum(float(r.totale or 0) for r in revenue_rows)

    six_months_ago = datetime.utcnow().date() - timedelta(days=180)
    monthly_rows = (
        db.query(
            ShopOrder.data,
            func.sum(ShopOrder.importo).label("totale"),
        )
        .filter(
            ShopOrder.club_id == cid,
            ShopOrder.data >= six_months_ago,
        )
        .group_by(ShopOrder.data)
        .order_by(ShopOrder.data)
        .all()
    )

    # Aggrega per mese (YYYY-MM) compatibile con SQLite e PostgreSQL
    mesi: dict = {}
    for row in monthly_rows:
        if row.data:
            key = row.data.strftime("%Y-%m")
            mesi[key] = mesi.get(key, 0.0) + float(row.totale or 0)

    return {
        "fans": {"totale": total_fans},
        "revenue": {"totale": revenue_totale},
        "grafico_mensile": [
            {"mese": k, "totale": v} for k, v in sorted(mesi.items())
        ],
    }
