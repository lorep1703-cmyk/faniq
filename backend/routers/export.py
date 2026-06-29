import csv
import io
import re

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Club
from tenant import get_current_club
from services.analytics import compute_fan_segments

router = APIRouter(prefix="/export", tags=["export"])

FIELDNAMES = [
    "id", "nome", "cognome", "email", "citta", "genere",
    "total_spend", "rfm_score", "r_score", "f_score", "m_score",
    "segment", "n_sources", "last_activity", "consenso_marketing", "consenso_profilazione",
]

_CONSENT_LABEL = {True: "Sì", False: "No", None: "Non registrato"}


@router.get("/fans")
def export_fans(
    segment: str = None,
    solo_consenzienti: bool = False,
    db: Session = Depends(get_db),
    club: Club = Depends(get_current_club),
):
    fans = compute_fan_segments(db, club.id)

    if segment and segment.lower() not in ("tutti", "all", ""):
        fans = [f for f in fans if f["segment"].lower() == segment.lower()]

    if solo_consenzienti:
        fans = [f for f in fans if f.get("consenso_marketing") is True and f.get("email")]

    rows = []
    for f in fans:
        r = dict(f)
        r["consenso_marketing"] = _CONSENT_LABEL.get(f.get("consenso_marketing"), "Non registrato")
        r["consenso_profilazione"] = _CONSENT_LABEL.get(f.get("consenso_profilazione"), "Non registrato")
        rows.append(r)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=FIELDNAMES, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    suffix = "_consenzienti" if solo_consenzienti else ""
    safe_segment = re.sub(r'[^a-zA-Z0-9_\-]', '_', segment) if segment else 'tutti'
    filename = f"faniq_{safe_segment}{suffix}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
