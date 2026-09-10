import pytest

from src.automation.bridge.orchestrator import Orchestrator
from src.automation.config.settings import AutomationSettings
from src.automation.github.client import GitHubClient
from src.automation.telegram.client import TelegramClient


def make_orchestrator(**settings_kwargs) -> Orchestrator:
    settings = AutomationSettings(**settings_kwargs)
    github = GitHubClient(token="t", repo="acme/redthread")
    telegram = TelegramClient(token="t")
    return Orchestrator(github, telegram, settings)


def update_from(text: str, user_id: int = 1, chat_id: int = -100) -> dict:
    return {
        "message": {
            "text": text,
            "from": {"id": user_id},
            "chat": {"id": chat_id},
        }
    }


@pytest.mark.asyncio
async def test_help_reply_without_network():
    orch = make_orchestrator()
    reply = await orch.handle_update(update_from("/help"))
    assert "/idea" in reply
    assert "/task" in reply


@pytest.mark.asyncio
async def test_unauthorized_user_denied(monkeypatch):
    orch = make_orchestrator(ALLOWED_TELEGRAM_USERS="999")
    reply = await orch.handle_update(update_from("/help", user_id=123))
    assert "denegado" in reply.lower()


@pytest.mark.asyncio
async def test_idea_requires_description():
    orch = make_orchestrator()
    reply = await orch.handle_update(update_from("/idea"))
    assert "Uso:" in reply


@pytest.mark.asyncio
async def test_done_requires_number():
    orch = make_orchestrator()
    reply = await orch.handle_update(update_from("/done"))
    assert "Uso:" in reply


@pytest.mark.asyncio
async def test_idea_creates_issue(monkeypatch):
    orch = make_orchestrator()
    created = {"number": 12, "html_url": "https://github.com/acme/redthread/issues/12"}

    async def fake_create_issue(title, body, labels, client=None):
        assert title == "Idea: modo oscuro"
        assert labels == ["idea"]
        return created

    async def fake_ensure_labels(names, client=None):
        return {name: True for name in names}

    monkeypatch.setattr(orch.github, "create_issue", fake_create_issue)
    monkeypatch.setattr(orch.github, "ensure_labels", fake_ensure_labels)

    reply = await orch.handle_update(update_from('/idea "modo oscuro"'))

    assert "Idea #12" in reply
    assert "issues/12" in reply


@pytest.mark.asyncio
async def test_status_counts(monkeypatch):
    orch = make_orchestrator()
    issues = [
        {"number": 1, "state": "open", "labels": [{"name": "idea"}]},
        {"number": 2, "state": "open", "labels": [{"name": "task"}]},
        {"number": 3, "state": "open", "labels": [{"name": "in-progress"}]},
        {"number": 4, "state": "closed", "labels": [{"name": "done"}]},
    ]

    async def fake_list_issues(state="open", labels=None, client=None):
        return issues

    monkeypatch.setattr(orch.github, "list_issues", fake_list_issues)

    reply = await orch.handle_update(update_from("/status"))

    assert "Ideas: 1" in reply
    assert "Tareas: 1" in reply
    assert "En progreso: 1" in reply
    assert "Completadas: 1" in reply


@pytest.mark.asyncio
async def test_done_closes_and_labels(monkeypatch):
    orch = make_orchestrator()
    closed = {"number": 7, "state": "closed"}

    async def fake_close_issue(number, comment=None, client=None):
        assert number == 7
        return closed

    async def fake_add_labels(number, names, client=None):
        assert names == ["done"]
        return [{"name": "done"}]

    monkeypatch.setattr(orch.github, "close_issue", fake_close_issue)
    monkeypatch.setattr(orch.github, "add_labels", fake_add_labels)

    reply = await orch.handle_update(update_from("/done 7"))

    assert "#7" in reply
