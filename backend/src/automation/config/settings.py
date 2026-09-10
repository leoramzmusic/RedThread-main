from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class AutomationSettings(BaseSettings):
    """Configuración del pipeline de automatización (Telegram + GitHub)."""

    TELEGRAM_BOT_TOKEN: str = ""
    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = ""
    ALLOWED_TELEGRAM_USERS: str = ""
    NOTIFY_CHAT_IDS: str = ""
    AUTOMATION_WEBHOOK_SECRET: str = ""
    TELEGRAM_API_BASE: str = "https://api.telegram.org"
    GITHUB_API_BASE: str = "https://api.github.com"

    model_config = SettingsConfigDict(
        env_file="config/local.env",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def allowed_user_ids(self) -> List[int]:
        return self._parse_ids(self.ALLOWED_TELEGRAM_USERS)

    @property
    def notify_chats(self) -> List[int]:
        return self._parse_ids(self.NOTIFY_CHAT_IDS)

    @staticmethod
    def _parse_ids(raw: str) -> List[int]:
        return [int(part) for part in raw.split(",") if part.strip().lstrip('-').isdigit()]


automation_settings = AutomationSettings()