from fastapi import APIRouter, HTTPException, status, Depends, Request, Response, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid
from src.core.config import settings
from src.models.user import User, AuthProvider, SubscriptionTier
from src.models.profile import Profile
from src.models.session import Session
from src.services.mail_service import mail_service
from src.core.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    generate_reset_token
)
from datetime import datetime, timedelta
from src.core.utils.nickname_validator import validate_nickname
from src.services.redis_service import redis_service
from src.services.security_service import (
    check_suspicious_login,
    enforce_max_sessions,
    calculate_session_expiration,
    parse_user_agent
)


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)
optional_oauth2_scheme = HTTPBearer(auto_error=False)  # For optional authentication


# Request/Response Models
class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    username: str  # Unique identifier
    password: str
    real_name: Optional[str] = None  # Optional for now, manual entry
    display_name: str  # Public display name
    age: int
    gender: str

class RegisterResponse(BaseModel):
    message: str
    requires_verification: bool = False
    temp_user_id: Optional[str] = None

class VerifyPhoneRequest(BaseModel):
    user_id: str
    otp: str


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    identifier: Optional[str] = None  # New unified field: email, phone, or nickname
    password: str
    remember_me: bool = False
    device_type: Optional[str] = "web"  # 'web', 'mobile', 'tablet'
    device_info: Optional[dict] = None  # Browser, OS, etc.


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class RecoverPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    new_password: str


# Dependency to get current user
# Dependency to get current user
async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """Get current authenticated user from token (header or cookie)"""
    
    # Try header first (legacy/backwards compatibility), then cookie
    token_to_verify = token
    if not token_to_verify:
        token_to_verify = request.cookies.get("access_token")

    if not token_to_verify:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = decode_token(token_to_verify)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = await User.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user


