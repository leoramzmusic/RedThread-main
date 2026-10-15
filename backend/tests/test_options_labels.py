"""
Tests for the /options label resolution.

Regression: the `label_<lang>` fields always exist with a "" default, so the
old `getattr(opt, label_field, opt.label)` never fell back and returned "" for
languages without a seeded translation, rendering blank options in the combo
(e.g. sexual_orientation only had es/en/pt/fr seeded).
"""

import pytest
from types import SimpleNamespace

from src.api import options as api_options
from src.services.options import routes as service_options


OPTION_MODULES = [api_options, service_options]


@pytest.mark.parametrize("mod", OPTION_MODULES)
def test_get_label_field_supported_lang(mod):
    assert mod.get_label_field("de") == "label_de"


@pytest.mark.parametrize("mod", OPTION_MODULES)
def test_get_label_field_unsupported_lang_falls_back_to_es(mod):
    assert mod.get_label_field("xx") == "label_es"


@pytest.mark.parametrize("mod", OPTION_MODULES)
def test_resolve_label_returns_translation_when_present(mod):
    opt = SimpleNamespace(
        value="heterosexual",
        label="Heterosexual",
        label_en="Heterosexual",
        label_es="Heterosexual",
        label_de="Heterosexuell",
    )
    assert mod.resolve_label(opt, "label_de") == "Heterosexuell"


@pytest.mark.parametrize("mod", OPTION_MODULES)
def test_resolve_label_falls_back_when_translation_is_empty(mod):
    opt = SimpleNamespace(
        value="heterosexual",
        label="Heterosexual",
        label_en="Heterosexual",
        label_es="Heterosexual",
        label_de="",
    )
    assert mod.resolve_label(opt, "label_de") == "Heterosexual"


@pytest.mark.parametrize("mod", OPTION_MODULES)
def test_resolve_label_falls_back_to_english_then_value(mod):
    opt = SimpleNamespace(
        value="heterosexual",
        label="",
        label_en="Heterosexual",
        label_de="",
    )
    assert mod.resolve_label(opt, "label_de") == "Heterosexual"

    bare = SimpleNamespace(value="heterosexual", label="", label_en="", label_de="")
    assert mod.resolve_label(bare, "label_de") == "heterosexual"
