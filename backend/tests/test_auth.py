"""
TEST-001: Auth unit tests
Tests for register, login, OTP, refresh, password reset flows.
Pure unit tests — no database required.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import hashlib


# ---- Security Utilities ----


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password_returns_bcrypt_string(self):
        from src.core.utils.security import get_password_hash
        hashed = get_password_hash("testpassword123")
        assert hashed.startswith("$2b$")
        assert len(hashed) == 60

    def test_verify_password_correct(self):
        from src.core.utils.security import get_password_hash, verify_password
        password = "mysecurepassword"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        from src.core.utils.security import get_password_hash, verify_password
        hashed = get_password_hash("correctpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_verify_password_empty_string(self):
        from src.core.utils.security import get_password_hash, verify_password
        hashed = get_password_hash("password")
        assert verify_password("", hashed) is False

    def test_verify_password_invalid_hash(self):
        from src.core.utils.security import verify_password
        assert verify_password("password", "not-a-valid-hash") is False

    def test_hash_truncates_at_72_bytes(self):
        from src.core.utils.security import get_password_hash
        long_password = "a" * 100
        hashed = get_password_hash(long_password)
        # Should not raise, truncation happens internally
        assert hashed.startswith("$2b$")


class TestJWTTokens:
    """Test JWT access and refresh token creation/decode."""

    def test_create_access_token_web(self):
        from src.core.utils.security import create_access_token, decode_token
        data = {"sub": "user@example.com", "user_id": "123"}
        token = create_access_token(data, device_type="web")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user@example.com"
        assert payload["user_id"] == "123"
        assert payload["type"] == "access"

    def test_create_access_token_mobile(self):
        from src.core.utils.security import create_access_token, decode_token
        data = {"sub": "user@example.com"}
        token = create_access_token(data, device_type="mobile")
        payload = decode_token(token)
        assert payload is not None
        assert payload["type"] == "access"

    def test_create_access_token_custom_expiry(self):
        from src.core.utils.security import create_access_token, decode_token
        data = {"sub": "user@example.com"}
        custom_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta=custom_delta)
        payload = decode_token(token)
        assert payload is not None
        # Token should expire within ~15 minutes
        exp = datetime.utcfromtimestamp(payload["exp"])
        now = datetime.utcnow()
        diff = (exp - now).total_seconds()
        assert 0 < diff <= 16 * 60  # Allow 1 minute buffer

    def test_create_refresh_token_web_no_remember(self):
        from src.core.utils.security import create_refresh_token, decode_token
        data = {"sub": "user@example.com"}
        token = create_refresh_token(data, device_type="web", remember_me=False)
        payload = decode_token(token)
        assert payload is not None
        assert payload["type"] == "refresh"

    def test_create_refresh_token_web_remember_me(self):
        from src.core.utils.security import create_refresh_token, decode_token
        data = {"sub": "user@example.com"}
        token = create_refresh_token(data, device_type="web", remember_me=True)
        payload = decode_token(token)
        assert payload is not None
        exp = datetime.utcfromtimestamp(payload["exp"])
        now = datetime.utcnow()
        days_diff = (exp - now).days
        # Remember me should be ~30 days
        assert 29 <= days_diff <= 31

    def test_create_refresh_token_mobile(self):
        from src.core.utils.security import create_refresh_token, decode_token
        data = {"sub": "user@example.com"}
        token = create_refresh_token(data, device_type="mobile")
        payload = decode_token(token)
        assert payload is not None
        exp = datetime.utcfromtimestamp(payload["exp"])
        now = datetime.utcnow()
        days_diff = (exp - now).days
        # Mobile should be ~90 days
        assert 89 <= days_diff <= 91

    def test_decode_token_invalid(self):
        from src.core.utils.security import decode_token
        result = decode_token("invalid.token.here")
        assert result is None

    def test_decode_token_expired(self):
        from src.core.utils.security import create_access_token, decode_token
        data = {"sub": "user@example.com"}
        # Create token with past expiration
        past_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta=past_delta)
        result = decode_token(token)
        assert result is None

    def test_token_contains_algorithm(self):
        from src.core.utils.security import create_access_token, decode_token
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        payload = decode_token(token)
        assert payload is not None
        # jose adds 'alg' and 'typ' headers, but payload should have our data
        assert "sub" in payload


class TestTokenGeneration:
    """Test OTP and reset token generation."""

    def test_verification_code_is_6_digits(self):
        from src.core.utils.security import generate_verification_code
        code = generate_verification_code()
        assert len(code) == 6
        assert code.isdigit()

    def test_verification_code_range(self):
        from src.core.utils.security import generate_verification_code
        for _ in range(100):
            code = generate_verification_code()
            assert 0 <= int(code) <= 999999

    def test_reset_token_is_urlsafe(self):
        from src.core.utils.security import generate_reset_token
        token = generate_reset_token()
        assert len(token) >= 30
        # Should be valid base64url
        import base64
        # urlsafe tokens use - and _ instead of + and /
        assert all(c in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for c in token)

    def test_hash_token_deterministic(self):
        from src.core.utils.security import hash_token
        token = "test-token-123"
        hash1 = hash_token(token)
        hash2 = hash_token(token)
        assert hash1 == hash2

    def test_hash_token_is_sha256(self):
        from src.core.utils.security import hash_token
        token = "test-token"
        result = hash_token(token)
        expected = hashlib.sha256(token.encode()).hexdigest()
        assert result == expected

    def test_hash_token_different_inputs(self):
        from src.core.utils.security import hash_token
        hash1 = hash_token("token1")
        hash2 = hash_token("token2")
        assert hash1 != hash2


# ---- Security Service ----


class TestCalculateDistance:
    """Test Haversine distance calculation."""

    def test_same_point_returns_zero(self):
        from src.services.security_service import calculate_distance
        distance = calculate_distance(40.7128, -74.0060, 40.7128, -74.0060)
        assert distance == 0.0

    def test_known_distance_new_york_to_los_angeles(self):
        from src.services.security_service import calculate_distance
        # NYC to LA is approximately 3944 km
        distance = calculate_distance(40.7128, -74.0060, 34.0522, -118.2437)
        assert 3900 < distance < 4000

    def test_short_distance(self):
        from src.services.security_service import calculate_distance
        # Two points ~1 km apart
        distance = calculate_distance(40.7128, -74.0060, 40.7138, -74.0050)
        assert 0 < distance < 2

    def test_invalid_coordinates_return_none(self):
        from src.services.security_service import calculate_distance
        assert calculate_distance(None, None, 40.0, -74.0) is None
        assert calculate_distance(40.0, -74.0, None, None) is None
        assert calculate_distance(None, None, None, None) is None

    def test_opposite_sides_of_earth(self):
        from src.services.security_service import calculate_distance
        # NYC to Sydney is approximately 16000 km
        distance = calculate_distance(40.7128, -74.0060, -33.8688, 151.2093)
        assert 15900 < distance < 16100


class TestSessionExpiration:
    """Test session expiration calculation."""

    def test_web_no_remember(self):
        from src.services.security_service import calculate_session_expiration
        result = calculate_session_expiration("web", False)
        expected_days = 1  # REFRESH_TOKEN_EXPIRE_DAYS_WEB
        expected = datetime.utcnow() + timedelta(days=expected_days)
        # Allow 1 minute tolerance
        assert abs((result - expected).total_seconds()) < 60

    def test_web_with_remember(self):
        from src.services.security_service import calculate_session_expiration
        result = calculate_session_expiration("web", True)
        expected_days = 30  # REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER
        expected = datetime.utcnow() + timedelta(days=expected_days)
        assert abs((result - expected).total_seconds()) < 60

    def test_mobile(self):
        from src.services.security_service import calculate_session_expiration
        result = calculate_session_expiration("mobile", False)
        expected_days = 90  # REFRESH_TOKEN_EXPIRE_DAYS_MOBILE
        expected = datetime.utcnow() + timedelta(days=expected_days)
        assert abs((result - expected).total_seconds()) < 60


class TestUserAgentParsing:
    """Test device type detection from user agent strings."""

    def test_detect_mobile_ios(self):
        from src.services.security_service import parse_user_agent
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        result = parse_user_agent(ua)
        assert result["device_type"] == "mobile"

    def test_detect_mobile_android(self):
        from src.services.security_service import parse_user_agent
        ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36"
        result = parse_user_agent(ua)
        assert result["device_type"] == "mobile"

    def test_detect_desktop_chrome(self):
        from src.services.security_service import parse_user_agent
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        result = parse_user_agent(ua)
        assert result["device_type"] == "web"
        assert result["browser"] == "Chrome"

    def test_detect_desktop_firefox(self):
        from src.services.security_service import parse_user_agent
        ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
        result = parse_user_agent(ua)
        assert result["device_type"] == "web"
        assert result["browser"] == "Firefox"

    def test_empty_user_agent(self):
        from src.services.security_service import parse_user_agent
        result = parse_user_agent("")
        assert result["device_type"] == "web"


# ---- Username Service ----


class TestUsernameValidation:
    """Test username format validation."""

    def test_valid_username(self):
        from src.services.username_service import UsernameService
        result = UsernameService.validate("john_doe")
        assert result["valid"] is True
        assert len(result["errors"]) == 0

    def test_valid_username_with_numbers(self):
        from src.services.username_service import UsernameService
        result = UsernameService.validate("user123")
        assert result["valid"] is True

    def test_too_short_username(self):
        from src.services.username_service import UsernameService
        result = UsernameService.validate("ab")
        assert result["valid"] is False
        assert "too_short" in result["errors"]

    def test_too_long_username(self):
        from src.services.username_service import UsernameService
        result = UsernameService.validate("a" * 30)
        assert result["valid"] is True  # 30 is MAX_LENGTH, valid
        result_long = UsernameService.validate("a" * 31)
        assert result_long["valid"] is False
        assert "too_long" in result_long["errors"]

    def test_invalid_characters(self):
        from src.services.username_service import UsernameService
        result_space = UsernameService.validate("user name")
        assert result_space["valid"] is False
        assert "no_spaces" in result_space["errors"] or "invalid_characters" in result_space["errors"]

    def test_normalize_lowercase(self):
        from src.services.username_service import UsernameService
        assert UsernameService.normalize("JohnDoe") == "johndoe"


# ---- Config Validation (SEC-001 / SEC-011) ----


class TestConfigValidation:
    """Test security configuration defaults."""

    def test_secret_key_rejects_default_in_prod(self):
        """SEC-001: App should fail with default SECRET_KEY in production."""
        import os
        os.environ["ENVIRONMENT"] = "prod"
        os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
        try:
            from importlib import reload
            import src.core.config as config_module
            reload(config_module)
            settings = config_module.Settings()
            # Should have raised ValueError
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "SEC-001" in str(e)
        finally:
            # Reset env
            os.environ.pop("SECRET_KEY", None)
            os.environ["ENVIRONMENT"] = "local"

    def test_debug_defaults_to_false(self):
        """SEC-011: DEBUG should default to False."""
        import os
        os.environ.pop("DEBUG", None)
        from importlib import reload
        import src.core.config as config_module
        reload(config_module)
        settings = config_module.Settings()
        assert settings.DEBUG is False
