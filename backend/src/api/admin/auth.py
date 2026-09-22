from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Response, Request, Header, UploadFile, File
from pydantic import BaseModel, EmailStr
from src.models.employee import Employee
from src.models.session import Session
from src.models.employee_audit import EmployeeAudit
from src.services.employee_service import employee_service
from src.services.security_service import calculate_session_expiration, enforce_max_sessions, parse_user_agent
from src.core.utils.security import create_access_token, create_refresh_token, decode_token, hash_token
from src.core.config import settings

router = APIRouter(prefix="/portal-redthread/auth", tags=["Admin Auth"])

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None

class AdminAuthResponse(BaseModel):
    employee: dict
    message: str = "ok"

class Update2FARequest(BaseModel):
    enabled: bool

class EmployeeRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    employee_id: str
    roles: List[str]
    department_id: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    country: Optional[str] = None
    city: Optional[str] = None
    is_2fa_enabled: bool = False

def _set_admin_cookies(response: Response, access_token: str, refresh_token: str):
    secure = settings.ENVIRONMENT != "local"
    response.set_cookie(
        key="admin_access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="admin_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="strict",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )


def _clear_admin_cookies(response: Response):
    response.delete_cookie(key="admin_access_token", path="/")
    response.delete_cookie(key="admin_refresh_token", path="/")


def _employee_summary(employee: Employee) -> dict:
    return {
        "id": str(employee.id),
        "email": employee.email,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "roles": employee.roles,
        "avatar": employee.avatar
    }


async def get_current_employee(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Employee:
    """Get current authenticated employee from Authorization header or HttpOnly cookie"""
    token = None

    if authorization:
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                token = None
        except ValueError:
            token = None

    if not token:
        token = request.cookies.get("admin_access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Check if it's an employee token
    if payload.get("scope") != "employee":
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token scope"
        )

    employee_id = payload.get("sub")
    if not employee_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    employee = await Employee.get(employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee not found"
        )
        
    return employee

@router.post("/login", response_model=AdminAuthResponse)
async def login(request: AdminLoginRequest, response: Response, http_request: Request):
    print(f"[AUTH DEBUG] Login request received for email: {request.email}")
    employee = await employee_service.authenticate_employee(request.email, request.password)
    
    if not employee:
        print(f"[AUTH DEBUG] Authentication failed for: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    
    # Generate tokens with employee scope
    access_token = create_access_token(
        {"sub": str(employee.id), "scope": "employee"},
        device_type="web" # Admin portal is web-only for now
    )
    refresh_token = create_refresh_token(
        {"sub": str(employee.id), "scope": "employee"},
        device_type="web"
    )
    
    await employee_service.update_last_login(str(employee.id))

    # Create session record for multi-device management
    user_agent = http_request.headers.get("user-agent", "Unknown")
    ip_address = http_request.client.host if http_request.client else "unknown"
    ua_info = parse_user_agent(user_agent)
    session = Session(
        user_id=str(employee.id),
        refresh_token_hash=hash_token(refresh_token),
        device_type=ua_info["device_type"],
        device_name=ua_info["browser"],
        device_os=ua_info["os"],
        ip_address=ip_address,
        remember_me=False,
        created_at=datetime.utcnow(),
        last_activity_at=datetime.utcnow(),
        expires_at=calculate_session_expiration(ua_info["device_type"], False),
        is_active=True,
    )
    await session.insert()
    await enforce_max_sessions(str(employee.id))

    _set_admin_cookies(response, access_token, refresh_token)

    return AdminAuthResponse(employee=_employee_summary(employee))

@router.post("/refresh", response_model=AdminAuthResponse)
async def refresh_token(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None
):
    """Refresh admin access token from HttpOnly cookie or request body"""
    refresh_token_val = request.cookies.get("admin_refresh_token")
    if not refresh_token_val and body and body.refresh_token:
        refresh_token_val = body.refresh_token

    if not refresh_token_val:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    payload = decode_token(refresh_token_val)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    if payload.get("scope") != "employee":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token scope"
        )
    
    employee_id = payload.get("sub")
    employee = await Employee.get(employee_id)
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee not found"
        )
    
    # Generate new tokens
    access_token = create_access_token(
        {"sub": str(employee.id), "scope": "employee"},
        device_type="web"
    )
    new_refresh_token = create_refresh_token(
        {"sub": str(employee.id), "scope": "employee"},
        device_type="web"
    )

    # Update or create session record for this refresh
    token_hash = hash_token(refresh_token_val)
    session = await Session.find_one(Session.refresh_token_hash == token_hash, Session.is_active == True)
    if session:
        session.refresh_token_hash = hash_token(new_refresh_token)
        session.last_activity_at = datetime.utcnow()
        await session.save()
    else:
        user_agent = request.headers.get("user-agent", "Unknown")
        ip_address = request.client.host if request.client else "unknown"
        ua_info = parse_user_agent(user_agent)
        session = Session(
            user_id=str(employee.id),
            refresh_token_hash=hash_token(new_refresh_token),
            device_type=ua_info["device_type"],
            device_name=ua_info["browser"],
            device_os=ua_info["os"],
            ip_address=ip_address,
            remember_me=False,
            created_at=datetime.utcnow(),
            last_activity_at=datetime.utcnow(),
            expires_at=calculate_session_expiration(ua_info["device_type"], False),
            is_active=True,
        )
        await session.insert()
        await enforce_max_sessions(str(employee.id))

    _set_admin_cookies(response, access_token, new_refresh_token)

    return AdminAuthResponse(employee=_employee_summary(employee))

