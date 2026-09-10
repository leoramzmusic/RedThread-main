"""Runner de long-polling para el bot de automatización (dev local).

Uso:
    python scripts/automation_poller.py

Requiere las variables configuradas en backend/config/local.env
(TELEGRAM_BOT_TOKEN, GITHUB_TOKEN, GITHUB_REPO, ALLOWED_TELEGRAM_USERS).
"""
import asyncio
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from src.automation.bridge.orchestrator import Orchestrator  # noqa: E402
from src.automation.config.settings import automation_settings  # noqa: E402
from src.automation.github.client import GitHubClient  # noqa: E402
from src.automation.telegram.client import TelegramClient  # noqa: E402

POLL_TIMEOUT = 30

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass


async def main() -> None:
    if not automation_settings.TELEGRAM_BOT_TOKEN:
        print(
            "AVISO: TELEGRAM_BOT_TOKEN vacío. "
            "Configúralo en backend/config/local.env."
        )
    telegram = TelegramClient(
        automation_settings.TELEGRAM_BOT_TOKEN,
        automation_settings.TELEGRAM_API_BASE,
    )
    github = GitHubClient(
        automation_settings.GITHUB_TOKEN,
        automation_settings.GITHUB_REPO,
        automation_settings.GITHUB_API_BASE,
    )
    orchestrator = Orchestrator(github, telegram, automation_settings)

    offset = 0
    print("🤖 Escuchando comandos de Telegram... Ctrl+C para salir.")
    async with httpx.AsyncClient() as client:
        while True:
            try:
                updates = await telegram.get_updates(
                    offset=offset, timeout=POLL_TIMEOUT, client=client
                )
                for update in updates:
                    offset = update["update_id"] + 1
                    reply = await orchestrator.handle_update(update)
                    chat_id = (update.get("message") or {}).get("chat", {}).get("id")
                    if reply and chat_id and automation_settings.TELEGRAM_BOT_TOKEN:
                        await telegram.send_message(chat_id, reply, client=client)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                print(f"[error] {exc}", flush=True)
                await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Detenido.")