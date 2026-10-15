"""Tests for CAREFormula model constants and pure helpers."""
import pytest
from src.care.formula.service import (
    CANONICAL_BLOCKS,
    CANONICAL_LABELS_ES,
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
