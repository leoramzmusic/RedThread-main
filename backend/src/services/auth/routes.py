from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from src.models.user import User, AuthProvider, SubscriptionTier
from src.models.profile import Profile
from src.core.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from src.services.redis_service import redis_service


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# Request/Response Models
class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    display_name: str
    age: int
    gender: str


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user from token"""
    payload = decode_token(token)
    
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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
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
    
    # Create user
    user = User(
        email=request.email,
        phone=request.phone,
        hashed_password=get_password_hash(request.password),
        auth_provider=AuthProvider.EMAIL,
        subscription_tier=SubscriptionTier.FREE,
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow()
    )
    await user.insert()
    
    # Create profile
    profile = Profile(
        user_id=str(user.id),
        display_name=request.display_name,
        age=request.age,
        gender=request.gender,
        created_at=datetime.utcnow()
    )
    await profile.insert()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Store refresh token
    user.refresh_tokens.append(refresh_token)
    await user.save()
    
    # Set user online
    await redis_service.set_user_online(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id)
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with email/phone and password"""
    
    # Find user
    user = None
    print(f"Login attempt for: {request.email or request.phone}")
    if request.email:
        user = await User.find_one(User.email == request.email)
    elif request.phone:
        user = await User.find_one(User.phone == request.phone)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required"
        )
    
    if user:
        print(f"User found: {user.email}")
        is_valid = verify_password(request.password, user.hashed_password)
        print(f"Password valid: {is_valid}")
    else:
        print("User not found")

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
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    await user.save()
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Store refresh token
    user.refresh_tokens.append(refresh_token)
    await user.save()
    
    # Set user online
    await redis_service.set_user_online(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await User.get(user_id)
    
    if not user or request.refresh_token not in user.refresh_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Generate new tokens
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Replace old refresh token
    user.refresh_tokens.remove(request.refresh_token)
    user.refresh_tokens.append(new_refresh_token)
    await user.save()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_id=str(user.id)
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user"""
    
    # Clear refresh tokens
    current_user.refresh_tokens = []
    await current_user.save()
    
    # Set user offline
    await redis_service.set_user_offline(str(current_user.id))
    
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "phone": current_user.phone,
        "subscription_tier": current_user.subscription_tier,
        "profile": profile.dict() if profile else None
    }


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

