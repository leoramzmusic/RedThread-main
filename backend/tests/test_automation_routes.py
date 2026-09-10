import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.automation.config.settings import automation_settings
from src.automation.routes import router


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/automation")
    return TestClient(app)


def test_health(client):
    response = client.get("/automation/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_telegram_webhook_rejects_bad_secret(client, monkeypatch):
    monkeypatch.setattr(automation_settings, "AUTOMATION_WEBHOOK_SECRET", "super-secreto")
    response = client.post(
        "/automation/telegram/webhook",
        json={"message": {"text": "/help", "chat": {"id": 1}, "from": {"id": 1}}},
    )
    assert response.status_code == 403


def test_telegram_webhook_ok_when_disabled(client, monkeypatch):
    monkeypatch.setattr(automation_settings, "AUTOMATION_WEBHOOK_SECRET", "")
    monkeypatch.setattr(automation_settings, "TELEGRAM_BOT_TOKEN", "")
    response = client.post(
        "/automation/telegram/webhook",
        json={"message": {"text": "/help", "chat": {"id": 1}, "from": {"id": 1}}},
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}