@router.post("/logout")
async def logout(response: Response, request: Request):
    """Logout admin - deactivates session if present and clears HttpOnly cookies"""
    refresh_token_val = request.cookies.get("admin_refresh_token")
    if refresh_token_val:
        payload = decode_token(refresh_token_val)
        employee_id = payload.get("sub") if payload else None
        if employee_id:
            session = await Session.find_one(
                Session.refresh_token_hash == hash_token(refresh_token_val),
                Session.is_active == True,
                Session.user_id == employee_id,
            )
            if session:
                session.is_active = False
                await session.save()
    _clear_admin_cookies(response)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_employee_info(current_employee: Employee = Depends(get_current_employee)):
    return await _me_payload(current_employee)


@router.get("/sessions")
async def get_active_sessions(current_employee: Employee = Depends(get_current_employee)):
    """Get all active sessions for the current employee"""
    sessions = await Session.find(
        Session.user_id == str(current_employee.id),
        Session.is_active == True,
    ).sort(-Session.last_activity_at).to_list()

    return [
        {
            "id": str(session.id),
            "device_type": session.device_type,
            "device_name": session.device_name,
            "device_os": session.device_os,
            "ip_address": session.ip_address,
            "location": session.location,
            "remember_me": session.remember_me,
            "created_at": session.created_at.isoformat(),
            "last_activity_at": session.last_activity_at.isoformat(),
            "expires_at": session.expires_at.isoformat(),
        }
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_employee: Employee = Depends(get_current_employee),
):
    """Revoke a specific session belonging to the current employee"""
    session = await Session.get(session_id)

    if not session or session.user_id != str(current_employee.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    session.is_active = False
    await session.save()

    return {"message": "Session revoked successfully"}


@router.post("/logout-all")
async def logout_all_devices(current_employee: Employee = Depends(get_current_employee)):
    """Deactivate all sessions for the current employee"""
    await Session.find(
        Session.user_id == str(current_employee.id),
        Session.is_active == True,
    ).update({"$set": {"is_active": False}})

    return {"message": "Logged out from all devices successfully"}


@router.put("/me/2fa")
async def update_2fa(
    request: Update2FARequest,
    current_employee: Employee = Depends(get_current_employee),
):
    """Enable or disable 2FA for the current employee (audit-logged)"""
    old_value = current_employee.is_2fa_enabled
    current_employee.is_2fa_enabled = request.enabled
    current_employee.updated_at = datetime.utcnow()
    await current_employee.save()

    admin_id = str(current_employee.id)
    admin_name = f"{current_employee.first_name} {current_employee.last_name}"
    await EmployeeAudit(
        employee_id=str(current_employee.id),
        admin_id=admin_id,
        admin_name=admin_name,
        action="update_2fa",
        field_name="is_2fa_enabled",
        old_value=old_value,
        new_value=request.enabled,
        change_summary=f"2FA {'enabled' if request.enabled else 'disabled'}",
    ).insert()

    return {
        "message": "2FA updated successfully",
        "is_2fa_enabled": current_employee.is_2fa_enabled,
    }


class UpdateMeRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None  # YYYY-MM-DD
    country: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None


@router.put("/me")
async def update_current_employee_info(
    request: UpdateMeRequest,
    current_employee: Employee = Depends(get_current_employee),
):
    """Self-service profile update (same record as admin employee edit)."""
    data = request.dict(exclude_unset=True)

    if data.get("email"):
        normalized = data["email"].lower().strip()
        if normalized != current_employee.email:
            existing = await employee_service.get_by_email(normalized)
            if existing and str(existing.id) != str(current_employee.id):
                raise HTTPException(status_code=400, detail="Email already registered")
        data["email"] = normalized

    if "birth_date" in data and data["birth_date"]:
        try:
            data["birth_date"] = datetime.fromisoformat(data["birth_date"])
        except ValueError:
            raise HTTPException(status_code=400, detail="birth_date must be ISO format (YYYY-MM-DD)")

    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    admin_id = str(current_employee.id)
    admin_name = f"{current_employee.first_name} {current_employee.last_name}"
    employee = await employee_service.update_employee(
        id=admin_id,
        update_data=data,
        admin_id=admin_id,
        admin_name=admin_name,
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return await _me_payload(employee)


@router.post("/me/avatar")
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_employee: Employee = Depends(get_current_employee),
):
    """Self-service 1:1 avatar upload (same bucket + audit as admin upload."""
    admin_id = str(current_employee.id)
    admin_name = f"{current_employee.first_name} {current_employee.last_name}"
    url = await employee_service.save_avatar(current_employee, file, admin_id, admin_name)
    return {"url": url, "message": "Avatar actualizado"}


async def _me_payload(employee: Employee) -> dict:
    return {
        "id": str(employee.id),
        "employee_id": employee.employee_id,
        "email": employee.email,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "phone": employee.phone,
        "birth_date": employee.birth_date.isoformat() if employee.birth_date else None,
        "country": employee.country,
        "city": employee.city,
        "address": employee.address,
        "avatar": employee.avatar,
        "roles": employee.roles,
        "department_id": employee.department_id,
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "is_2fa_enabled": employee.is_2fa_enabled,
        "status": employee.status.value if hasattr(employee.status, "value") else employee.status,
        "admin_theme_mode": employee.admin_theme_mode,
        "admin_visual_theme": employee.admin_visual_theme,
        "permissions": await employee.get_all_permissions(),
    }

@router.post("/register")
async def register_employee(request: EmployeeRegisterRequest):
    """Register a new employee. High-security endpoint."""
    # Check if email is already used
    existing = await employee_service.get_by_email(request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    employee = await employee_service.create_employee(**request.dict())
    return {"status": "success", "id": str(employee.id)}


class UpdateAdminThemeRequest(BaseModel):
    admin_theme_mode: Optional[str] = None  # 'light' or 'dark'
    admin_visual_theme: Optional[str] = None  # 'redThread', 'premium', etc.


@router.patch("/profile/theme")
async def update_admin_theme(
    request: UpdateAdminThemeRequest,
    current_employee: Employee = Depends(get_current_employee)
):
    """Update admin theme preferences (mode and/or visual theme) - independent from user portal"""
    
    if request.admin_theme_mode and request.admin_theme_mode not in ['light', 'dark']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="admin_theme_mode must be 'light' or 'dark'"
        )
    
    if request.admin_theme_mode:
        current_employee.admin_theme_mode = request.admin_theme_mode
    
    if request.admin_visual_theme:
        current_employee.admin_visual_theme = request.admin_visual_theme
    
    current_employee.updated_at = datetime.utcnow()
    await current_employee.save()
    
    return {
        "message": "Admin theme updated successfully",
        "admin_theme_mode": current_employee.admin_theme_mode,
        "admin_visual_theme": current_employee.admin_visual_theme
    }

