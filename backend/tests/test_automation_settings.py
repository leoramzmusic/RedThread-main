import pytest
from src.automation.config.settings import AutomationSettings


def test_defaults_empty():
    settings = AutomationSettings(_env_file=None)
    assert settings.TELEGRAM_BOT_TOKEN == ""
    assert settings.GITHUB_TOKEN == ""
    assert settings.GITHUB_REPO == ""
    assert settings.allowed_user_ids == []
    assert settings.notify_chats == []


def test_allowed_user_ids_parse(monkeypatch):
    monkeypatch.setenv("ALLOWED_TELEGRAM_USERS", "111,222,,333")
    settings = AutomationSettings()
    assert settings.allowed_user_ids == [111, 222, 333]


def test_notify_chats_parse(monkeypatch):
    monkeypatch.setenv("NOTIFY_CHAT_IDS", "-100123,42")
    settings = AutomationSettings()
    assert settings.notify_chats == [-100123, 42]
