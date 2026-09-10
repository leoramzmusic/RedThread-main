from __future__ import annotations

import hashlib
import hmac
import re
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request

from src.automation.bridge.orchestrator import Orchestrator
from src.automation.config.settings import AutomationSettings, automation_settings
from src.automation.constants import LABEL_COPILOT
from src.automation.github.client import GitHubClient
from src.automation.telegram.client import TelegramClient

router = APIRouter()

_ISSUE_NUMBER_RE = re.compile(r"#(\d+)")


def _orchestrator(settings: AutomationSettings = automation_settings) -> Orchestrator:
    telegram = TelegramClient(settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_API_BASE)
    github = GitHubClient(settings.GITHUB_TOKEN, settings.GITHUB_REPO, settings.GITHUB_API_BASE)
    return Orchestrator(github, telegram, settings)


@router.get("/health")
async def automation_health():
    telegram = "configurado" if automation_settings.TELEGRAM_BOT_TOKEN else "pendiente"
    github = "configurado" if automation_settings.GITHUB_TOKEN else "pendiente"
    return {
        "status": "ok",
        "telegram": telegram,
        "github": github,
        "repo": automation_settings.GITHUB_REPO or "no configurado",
    }


@router.get("/telegram/webhook")
async def telegram_webhook_get():
    return {"ok": True}


@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: Optional[str] = Header(default=None),
):
    secret = automation_settings.AUTOMATION_WEBHOOK_SECRET
    if secret and x_telegram_bot_api_secret_token != secret:
        raise HTTPException(status_code=403, detail="Secreto de webhook inválido")
    update = await request.json()
    orchestrator = _orchestrator()
    reply = await orchestrator.handle_update(update)
    chat_id = (update.get("message") or {}).get("chat", {}).get("id")
    if reply and chat_id and automation_settings.TELEGRAM_BOT_TOKEN:
        await orchestrator.telegram.send_message(chat_id, reply)
    return {"ok": True}


@router.post("/github/webhook")
async def github_webhook(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(default=None),
):
    body = await request.body()
    secret = automation_settings.AUTOMATION_WEBHOOK_SECRET
    if secret:
        expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_hub_signature_256 or ""):
            raise HTTPException(status_code=403, detail="Firma de webhook inválida")
    event = request.headers.get("X-GitHub-Event", "")
    payload = await request.json()
    if event == "pull_request" and payload.get("action") == "opened":
        pr = payload.get("pull_request") or {}
        pr_labels = [label.get("name") for label in pr.get("labels", [])]
        if LABEL_COPILOT in pr_labels:
            body_text = pr.get("body") or ""
            match = _ISSUE_NUMBER_RE.search(body_text)
            issue_number = match.group(1) if match else "n/a"
            orchestrator = _orchestrator()
            await orchestrator.notify_copilot_pr(
                issue_number=issue_number,
                title=pr.get("title", ""),
                pr_number=pr.get("number", 0),
                pr_url=pr.get("html_url", ""),
            )
    return {"ok": True}
