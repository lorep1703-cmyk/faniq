"""Test del Fan Intelligence Engine — usa SOLO dati sintetici."""
from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest

from fan_intelligence import AnomalySeverity, DataQuality, DecayProfile, JourneyStage
from services.intelligence.decay import calculate_decay
from services.intelligence.journey import calculate_journey
from services.intelligence.anomaly import calculate_anomaly
from services.intelligence.ambassador import calculate_ambassador
from services.intelligence.renewal import calculate_renewal
from services.intelligence.engine import _was_dormiente_before_last_match


# ── Helpers ────────────────────────────────────────────────────────────────

def _flags(pattern: str) -> list[bool]:
    """'1' = presente, '0' = assente. Es: '10101010'"""
    return [c == "1" for c in pattern]


def _purchases(n_tickets_list: list[int], months_back: int = 1) -> list[dict]:
    base = date.today() - timedelta(days=months_back * 30)
    return [
        {"date": base - timedelta(days=i * 15), "n_tickets": n, "amount": n * 20.0}
        for i, n in enumerate(n_tickets_list)
    ]


# ── Stadio 1: Decay ────────────────────────────────────────────────────────

def test_decay_lento_mai_assente():
    flags = _flags("1" * 12)
    profile, hl = calculate_decay(flags, "VIP")
    assert profile == DecayProfile.LENTO
    assert hl == 0.0


def test_decay_medio_pause_di_4():
    # Pausa di 4 partite tra ogni presenza
    flags = _flags("1000010000100001")
    profile, hl = calculate_decay(flags, "Fedele")
    assert profile in (DecayProfile.MEDIO, DecayProfile.LENTO)


def test_decay_rapido_pause_brevi():
    flags = _flags("101010101010")
    profile, _ = calculate_decay(flags, "Occasionale")
    assert profile == DecayProfile.RAPIDO


def test_decay_volatile_pattern_irregolare():
    # Pause molto irregolari: 1, 7, 1, 6, 1
    flags = _flags("1011111110110000001")
    profile, _ = calculate_decay(flags, "Occasionale")
    assert profile == DecayProfile.VOLATILE


def test_decay_proxy_rfm_quando_storico_insufficiente():
    flags = _flags("101")   # solo 3 partite
    profile, hl = calculate_decay(flags, "Dormiente")
    assert profile == DecayProfile.VOLATILE
    assert hl is None


# ── Stadio 2: Journey ──────────────────────────────────────────────────────

def test_journey_picco():
    flags = _flags("1" * 8)
    stage, mom = calculate_journey(flags, DecayProfile.LENTO)
    assert stage == JourneyStage.PICCO


def test_journey_dormiente():
    flags = _flags("11110000")
    stage, mom = calculate_journey(flags, DecayProfile.RAPIDO)
    assert stage == JourneyStage.DORMIENTE
    assert mom < 0


def test_journey_recuperato():
    flags = _flags("0000001")
    stage, mom = calculate_journey(flags, DecayProfile.MEDIO, was_dormiente_last_week=True)
    assert stage == JourneyStage.RECUPERATO


def test_journey_rischio_volatile_in_calo():
    flags = _flags("11111000")
    stage, _ = calculate_journey(flags, DecayProfile.VOLATILE)
    assert stage == JourneyStage.RISCHIO


def test_recuperato_raggiungibile_end_to_end():
    """DA-00: was_dormiente_last_week era sempre hardcoded False in engine.py —
    RECUPERATO non era mai raggiungibile in pipeline reale. Verifica che la
    derivazione da presence_flags[:-1] lo sblocchi davvero."""
    flags = _flags("00000000001")  # dormiente da 10 partite, torna solo all'ultima
    was_dormiente = _was_dormiente_before_last_match(flags, DecayProfile.MEDIO)
    assert was_dormiente is True

    stage, _ = calculate_journey(flags, DecayProfile.MEDIO, was_dormiente_last_week=was_dormiente)
    assert stage == JourneyStage.RECUPERATO


def test_was_dormiente_before_last_match_nessun_falso_positivo():
    flags = _flags("1" * 11)  # sempre presente, mai stato dormiente
    assert _was_dormiente_before_last_match(flags, DecayProfile.MEDIO) is False


# ── Stadio 3: Anomaly ──────────────────────────────────────────────────────

def test_anomaly_nessuna_senza_abbonamento():
    flags = _flags("11100000")
    alert = calculate_anomaly(
        flags, has_active_subscription=False, journey_stage=JourneyStage.RISCHIO,
        decay_profile=DecayProfile.MEDIO, n_subscription_seasons=0,
    )
    assert alert is None


def test_anomaly_baseline_critica_5_assenze():
    """Decay MEDIO + zero storico → margine 0, soglie invariate rispetto al default."""
    flags = _flags("111100000")
    alert = calculate_anomaly(
        flags, has_active_subscription=True, journey_stage=JourneyStage.RISCHIO,
        decay_profile=DecayProfile.MEDIO, n_subscription_seasons=0,
    )
    assert alert is not None
    assert alert.severity == AnomalySeverity.CRITICA


