from beanie import Document, Indexed
from pydantic import Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .admin_rbac import AdminRole, Permission

class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class Employee(Document):
    """
    Dedicated Employee profile for Red Thread Admin Portal.
    Completely separate from the User collection.
    """
    
    # Identity
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    employee_id: Indexed(str, unique=True)
    
    # Personal Info
    first_name: str
    last_name: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    
    # Location
    country: Optional[str] = None
    city: Optional[str] = None
    
    # Role & Organizational Access
    # Now supports multiple roles (slugs) and a specific department
    roles: List[str] = Field(default_factory=list) # List of Role.slug
    department_id: Optional[str] = None # Reference to Department.id
    area: Optional[str] = None  # Legacy area field, kept for compatibility or secondary grouping
    role: Optional[AdminRole] = None  # Legacy role field for backward compatibility
    
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    hire_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Hierarchy
    supervisor_id: Optional[str] = None  # Reference to another Employee.id
    
    # Security & Audit
    is_2fa_enabled: bool = False
    is_email_verified: bool = False
    is_phone_verified: bool = False
    last_login_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Internal
    internal_notes: Optional[str] = None
    
    # Theme Preference (independent from user portal)
    admin_theme_mode: str = "light"  # light, dark
    admin_visual_theme: str = "redThread"  # redThread, premium, vip, blue, purple, pink, green, sakura, halloween, christmas
    
    class Settings:
        name = "employees"
        indexes = [
            "email",
            "employee_id",
            "status",
            "department_id",
            "roles",
            "country",
            "city"
        ]

    @property
    def display_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
        
    async def has_permission(self, permission: Permission) -> bool:
        """Check if employee has a specific permission (Async version)"""
        if self.status != EmployeeStatus.ACTIVE:
            return False
            
        from .role import Role
        
        # Check permissions from all roles
        roles_data = await Role.find({"slug": {"$in": self.roles}, "is_active": True}).to_list()
        for r in roles_data:
            if permission in r.permissions:
                return True
                
        # SuperAdmin check (shortcut)
        if "superadmin" in self.roles:
            return True

        # Legacy role check
        if self.role:
            from .admin_rbac import ROLE_PERMISSIONS
            role_perms = ROLE_PERMISSIONS.get(self.role, [])
            if permission in role_perms:
                return True
            if self.role == AdminRole.SUPER_ADMIN:
                return True
            
        return False

    async def has_all_permissions(self, permissions: List[Permission]) -> bool:
        """Check if employee has all of the specified permissions"""
        for p in permissions:
            if not await self.has_permission(p):
                return False
        return True
        return True

    async def get_all_permissions(self) -> List[Permission]:
        """Get all permissions for this employee (Async)"""
        if self.status != EmployeeStatus.ACTIVE:
            return []
            
        all_perms = set()
        from .role import Role
        
        # Check permissions from all roles
        roles_data = await Role.find({"slug": {"$in": self.roles}, "is_active": True}).to_list()
        for r in roles_data:
            all_perms.update(r.permissions)
            
        # SuperAdmin shortcut
        if "superadmin" in self.roles:
            from .admin_rbac import Permission
            all_perms.update([p for p in Permission])

        # Legacy role perms
        if self.role:
            from .admin_rbac import ROLE_PERMISSIONS
            all_perms.update(ROLE_PERMISSIONS.get(self.role, []))
            if self.role == AdminRole.SUPER_ADMIN:
                from .admin_rbac import Permission
                all_perms.update([p for p in Permission])
            
        return list(all_perms)

    async def has_any_permission(self, permissions: List[Permission]) -> bool:
        """Check if employee has any of the specified permissions"""
        for p in permissions:
            if await self.has_permission(p):
                return True
        return False
