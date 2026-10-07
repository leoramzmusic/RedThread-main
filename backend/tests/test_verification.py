"""Contact verification: OTP for phone/email + public email link.

No DB — Beanie models are subclassed with in-memory fakes and the auth
dependency is overridden. (backend/tests/conftest.py defines no client
fixtures, so they are declared locally here.)

New fields (phone_otp_sent_at, email_otp*, email_token*, profile.email_verified)
do not exist yet, so tests write them through a raw-dict helper that works
both before and after the model change.
"""

import hashlib
import re
from datetime import datetime, timedelta
from types import SimpleNamespace
from typing import ClassVar
from unittest.mock import AsyncMock, MagicMock

import pytest
from beanie.odm.settings.document import DocumentSettings
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

import src.api.auth as auth_mod
import src.api.profiles as pm
from src.api.auth import get_current_user
from src.api.dtos.user_dtos import UserProfileResponseDTO
from src.models.profile import Profile
from src.models.user import User

for _model, _name in ((User, "users"), (Profile, "profiles")):
    if getattr(_model, "_document_settings", None) is None:
        _model._document_settings = DocumentSettings(name=_name)


# ---- Helpers ----------------------------------------------------------------


def _set(obj, name, value):
    """Set an attribute that may not exist on the model yet (pre-GREEN)."""
    try:
        setattr(obj, name, value)
    except (ValueError, AttributeError):
        obj.__dict__[name] = value


class _Q:
    def __init__(self, field, value):
        self.field, self.value = field, value


class _Cmp:
    def __init__(self, name):
        self.name = name

    def __eq__(self, value):
        return _Q(self.name, value)


def _meta(base):
    class _M(type(base)):
        def __getattr__(cls, name):
            fields = cls.__dict__.get("CMP_FIELDS")
            if fields and name in fields:
                return _Cmp(name)
            return super().__getattr__(name)

    return _M


class FakeUser(User, metaclass=_meta(User)):
    CMP_FIELDS: ClassVar[set] = {"email", "phone", "email_token_hash"}
    store: ClassVar[dict] = {}

    @classmethod
    async def find_one(cls, query):
        return next(
            (u for u in cls.store.values() if getattr(u, query.field) == query.value),
            None,
        )

    async def save(self):
        return self


class FakeProfile(Profile, metaclass=_meta(Profile)):
    CMP_FIELDS: ClassVar[set] = {"user_id"}
    store: ClassVar[dict] = {}

    @classmethod
    async def find_one(cls, query):
        return next(
            (p for p in cls.store.values() if getattr(p, query.field) == query.value),
            None,
        )

    async def save(self):
        return self


class FakeProfileModule:
    @classmethod
    async def hidden_keys(cls):
        return []


# ---- Fixtures ---------------------------------------------------------------


@pytest.fixture
def env(monkeypatch):
    FakeUser.store.clear()
    FakeProfile.store.clear()

    monkeypatch.setattr(pm, "User", FakeUser)
    monkeypatch.setattr(pm, "Profile", FakeProfile)
    monkeypatch.setattr(auth_mod, "User", FakeUser)
    monkeypatch.setattr(auth_mod, "Profile", FakeProfile, raising=False)

    monkeypatch.setattr(pm, "ProfileModule", FakeProfileModule)

    async def _no_music():
        return False

    monkeypatch.setattr(pm, "_music_fallback_active", _no_music)
    monkeypatch.setattr(pm, "calculate_profile_completion", lambda *a, **k: 0)
    monkeypatch.setattr(
        pm, "redis_service", SimpleNamespace(invalidar_usuario=AsyncMock())
    )

    sms = MagicMock(return_value=True)
    mail = AsyncMock(return_value=True)
    monkeypatch.setattr(pm, "send_sms", sms, raising=False)
    monkeypatch.setattr(pm, "send_verification_email", mail, raising=False)

    return SimpleNamespace(sms=sms, mail=mail)


@pytest.fixture
def seeded(env):
    user = FakeUser(
        id=ObjectId(),
        display_name="Ana",
        nickname="ana",
        email="ana@example.com",
        phone="+525512345678",
    )
    profile = FakeProfile(
        user_id=str(user.id),
        gender="prefer_not_to_say",
        age=25,
        phone="5512345678",
        country_code="+52",
        phone_verified=False,
    )
    _set(profile, "email_verified", False)
    FakeUser.store[str(user.id)] = user
    FakeProfile.store[str(user.id)] = profile
    return SimpleNamespace(user=user, profile=profile)


def _build_app(user):
    app = FastAPI()
    app.include_router(pm.router, prefix="/profiles")
    app.include_router(auth_mod.router, prefix="/auth")
    app.dependency_overrides[get_current_user] = lambda: user
    return app


@pytest.fixture
def client(env, seeded):
    with TestClient(_build_app(seeded.user)) as c:
        yield c