def test_anomaly_volatile_novizio_critica_anticipata():
    """Decay VOLATILE + primo anno → margine negativo, CRITICA scatta a 4 assenze invece di 5."""
    flags = _flags("11110000")
    alert = calculate_anomaly(
        flags, has_active_subscription=True, journey_stage=JourneyStage.ABITUDINE,
        decay_profile=DecayProfile.VOLATILE, n_subscription_seasons=1,
    )
    assert alert is not None
    assert alert.severity == AnomalySeverity.CRITICA


def test_anomaly_lento_fedele_margine_esteso():
    """Decay LENTO + storico lungo → margine positivo, 5 assenze restano ALTA, non CRITICA."""
    flags = _flags("111100000")
    alert = calculate_anomaly(
        flags, has_active_subscription=True, journey_stage=JourneyStage.FEDELTA,
        decay_profile=DecayProfile.LENTO, n_subscription_seasons=4,
    )
    assert alert is not None
    assert alert.severity == AnomalySeverity.ALTA


def test_anomaly_nessuna_fan_presente():
    flags = _flags("11111111")
    alert = calculate_anomaly(
        flags, has_active_subscription=True, journey_stage=JourneyStage.PICCO,
        decay_profile=DecayProfile.LENTO, n_subscription_seasons=0,
    )
    assert alert is None


# ── Stadio 4: Ambassador ───────────────────────────────────────────────────

def test_ambassador_compra_sempre_3_biglietti():
    purchases = _purchases([3, 3, 4, 3, 3, 3])
    score = calculate_ambassador(purchases, total_presences=6)
    assert score > 40   # fan multi-biglietto deve superare il singolo acquirente


def test_ambassador_solo_biglietti_singoli():
    purchases = _purchases([1, 1, 1, 1, 1])
    score = calculate_ambassador(purchases, total_presences=5)
    assert score < 30


def test_ambassador_decade_senza_acquisti_recenti():
    # Acquisti vecchi di 8 mesi
    purchases = _purchases([4, 4, 4], months_back=8)
    score = calculate_ambassador(purchases, total_presences=3)
    # Senza acquisti recenti il score deve essere inferiore rispetto a uno con acquisti recenti
    purchases_recenti = _purchases([4, 4, 4], months_back=1)
    score_recente = calculate_ambassador(purchases_recenti, total_presences=3)
    assert score < score_recente


# ── Stadio 5: Renewal ──────────────────────────────────────────────────────

def test_renewal_vip_senza_anomalie():
    flags = _flags("1" * 8)
    prob = calculate_renewal(
        flags, momentum=0.8, decay_profile=DecayProfile.LENTO,
        rfm_segment="VIP", n_subscription_seasons=4,
        anomaly=None, data_quality=DataQuality.FULL
    )
    assert prob is not None
    assert prob > 0.80


def test_renewal_dormiente_basso():
    flags = _flags("0" * 8)
    prob = calculate_renewal(
        flags, momentum=-0.9, decay_profile=DecayProfile.VOLATILE,
        rfm_segment="Dormiente", n_subscription_seasons=0,
        anomaly=None, data_quality=DataQuality.FULL
    )
    assert prob is not None
    assert prob < 0.30


def test_renewal_none_se_insufficient():
    flags = _flags("10")   # solo 2 partite
    prob = calculate_renewal(
        flags, momentum=0.0, decay_profile=DecayProfile.MEDIO,
        rfm_segment="Nuovo", n_subscription_seasons=0,
        anomaly=None, data_quality=DataQuality.INSUFFICIENT
    )
    assert prob is None


def test_renewal_partial_calcolato_con_flag():
    """DataQuality.PARTIAL deve restituire un valore (non None)."""
    flags = _flags("1010101")   # 7 partite → PARTIAL
    prob = calculate_renewal(
        flags, momentum=0.1, decay_profile=DecayProfile.MEDIO,
        rfm_segment="Fedele", n_subscription_seasons=1,
        anomaly=None, data_quality=DataQuality.PARTIAL
    )
    assert prob is not None


# ── Integration: _determine_data_quality (importa direttamente senza DB) ──

def test_data_quality_full():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    # Stubbià le dipendenze DB per il solo import dell'engine
    import unittest.mock as mock
    with mock.patch.dict("sys.modules", {
        "models": mock.MagicMock(),
        "database": mock.MagicMock(),
    }):
        from importlib import import_module
        import importlib
        # Rimuove eventuali versioni cached
        for key in list(sys.modules):
            if "intelligence.engine" in key:
                del sys.modules[key]
        import services.intelligence.engine as eng
        assert eng._determine_data_quality([True] * 10) == DataQuality.FULL


def test_data_quality_partial():
    import sys
    for key in list(sys.modules):
        if "intelligence.engine" in key:
            del sys.modules[key]
    import unittest.mock as mock
    with mock.patch.dict("sys.modules", {
        "models": mock.MagicMock(),
        "database": mock.MagicMock(),
    }):
        import services.intelligence.engine as eng
        assert eng._determine_data_quality([True] * 5) == DataQuality.PARTIAL


def test_data_quality_insufficient():
    import sys
    for key in list(sys.modules):
        if "intelligence.engine" in key:
            del sys.modules[key]
    import unittest.mock as mock
    with mock.patch.dict("sys.modules", {
        "models": mock.MagicMock(),
        "database": mock.MagicMock(),
    }):
        import services.intelligence.engine as eng
        assert eng._determine_data_quality([]) == DataQuality.INSUFFICIENT
