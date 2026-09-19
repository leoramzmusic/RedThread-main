from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from src.models.department import Department, DepartmentStatus
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import require_employee_permission, log_employee_action
from src.models.employee import Employee
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Admin Departments"])

class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: str = ""
    status: DepartmentStatus = DepartmentStatus.ACTIVE
    head_id: str = None
    location: str = None
    contact_email: str = None
    contact_phone: str = None
    max_employees: int = None

class DepartmentUpdate(BaseModel):
    name: str = None
    description: str = None
    status: DepartmentStatus = None
    head_id: str = None
    location: str = None
    contact_email: str = None
    contact_phone: str = None
    max_employees: int = None

@router.get("/", response_model=List[Department])
async def list_departments(admin: Employee = Depends(require_employee_permission(Permission.VIEW_EMPLOYEES))):
    """List all organizational departments"""
    return await Department.find_all().to_list()

@router.get("/{dept_id}", response_model=Department)
async def get_department(dept_id: str, admin: Employee = Depends(require_employee_permission(Permission.VIEW_EMPLOYEES))):
    """Get department details"""
    dept = await Department.get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.post("/", response_model=Department)
async def create_department(
    dept_in: DepartmentCreate,
    admin: Employee = Depends(require_employee_permission(Permission.MANAGE_EMPLOYEES))
):
    """Create a new department"""
    existing = await Department.find_one(Department.code == dept_in.code)
    if existing:
        raise HTTPException(status_code=400, detail="Department with this code already exists")
    
    new_dept = Department(**dept_in.dict())
    await new_dept.insert()
    
    await log_employee_action(
        employee_id=str(admin.id),
        action_type="create_department",
        description=f"Created department {new_dept.name}",
        target_type="department",
        target_id=str(new_dept.id)
    )
    
    return new_dept

@router.put("/{dept_id}", response_model=Department)
async def update_department(
    dept_id: str,
    dept_in: DepartmentUpdate,
    admin: Employee = Depends(require_employee_permission(Permission.MANAGE_EMPLOYEES))
):
    """Update department details"""
    dept = await Department.get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    update_data = dept_in.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(dept, key, value)
    
    await dept.save()
    
    await log_employee_action(
        employee_id=str(admin.id),
        action_type="update_department",
        description=f"Updated department {dept.name}",
        target_type="department",
        target_id=str(dept.id)
    )
    
    return dept

@router.delete("/{dept_id}")
async def delete_department(
    dept_id: str,
    admin: Employee = Depends(require_employee_permission(Permission.MANAGE_EMPLOYEES))
):
    """Delete a department"""
    dept = await Department.get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check for assigned employees
    usage = await Employee.find(Employee.department_id == dept_id).count()
    if usage > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete department: {usage} employees are still assigned")
        
    await dept.delete()
    
    await log_employee_action(
        employee_id=str(admin.id),
        action_type="delete_department",
        description=f"Deleted department {dept.name}",
        target_type="department",
        target_id=dept_id
    )
    
    return {"status": "success"}