# ---- Route registration -----------------------------------------------------


def test_verification_routes_registered():
    from src.main import app

    registered = {
        (m, getattr(r, "path", ""))
        for r in app.routes
        for m in (getattr(r, "methods", None) or [])
    }
    expected = {
        ("POST", "/profiles/verify-phone"),
        ("POST", "/profiles/confirm-phone"),
        ("POST", "/profiles/verify-email"),
        ("POST", "/profiles/confirm-email"),
        ("POST", "/profiles/resend-verification"),
        ("POST", "/auth/verify-email-token"),
    }
    missing = expected - registered
    assert not missing, f"routes not registered: {sorted(missing)}"


# ---- Phone: send / OTP ------------------------------------------------------


def test_verify_phone_sends_sms_and_stores_otp(client, env, seeded):
    res = client.post("/profiles/verify-phone")
    assert res.status_code == 200
    env.sms.assert_called_once()
    dest, code = env.sms.call_args.args
    assert dest == "+525512345678"
    assert re.fullmatch(r"\d{6}", code)
    assert getattr(seeded.user, "phone_otp", None) == code
    assert getattr(seeded.user, "phone_otp_attempts", None) == 0
    expires = getattr(seeded.user, "phone_otp_expires_at", None)
    now = datetime.utcnow()
    assert expires is not None
    assert now + timedelta(minutes=9) < expires <= now + timedelta(minutes=11)
    assert getattr(seeded.user, "phone_otp_sent_at", None) is not None


def test_verify_phone_without_saved_phone_is_rejected(client, env, seeded):
    _set(seeded.user, "phone", None)
    res = client.post("/profiles/verify-phone")
    assert res.status_code == 400
    env.sms.assert_not_called()


def test_verify_phone_resend_within_cooldown_is_rate_limited(client, env, seeded):
    _set(seeded.user, "phone_otp_sent_at", datetime.utcnow())
    res = client.post("/profiles/verify-phone")
    assert res.status_code == 429
    env.sms.assert_not_called()


def test_verify_phone_resend_after_cooldown_sends_new_code(client, env, seeded):
    _set(seeded.user, "phone_otp_sent_at", datetime.utcnow() - timedelta(seconds=61))
    res = client.post("/profiles/verify-phone")
    assert res.status_code == 200
    env.sms.assert_called_once()


def test_confirm_phone_with_wrong_code_increments_attempts(client, seeded):
    _set(seeded.user, "phone_otp", "111111")
    _set(seeded.user, "phone_otp_attempts", 0)
    _set(seeded.user, "phone_otp_expires_at", datetime.utcnow() + timedelta(minutes=10))
    res = client.post("/profiles/confirm-phone", json={"code": "222222"})
    assert res.status_code == 400
    assert getattr(seeded.user, "phone_otp_attempts", None) == 1
    assert seeded.profile.phone_verified is False


def test_confirm_phone_locks_after_five_failed_attempts(client, seeded):
    _set(seeded.user, "phone_otp", "111111")
    _set(seeded.user, "phone_otp_attempts", 5)
    _set(seeded.user, "phone_otp_expires_at", datetime.utcnow() + timedelta(minutes=10))
    res = client.post("/profiles/confirm-phone", json={"code": "111111"})
    assert res.status_code == 429
    assert seeded.profile.phone_verified is False


def test_confirm_phone_with_expired_code_is_rejected(client, seeded):
    _set(seeded.user, "phone_otp", "111111")
    _set(seeded.user, "phone_otp_expires_at", datetime.utcnow() - timedelta(seconds=1))
    res = client.post("/profiles/confirm-phone", json={"code": "111111"})
    assert res.status_code == 400
    assert seeded.profile.phone_verified is False


def test_confirm_phone_success_marks_profile_verified_and_clears_otp(client, seeded):
    _set(seeded.user, "phone_otp", "111111")
    _set(seeded.user, "phone_otp_attempts", 2)
    _set(seeded.user, "phone_otp_expires_at", datetime.utcnow() + timedelta(minutes=10))
    res = client.post("/profiles/confirm-phone", json={"code": "111111"})
    assert res.status_code == 200
    assert seeded.profile.phone_verified is True
    assert getattr(seeded.user, "phone_otp", None) is None
    assert getattr(seeded.user, "phone_otp_attempts", None) == 0


# ---- Email: send / OTP ------------------------------------------------------


def test_verify_email_sends_code_and_link_to_saved_email(client, env, seeded):
    res = client.post("/profiles/verify-email")
    assert res.status_code == 200
    env.mail.assert_called_once()
    to, code, token = env.mail.call_args.args
    assert to == "ana@example.com"
    assert re.fullmatch(r"\d{6}", code)
    assert isinstance(token, str) and len(token) >= 20
    assert getattr(seeded.user, "email_otp", None) == code
    assert getattr(seeded.user, "email_otp_attempts", None) == 0
    expires = getattr(seeded.user, "email_otp_expires_at", None)
    now = datetime.utcnow()
    assert expires is not None
    assert now + timedelta(minutes=9) < expires <= now + timedelta(minutes=11)
    stored = getattr(seeded.user, "email_token_hash", None)
    assert stored == hashlib.sha256(token.encode()).hexdigest()


