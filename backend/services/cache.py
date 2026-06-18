"""Cache in-memory con TTL — chiavi scoped per club_id per isolamento tenant."""
from __future__ import annotations

import threading
import time

from config import ANALYTICS_CACHE_TTL

_lock = threading.Lock()
_store: dict = {}


def get(key: str):
    if ANALYTICS_CACHE_TTL <= 0:
        return None
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del _store[key]
            return None
        return value


def set(key: str, value):
    if ANALYTICS_CACHE_TTL <= 0:
        return
    with _lock:
        _store[key] = (value, time.monotonic() + ANALYTICS_CACHE_TTL)


def invalidate(club_id: int | None = None):
    """Invalida la cache. Se club_id è specificato, cancella solo le chiavi di quel club."""
    with _lock:
        if club_id is None:
            _store.clear()
        else:
            suffix = f"_{club_id}"
            stale = [k for k in _store if k.endswith(suffix)]
            for k in stale:
                del _store[k]
