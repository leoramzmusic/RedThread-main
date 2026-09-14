"""Tests for the dashboard read-through cache layer (RedisService + _with_cache)."""

from datetime import datetime, timezone

import pytest

from src.services.redis_service import redis_service
from src.api.home import _with_cache


class FakeRedisClient:
    """In-memory stub that mimics the subset of redis.asyncio.Redis used by the cache layer."""

    def __init__(self):
        self.store = {}

    async def get(self, key):
        return self.store.get(key)

    async def setex(self, key, ttl, value):
        self.store[key] = value

    async def delete(self, *keys):
        for key in keys:
            self.store.pop(key, None)


@pytest.fixture
def fake_client(monkeypatch):
    client = FakeRedisClient()
    monkeypatch.setattr(redis_service, "client", client)
    return client


def _key(ns, user_id):
    return f"cache:{ns}:{user_id}"


@pytest.mark.asyncio
async def test_set_get_cached_json_roundtrip(fake_client):
    await redis_service.set_cached_json("cache:stats:u1", {"matches_count": 3}, ttl=30)
    assert await redis_service.get_cached_json("cache:stats:u1") == {"matches_count": 3}


@pytest.mark.asyncio
async def test_get_cached_json_miss_returns_none(fake_client):
    assert await redis_service.get_cached_json("cache:stats:u1") is None


@pytest.mark.asyncio
async def test_set_cached_json_serializes_datetime(fake_client):
    payload = {"matched_at": datetime.now(timezone.utc)}
    await redis_service.set_cached_json(_key("recent", "u1"), payload, ttl=60)
    raw = fake_client.store[_key("recent", "u1")]
    assert isinstance(raw, str)
    stored = await redis_service.get_cached_json(_key("recent", "u1"))
    assert isinstance(stored["matched_at"], str)


@pytest.mark.asyncio
async def test_invalidar_usuario_deletes_exact_keys(fake_client):
    await redis_service.set_cached_json(_key("stats", "u1"), {"a": 1}, ttl=30)
    await redis_service.set_cached_json(_key("recent", "u1"), {"b": 2}, ttl=60)
    await redis_service.set_cached_json(_key("suggest", "u2"), {"c": 3}, ttl=600)

    await redis_service.invalidar_usuario(["stats", "recent"], "u1")

    assert await redis_service.get_cached_json(_key("stats", "u1")) is None
    assert await redis_service.get_cached_json(_key("recent", "u1")) is None
    # Keys from other namespaces/users are untouched
    assert await redis_service.get_cached_json(_key("suggest", "u2")) == {"c": 3}


@pytest.mark.asyncio
async def test_fail_open_when_redis_down():
    assert redis_service.client is None
    assert await redis_service.get_cached_json("cache:stats:u1") is None
    await redis_service.set_cached_json("cache:stats:u1", {"x": 1}, ttl=30)
    await redis_service.invalidar_usuario(["stats", "recent"], "u1")


@pytest.mark.asyncio
async def test_with_cache_reads_through(fake_client):
    call_count = {"n": 0}

    async def _compute():
        call_count["n"] += 1
        return {"matches_count": call_count["n"]}

    first = await _with_cache("cache:stats:u1", ttl=30, compute=_compute)
    second = await _with_cache("cache:stats:u1", ttl=30, compute=_compute)

    assert first == {"matches_count": 1}
    assert second == {"matches_count": 1}
    assert call_count["n"] == 1


@pytest.mark.asyncio
async def test_with_cache_recomputes_after_invalidation(fake_client):
    await redis_service.set_cached_json(_key("stats", "u1"), {"matches_count": 1}, ttl=30)

    async def _compute():
        return {"matches_count": 2}

    result = await _with_cache(f"cache:stats:u1", ttl=30, compute=_compute)
    assert result == {"matches_count": 1}

    await redis_service.invalidar_usuario(["stats"], "u1")
    result = await _with_cache(f"cache:stats:u1", ttl=30, compute=_compute)
    assert result == {"matches_count": 2}


@pytest.mark.asyncio
async def test_with_cache_fail_open_always_computes(monkeypatch):
    monkeypatch.setattr(redis_service, "client", None)
    call_count = {"n": 0}

    async def _compute():
        call_count["n"] += 1
        return {"matches_count": 1}

    await _with_cache("cache:stats:u1", ttl=30, compute=_compute)
    await _with_cache("cache:stats:u1", ttl=30, compute=_compute)
    assert call_count["n"] == 2