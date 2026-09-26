from unittest.mock import AsyncMock, Mock

import pytest

from src.api.settings import UpdateSettingsRequest


def _fake_settings_doc(lang="es"):
    doc = Mock()
    doc.id = "settings-doc-id"
    doc.dict.return_value = {"preferred_language": lang, "theme_mode": "dark"}
    doc.update_timestamp = Mock()
    doc.save = AsyncMock()
    return doc


@pytest.mark.asyncio
async def test_get_settings_reports_user_language_over_stale_settings_doc(monkeypatch):
    from src.api import settings as settings_module

    current_user = Mock(preferred_language="fr", id="u1")
    stale_doc = _fake_settings_doc(lang="es")
    monkeypatch.setattr(settings_module.UserSettings, "find_one", AsyncMock(return_value=stale_doc))

    result = await settings_module.get_settings(current_user=current_user)

    assert result["preferred_language"] == "fr"


@pytest.mark.asyncio
async def test_put_settings_writes_language_to_user(monkeypatch):
    from src.api import settings as settings_module

    current_user = Mock(preferred_language="es", id="u1")
    current_user.save = AsyncMock()
    doc = _fake_settings_doc(lang="es")
    monkeypatch.setattr(settings_module.UserSettings, "find_one", AsyncMock(return_value=doc))

    request = UpdateSettingsRequest(preferred_language="fr")
    result = await settings_module.update_settings(request=request, current_user=current_user)

    assert current_user.preferred_language == "fr"
    current_user.save.assert_awaited()
    assert result["preferred_language"] == "fr"


@pytest.mark.asyncio
async def test_get_settings_seeds_created_doc_with_user_language(monkeypatch):
    from src.api import settings as settings_module

    current_user = Mock(preferred_language="de", id="u1")
    created = Mock()
    created.dict.return_value = {"preferred_language": "de", "theme_mode": "dark"}
    created.insert = AsyncMock()
    fake_cls = Mock()
    fake_cls.find_one = AsyncMock(return_value=None)
    fake_cls.return_value = created
    monkeypatch.setattr(settings_module, "UserSettings", fake_cls)

    result = await settings_module.get_settings(current_user=current_user)

    fake_cls.assert_called_once_with(
        user_id="u1", preferred_language="de"
    )
    assert result["preferred_language"] == "de"
