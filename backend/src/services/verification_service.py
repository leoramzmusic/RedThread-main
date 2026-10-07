"""Contact verification: OTP lifecycle + email confirmation links.

State machine per channel (phone / email):
  none --send--> pending(otp, ttl 10min, cooldown 60s, attempts<=5)
  pending --correct code--> verified (otp cleared)
  pending --edit value--> none (flag reset by PUT /profiles/me)
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException

from src.core.utils.security import (
    generate_reset_token,
    generate_verification_code,
    hash_token,
)

OTP_TTL = timedelta(minutes=10)
EMAIL_TOKEN_TTL = timedelta(hours=24)
RESEND_COOLDOWN = timedelta(seconds=60)
MAX_OTP_ATTEMPTS = 5


def new_otp() -> str:
    """Generate a fresh 6-digit verification code."""
    return generate_verification_code()


def cooldown_active(sent_at: Optional[datetime]) -> bool:
    """True while the resend cooldown (60s since last send) is still running."""
    if sent_at is None:
        return False
    return datetime.utcnow() - sent_at < RESEND_COOLDOWN


def new_email_token() -> tuple[str, str]:
    """Return (raw token for the link, sha256 hash to store)."""
    token = generate_reset_token()
    return token, hash_token(token)


async def check_otp(user, channel: str, code: str) -> None:
    """Validate the OTP for `channel` ('phone' | 'email').

    Raises 429 when locked (>= MAX_OTP_ATTEMPTS), 400 when missing/expired,
    400 (and increments attempts) on wrong code. On success returns None and
    leaves the caller to clear the OTP and persist the verified flag.
    """
    otp = getattr(user, f"{channel}_otp")
    expires_at = getattr(user, f"{channel}_otp_expires_at")
    attempts = getattr(user, f"{channel}_otp_attempts")

    if attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=429, detail="Too many attempts. Request a new code."
        )

    if not otp or expires_at is None or expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")

    if otp != code:
        setattr(user, f"{channel}_otp_attempts", attempts + 1)
        await user.save()
        raise HTTPException(status_code=400, detail="Invalid verification code")


def clear_otp(user, channel: str) -> None:
    """Clear the OTP after successful confirmation (keeps sent_at for cooldown)."""
    setattr(user, f"{channel}_otp", None)
    setattr(user, f"{channel}_otp_expires_at", None)
    setattr(user, f"{channel}_otp_attempts", 0)
