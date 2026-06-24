"""
Benchmark standalone per _run_pipeline del Fan Intelligence Engine.
Non tocca il DB — usa dati sintetici in-memory.
Esegui: cd backend && python tests/bench_intelligence.py
"""
import sys
import os
import time
import random
from datetime import date, timedelta

# Aggiungi il backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Imposta JWT_SECRET per evitare RuntimeError all'import di config
os.environ.setdefault("FANIQ_JWT_SECRET", "bench-secret-key")

from services.intelligence.engine import _FanRaw, _run_pipeline


def make_fan_raw(fan_id: int, n_matches: int = 20) -> _FanRaw:
    """Crea un _FanRaw sintetico con dati casuali."""
    rng = random.Random(fan_id)

    # Serie presenza: True con probabilità 0.6
    presence_flags = [rng.random() < 0.6 for _ in range(n_matches)]

    # Stagione corrente
    today = date.today()
    y = today.year if today.month >= 7 else today.year - 1
    current_season = f"{y}/{str(y + 1)[-2:]}"

    # Acquisti: 0-5 date distinte
    n_purchases = rng.randint(0, 5)
    base_date = today - timedelta(days=365)
    purchases = []
    for i in range(n_purchases):
        d = base_date + timedelta(days=rng.randint(0, 360))
        purchases.append({"date": d, "n_tickets": rng.randint(1, 4), "amount": 0.0})

    segments = ["VIP", "Fedele", "Occasionale", "A rischio", "Dormiente", "Nuovo"]
    rfm = segments[fan_id % len(segments)]

    return _FanRaw(
        fan_id=fan_id,
        club_id=1,
        rfm_segment=rfm,
        presence_flags=presence_flags,
        has_active_subscription=rng.random() < 0.5,
        n_subscription_seasons=rng.randint(0, 4),
        purchases=purchases,
    )


def bench(n: int, n_matches: int = 20) -> tuple[float, float]:
    """Esegue _run_pipeline su N fan. Restituisce (totale_s, media_ms)."""
    fans = [make_fan_raw(i, n_matches) for i in range(n)]

    t0 = time.perf_counter()
    for raw in fans:
        _run_pipeline(raw)
    elapsed = time.perf_counter() - t0

    return elapsed, (elapsed / n) * 1000  # totale secondi, media ms


def main():
    sizes = [100, 500, 1000, 2000, 5000]

    print(f"\n{'=' * 70}")
    print("  FanIQ Intelligence Engine — Benchmark _run_pipeline")
    print(f"{'=' * 70}")
    print(f"{'N fan':>8}  {'Totale (s)':>12}  {'Media/fan (ms)':>16}  {'Stima 5000 (s)':>16}")
    print(f"{'-' * 70}")

    for n in sizes:
        total_s, mean_ms = bench(n)
        stima_5k = (mean_ms / 1000) * 5000
        print(f"{n:>8}  {total_s:>12.3f}  {mean_ms:>16.4f}  {stima_5k:>16.3f}")

    print(f"{'=' * 70}")
    print("\nNOTA: tempi sopra = solo CPU (_run_pipeline puro, senza I/O DB).")
    print("Il collo di bottiglia reale è la query joinedload al DB, non la pipeline.\n")


if __name__ == "__main__":
    main()
