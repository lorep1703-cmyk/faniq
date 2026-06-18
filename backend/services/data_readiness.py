"""Valutazione completezza e affidabilità dei dati caricati."""
from sqlalchemy.orm import Session

from models import Abbonamento, Biglietto, Fan, ShopOrder, UploadHistory
from services.analytics import get_all_fans_raw


def compute_data_readiness(db: Session, club_id: int) -> dict:
    fans = get_all_fans_raw(db, club_id)
    n_fans = len(fans)

    if n_fans == 0:
        return {
            "score": 0,
            "checks": [{"label": "Tifosi nel database", "ok": False, "detail": "Nessun dato caricato"}],
            "sources": {"abbonati": 0, "biglietteria": 0, "shop": 0},
            "uploads": 0,
        }

    with_email = sum(1 for f in fans if f.email and f.email.strip())
    with_citta = sum(1 for f in fans if f.citta and f.citta.strip())
    n_abbonamenti = db.query(Abbonamento).filter(Abbonamento.club_id == club_id).count()
    n_biglietti = db.query(Biglietto).filter(Biglietto.club_id == club_id).count()
    n_shop = db.query(ShopOrder).filter(ShopOrder.club_id == club_id).count()
    n_uploads = db.query(UploadHistory).filter(UploadHistory.club_id == club_id).count()

    email_pct = with_email / n_fans
    citta_pct = with_citta / n_fans
    has_abbonati = n_abbonamenti > 0
    has_biglietti = n_biglietti > 0
    has_shop = n_shop > 0
    sources_count = sum([has_abbonati, has_biglietti, has_shop])

    checks = [
        {"label": "Tifosi identificati", "ok": n_fans >= 10, "detail": f"{n_fans} profili"},
        {"label": "Email presenti", "ok": email_pct >= 0.5, "detail": f"{round(email_pct * 100)}% con email"},
        {"label": "Città indicate", "ok": citta_pct >= 0.4, "detail": f"{round(citta_pct * 100)}% con città"},
        {"label": "Dati abbonamenti", "ok": has_abbonati, "detail": f"{n_abbonamenti} record" if has_abbonati else "Non caricati"},
        {"label": "Dati biglietteria", "ok": has_biglietti, "detail": f"{n_biglietti} record" if has_biglietti else "Non caricati"},
        {"label": "Dati shop", "ok": has_shop, "detail": f"{n_shop} record" if has_shop else "Non caricati"},
        {"label": "Fonti multiple", "ok": sources_count >= 2, "detail": f"{sources_count}/3 fonti attive"},
    ]

    weights = [15, 20, 10, 15, 15, 15, 10]
    score = min(100, sum(w for c, w in zip(checks, weights) if c["ok"]))

    return {
        "score": score,
        "checks": checks,
        "sources": {"abbonati": n_abbonamenti, "biglietteria": n_biglietti, "shop": n_shop},
        "uploads": n_uploads,
    }
