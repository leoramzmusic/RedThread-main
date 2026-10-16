"""Tests for CAREFormula model constants and pure helpers."""
import pytest
from src.care.formula.service import (
    CANONICAL_BLOCKS,
    CANONICAL_LABELS_ES,
    clamp_score,
    compatibility_label,
    compute_chi,
    normalize_blocks,
    validate_formula_dict,
)


def test_canonical_blocks_sum_exactly_one():
    assert round(sum(CANONICAL_BLOCKS.values()), 10) == 1.0
    assert set(CANONICAL_BLOCKS) == {
        "values", "relationship_goals", "neurodiversity",
        "responsiveness", "music", "love_language", "communication_style",
    }
    assert CANONICAL_BLOCKS["values"] == 0.36
    assert CANONICAL_BLOCKS["neurodiversity"] == 0.15


def test_canonical_labels_cover_all_keys():
    assert set(CANONICAL_LABELS_ES) == set(CANONICAL_BLOCKS)
    assert CANONICAL_LABELS_ES["values"] == "Valores"


def test_validate_ok():
    data = {"blocks": dict(CANONICAL_BLOCKS), "chaos_factor": 5.0,
            "chaos_seed": None, "min_compatibility": 0.0, "match_critical": 0.15}
    assert validate_formula_dict(data) == []


def test_validate_rejects_wrong_keys_and_sum():
    bad = dict(CANONICAL_BLOCKS)
    del bad["music"]
    bad["interests"] = 0.1
    errors = validate_formula_dict({"blocks": bad})
    assert any("music" in e for e in errors)
    assert any("interests" in e or "sobran" in e for e in errors)


def test_validate_rejects_sum_not_one():
    bad = dict(CANONICAL_BLOCKS)
    bad["values"] = 0.50  # suma > 1
    errors = validate_formula_dict({"blocks": bad})
    assert any("100" in e or "1.0" in e for e in errors)


def test_validate_rejects_out_of_range():
    bad = dict(CANONICAL_BLOCKS)
    bad["music"] = 1.5
    errors = validate_formula_dict({"blocks": bad})
    assert any("music" in e for e in errors)


def test_normalize_respects_locks():
    blocks = {"values": 0.30, "relationship_goals": 0.10, "neurodiversity": 0.10,
              "responsiveness": 0.10, "music": 0.10, "love_language": 0.10,
              "communication_style": 0.10}
    out = normalize_blocks(blocks, locked={"values"})
    assert out["values"] == 0.30
    assert round(sum(out.values()), 10) == 1.0
    # los no bloqueados mantienen sus proporciones relativas
    assert out["music"] > 0.10


def test_normalize_raises_if_locked_overflow():
    blocks = dict(CANONICAL_BLOCKS)
    blocks["values"] = 0.95
    with pytest.raises(ValueError):
        normalize_blocks(blocks, locked={"values", "relationship_goals"})


def test_normalize_raises_if_no_free_dimensions():
    blocks = {k: 0.1 for k in CANONICAL_BLOCKS}
    with pytest.raises(ValueError):
        normalize_blocks(blocks, locked=set(CANONICAL_BLOCKS))


def test_label_bands():
    assert compatibility_label(0.9) == "Alto"
    assert compatibility_label(0.70) == "Alto"
    assert compatibility_label(0.55) == "Medio"
    assert compatibility_label(0.50) == "Medio"
    assert compatibility_label(0.40) == "Bajo"
    assert compatibility_label(0.30) == "Bajo"
    assert compatibility_label(0.29) == "Muy bajo"


def test_chi_zero_factor_is_zero_and_skips_rng():
    assert compute_chi(0.0, "abc", "u1", "c1", 1) == 0.0
    assert compute_chi(0.0, None, "u1", "c1", 1) == 0.0


def test_chi_deterministic_with_seed():
    a = compute_chi(10.0, "seed-x", "u1", "c1", 3)
    b = compute_chi(10.0, "seed-x", "u1", "c1", 3)
    assert a == b
    assert -0.10 <= a <= 0.10


def test_chi_varies_per_pair_and_version():
    a = compute_chi(10.0, "seed-x", "u1", "c1", 3)
    b = compute_chi(10.0, "seed-x", "u2", "c2", 3)
    c = compute_chi(10.0, "seed-x", "u1", "c1", 4)
    assert a != b or a != c  # con alta probabilidad; semillas distintas


def test_chi_unseeded_within_bounds():
    for _ in range(50):
        chi = compute_chi(5.0, None, "u", "c", 1)
        assert -0.05 <= chi <= 0.05


def test_clamp_score():
    assert clamp_score(1.2) == (1.0, True)
    assert clamp_score(-0.1) == (0.0, True)
    assert clamp_score(0.5) == (0.5, False)
