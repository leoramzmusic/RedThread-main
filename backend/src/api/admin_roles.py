from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from src.models.role import Role
from src.models.admin_rbac import Permission, AdminUser
from src.core.middleware.rbac import require_permission, log_admin_action
from src.models.employee import Employee
from pydantic import BaseModel

router = APIRouter(tags=["Admin Roles"])

class RoleCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    permissions: List[Permission]
    hierarchy_level: int = 10
    is_active: bool = True

class RoleUpdate(BaseModel):
    name: str = None
    description: str = None
    permissions: List[Permission] = None
    hierarchy_level: int = None
    is_active: bool = None

@router.get("/", response_model=List[Role])
async def list_roles(admin: Employee = Depends(require_permission(Permission.VIEW_EMPLOYEES))):
    """List all organizational roles"""
    return await Role.find_all().to_list()

@router.get("/permissions")
async def list_available_permissions(admin: Employee = Depends(require_permission(Permission.ASSIGN_ROLES))):
    """List all available granular permissions in the system"""
    return [{"id": p.name, "name": p.value} for p in Permission]

@router.post("/", response_model=Role)
async def create_role(
    role_in: RoleCreate,
    admin: Employee = Depends(require_permission(Permission.ASSIGN_ROLES))
):
    """Create a new custom role"""
    # Check for duplicate slug
    if await Role.find_one(Role.slug == role_in.slug):
        raise HTTPException(status_code=400, detail="Ya existe un rol con este identificador (slug)")
    
    # Check for duplicate name
    if await Role.find_one(Role.name == role_in.name):
        raise HTTPException(status_code=400, detail="Ya existe un rol con este nombre")
    
    new_role = Role(**role_in.dict())
    await new_role.insert()
    
    await log_admin_action(
        admin_user_id=str(admin.id),
        action_type="create_role",
        description=f"Created role {new_role.name}",
        target_type="role",
        target_id=str(new_role.id)
    )
    
    return new_role

@router.put("/{role_id}", response_model=Role)
async def update_role(
    role_id: str,
    role_in: RoleUpdate,
    admin: Employee = Depends(require_permission(Permission.ASSIGN_ROLES))
):
    """Update an existing role"""
    role = await Role.get(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.is_system_role and role_in.permissions is not None:
         # Prevent removing all permissions from system roles if needed
         pass
         
    update_data = role_in.dict(exclude_unset=True)
    
    # Validation for unique name if changed
    if "name" in update_data and update_data["name"] != role.name:
        if await Role.find_one(Role.name == update_data["name"]):
            raise HTTPException(status_code=400, detail="Ya existe otro rol con ese nombre")
            
    for key, value in update_data.items():
        setattr(role, key, value)
    
    await role.save()
    
    await log_admin_action(
        admin_user_id=str(admin.id),
        action_type="update_role",
        description=f"Updated role {role.name}",
        target_type="role",
        target_id=str(role.id)
    )
    
    return role

@router.delete("/{role_id}")
async def delete_role(
    role_id: str,
    admin: Employee = Depends(require_permission(Permission.ASSIGN_ROLES))
):
    """Delete a custom role"""
    role = await Role.get(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.is_system_role:
        raise HTTPException(status_code=400, detail="System roles cannot be deleted")
        
    # Check if any employee is using this role
    usage = await Employee.find(Employee.roles == role.slug).count()
    if usage > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role: {usage} employees are using it")
        
    await role.delete()
    
    await log_admin_action(
        admin_user_id=str(admin.id),
        action_type="delete_role",
        description=f"Deleted role {role.name}",
        target_type="role",
        target_id=role_id
    )
    
    return {"status": "success"}
