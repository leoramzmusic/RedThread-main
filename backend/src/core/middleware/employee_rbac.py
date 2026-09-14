"""
Employee RBAC Middleware

Provides role-based access control for admin endpoints using the Employee model.
This replaces the old AdminUser-based RBAC for the new Employee authentication system.
"""

from fastapi import Depends, HTTPException, status, Header, Request
from typing import List, Callable, Optional
from src.models.employee import Employee
from src.models.admin_rbac import Permission, AdminAction, ROLE_PERMISSIONS
from src.core.utils.security import decode_token
from datetime import datetime


async def get_current_employee(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Employee:
    """
    Get current authenticated employee from Authorization header or HttpOnly cookie.
    Raises 401 if token is invalid or employee not found.
    """
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
            detail="Authorization header or session cookie missing"
        )

    # Decode token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Check if it's an employee token
    if payload.get("scope") != "employee":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token scope - employee token required"
        )
    
    employee_id = payload.get("sub")
    if not employee_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get employee from database
    employee = await Employee.get(employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee not found"
        )
    
    # Check if employee is active
    if employee.status.value != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Employee account is {employee.status.value}"
        )
    
    # Update last activity
    employee.last_activity_at = datetime.utcnow()
    await employee.save()
    
    return employee


def require_employee_permission(permission: Permission):
    """
    Dependency factory that requires a specific permission for employees.
    
    Usage:
        @router.get("/users")
        async def list_users(employee: Employee = Depends(require_employee_permission(Permission.VIEW_USERS))):
            ...
    """
    async def permission_checker(employee: Employee = Depends(get_current_employee)) -> Employee:
        if not await employee.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}"
            )
        return employee
    
    return permission_checker


def require_any_employee_permission(permissions: List[Permission]):
    """
    Dependency factory that requires ANY of the specified permissions for employees.
    
    Usage:
        @router.get("/reports")
        async def view_reports(
            employee: Employee = Depends(require_any_employee_permission([
                Permission.VIEW_REPORTS,
                Permission.HANDLE_REPORTS
            ]))
        ):
            ...
    """
    async def permission_checker(employee: Employee = Depends(get_current_employee)) -> Employee:
        # Check if employee has any of the required permissions
        has_permission = False
        for perm in permissions:
            if await employee.has_permission(perm):
                has_permission = True
                break
        
        if not has_permission:
            perm_names = ", ".join([p.value for p in permissions])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {perm_names}"
            )
        return employee
    
    return permission_checker


def require_all_employee_permissions(permissions: List[Permission]):
    """
    Dependency factory that requires ALL of the specified permissions for employees.
    
    Usage:
        @router.delete("/users/{id}")
        async def delete_user(
            employee: Employee = Depends(require_all_employee_permissions([
                Permission.VIEW_USERS,
                Permission.DELETE_USERS
            ]))
        ):
            ...
    """
    async def permission_checker(employee: Employee = Depends(get_current_employee)) -> Employee:
        for perm in permissions:
            if not await employee.has_permission(perm):
                perm_names = ", ".join([p.value for p in permissions])
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"All of these permissions required: {perm_names}"
                )
        return employee
    
    return permission_checker


async def log_employee_action(
    employee_id: str,
    action_type: str,
    description: str,
    target_type: str = None,
    target_id: str = None,
    metadata: dict = None,
    success: bool = True,
    error_message: str = None
):
    """
    Log an employee action for audit purposes.
    
    Args:
        employee_id: ID of employee who performed action
        action_type: Type of action (e.g., "suspend_user")
        description: Human-readable description
        target_type: Type of resource affected (e.g., "user")
        target_id: ID of affected resource
        metadata: Additional context
        success: Whether action succeeded
        error_message: Error message if failed
    """
    action = AdminAction(
        admin_user_id=employee_id,  # Reusing AdminAction model
        action_type=action_type,
        target_type=target_type or "unknown",
        target_id=target_id,
        description=description,
        metadata=metadata or {},
        success=success,
        error_message=error_message
    )
    
    await action.insert()


# Helper function to check if employee has permission
async def employee_has_permission(employee_id: str, permission: Permission) -> bool:
    """Check if an employee has a specific permission"""
    employee = await Employee.get(employee_id)
    if not employee:
        return False
    return await employee.has_permission(permission)


# Helper function to get employee's permissions
async def get_employee_permissions(employee_id: str) -> List[Permission]:
    """Get all permissions for an employee"""
    employee = await Employee.get(employee_id)
    if not employee:
        return []
    
    # Get permissions from role
    role_perms = ROLE_PERMISSIONS.get(employee.role, [])
    # Add custom permissions
    all_perms = list(set(role_perms + employee.custom_permissions))
    return all_perms
