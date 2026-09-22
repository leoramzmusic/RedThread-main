from typing import Optional, List
from datetime import datetime
import os
import uuid
from fastapi import HTTPException, UploadFile
from src.models.employee import Employee, EmployeeStatus
from src.models.admin_rbac import AdminRole
from src.models.employee_audit import EmployeeAudit
from src.core.utils.security import get_password_hash, verify_password

AVATAR_DIR = "static/uploads/avatars"
ALLOWED_AVATAR_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_AVATAR_SIZE = 3 * 1024 * 1024
ALLOWED_AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


class EmployeeService:
    async def save_avatar(
        self,
        employee: Employee,
        file: UploadFile,
        admin_id: str,
        admin_name: str,
    ) -> str:
        """Validate, store and audit a 1:1 avatar upload. Returns the public URL."""
        os.makedirs(AVATAR_DIR, exist_ok=True)
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_AVATAR_EXT:
            raise HTTPException(status_code=400, detail="Formato no permitido. Usa JPG o PNG")
        if file.content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
        filename = f"avatar_{employee.id}_{uuid.uuid4().hex}{ext}"
        path = os.path.join(AVATAR_DIR, filename)
        size = 0
        try:
            with open(path, "wb") as out:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_AVATAR_SIZE:
                        out.close()
                        if os.path.exists(path):
                            os.remove(path)
                        raise HTTPException(status_code=413, detail="Imagen supera 3MB")
                    out.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        url = f"/static/uploads/avatars/{filename}"
        old = employee.avatar
        employee.avatar = url
        employee.updated_at = datetime.utcnow()
        await employee.save()
        await EmployeeAudit(
            employee_id=str(employee.id),
            admin_id=admin_id,
            admin_name=admin_name,
            action="update",
            field_name="avatar",
            old_value=old or "",
            new_value=url,
            change_summary="Foto de perfil actualizada (para credencial/documentos)",
        ).insert()
        return url

    async def create_employee(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        employee_id: str,
        roles: List[str],
        department_id: Optional[str] = None,
        phone: Optional[str] = None,
        birth_date: Optional[datetime] = None,
        hire_date: Optional[datetime] = None,
        supervisor_id: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        is_2fa_enabled: bool = False
    ) -> Employee:
        """Create a new employee"""
        # Normalize email to lowercase
        email = email.lower().strip()
        hashed_password = get_password_hash(password)
        
        employee = Employee(
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            employee_id=employee_id,
            roles=roles,
            department_id=department_id,
            phone=phone,
            birth_date=birth_date,
            hire_date=hire_date or datetime.utcnow(),
            supervisor_id=supervisor_id,
            country=country,
            city=city,
            is_2fa_enabled=is_2fa_enabled,
            status=EmployeeStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await employee.insert()
        return employee

    async def authenticate_employee(self, email: str, password: str) -> Optional[Employee]:
        """Authenticate employee by email and password"""
        # Normalize email and strip password of any accidental whitespace
        email = email.lower().strip()
        password = password.strip()
        
        employee = await Employee.find_one(Employee.email == email)
        
        if not employee:
            print(f"[AUTH DEBUG] Employee not found: {email}")
            return None
            
        if not verify_password(password, employee.hashed_password):
            print(f"[AUTH DEBUG] Invalid password for: {email} (Length: {len(password)})")
            return None
            
        if employee.status != EmployeeStatus.ACTIVE:
            print(f"[AUTH DEBUG] Employee NOT ACTIVE: {email}")
            return None
            
        print(f"[AUTH DEBUG] Authentication successful: {email}")
        return employee

    async def update_last_login(self, employee_id: str):
        """Update last login timestamp"""
        employee = await Employee.get(employee_id)
        if employee:
            employee.last_login_at = datetime.utcnow()
            await employee.save()

    async def get_by_email(self, email: str) -> Optional[Employee]:
        return await Employee.find_one(Employee.email == email.lower().strip())

    async def get_by_id(self, employee_id: str) -> Optional[Employee]:
        return await Employee.find_one(Employee.employee_id == employee_id)

    async def update_employee(
        self,
        id: str,
        update_data: dict,
        admin_id: str,
        admin_name: str
    ) -> Optional[Employee]:
        """Update employee with audit logging"""
        employee = await Employee.get(id)
        if not employee:
            return None

        # Track changes for audit
        audits = []
        for field, new_value in update_data.items():
            # Special handling for password BEFORE hasattr check
            if field == "password":
                # Hash the new password
                hashed_new = get_password_hash(new_value)
                old_hash = employee.hashed_password
                
                # Only update if different
                if old_hash != hashed_new:
                    audits.append(EmployeeAudit(
                        employee_id=str(employee.id),
                        admin_id=admin_id,
                        admin_name=admin_name,
                        action="update",
                        field_name="hashed_password",
                        old_value="[REDACTED]",
                        new_value="[HASH]",
                        change_summary="Contraseña reseteada"
                    ))
                    setattr(employee, "hashed_password", hashed_new)
                continue
            
            # Regular field updates
            if not hasattr(employee, field):
                continue
            
            old_value = getattr(employee, field)
            
            # Simple equality check for audit
            if old_value != new_value:
                summary = f"Cambio en {field}"

                audits.append(EmployeeAudit(
                    employee_id=str(employee.id),
                    admin_id=admin_id,
                    admin_name=admin_name,
                    action="update",
                    field_name=field,
                    old_value=str(old_value) if old_value is not None else None,
                    new_value=str(new_value) if new_value is not None else None,
                    change_summary=summary
                ))
                setattr(employee, field, new_value)

        if audits:
            employee.updated_at = datetime.utcnow()
            await employee.save()
            # Batch insert audits
            await EmployeeAudit.insert_many(audits)
            
        return employee

    async def get_audit_logs(self, employee_id: str) -> List[EmployeeAudit]:
        """Get history of changes for an employee"""
        return await EmployeeAudit.find(EmployeeAudit.employee_id == employee_id).sort("-created_at").to_list()

employee_service = EmployeeService()
