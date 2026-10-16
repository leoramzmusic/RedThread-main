"""
Persistent sessions (Remember Me + long refresh tokens).

Covers the per-portal policy (user: 30/90 days, admin: 7/30 days), sliding
session renewal on refresh, and admin login remember_me support.
Pure unit tests — no database required.
"""
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import Response
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.requests import Request

from src.core.config import settings
from src.core.utils.security import (
    create_refresh_token,
    decode_token,
    hash_token,
)
from src.models.session import Session

CHROME_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


@pytest_asyncio.fixture(autouse=True)
async def _init_session_model():
    """Register Session with beanie so class-level field access works
    (the app does this in init_db at startup; tests have no DB)."""
    client = AsyncIOMotorClient(
        "mongodb://localhost:27017", serverSelectionTimeoutMS=100
    )
    await init_beanie(
        database=client["redthread_tests"], document_models=[Session]
    )
    yield
    client.close()


# ---- Helpers ----


def make_request(cookies=None, user_agent=CHROME_UA):
    """Build a minimal Starlette Request for calling endpoints directly."""
    headers = [(b"user-agent", user_agent.encode())]
    if cookies:
        cookie_header = "; ".join(f"{k}={v}" for k, v in cookies.items())
        headers.append((b"cookie", cookie_header.encode()))
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": headers,
        "client": ("1.2.3.4", 1234),
        "query_string": b"",
        "scheme": "http",
        "server": ("testserver", 80),
        "http_version": "1.1",
    }
    return Request(scope)


def _set_cookie_headers(response: Response):
    return [v.decode() for k, v in response.raw_headers if k == b"set-cookie"]


def cookie_max_age(response: Response, name: str) -> int:
    for header in _set_cookie_headers(response):
        if header.startswith(f"{name}="):
            for part in header.split(";"):
                part = part.strip()
                if part.lower().startswith("max-age="):
                    return int(part.split("=", 1)[1])
    raise AssertionError(f"cookie {name!r} not found in response")


def cookie_value(response: Response, name: str) -> str:
    for header in _set_cookie_headers(response):
        if header.startswith(f"{name}="):
            return header.split(";", 1)[0].split("=", 1)[1]
    raise AssertionError(f"cookie {name!r} not found in response")


def days_until(exp_ts: float) -> float:
    exp = datetime.utcfromtimestamp(exp_ts)
    return (exp - datetime.utcnow()).total_seconds() / 86400.0


def days_from_now(dt: datetime) -> float:
    return (dt - datetime.utcnow()).total_seconds() / 86400.0


def make_fake_employee():
    return SimpleNamespace(
        id="emp-1",
        email="admin@redthread.com",
        first_name="Ada",
        last_name="Lovelace",
        roles=["admin"],
        avatar=None,
    )


# ---- Policy: blueprint values ----


class TestSessionPolicyBlueprint:
    """The approved blueprint fixes these numbers."""

    def test_user_portal_expirations(self):
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB == 30
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER == 90

    def test_admin_portal_expirations(self):
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS_ADMIN == 7
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS_ADMIN_REMEMBER == 30

    def test_mobile_unchanged(self):
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS_MOBILE == 90

    def test_access_tokens_unchanged(self):
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES_MOBILE == 60


# ---- Portal-aware day resolution ----


class TestRefreshTokenExpireDays:
    def test_user_web_default(self):
        from src.core.utils.security import refresh_token_expire_days
        assert refresh_token_expire_days("web", False) == 30

    def test_user_web_remember(self):
        from src.core.utils.security import refresh_token_expire_days
        assert refresh_token_expire_days("web", True) == 90

    def test_user_mobile_ignores_remember(self):
        from src.core.utils.security import refresh_token_expire_days
        assert refresh_token_expire_days("mobile", False) == 90
        assert refresh_token_expire_days("mobile", True) == 90

    def test_admin_default(self):
        from src.core.utils.security import refresh_token_expire_days
        assert refresh_token_expire_days("web", False, portal="admin") == 7

    def test_admin_remember(self):
        from src.core.utils.security import refresh_token_expire_days
        assert refresh_token_expire_days("web", True, portal="admin") == 30


# ---- Refresh token JWT claims per portal ----


class TestPortalRefreshTokenClaims:
    def test_user_default_token_lasts_30_days(self):
        data = {"sub": "user-1"}
        token = create_refresh_token(data, device_type="web", remember_me=False)
        payload = decode_token(token)
        assert payload is not None
        assert abs(days_until(payload["exp"]) - 30) < 0.01

    def test_user_remember_token_lasts_90_days(self):
        data = {"sub": "user-1"}
        token = create_refresh_token(data, device_type="web", remember_me=True)
        payload = decode_token(token)
        assert payload is not None
        assert abs(days_until(payload["exp"]) - 90) < 0.01

    def test_admin_token_lasts_7_days(self):
        data = {"sub": "emp-1", "scope": "employee"}
        token = create_refresh_token(
            data, device_type="web", remember_me=False, portal="admin"
        )
        payload = decode_token(token)
        assert payload is not None
        assert abs(days_until(payload["exp"]) - 7) < 0.01

    def test_admin_remember_token_lasts_30_days(self):
        data = {"sub": "emp-1", "scope": "employee"}
        token = create_refresh_token(
            data, device_type="web", remember_me=True, portal="admin"
        )
        payload = decode_token(token)
        assert payload is not None
        assert abs(days_until(payload["exp"]) - 30) < 0.01


