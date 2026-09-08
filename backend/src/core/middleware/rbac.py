"""
RBAC Middleware and Authorization Utilities

Provides role-based access control for admin endpoints.
"""

from fastapi import Depends, HTTPException, status, Request
from typing import List, Callable, Union, Optional
from src.models.user import User
from src.models.admin_rbac import AdminUser, Permission, AdminAction
from src.models.employee import Employee
from src.api.auth import get_current_user, oauth2_scheme
from src.core.utils.security import decode_token
from datetime import datetime


async def get_admin_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> Union[AdminUser, Employee]:
    """
    Get Admin identity (either Employee or AdminUser record).
    Supports dual-system authentication.
    """
    # 1. Get token (check header First, then Cookie)
    token_to_verify = token
    if not token_to_verify:
        token_to_verify = request.cookies.get("access_token")
    
    if not token_to_verify:
        print("DEBUG RBAC: No token found in Authorization header or cookies")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required"
        )
        
    # 2. Decode token to check scope
    payload = decode_token(token_to_verify)
    if not payload:
        print(f"DEBUG RBAC: Failed to decode token: {token_to_verify[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        
    print(f"DEBUG RBAC: Token payload: {payload}")

    # 3. Handle System B: Employee tokens
    if payload.get("scope") == "employee":
        employee_id = payload.get("sub")
        employee = await Employee.get(employee_id)
        if not employee:
            print(f"DEBUG RBAC: Employee {employee_id} not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Employee account not found"
            )
        if employee.status != "active":
            print(f"DEBUG RBAC: Employee {employee_id} is not active (status={employee.status})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Employee account inactive"
            )
        print(f"DEBUG RBAC: Authenticated as Employee {employee_id} ({employee.email})")
        return employee
        
    # 4. Handle System A: Regular User + AdminUser record
    try:
        current_user = await get_current_user(request, token_to_verify)
    except HTTPException as e:
        raise e
        
    admin_user = await AdminUser.find_one(
        AdminUser.user_id == str(current_user.id),
        AdminUser.is_active == True
    )
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have admin privileges"
        )
    
    # Update last login for System A
    admin_user.last_login = datetime.utcnow()
    admin_user.login_count += 1
    await admin_user.save()
    
    return admin_user


def require_permission(permission: Permission):
    """
    Dependency factory that requires a specific permission.
    
    Usage:
        @router.get("/users")
        async def list_users(admin: AdminUser = Depends(require_permission(Permission.VIEW_USERS))):
            ...
    """
    async def permission_checker(admin_user: Union[AdminUser, Employee] = Depends(get_admin_user)) -> Union[AdminUser, Employee]:
        admin_id = str(admin_user.id) if isinstance(admin_user, Employee) else admin_user.user_id
        if not await admin_user.has_permission(permission):
            all_perms = await admin_user.get_all_permissions()
            print(f"DEBUG RBAC: Permission denied for {admin_id}. User has permissions: {all_perms}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}"
            )
        return admin_user
    
    return permission_checker


def require_any_permission(permissions: List[Permission]):
    """
    Dependency factory that requires ANY of the specified permissions.
    
    Usage:
        @router.get("/reports")
        async def view_reports(
            admin: AdminUser = Depends(require_any_permission([
                Permission.VIEW_REPORTS,
                Permission.HANDLE_REPORTS
            ]))
        ):
            ...
    """
    async def permission_checker(admin_user: Union[AdminUser, Employee] = Depends(get_admin_user)) -> Union[AdminUser, Employee]:
        if not await admin_user.has_any_permission(permissions):
            perm_names = ", ".join([p.value for p in permissions])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {perm_names}"
            )
        return admin_user
    
    return permission_checker


def require_all_permissions(permissions: List[Permission]):
    """
    Dependency factory that requires ALL of the specified permissions.
    
    Usage:
        @router.delete("/users/{id}")
        async def delete_user(
            admin: AdminUser = Depends(require_all_permissions([
                Permission.VIEW_USERS,
                Permission.DELETE_USERS
            ]))
        ):
            ...
    """
    async def permission_checker(admin_user: Union[AdminUser, Employee] = Depends(get_admin_user)) -> Union[AdminUser, Employee]:
        if not await admin_user.has_all_permissions(permissions):
            perm_names = ", ".join([p.value for p in permissions])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"All of these permissions required: {perm_names}"
            )
        return admin_user
    
    return permission_checker


async def log_admin_action(
    admin_user_id: str,
    action_type: str,
    description: str,
    target_type: str = None,
    target_id: str = None,
    metadata: dict = None,
    success: bool = True,
    error_message: str = None
):
    """
    Log an admin action for audit purposes.
    
    Args:
        admin_user_id: ID of admin who performed action
        action_type: Type of action (e.g., "suspend_user")
        description: Human-readable description
        target_type: Type of resource affected (e.g., "user")
        target_id: ID of affected resource
        metadata: Additional context
        success: Whether action succeeded
        error_message: Error message if failed
    """
    action = AdminAction(
        admin_user_id=admin_user_id,
        action_type=action_type,
        target_type=target_type or "unknown",
        target_id=target_id,
        description=description,
        metadata=metadata or {},
        success=success,
        error_message=error_message
    )
    
    await action.insert()


# Convenience decorators for common permission checks

def admin_only(func):
    """
    Decorator that requires admin access (any admin role).
    Simpler alternative to require_permission for basic admin checks.
    """
    async def wrapper(*args, admin_user: Union[AdminUser, Employee] = Depends(get_admin_user), **kwargs):
        return await func(*args, admin_user=admin_user, **kwargs)
    return wrapper


# Helper function to check if user is admin
async def is_admin(user_id: str) -> bool:
    """Check if a user has admin access"""
    admin_user = await AdminUser.find_one(
        AdminUser.user_id == user_id,
        AdminUser.is_active == True
    )
    return admin_user is not None


# Helper function to get user's permissions
async def get_user_permissions(user_id: str) -> List[Permission]:
    """Get all permissions for a user"""
    admin_user = await AdminUser.find_one(
        AdminUser.user_id == user_id,
        AdminUser.is_active == True
    )
    
    if not admin_user:
        return []
    
    return await admin_user.get_all_permissions()


# Domain-based access control
def validate_admin_domain(email: str) -> bool:
    """
    Validate that email is from @redthread.com domain.
    This ensures only corporate emails can access admin portal.
    """
    if not email:
        return False
    return email.endswith("@redthread.com")


async def require_admin_domain(current_user: User = Depends(get_current_user)) -> User:
    """
    Middleware to require @redthread.com domain for admin portal access.
    
    Usage:
        app.include_router(
            admin_router,
            prefix="/portal-redthread",
            dependencies=[Depends(require_admin_domain)]
        )
    """
    if not validate_admin_domain(current_user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin portal access restricted to @redthread.com domain"
        )
    return current_user

