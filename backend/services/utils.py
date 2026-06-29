from __future__ import annotations


def _norm_email(email: str | None) -> str | None:
    if not email:
        return None
    return email.strip().lower() or None
