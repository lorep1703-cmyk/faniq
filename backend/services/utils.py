from __future__ import annotations

import re


def _norm_email(email: str | None) -> str | None:
    if not email:
        return None
    return email.strip().lower() or None


_STAGIONE_RE = re.compile(r"^(\d{4})/(\d{2}|\d{4})$")


def _norm_stagione(stagione: str | None) -> str | None:
    """Normalizza 'YYYY/YY' in 'YYYY/YYYY' (es. '2024/25' -> '2024/2025')."""
    if not stagione:
        return stagione
    stagione = stagione.strip()
    match = _STAGIONE_RE.match(stagione)
    if not match:
        return stagione
    start_year = int(match.group(1))
    return f"{start_year}/{start_year + 1}"
