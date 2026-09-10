from __future__ import annotations

from typing import List, Optional

import httpx

from src.automation.config.settings import AutomationSettings, automation_settings
from src.automation.constants import (
    HELP_TEXT,
    LABEL_COPILOT,
    LABEL_DONE,
    LABEL_IDEA,
    LABEL_IN_PROGRESS,
    LABEL_TASK,
)
from src.automation.github.client import GitHubClient
from src.automation.models.task import TaskItem
from src.automation.telegram.client import TelegramClient

ALL_LABELS = [LABEL_IDEA, LABEL_TASK, LABEL_IN_PROGRESS, LABEL_DONE, LABEL_COPILOT]


class Orchestrator:
    """Coordina los comandos de Telegram con la GitHub API."""

    def __init__(
        self,
        github: GitHubClient,
        telegram: TelegramClient,
        settings: AutomationSettings = automation_settings,
    ) -> None:
        self.github = github
        self.telegram = telegram
        self.settings = settings

    def is_authorized(self, user_id: Optional[int]) -> bool:
        allowed = self.settings.allowed_user_ids
        return not allowed or user_id in allowed

    async def handle_update(self, update: dict) -> str:
        """Procesa un update de Telegram y devuelve el texto de respuesta."""
        message = update.get("message") or {}
        text = (message.get("text") or "").strip()
        chat_id = (message.get("chat") or {}).get("id")
        user_id = (message.get("from") or {}).get("id") if message.get("from") else None
        if not text or chat_id is None:
            return ""
        if not self.is_authorized(user_id):
            return "⛔ Acceso denegado. Tu usuario no está en la whitelist."
        parts = text.split(maxsplit=1)
        command = parts[0].lower().split("@")[0]
        argument = (parts[1].strip() if len(parts) > 1 else "").strip("\"'")
        try:
            return await self._route(command, argument)
        except httpx.HTTPStatusError as exc:
            return f"⚠️ La API de GitHub respondió {exc.response.status_code}."
        except Exception as exc:  # noqa: BLE001
            return f"❌ Error inesperado: {exc}"

    async def _route(self, command: str, argument: str) -> str:
        if command == "/help":
            return HELP_TEXT
        if command == "/idea":
            return await self._create_item("Idea", LABEL_IDEA, "💡", argument)
        if command == "/task":
            return await self._create_item("Task", LABEL_TASK, "🛠", argument)
        if command == "/status":
            return await self._status()
        if command == "/list":
            return await self._list(argument)
        if command == "/done":
            return await self._done(argument)
        return HELP_TEXT

    async def _create_item(self, kind: str, label: str, emoji: str, description: str) -> str:
        if not description:
            return f"Uso: /{label} \"descripción\". Ejemplo: /{label} \"{kind}: mejorar el radar\""
        await self.github.ensure_labels(ALL_LABELS)
        issue = await self.github.create_issue(title=f"{kind}: {description}", body="", labels=[label])
        url = issue.get("html_url", "#")
        return f"{emoji} {kind} #{issue['number']} creada: {description}\n{url}"

    async def _status(self) -> str:
        issues = await self.github.list_issues(state="all")
        ideas = tasks = done = progress = 0
        for raw in issues:
            item = TaskItem.from_issue(raw)
            if LABEL_DONE in item.labels or item.state == "closed":
                done += 1
            elif LABEL_IN_PROGRESS in item.labels:
                progress += 1
            elif LABEL_TASK in item.labels:
                tasks += 1
            elif LABEL_IDEA in item.labels:
                ideas += 1
        return (
            "📊 *Pipeline de RedThread*\n"
            f"💡 Ideas: {ideas}\n"
            f"🛠 Tareas: {tasks}\n"
            f"⚙️ En progreso: {progress}\n"
            f"✅ Completadas: {done}"
        )

    async def _list(self, argument: str) -> str:
        label_map = {
            "ideas": LABEL_IDEA,
            "idea": LABEL_IDEA,
            "tasks": LABEL_TASK,
            "task": LABEL_TASK,
            "progreso": LABEL_IN_PROGRESS,
            "in-progress": LABEL_IN_PROGRESS,
        }
        labels = [label_map[argument]] if argument in label_map else None
        issues = await self.github.list_issues(state="open", labels=labels)
        if not issues:
            return "📋 No hay pendientes abiertos."
        lines = ["📋 *Pendientes abiertos*:"]
        for raw in issues:
            item = TaskItem.from_issue(raw)
            tag = ", ".join(item.labels) or "sin-etiqueta"
            lines.append(f"#{item.number} {item.title}  [{tag}]")
        return "\n".join(lines)

    async def _done(self, argument: str) -> str:
        if not argument.isdigit():
            return "Uso: /done <número de issue>\nEjemplo: /done 12"
        number = int(argument)
        await self.github.close_issue(
            number, comment="✅ Marcado como completado desde Telegram."
        )
        await self.github.add_labels(number, [LABEL_DONE])
        return f"✅ Issue #{number} marcado como completado."

    async def notify_copilot_pr(
        self,
        issue_number: str,
        title: str,
        pr_number: int,
        pr_url: str,
    ) -> None:
        text = (
            f"🤖 Copilot generó *PR #{pr_number}* para el issue #{issue_number}:\n"
            f"{title}\n{pr_url}\n"
            "Revísalo y aplica cambios con: python scripts/pull_copilot_pr.py "
            f"{pr_number}"
        )
        for chat_id in self.settings.notify_chats:
            await self.telegram.send_message(chat_id, text)