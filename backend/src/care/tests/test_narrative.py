# backend/src/care/tests/test_narrative.py
"""Tests for the CARE narrative generator."""
import pytest
from src.care.narrative import generate_narrative

BASE_BREAKDOWN = {
    "values": 0.9, "relationship_goals": 0.8, "neurodiversity": 0.7,
    "responsiveness": 0.6, "music": 0.2, "love_language": 0.5,
    "communication_style": 0.4, "chaos_applied": 0.0, "saturated": False,
}


@pytest.mark.parametrize("tone", ["directo", "poetico", "ludico", "emocional", "curioso"])
def test_all_tones_return_full_shape(tone):
    result = generate_narrative(dict(BASE_BREAKDOWN), tone=tone)
    assert set(result) == {"tone", "text", "label"}
    assert result["tone"] == tone
    assert result["text"].strip()
    assert result["label"] in {"Muy bajo", "Bajo", "Medio", "Alto"}


def test_narrative_mentions_top_and_contrast():
    result = generate_narrative(dict(BASE_BREAKDOWN), tone="directo")
    text = result["text"].lower()
    assert "valores" in text          # top-1
    assert "música" in text           # dimensión más baja (contraste)


def test_narrative_mentions_chaos_when_applied():
    data = dict(BASE_BREAKDOWN, chaos_applied=0.04)
    result = generate_narrative(data, tone="directo")
    assert "caos" in result["text"].lower()


def test_narrative_skips_chaos_phrase_when_zero():
    result = generate_narrative(dict(BASE_BREAKDOWN), tone="directo")
    assert "caos" not in result["text"].lower()


def test_invalid_tone_falls_back_to_directo():
    result = generate_narrative(dict(BASE_BREAKDOWN), tone="inventado")
    assert result["tone"] == "directo"
    assert "inventado" not in result["tone"]


def test_label_comes_from_breakdown_or_score():
    data = dict(BASE_BREAKDOWN, compatibility_label="Alto")
    assert generate_narrative(data)["label"] == "Alto"
