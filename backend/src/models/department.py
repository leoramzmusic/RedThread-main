from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DepartmentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class Department(Document):
    """
    Organizational department for Red Thread.
    Defines areas, responsibility, and hierarchical structure.
    """
    
    # Basic Info
    name: Indexed(str, unique=True)
    code: Indexed(str, unique=True)  # Internal code (e.g., TI, HR, MKT)
    description: Optional[str] = None
    status: DepartmentStatus = DepartmentStatus.ACTIVE
    
    # Organizational
    head_id: Optional[str] = None  # Employee ID of the supervisor/manager
    location: Optional[str] = None  # Physical or regional location
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    
    # Metrics/Control
    max_employees: Optional[int] = None
    
    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "departments"
        indexes = [
            "name",
            "code",
            "status",
            "head_id"
        ]

    async def get_employee_count(self) -> int:
        """Count employees assigned to this department"""
        from .employee import Employee
        return await Employee.find(Employee.department_id == str(self.id)).count()
