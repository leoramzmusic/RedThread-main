from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from src.models.employee import Employee, EmployeeStatus
from src.models.admin_rbac import AdminRole, Permission, AdminUser
from src.core.middleware.rbac import require_permission, require_all_permissions, log_admin_action, get_admin_user
from src.services.employee_service import employee_service


router = APIRouter()


# Pydantic models for request validation
class EmployeeActionRequest(BaseModel):
    action: str  # "update_role", "update_status", "update_area"
    role: Optional[AdminRole] = None
    status: Optional[EmployeeStatus] = None
    area: Optional[str] = None
    reason: Optional[str] = None

class EmployeeUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    roles: Optional[List[str]] = None
    status: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    birth_date: Optional[str] = None
    is_2fa_enabled: Optional[bool] = None
    password: Optional[str] = None  # For password resets


@router.get("/roles")
async def listar_roles(
    admin_user: Any = Depends(require_permission(Permission.VIEW_EMPLOYEES))
) -> List[Dict[str, Any]]:
    """List all available admin roles"""
    return [
        {"id": role.value, "nombre": role.name.replace("_", " ").title(), "value": role.value}
        for role in AdminRole
    ]


@router.get("/permisos")
async def listar_permisos(
    admin_user: Any = Depends(require_permission(Permission.VIEW_EMPLOYEES))
) -> List[Dict[str, Any]]:
    """List all available permissions"""
    return [
        {"id": perm.value, "nombre": perm.name.replace("_", " ").title(), "value": perm.value}
        for perm in Permission
    ]