# ---- Session expiration per portal ----


class TestSessionExpirationAdminPortal:
    def test_admin_no_remember_is_7_days(self):
        from src.services.security_service import calculate_session_expiration
        result = calculate_session_expiration("web", False, portal="admin")
        assert abs(days_from_now(result) - 7) < 0.01

    def test_admin_remember_is_30_days(self):
        from src.services.security_service import calculate_session_expiration
        result = calculate_session_expiration("web", True, portal="admin")
        assert abs(days_from_now(result) - 30) < 0.01


# ---- Admin login: remember_me end-to-end ----


class TestAdminLoginRememberMe:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "remember_me,expected_days",
        [(False, 7), (True, 30)],
    )
    async def test_login_session_and_cookie_follow_policy(
        self, remember_me, expected_days
    ):
        from src.api.admin.auth import AdminLoginRequest, login

        fake_service = MagicMock()
        fake_service.authenticate_employee = AsyncMock(
            return_value=make_fake_employee()
        )
        fake_service.update_last_login = AsyncMock()

        captured = {}

        async def capture_insert(self):
            captured["session"] = self

        response = Response()
        request = make_request()
        login_request = AdminLoginRequest(
            email="admin@redthread.com", password="secret", remember_me=remember_me
        )

        with patch("src.api.admin.auth.employee_service", fake_service), patch(
            "src.api.admin.auth.enforce_max_sessions", new_callable=AsyncMock
        ), patch.object(Session, "insert", capture_insert):
            await login(login_request, response, request)

        session_doc = captured["session"]
        assert session_doc.remember_me is remember_me
        assert abs(days_from_now(session_doc.expires_at) - expected_days) < 0.01
        assert (
            cookie_max_age(response, "admin_refresh_token")
            == expected_days * 24 * 3600
        )
        assert (
            cookie_max_age(response, "admin_access_token")
            == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )


# ---- Admin refresh: rotation + sliding expiration ----


class TestAdminRefreshSliding:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "remember_me,expected_days",
        [(False, 7), (True, 30)],
    )
    async def test_refresh_rotates_token_and_slides_expiry(
        self, remember_me, expected_days
    ):
        from src.api.admin.auth import refresh_token as admin_refresh

        old_token = create_refresh_token(
            {"sub": "emp-1", "scope": "employee"},
            device_type="web",
            remember_me=remember_me,
            portal="admin",
        )
        fake_session = SimpleNamespace(
            device_type="web",
            remember_me=remember_me,
            refresh_token_hash=hash_token(old_token),
            last_activity_at=datetime.utcnow() - timedelta(days=1),
            expires_at=datetime.utcnow() + timedelta(hours=1),
            save=AsyncMock(),
        )
        response = Response()
        request = make_request(cookies={"admin_refresh_token": old_token})

        with patch.object(
            Session, "find_one", new=AsyncMock(return_value=fake_session)
        ), patch(
            "src.api.admin.auth.Employee.get",
            new=AsyncMock(return_value=make_fake_employee()),
        ):
            await admin_refresh(request, response, None)

        assert fake_session.save.await_count == 1
        assert abs(days_from_now(fake_session.expires_at) - expected_days) < 0.01
        new_token = cookie_value(response, "admin_refresh_token")
        assert new_token != old_token
        assert fake_session.refresh_token_hash == hash_token(new_token)
        assert (
            cookie_max_age(response, "admin_refresh_token")
            == expected_days * 24 * 3600
        )


# ---- User refresh: rotation + sliding expiration ----


class TestUserRefreshSliding:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "remember_me,expected_days",
        [(False, 30), (True, 90)],
    )
    async def test_refresh_slides_session_expiry(self, remember_me, expected_days):
        from src.api.auth import refresh_token as user_refresh

        token = create_refresh_token(
            {"sub": "u-1"}, device_type="web", remember_me=remember_me
        )
        fake_session = SimpleNamespace(
            device_type="web",
            remember_me=remember_me,
            refresh_token_hash=hash_token(token),
            last_activity_at=datetime.utcnow() - timedelta(days=1),
            expires_at=datetime.utcnow() + timedelta(hours=1),
            save=AsyncMock(),
        )
        response = Response()
        request = make_request(cookies={"refresh_token": token})

        with patch.object(
            Session, "find_one", new=AsyncMock(return_value=fake_session)
        ), patch(
            "src.api.auth.User.get",
            new=AsyncMock(return_value=SimpleNamespace(id="u-1")),
        ):
            await user_refresh(request, response, None)

        assert fake_session.save.await_count == 1
        assert abs(days_from_now(fake_session.expires_at) - expected_days) < 0.01
        new_token = cookie_value(response, "refresh_token")
        assert fake_session.refresh_token_hash == hash_token(new_token)
        assert (
            cookie_max_age(response, "refresh_token")
            == expected_days * 24 * 3600
        )