# Optional dependency for public endpoints
async def get_current_user_optional(credentials: Optional[HTTPBearer] = Depends(optional_oauth2_scheme)) -> Optional[User]:
    """Get current user if authenticated, None otherwise (for public endpoints)"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = await User.get(user_id)
        if not user or not user.is_active:
            return None
        
        return user
    except:
        return None


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role for endpoint access"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, response: Response):
    """Register a new user with email or phone"""
    
    # Validate input
    if not request.email and not request.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required"
        )
    
    # Check if user already exists
    if request.email:
        existing_user = await User.find_one(User.email == request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    if request.phone:
        existing_user = await User.find_one(User.phone == request.phone)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone already registered"
            )
    
    # Validate username (nickname)
    from src.services.username_service import UsernameService
    
    # We should add username to RegisterRequest if not already there, 
    # but for now let's assume display_name or a temporary logic if missing
    # In the Refactored RegisterForm, 'username' is sent in the body.
    # Let's check if we need to update RegisterRequest model.
    
    # If request has username field (need to update RegisterRequest)
    # user_nickname = request.username 
    # For now, let's use the display_name as a fallback or ensure it's provided
    user_nickname = getattr(request, 'username', request.display_name)
    
    validation = UsernameService.validate(user_nickname)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid username: {', '.join(validation['errors'])}"
        )
        
    if not await UsernameService.is_available(user_nickname):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user
    user = User(
        real_name=request.real_name,
        display_name=request.display_name,
        nickname=UsernameService.normalize(user_nickname),
        email=request.email,
        phone=request.phone,
        hashed_password=get_password_hash(request.password),
        auth_provider=AuthProvider.EMAIL,
        subscription_tier=SubscriptionTier.FREE,
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow()
    )

    # Handle Phone Registration Verification
    requires_verification = False
    if request.phone:
        import random
        otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
        user.phone_otp = otp
        user.phone_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        requires_verification = True
        # Mock SMS sending
        print(f"--- [MOCK SMS] --- To: {request.phone} Code: {otp} ---")
    else:
        user.is_verified = True # Email verified immediately or later? For now immediate to match UI flow

    await user.insert()
    
    # nickname is already set above
    await user.save()
    
    # Create profile
    profile = Profile(
        user_id=str(user.id),
        age=request.age,
        gender=request.gender,
        created_at=datetime.utcnow()
    )
    await profile.insert()
    
    if requires_verification:
        return RegisterResponse(
            message="Verification code sent via SMS",
            requires_verification=True,
            temp_user_id=str(user.id)
        )

    # Generate tokens for immediate email registration
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Store refresh token
    user.refresh_tokens.append(refresh_token)
    await user.save()
    
    # Set user online
    await redis_service.set_user_online(str(user.id))
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB * 24 * 60 * 60,
        path="/"
    )

    # Emit Kafka registration event
    try:
        from src.services.kafka_service import kafka_service
        from src.services.kafka_topics import KafkaTopic, KafkaEventType
        await kafka_service.publish(
            topic=KafkaTopic.USER_EVENTS,
            event_type=KafkaEventType.USER_REGISTERED,
            payload={
                "user_id": str(user.id),
                "email": user.email,
                "created_at": user.created_at.isoformat(),
            },
            key=str(user.id),
        )
    except Exception as k_err:
        print(f"Kafka publish error (auth register): {k_err}")

    return RegisterResponse(
        message="User registered successfully",
        requires_verification=False,
        temp_user_id=str(user.id)
    )


@router.post("/verify-phone", response_model=TokenResponse)
async def verify_phone(request: VerifyPhoneRequest, response: Response):
    """Verify phone OTP and return tokens"""
    user = await User.get(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="User already verified")
    
    if not user.phone_otp or user.phone_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if user.phone_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    # Mark as verified
    user.is_verified = True
    user.phone_otp = None
    user.phone_otp_expires_at = None
    await user.save()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Store refresh token
    user.refresh_tokens.append(refresh_token)
    await user.save()
    
    # Set user online
    await redis_service.set_user_online(str(user.id))
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB * 24 * 60 * 60,
        path="/"
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id)
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, request_obj: Request, response: Response):
    """Login with email/phone and password"""
    
    # Find user
    user = None
    # Support unified identifier or legacy fields
    identifier = request.identifier or request.email or request.phone
    print(f"Login attempt for identifier: {identifier}")
    
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifier (email, phone or nickname) is required"
        )

    # Identifier detection logic
    user = None
    if "@" in identifier:
        # Likely an email
        user = await User.find_one(User.email == identifier.lower())
    elif any(char.isdigit() for char in identifier) and len([c for c in identifier if c.isdigit()]) >= 8:
        # Likely a phone number (check for digits and minimum length)
        # Normalize: remove non-digit chars except '+' for search
        normalized_phone = "".join([c for c in identifier if c.isdigit() or c == '+'])
        user = await User.find_one(User.phone == normalized_phone)
        
        # If not found with normalized, try exact match
        if not user:
            user = await User.find_one(User.phone == identifier)
    
    # If still not found, try nickname
    if not user:
        user = await User.find_one(User.nickname == identifier)

    if not user:
        print(f"User not found for identifier: {identifier}")
    else:
        print(f"User found: {user.email or user.nickname}")

    # Verify user and password
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned"
        )
    
    # Get device and location info
    ip_address = request_obj.client.host if request_obj.client else "unknown"
    user_agent = request_obj.headers.get("user-agent", "")
    
    # Parse device info from user agent if not provided
    if not request.device_info:
        device_info = parse_user_agent(user_agent)
        device_type = device_info['device_type']
        device_name = device_info['browser']
        device_os = device_info['os']
    else:
        device_type = request.device_type or "web"
        device_name = request.device_info.get('browser', 'Unknown')
        device_os = request.device_info.get('os', 'Unknown')
    
    # Check for suspicious activity (optional - can be enhanced with IP geolocation)
    # await check_suspicious_login(user, ip_address)
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    await user.save()
    
    # Generate tokens with device-specific expiration
    access_token = create_access_token(
        {"sub": str(user.id)},
        device_type=device_type
    )
    refresh_token = create_refresh_token(
        {"sub": str(user.id)},
        device_type=device_type,
        remember_me=request.remember_me
    )
    
    # Create session record
    session = Session(
        user_id=str(user.id),
        refresh_token_hash=hash_token(refresh_token),
        device_type=device_type,
        device_name=device_name,
        device_os=device_os,
        ip_address=ip_address,
        remember_me=request.remember_me,
        created_at=datetime.utcnow(),
        last_activity_at=datetime.utcnow(),
        expires_at=calculate_session_expiration(device_type, request.remember_me),
        is_active=True
    )
    await session.insert()
    
    # Enforce max sessions limit
    await enforce_max_sessions(str(user.id))
    
    # Set user online
    await redis_service.set_user_online(str(user.id))
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    # Determine max age for refresh cookie
    if device_type == "mobile":
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS_MOBILE
    elif request.remember_me:
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER
    else:
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=refresh_days * 24 * 60 * 60,
        path="/"
    )

    # Emit Kafka login event
    try:
        from src.services.kafka_service import kafka_service
        from src.services.kafka_topics import KafkaTopic, KafkaEventType
        await kafka_service.publish(
            topic=KafkaTopic.USER_EVENTS,
            event_type=KafkaEventType.USER_LOGIN,
            payload={
                "user_id": str(user.id),
                "device_type": device_type,
                "ip_address": ip_address,
                "login_at": datetime.utcnow().isoformat(),
            },
            key=str(user.id),
        )
    except Exception as k_err:
        print(f"Kafka publish error (auth login): {k_err}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, body: Optional[RefreshTokenRequest] = None):
    """Refresh access token using refresh token from cookie or body"""
    
    # Try to get refresh token from cookie first
    refresh_token_val = request.cookies.get("refresh_token")
    
    # Fallback to body if provided (for mobile/legacy)
    if not refresh_token_val and body:
        refresh_token_val = body.refresh_token
        
    if not refresh_token_val:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
    
    payload = decode_token(refresh_token_val)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Find session by hashed refresh token
    token_hash = hash_token(refresh_token_val)
    session = await Session.find_one(
        Session.user_id == user_id,
        Session.refresh_token_hash == token_hash,
        Session.is_active == True
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    # Check if session has expired
    if session.expires_at < datetime.utcnow():
        session.is_active = False
        await session.save()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    # Generate new tokens
    access_token = create_access_token(
        {"sub": str(user.id)},
        device_type=session.device_type
    )
    new_refresh_token = create_refresh_token(
        {"sub": str(user.id)},
        device_type=session.device_type,
        remember_me=session.remember_me
    )
    
    # Update session with new refresh token
    session.refresh_token_hash = hash_token(new_refresh_token)
    session.last_activity_at = datetime.utcnow()
    await session.save()
    
    # Determine max age for refresh cookie based on device type and remember_me
    if session.device_type == "mobile":
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS_MOBILE
    elif session.remember_me:
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER
    else:
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=refresh_days * 24 * 60 * 60,
        path="/"
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_id=str(user.id)
    )


@router.post("/logout")
async def logout(
    response: Response, 
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Logout current user from current session"""
    
    if current_user:
        # Deactivate all sessions for this user
        await Session.find(
            Session.user_id == str(current_user.id),
            Session.is_active == True
        ).update({"$set": {"is_active": False}})
        
        # Set user offline
        await redis_service.set_user_offline(str(current_user.id))
    
    # Delete cookies
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(request: Request, current_user: User = Depends(get_current_user)):
    """Get current user information (privacy-protected)"""
    
    from src.api.dtos.user_dtos import PrivateUserDTO
    from src.services.data_privacy_service import log_sensitive_access
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    print(f"[PROFILE ME] User {current_user.id}:")
    print(f"  - verified: {current_user.verified}")
    print(f"  - identity_verification_status: {current_user.identity_verification_status}")
    
    # Create privacy-protected response using DTO
    response_dto = PrivateUserDTO.from_user_and_profile(
        current_user, 
        profile, 
        mask_data=True  # Mask email and phone
    )
    
    # Log access to sensitive fields for audit
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    await log_sensitive_access(
        user_id=str(current_user.id),
        accessed_by=str(current_user.id),
        fields=["email", "phone", "identity_verification_status"],
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return response_dto



# Session Management Endpoints
@router.get("/sessions")
async def get_active_sessions(current_user: User = Depends(get_current_user)):
    """Get all active sessions for current user"""
    sessions = await Session.find(
        Session.user_id == str(current_user.id),
        Session.is_active == True
    ).sort(-Session.last_activity_at).to_list()
    
    return [{
        "id": str(session.id),
        "device_type": session.device_type,
        "device_name": session.device_name,
        "device_os": session.device_os,
        "ip_address": session.ip_address,
        "location": session.location,
        "remember_me": session.remember_me,
        "created_at": session.created_at.isoformat(),
        "last_activity_at": session.last_activity_at.isoformat(),
        "expires_at": session.expires_at.isoformat()
    } for session in sessions]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Revoke a specific session"""
    session = await Session.get(session_id)
    
    if not session or session.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.is_active = False
    await session.save()
    
    return {"message": "Session revoked successfully"}


@router.post("/logout-all")
async def logout_all_devices(current_user: User = Depends(get_current_user)):
    """Logout from all devices"""
    result = await Session.find(
        Session.user_id == str(current_user.id),
        Session.is_active == True
    ).update({"$set": {"is_active": False}})
    
    # Set user offline
    await redis_service.set_user_offline(str(current_user.id))
    
    return {"message": "Logged out from all devices successfully"}


# OAuth endpoints (placeholder - requires actual OAuth implementation)
@router.get("/google")
async def google_oauth():
    """Initiate Google OAuth flow"""
    # TODO: Implement Google OAuth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google OAuth not yet implemented. Add your credentials to config."
    )


@router.get("/facebook")
async def facebook_oauth():
    """Initiate Facebook OAuth flow"""
    # TODO: Implement Facebook OAuth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Facebook OAuth not yet implemented. Add your credentials to config."
    )


@router.get("/apple")
async def apple_oauth():
    """Initiate Apple OAuth flow"""
    # TODO: Implement Apple OAuth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Apple OAuth not yet implemented. Add your credentials to config."
    )


@router.get("/tiktok")
async def tiktok_oauth():
    """Initiate TikTok OAuth flow"""
    # TODO: Implement TikTok OAuth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="TikTok OAuth not yet implemented."
    )


@router.get("/instagram")
async def instagram_oauth():
    """Initiate Instagram OAuth flow"""
    # TODO: Implement Instagram OAuth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Instagram OAuth not yet implemented."
    )

# Password Recovery Endpoints
@router.post("/recover-password")
async def recover_password(request: RecoverPasswordRequest):
    """Initiate password recovery flow"""
    user = await User.find_one(User.email == request.email)
    
    # Security: Always return success message even if email doesn't exist
    if user:
        # Generate token
        token = generate_reset_token()
        user.reset_token = hash_token(token)
        user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        await user.save()
        
        # Send email
        await mail_service.send_password_reset_email(request.email, token)
        
    return {"message": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    token_hash = hash_token(request.token)
    user = await User.find_one(
        User.reset_token == token_hash,
        User.reset_token_expires_at > datetime.utcnow()
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    
    # Revoke all current sessions for safety
    await Session.find(
        Session.user_id == str(user.id),
        Session.is_active == True
    ).update({"$set": {"is_active": False}})
    
    await user.save()
    
    return {"message": "Tu contraseña ha sido actualizada con éxito"}




@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change password for authenticated user"""
    # Basic complexity check (minimum 8 characters)
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 8 caracteres"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(request.new_password)
    await current_user.save()
    
    # Send notification email
    if current_user.email:
        await mail_service.send_password_change_notification(current_user.email)
    
    return {"message": "Contraseña actualizada con éxito"}


@router.get("/check-username")
async def check_username(username: str):
    """
    Check if username (nickname) is available and valid
    
    Returns:
        - available: bool - Whether the username is available
        - reason: str - Reason if not available (too_short, too_long, invalid_characters, taken)
        - suggestions: list - Username suggestions if taken
    """
    from src.services.username_service import UsernameService
    
    # Validate format
    validation = UsernameService.validate(username)
    
    if not validation["valid"]:
        # Return first error as reason
        return {
            "available": False,
            "reason": validation["errors"][0] if validation["errors"] else "invalid",
            "suggestions": []
        }
    
    # Check availability (nickname field)
    from src.models.user import User
    normalized = username.lower()
    existing = await User.find_one(User.nickname == normalized)
    is_available = existing is None
    
    if not is_available:
        # Generate suggestions
        suggestions = await UsernameService.generate_suggestions(username, count=5)
        return {
            "available": False, 
            "reason": "taken",
            "suggestions": suggestions
        }
    
    return {
        "available": True,
        "reason": None,
        "suggestions": []
    }
