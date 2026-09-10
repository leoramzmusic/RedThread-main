import json

import httpx
import pytest

from src.automation.telegram.client import TelegramClient


@pytest.mark.asyncio
async def test_send_message_returns_true_on_ok():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/sendMessage")
        body = json.loads(request.content)
        assert body["chat_id"] == 123
        assert body["text"] == "hola"
        return httpx.Response(200, json={"ok": True})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        telegram = TelegramClient(token="test-token")
        ok = await telegram.send_message(123, "hola", client=client)

    assert ok is True


@pytest.mark.asyncio
async def test_get_updates_returns_result_list():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/getUpdates")
        assert request.url.params["offset"] == "5"
        return httpx.Response(200, json={"ok": True, "result": [{"update_id": 6, "message": {}}]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        telegram = TelegramClient(token="test-token")
        updates = await telegram.get_updates(offset=5, client=client)

    assert updates == [{"update_id": 6, "message": {}}]