"""
Completeness tests for profile-tip i18n dictionaries.

Guards against the regression where the social_style_test tip only had an
"es" translation, so the profile button ("¿No sabes cuál eres?") showed
Spanish in every other locale via the es fallback in admin_profile_tips.
"""

import importlib.util
from pathlib import Path

from src.api.options import SUPPORTED_LANGS

I18N_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "profile_tips_i18n.py"
)

spec = importlib.util.spec_from_file_location("profile_tips_i18n", I18N_PATH)
i18n = importlib.util.module_from_spec(spec)
spec.loader.exec_module(i18n)


def test_social_style_test_covers_all_21_languages():
    assert set(i18n.SOCIAL_STYLE_TEST_I18N) == set(SUPPORTED_LANGS)
    assert len(i18n.SOCIAL_STYLE_TEST_I18N) == 21


def test_social_style_test_has_non_empty_text_fields():
    for lang, translation in i18n.SOCIAL_STYLE_TEST_I18N.items():
        for field in ("title", "description", "trigger_button_text"):
            value = translation.get(field)
            assert value and value.strip(), f"social_style_test/{lang}/{field} empty"


def test_social_style_test_button_is_localized_not_es_only():
    buttons = {
        lang: tr["trigger_button_text"]
        for lang, tr in i18n.SOCIAL_STYLE_TEST_I18N.items()
    }
    assert buttons["es"] == "¿No sabes cuál eres?"
    # Every non-es locale must differ from the Spanish fallback.
    for lang, text in buttons.items():
        if lang != "es":
            assert text != buttons["es"], f"{lang} still uses the ES button text"


def test_photos_visual_titles_cover_all_21_languages():
    assert set(i18n.PHOTOS_VISUAL_TITLES) == set(SUPPORTED_LANGS)
