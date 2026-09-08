"""
Admin Bootstrap Endpoints

⚠️ WARNING: These endpoints are for initial setup only.
They should be DISABLED or REMOVED in production environments.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from src.models.user import User
from src.models.admin_rbac import AdminUser, AdminRole
from src.models.employee import Employee
from src.api.auth import get_current_user


router = APIRouter()


@router.post("/create-super-admin")
async def create_super_admin_bootstrap(
    current_user: User = Depends(get_current_user)
):
    """
    Bootstrap endpoint to create initial super admin.
    Only works if NO super admins exist yet.
    
    ⚠️ THIS ENDPOINT SHOULD BE REMOVED IN PRODUCTION
    
    Returns:
        dict: Success message with admin details
    
    Raises:
        HTTPException: If super admin already exists
    """
    
    # Check if any super admin exists
    existing_super_admin = await AdminUser.find_one(
        AdminUser.role == AdminRole.SUPER_ADMIN,
        AdminUser.is_active == True
    )
    
    if existing_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin already exists. Bootstrap disabled for security."
        )
    
    # Check if current user is already an admin
    existing_admin = await AdminUser.find_one(
        AdminUser.user_id == str(current_user.id)
    )
    
    if existing_admin:
        # Upgrade to super admin
        existing_admin.role = AdminRole.SUPER_ADMIN
        existing_admin.is_active = True
        await existing_admin.save()
        message = "Upgraded to super admin"
    else:
        # Create new super admin
        admin_user = AdminUser(
            user_id=str(current_user.id),
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        await admin_user.insert()
        message = "Super admin created successfully"
    
    return {
        "message": message,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "nickname": current_user.nickname,
        "role": AdminRole.SUPER_ADMIN,
        "permissions": "ALL"
    }


@router.post("/initialize-organization")
async def initialize_organization(
    admin: User = Depends(get_current_user)
):
    """
    Initialize the organizational system with default roles and departments.
    Can be run multiple times; it will only create what's missing.
    """
    from src.models.role import Role
    from src.models.department import Department, DepartmentStatus
    from src.models.admin_rbac import Permission
    
    # 1. Create Core Roles
    roles_to_create = [
        {
            "name": "Super Administrador",
            "slug": "superadmin",
            "description": "Acceso total al sistema",
            "permissions": [p for p in Permission],
            "hierarchy_level": 0,
            "is_system_role": True
        },
        {
            "name": "Administrador",
            "slug": "admin",
            "description": "Gestión general de la organización",
            "permissions": [
                Permission.VIEW_USERS, Permission.EDIT_USERS, 
                Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES,
                Permission.VIEW_METRICS, Permission.VIEW_REPORTS
            ],
            "hierarchy_level": 1,
            "is_system_role": True
        },
        {
            "name": "Recursos Humanos",
            "slug": "hr",
            "description": "Gestión de empleados y departamentos",
            "permissions": [
                Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES,
                Permission.ASSIGN_ROLES
            ],
            "hierarchy_level": 2,
            "is_system_role": True
        }
    ]
    
    created_roles = []
    for r_data in roles_to_create:
        existing = await Role.find_one(Role.slug == r_data["slug"])
        if not existing:
            role = Role(**r_data)
            await role.insert()
            created_roles.append(role.slug)
            
    # 2. Create Default Departments
    depts_to_create = [
        {
            "name": "Dirección General",
            "code": "DIR",
            "description": "Gestión estratégica y liderazgo global",
            "status": DepartmentStatus.ACTIVE,
            "location": "Oficina Central"
        },
        {
            "name": "Recursos Humanos",
            "code": "RH",
            "description": "Gestión de personal, bienestar y talento",
            "status": DepartmentStatus.ACTIVE,
            "location": "Oficina Central"
        },
        {
            "name": "Finanzas",
            "code": "FIN",
            "description": "Control financiero, contable y presupuestario",
            "status": DepartmentStatus.ACTIVE,
            "location": "Oficina Central"
        },
        {
            "name": "Tecnología e Innovación",
            "code": "TI",
            "description": "Infraestructura, desarrollo y seguridad informática",
            "status": DepartmentStatus.ACTIVE,
            "location": "Remoto"
        },
        {
            "name": "Marketing",
            "code": "MKT",
            "description": "Publicidad, branding y comunicación estratégica",
            "status": DepartmentStatus.ACTIVE,
            "location": "Remoto"
        },
        {
            "name": "Ventas / Comercial",
            "code": "COM",
            "description": "Relación con clientes y gestión de ventas",
            "status": DepartmentStatus.ACTIVE,
            "location": "Oficina Central"
        },
        {
            "name": "Operaciones / Logística",
            "code": "OPS",
            "description": "Producción, distribución y control de inventarios",
            "status": DepartmentStatus.ACTIVE,
            "location": "Planta de Operaciones"
        },
        {
            "name": "Atención al Cliente",
            "code": "ATC",
            "description": "Soporte postventa y resolución de dudas",
            "status": DepartmentStatus.ACTIVE,
            "location": "Remoto"
        },
        {
            "name": "Legal / Compliance",
            "code": "LGL",
            "description": "Contratos, regulaciones y cumplimiento normativo",
            "status": DepartmentStatus.ACTIVE,
            "location": "Oficina Central"
        },
        {
            "name": "I+D",
            "code": "ID",
            "description": "Innovación y mejora continua de productos",
            "status": DepartmentStatus.ACTIVE,
            "location": "Laboratorio de Innovación"
        }
    ]
    
    created_depts = []
    for d_data in depts_to_create:
        existing = await Department.find_one(Department.code == d_data["code"])
        if not existing:
            dept = Department(**d_data)
            await dept.insert()
            created_depts.append(dept.code)
            
    # 2.5 Create Specialized Roles by Department
    specialized_roles = [
        {
            "dept_code": "RH",
            "roles": [
                {"name": "Gestor de Empleados", "slug": "gestor_empleados", "description": "Gestión directa de expedientes y estados", "permissions": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES, Permission.SUSPEND_USERS, Permission.ASSIGN_ROLES], "level": 3},
                {"name": "Especialista en Nómina", "slug": "especialista_nomina", "description": "Gestión de pagos y ausencias", "permissions": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_LEAVE_REQUESTS, Permission.VIEW_FINANCES, Permission.HANDLE_INVOICES], "level": 3},
                {"name": "Reclutador", "slug": "reclutador", "description": "Búsqueda y preselección de talento", "permissions": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES], "level": 4},
            ]
        },
        {
            "dept_code": "FIN",
            "roles": [
                {"name": "Contador", "slug": "contador", "description": "Registro contable y fiscal", "permissions": [Permission.VIEW_FINANCES, Permission.HANDLE_INVOICES, Permission.VIEW_METRICS], "level": 3},
                {"name": "Analista Financiero", "slug": "analista_financiero", "description": "Proyecciones y análisis de datos", "permissions": [Permission.VIEW_FINANCES, Permission.VIEW_METRICS, Permission.EXPORT_METRICS, Permission.APPROVE_BUDGETS], "level": 3},
                {"name": "Gestor de Pagos", "slug": "gestor_pagos", "description": "Ejecución de reembolsos y suscripciones", "permissions": [Permission.VIEW_FINANCES, Permission.PROCESS_REFUNDS, Permission.MANAGE_SUBSCRIPTIONS], "level": 4},
            ]
        },
        {
            "dept_code": "TI",
            "roles": [
                {"name": "Desarrollador", "slug": "desarrollador", "description": "Desarrollo y mantenimiento", "permissions": [Permission.VIEW_CONFIG, Permission.MANAGE_INTEGRATIONS, Permission.DEPLOY_UPDATES], "level": 4},
                {"name": "Administrador de Sistemas", "slug": "sysadmin", "description": "Infraestructura y seguridad", "permissions": [Permission.VIEW_CONFIG, Permission.EDIT_CONFIG, Permission.ACCESS_LOGS, Permission.MANAGE_BACKUPS, Permission.RESET_PASSWORDS], "level": 3},
                {"name": "Soporte Técnico", "slug": "soporte_ti", "description": "Asistencia técnica interna", "permissions": [Permission.VIEW_USERS, Permission.HANDLE_TICKETS, Permission.RESET_PASSWORDS], "level": 4},
            ]
        },
        {
            "dept_code": "MKT",
            "roles": [
                {"name": "Community Manager", "slug": "community_manager", "description": "Gestión de redes y comunicación", "permissions": [Permission.MANAGE_SOCIAL_ACCOUNTS, Permission.SCHEDULE_POSTS, Permission.VIEW_METRICS], "level": 4},
                {"name": "Especialista en Campañas", "slug": "especialista_campanas", "description": "Gestión de pauta y eventos", "permissions": [Permission.VIEW_CAMPAIGNS, Permission.CREATE_CAMPAIGNS, Permission.MANAGE_CAMPAIGNS, Permission.VIEW_EVENTS, Permission.CREATE_EVENTS, Permission.EDIT_EVENTS], "level": 3},
                {"name": "Diseñador Gráfico", "slug": "disenador_grafico", "description": "Creación de contenido visual y branding", "permissions": [Permission.VIEW_CAMPAIGNS, Permission.VIEW_EVENTS], "level": 4},
            ]
        },
        {
            "dept_code": "COM",
            "roles": [
                {"name": "Ejecutivo de Ventas", "slug": "ejecutivo_ventas", "description": "Cierre de ventas y leads", "permissions": [Permission.MANAGE_LEADS, Permission.TRACK_SALES, Permission.VIEW_CAMPAIGNS, Permission.ASSIGN_CLIENTS], "level": 4},
                {"name": "Gestor de Cuentas", "slug": "gestor_cuentas", "description": "Mantenimiento y fidelización de clientes", "permissions": [Permission.VIEW_USERS, Permission.ASSIGN_CLIENTS, Permission.VIEW_REPORTS], "level": 4},
                {"name": "Representante Comercial", "slug": "rep_comercial", "description": "Prospección y primer contacto", "permissions": [Permission.VIEW_CAMPAIGNS, Permission.MANAGE_LEADS], "level": 4},
            ]
        },
        {
            "dept_code": "OPS",
            "roles": [
                {"name": "Supervisor de Operaciones", "slug": "super_ops", "description": "Control de producción y eficiencia", "permissions": [Permission.VIEW_REPORTS, Permission.EDIT_REPORTS, Permission.ASSIGN_TASKS], "level": 3},
                {"name": "Coordinador Logístico", "slug": "coord_logistico", "description": "Gestión de envíos y cadena de suministro", "permissions": [Permission.TRACK_SHIPMENTS, Permission.MANAGE_INVENTORY, Permission.VIEW_EVENTS], "level": 4},
                {"name": "Gestor de Almacén", "slug": "gestor_almacen", "description": "Control de stock y suministros", "permissions": [Permission.MANAGE_INVENTORY, Permission.VIEW_REPORTS], "level": 4},
            ]
        },
        {
            "dept_code": "ATC",
            "roles": [
                {"name": "Agente de Soporte", "slug": "agente_soporte", "description": "Atención directa a usuarios", "permissions": [Permission.VIEW_USERS, Permission.HANDLE_TICKETS, Permission.CLOSE_TICKETS, Permission.SEND_NOTIFICATIONS], "level": 4},
                {"name": "Gestor de Tickets", "slug": "gestor_tickets", "description": "Escalación y calidad de soporte", "permissions": [Permission.VIEW_REPORTS, Permission.ASSIGN_REPORTS, Permission.FLAG_CONTENT], "level": 3},
                {"name": "Especialista en Satisfacción", "slug": "especialista_satisfaccion", "description": "Análisis de NPS y feedback", "permissions": [Permission.VIEW_METRICS, Permission.EXPORT_METRICS, Permission.VIEW_REPORTS], "level": 4},
            ]
        },
        {
            "dept_code": "LGL",
            "roles": [
                {"name": "Especialista en Compliance", "slug": "compliance", "description": "Auditoría y políticas", "permissions": [Permission.VIEW_REPORTS, Permission.HANDLE_REPORTS, Permission.APPROVE_POLICIES, Permission.AUDIT_ROLES, Permission.ACCESS_LOGS], "level": 3},
                {"name": "Abogado Interno", "slug": "abogado_interno", "description": "Gestión legal y contratos", "permissions": [Permission.HANDLE_CONTRACTS, Permission.APPROVE_POLICIES, Permission.VIEW_REPORTS], "level": 3},
            ]
        }
    ]
    
    created_specialized = []
    for spec in specialized_roles:
        dept = await Department.find_one(Department.code == spec["dept_code"])
        if not dept:
            continue
            
        for r_data in spec["roles"]:
            existing = await Role.find_one(Role.slug == r_data["slug"])
            if not existing:
                new_role = Role(
                    name=r_data["name"],
                    slug=r_data["slug"],
                    description=r_data["description"],
                    permissions=r_data["permissions"],
                    hierarchy_level=r_data["level"],
                    department_id=str(dept.id),
                    is_system_role=False
                )
                await new_role.insert()
                created_specialized.append(new_role.slug)
    employees = await Employee.find_all().to_list()
    migrated_count = 0
    for emp in employees:
        needs_save = False
        
        # If roles is empty but legacy role exists, migrate it
        if not emp.roles and hasattr(emp, 'role') and emp.role:
            # Map legacy AdminRole to slug
            role_map = {
                AdminRole.SUPER_ADMIN: "superadmin",
                AdminRole.MODERATOR: "admin", # Map moderator to admin for now
                AdminRole.SUPPORT: "admin",
                AdminRole.ANALYST: "admin",
                AdminRole.MARKETING: "admin",
                AdminRole.FINANCE: "admin"
            }
            slug = role_map.get(emp.role, "admin")
            emp.roles = [slug]
            needs_save = True
            
        # Ensure 'admin@redthread.com' is always SuperAdmin for safety during dev
        if emp.email == "admin@redthread.com" and "superadmin" not in emp.roles:
            if "superadmin" not in emp.roles:
                emp.roles.append("superadmin")
            needs_save = True
            
        if needs_save:
            await emp.save()
            migrated_count += 1
            
    return {
        "status": "success",
        "roles_created": created_roles,
        "specialized_roles_created": created_specialized,
        "departments_created": created_depts,
        "employees_migrated": migrated_count
    }

@router.get("/check-super-admin")
async def check_super_admin_exists():
    """
    Check if a super admin exists in the system.
    Public endpoint to determine if bootstrap is needed.
    
    Returns:
        dict: Whether super admin exists
    """
    existing_super_admin = await AdminUser.find_one(
        AdminUser.role == AdminRole.SUPER_ADMIN,
        AdminUser.is_active == True
    )
    
    return {
        "super_admin_exists": existing_super_admin is not None,
        "bootstrap_available": existing_super_admin is None
    }