def test_verify_email_without_saved_email_is_rejected(client, env, seeded):
    _set(seeded.user, "email", None)
    res = client.post("/profiles/verify-email")
    assert res.status_code == 400
    env.mail.assert_not_called()


def test_confirm_email_success_sets_email_verified_and_clears_otp(client, seeded):
    _set(seeded.user, "email_otp", "111111")
    _set(seeded.user, "email_otp_attempts", 0)
    _set(seeded.user, "email_otp_expires_at", datetime.utcnow() + timedelta(minutes=10))
    res = client.post("/profiles/confirm-email", json={"code": "111111"})
    assert res.status_code == 200
    assert seeded.profile.email_verified is True
    assert getattr(seeded.user, "email_otp", None) is None


def test_confirm_email_wrong_code_increments_attempts(client, seeded):
    _set(seeded.user, "email_otp", "111111")
    _set(seeded.user, "email_otp_attempts", 0)
    _set(seeded.user, "email_otp_expires_at", datetime.utcnow() + timedelta(minutes=10))
    res = client.post("/profiles/confirm-email", json={"code": "999999"})
    assert res.status_code == 400
    assert getattr(seeded.user, "email_otp_attempts", None) == 1
    assert seeded.profile.email_verified is False


# ---- Resend dispatcher ------------------------------------------------------


def test_resend_verification_phone_channel_resends_via_sms(client, env, seeded):
    res = client.post("/profiles/resend-verification", json={"channel": "phone"})
    assert res.status_code == 200
    env.sms.assert_called_once()
    env.mail.assert_not_called()


def test_resend_verification_email_channel_resends_via_email(client, env, seeded):
    res = client.post("/profiles/resend-verification", json={"channel": "email"})
    assert res.status_code == 200
    env.mail.assert_called_once()
    env.sms.assert_not_called()


def test_resend_verification_rejects_unknown_channel(client):
    res = client.post("/profiles/resend-verification", json={"channel": "carrier-pigeon"})
    assert res.status_code == 422


# ---- Public email link ------------------------------------------------------


def test_verify_email_token_marks_email_verified(client, seeded):
    token = "tok-abc-123-xyz"
    _set(seeded.user, "email_token_hash", hashlib.sha256(token.encode()).hexdigest())
    _set(seeded.user, "email_token_expires_at", datetime.utcnow() + timedelta(hours=24))
    res = client.post("/auth/verify-email-token", json={"token": token})
    assert res.status_code == 200
    assert seeded.profile.email_verified is True


def test_verify_email_token_rejects_expired_token(client, seeded):
    token = "tok-abc-123-xyz"
    _set(seeded.user, "email_token_hash", hashlib.sha256(token.encode()).hexdigest())
    _set(seeded.user, "email_token_expires_at", datetime.utcnow() - timedelta(seconds=1))
    res = client.post("/auth/verify-email-token", json={"token": token})
    assert res.status_code == 400
    assert seeded.profile.email_verified is False


def test_verify_email_token_rejects_unknown_token(client, seeded):
    res = client.post("/auth/verify-email-token", json={"token": "never-issued"})
    assert res.status_code == 400
    assert seeded.profile.email_verified is False


# ---- Verified flags reset when the value changes ----------------------------


def test_changing_phone_resets_phone_verified_flag(client, seeded):
    seeded.profile.phone_verified = True
    res = client.put(
        "/profiles/me", json={"phone": "5599999999", "country_code": "+52"}
    )
    assert res.status_code == 200
    assert seeded.profile.phone_verified is False
    assert seeded.user.phone == "+525599999999"


def test_changing_email_resets_email_verified_flag(client, seeded):
    _set(seeded.profile, "email_verified", True)
    res = client.put("/profiles/me", json={"email": "nueva@example.com"})
    assert res.status_code == 200
    assert seeded.profile.email_verified is False
    assert seeded.user.email == "nueva@example.com"


# ---- DTO mapping ------------------------------------------------------------


def test_dto_email_verified_comes_from_profile():
    user = User(display_name="Ana", nickname="ana-dto", email="a@b.co")
    profile = Profile(user_id="x", gender="prefer_not_to_say", age=25)
    profile.phone_verified = True
    _set(profile, "email_verified", True)
    # user.is_verified stays False: the DTO must not map email_verified from it
    dto = UserProfileResponseDTO.from_user_and_profile(user, profile, mask_data=False)
    assert dto.email_verified is True
    assert dto.phone_verified is True
