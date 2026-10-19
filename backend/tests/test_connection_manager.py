"""Tests for ConnectionManager multi-connection fan-out (Notificaciones 2.0)."""

import pytest

from src.services.connection_manager import ConnectionManager


class FakeWS:
    def __init__(self, fail=False):
        self.accepted = False
        self.sent = []
        self.fail = fail

    async def accept(self):
        self.accepted = True

    async def send_json(self, message):
        if self.fail:
            raise RuntimeError("dead socket")
        self.sent.append(message)


@pytest.mark.asyncio
async def test_connect_accepts_and_registers():
    m = ConnectionManager()
    ws = FakeWS()
    await m.connect("u1", ws)
    assert ws.accepted
    assert "u1" in m.active_connections


@pytest.mark.asyncio
async def test_send_fans_out_to_all_sockets_of_user():
    m = ConnectionManager()
    ws1, ws2 = FakeWS(), FakeWS()
    await m.connect("u1", ws1)
    await m.connect("u1", ws2)
    await m.send_personal_message("u1", {"action": "x"})
    assert ws1.sent == [{"action": "x"}]
    assert ws2.sent == [{"action": "x"}]


@pytest.mark.asyncio
async def test_dead_socket_is_pruned_and_others_still_receive():
    m = ConnectionManager()
    ws1, dead = FakeWS(), FakeWS(fail=True)
    await m.connect("u1", ws1)
    await m.connect("u1", dead)
    await m.send_personal_message("u1", {"action": "x"})
    assert ws1.sent == [{"action": "x"}]
    assert len(m.active_connections["u1"]) == 1


@pytest.mark.asyncio
async def test_disconnect_one_socket_keeps_the_other():
    m = ConnectionManager()
    ws1, ws2 = FakeWS(), FakeWS()
    await m.connect("u1", ws1)
    await m.connect("u1", ws2)
    m.disconnect("u1", ws2)
    assert m.active_connections["u1"] == [ws1]
    m.disconnect("u1", ws1)
    assert "u1" not in m.active_connections


@pytest.mark.asyncio
async def test_disconnect_without_websocket_removes_all():
    m = ConnectionManager()
    await m.connect("u1", FakeWS())
    await m.connect("u1", FakeWS())
    m.disconnect("u1")
    assert "u1" not in m.active_connections


@pytest.mark.asyncio
async def test_send_to_unknown_user_is_noop():
    m = ConnectionManager()
    await m.send_personal_message("nobody", {"action": "x"})  # no raise
