from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from .admin_rbac import Permission

class Role(Document):
    """
    Dynamic Role document for RBAC.
    Allows creating custom roles with specific permissions.
    """
    
    name: Indexed(str, unique=True) # e.g., "Supervisor de TI", "Marketing Manager"
    slug: Indexed(str, unique=True) # e.g., "supervisor_ti", "marketing_manager"
    description: Optional[str] = None
    department_id: Optional[str] = None # Reference to Department.id
    
    # Permissions
    permissions: List[Permission] = Field(default_factory=list)
    
    # Hierarchy & Status
    hierarchy_level: int = 10 # Lower number = Higher hierarchy
    is_active: bool = True
    is_system_role: bool = False # Roles like SuperAdmin shouldn't be deleted easily
    
    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "roles"
        indexes = [
            "name",
            "slug",
            "is_active",
            "hierarchy_level"
        ]

    @classmethod
    async def get_by_slug(cls, slug: str) -> Optional["Role"]:
        return await cls.find_one(cls.slug == slug)