@router.get("/listado")
async def listar_empleados(
    search: Optional[str] = Query(None, description="Search by name, email, or ID"),
    role: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    admin_user: Any = Depends(require_permission(Permission.VIEW_EMPLOYEES))
) -> Dict[str, Any]:
    """
    List all employees with advanced pagination and filters.
    """
    query = {}
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"first_name": search_regex},
            {"last_name": search_regex},
            {"email": search_regex},
            {"employee_id": search_regex}
        ]
        
    if role:
        query["roles"] = {"$in": [role]}  # roles is a list, so use $in
    if area:
        query["area"] = area
    if status:
        query["status"] = status
    if country:
        query["country"] = country

    employees = await Employee.find(query).sort(-Employee.created_at).skip(offset).limit(limit).to_list()
    total = await Employee.find(query).count()
    
    # Fetch departments for mapping if needed
    dept_names = {}
    if any(not e.area for e in employees):
        from src.models.department import Department
        depts = await Department.find_all().to_list()
        dept_names = {str(d.id): d.name for d in depts}
    
    return {
        "employees": [
            {
                "id": str(e.id),
                "employee_id": e.employee_id,
                "email": e.email,
                "first_name": e.first_name,
                "last_name": e.last_name,
                "display_name": e.display_name,
                "avatar": e.avatar,
                "role": e.role or (e.roles[0] if e.roles else None),
                "area": e.area or (dept_names.get(e.department_id) if e.department_id else None),
                "status": e.status,
                "country": e.country,
                "city": e.city,
                "last_login_at": e.last_login_at.isoformat() if e.last_login_at else None,
                "created_at": e.created_at.isoformat()
            } for e in employees
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/dashboard-stats")
async def get_employee_stats(
    admin_user: Any = Depends(require_permission(Permission.VIEW_EMPLOYEES))
) -> Dict[str, Any]:
    """
    Get aggregate metrics for the employee management dashboard.
    """
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)
    
    total = await Employee.find_all().count()
    active = await Employee.find(Employee.status == EmployeeStatus.ACTIVE).count()
    new_this_month = await Employee.find(Employee.created_at >= month_ago).count()
    
    # Distribution by Area
    # Beanie doesn't have an easy "group by" shorthand like this, so we use aggregation
    area_pipeline = [
        {"$group": {"_id": "$area", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    area_dist = await Employee.aggregate(area_pipeline).to_list()
    
    # Distribution by Role
    role_pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    role_dist = await Employee.aggregate(role_pipeline).to_list()

    return {
        "summary": {
            "total": total,
            "active": active,
            "suspended": await Employee.find(Employee.status == EmployeeStatus.SUSPENDED).count(),
            "new_this_month": new_this_month
        },
        "distribution": {
            "areas": [{"name": d["_id"], "value": d["count"]} for d in area_dist if d["_id"]],
            "roles": [{"name": d["_id"], "value": d["count"]} for d in role_dist if d["_id"]]
        }
    }


@router.put("/{employee_id}/actions")
async def employee_actions(
    employee_id: str,
    request: EmployeeActionRequest,
    admin_user: Any = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Perform administrative actions on an employee.
    Requires MANAGE_EMPLOYEES or ASSIGN_ROLES depending on the action.
    """
    # 1. Permission checks
    if request.action == "update_role":
        if not admin_user.has_permission(Permission.ASSIGN_ROLES):
            raise HTTPException(status_code=403, detail="Not enough permissions to assign roles")
    else:
        if not admin_user.has_permission(Permission.MANAGE_EMPLOYEES):
            raise HTTPException(status_code=403, detail="Not enough permissions to manage employees")

    # 2. Find employee
    employee = await Employee.get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # 3. Apply action
    if request.action == "update_role" and request.role:
        old_role = employee.role
        employee.role = request.role
        description = f"Changed role from {old_role} to {request.role}"
    elif request.action == "update_status" and request.status:
        old_status = employee.status
        employee.status = request.status
        description = f"Changed status from {old_status} to {request.status}"
    elif request.action == "update_area" and request.area:
        old_area = employee.area
        employee.area = request.area
        description = f"Changed area from {old_area} to {request.area}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action or missing required fields")

    employee.updated_at = datetime.utcnow()
    await employee.save()

    # 4. Audit log
    await log_admin_action(
        admin_user_id=str(admin_user.id) if hasattr(admin_user, 'id') else str(admin_user.user_id),
        action_type=request.action,
        description=f"{description}. Reason: {request.reason or 'No reason provided'}",
        target_type="employee",
        target_id=employee_id,
        metadata={"request": request.dict()}
    )

    return {
        "message": "Action completed successfully",
        "employee_id": employee_id,
        "new_value": getattr(employee, request.action.split("_")[1])
    }

@router.get("/{employee_id}")
async def obtener_empleado(
    employee_id: str,
    admin_user: Any = Depends(require_permission(Permission.VIEW_EMPLOYEES))
) -> Dict[str, Any]:
    """Get full employee details for editing"""
    employee = await Employee.get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return {
        "id": str(employee.id),
        "employee_id": employee.employee_id,
        "email": employee.email,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "phone": employee.phone,
        "roles": employee.roles,
        "department_id": employee.department_id,
        "status": employee.status,
        "country": employee.country,
        "city": employee.city,
        "birth_date": employee.birth_date.isoformat() if employee.birth_date else None,
        "hire_date": employee.hire_date.isoformat() if employee.hire_date else None,
        "is_2fa_enabled": employee.is_2fa_enabled,
        "last_login_at": employee.last_login_at.isoformat() if employee.last_login_at else None,
        "created_at": employee.created_at.isoformat(),
        "updated_at": employee.updated_at.isoformat()
    }

@router.put("/{employee_id}")
async def actualizar_empleado(
    employee_id: str,
    request: EmployeeUpdateRequest,
    admin_user: Any = Depends(require_permission(Permission.MANAGE_EMPLOYEES))
):
    """Full update of employee data with audit logging"""
    # Convert string dates to datetime if present
    data = request.dict(exclude_unset=True)
    if "birth_date" in data and data["birth_date"]:
        data["birth_date"] = datetime.fromisoformat(data["birth_date"])
    
    admin_id = str(admin_user.id) if hasattr(admin_user, 'id') else str(admin_user.user_id)
    admin_name = f"{admin_user.first_name} {admin_user.last_name}" if hasattr(admin_user, 'first_name') else "Admin"

    employee = await employee_service.update_employee(
        id=employee_id,
        update_data=data,
        admin_id=admin_id,
        admin_name=admin_name
    )
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return {"status": "success", "message": "Empleado actualizado correctamente"}

@router.get("/{employee_id}/audit")
async def listar_auditoria(
    employee_id: str,
    admin_user: Any = Depends(require_permission(Permission.VIEW_EMPLOYEES))
):
    """Get change history for an employee"""
    logs = await employee_service.get_audit_logs(employee_id)
    return [
        {
            "id": str(log.id),
            "admin_name": log.admin_name,
            "action": log.action,
            "field": log.field_name,
            "old": log.old_value,
            "new": log.new_value,
            "summary": log.change_summary,
            "date": log.created_at.isoformat()
        } for log in logs
    ]
