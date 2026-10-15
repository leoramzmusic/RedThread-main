"""
Completeness tests for the sexual_orientation seed.

Guards against the regression where only es/en/pt/fr were seeded, which made
the orientation combo render blank labels in the other 17 locales.
"""

import importlib.util
from pathlib import Path

import pytest

from src.api.options import SUPPORTED_LANGS

SEED_PATH = Path(__file__).resolve().parents[1] / "seed" / "seed_system_options.py"

spec = importlib.util.spec_from_file_location("seed_system_options", SEED_PATH)
seed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seed)

EXPECTED_VALUES = {
    "heterosexual",
    "homosexual",
    "bisexual",
    "pansexual",
    "asexual",
    "queer",
    "demisexual",
    "sapioerotico",
    "prefer_not_to_say",
}


def test_langs_match_api_supported_langs():
    assert seed.LANGS == SUPPORTED_LANGS
    assert len(seed.LANGS) == 21
    assert len(set(seed.LANGS)) == 21


def test_values_cover_the_catalog():
    assert {value for value, _, _ in seed.ROWS} == EXPECTED_VALUES


def test_every_value_has_a_label_for_every_language():
    for value, _, labels in seed.ROWS:
        assert len(labels) == len(seed.LANGS), f"{value} has {len(labels)} labels"


def test_no_label_is_empty():
    for value, _, labels in seed.ROWS:
        for lang, label in zip(seed.LANGS, labels):
            assert label and label.strip(), f"{value}/{lang} label is empty"


def test_build_kwargs_populates_all_label_fields():
    value, order, labels = seed.ROWS[0]
    kwargs = seed.build_kwargs(value, order, labels)
    assert kwargs["category"] == "sexual_orientation"
    assert kwargs["value"] == value
    assert kwargs["label"] == labels[seed.LANGS.index("es")]
    for lang in seed.LANGS:
        assert kwargs[f"label_{lang}"]


def test_build_kwargs_rejects_wrong_label_count():
    with pytest.raises(ValueError):
        seed.build_kwargs("x", 0, ["only one"])
