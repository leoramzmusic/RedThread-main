from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx


class TelegramClient:
    """Cliente asíncrono y delgado sobre la Telegram Bot API."""

    def __init__(self, token: str, api_base: str = "https://api.telegram.org") -> None:
        self._token = token
        self._base = api_base.rstrip("/")

    def _url(self, method: str) -> str:
        return f"{self._base}/bot{self._token}/{method}"

    async def send_message(
        self,
        chat_id: int,
        text: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> bool:
        payload: Dict[str, Any] = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
        if client is not None:
            response = await client.post(self._url("sendMessage"), json=payload)
        else:
            async with httpx.AsyncClient() as session:
                response = await session.post(self._url("sendMessage"), json=payload)
        return response.status_code == 200

    async def get_updates(
        self,
        offset: int = 0,
        timeout: int = 30,
        client: Optional[httpx.AsyncClient] = None,
    ) -> List[dict]:
        payload = {"offset": offset, "timeout": timeout}
        if client is not None:
            response = await client.get(self._url("getUpdates"), params=payload)
        else:
            async with httpx.AsyncClient() as session:
                response = await session.get(self._url("getUpdates"), params=payload)
        response.raise_for_status()
        return response.json().get("result", [])