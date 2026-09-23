from services.utils import _norm_stagione


def test_norm_stagione_expands_short_year():
    assert _norm_stagione("2024/25") == "2024/2025"
    assert _norm_stagione("2022/23") == "2022/2023"


def test_norm_stagione_leaves_canonical_form_unchanged():
    assert _norm_stagione("2024/2025") == "2024/2025"


def test_norm_stagione_handles_none_and_empty():
    assert _norm_stagione(None) is None
    assert _norm_stagione("") == ""


def test_norm_stagione_strips_whitespace():
    assert _norm_stagione(" 2024/25 ") == "2024/2025"


def test_norm_stagione_leaves_unrecognized_format_unchanged():
    assert _norm_stagione("stagione-x") == "stagione-x"
