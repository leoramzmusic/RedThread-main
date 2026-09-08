from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import secrets
import hashlib
from src.core.config import settings

# Password hashing
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Bcrypt has a 72 byte limit, truncate if necessary
    password_bytes = password.encode('utf-8')[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')


def create_access_token(data: dict, device_type: str = "web", expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with device-specific expiration"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Use device-specific expiration
        if device_type == "mobile":
            minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES_MOBILE
        else:
            minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        expire = datetime.utcnow() + timedelta(minutes=minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, device_type: str = "web", remember_me: bool = False) -> str:
    """Create JWT refresh token with context-specific expiration"""
    to_encode = data.copy()
    
    # Determine expiration based on device type and remember_me setting
    if device_type == "mobile":
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS_MOBILE
    elif remember_me:
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER
    else:
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB
    
    expire = datetime.utcnow() + timedelta(days=days)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_verification_code() -> str:
    """Generate 6-digit verification code"""
    return f"{secrets.randbelow(1000000):06d}"


def generate_reset_token() -> str:
    """Generate secure password reset token"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash token for secure storage in database"""
    return hashlib.sha256(token.encode()).hexdigest()

