from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Response, Request, Header
from pydantic import BaseModel, EmailStr
from src.models.employee import Employee
from src.services.employee_service import employee_service
from src.core.utils.security import create_access_token, create_refresh_token, decode_token
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
async def login(request: AdminLoginRequest, response: Response):
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

    _set_admin_cookies(response, access_token, new_refresh_token)

    return AdminAuthResponse(employee=_employee_summary(employee))

@router.post("/logout")
async def logout(response: Response):
    """Logout admin - clears HttpOnly cookies"""
    _clear_admin_cookies(response)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_employee_info(current_employee: Employee = Depends(get_current_employee)):
    return {
        "id": str(current_employee.id),
        "email": current_employee.email,
        "first_name": current_employee.first_name,
        "last_name": current_employee.last_name,
        "roles": current_employee.roles,
        "department_id": current_employee.department_id,
        "avatar": current_employee.avatar,
        "admin_theme_mode": current_employee.admin_theme_mode,
        "admin_visual_theme": current_employee.admin_visual_theme,
        "permissions": await current_employee.get_all_permissions()
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

