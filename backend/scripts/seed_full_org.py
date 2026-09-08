import asyncio
import os
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.config import settings
from src.core.database import init_db, close_db
from src.models.role import Role
from src.models.department import Department, DepartmentStatus
from src.models.admin_rbac import Permission, AdminRole
from src.models.employee import Employee

async def seed():
    print("🚀 Initializing DB...")
    await init_db()
    
    # 1. Departments Seed Data
    depts_data = [
        {"name": "Dirección General", "code": "DIR", "description": "Gestión estratégica y liderazgo global", "location": "Oficina Central"},
        {"name": "Recursos Humanos", "code": "RH", "description": "Gestión de personal, bienestar y talento", "location": "Oficina Central"},
        {"name": "Finanzas", "code": "FIN", "description": "Control financiero, contable y presupuestario", "location": "Oficina Central"},
        {"name": "Tecnología e Innovación", "code": "TI", "description": "Infraestructura, desarrollo y seguridad informática", "location": "Remoto"},
        {"name": "Marketing", "code": "MKT", "description": "Publicidad, branding y comunicación estratégica", "location": "Remoto"},
        {"name": "Ventas / Comercial", "code": "COM", "description": "Relación con clientes y gestión de ventas", "location": "Oficina Central"},
        {"name": "Operaciones / Logística", "code": "OPS", "description": "Producción, distribución y control de inventarios", "location": "Planta de Operaciones"},
        {"name": "Atención al Cliente", "code": "ATC", "description": "Soporte postventa y resolución de dudas", "location": "Remoto"},
        {"name": "Legal / Compliance", "code": "LGL", "description": "Contratos, regulaciones y cumplimiento normativo", "location": "Oficina Central"},
        {"name": "I+D", "code": "ID", "description": "Innovación y mejora continua de productos", "location": "Laboratorio de Innovación"}
    ]
    
    dept_map = {} # code -> id
    print("🏢 Seeding Departments...")
    for d_data in depts_data:
        existing = await Department.find_one(Department.code == d_data["code"])
        if not existing:
            dept = Department(**d_data, status=DepartmentStatus.ACTIVE)
            await dept.insert()
            print(f"✅ Created department: {dept.name}")
            dept_map[dept.code] = str(dept.id)
        else:
            dept_map[existing.code] = str(existing.id)
            
    # 2. Specialized Roles Seed Data
    specialized_roles = [
        # RH
        {"dept": "RH", "name": "Gestor de Empleados", "slug": "gestor_empleados", "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES, Permission.SUSPEND_USERS, Permission.ASSIGN_ROLES], "lvl": 10},
        {"dept": "RH", "name": "Especialista en Nómina", "slug": "especialista_nomina", "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_LEAVE_REQUESTS, Permission.VIEW_FINANCES, Permission.HANDLE_INVOICES], "lvl": 10},
        {"dept": "RH", "name": "Reclutador", "slug": "reclutador", "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES], "lvl": 15},
        # Finanzas
        {"dept": "FIN", "name": "Contador", "slug": "contador", "perms": [Permission.VIEW_FINANCES, Permission.HANDLE_INVOICES, Permission.VIEW_METRICS], "lvl": 10},
        {"dept": "FIN", "name": "Analista Financiero", "slug": "analista_financiero", "perms": [Permission.VIEW_FINANCES, Permission.VIEW_METRICS, Permission.EXPORT_METRICS, Permission.APPROVE_BUDGETS], "lvl": 10},
        {"dept": "FIN", "name": "Gestor de Pagos", "slug": "gestor_pagos", "perms": [Permission.VIEW_FINANCES, Permission.PROCESS_REFUNDS, Permission.MANAGE_SUBSCRIPTIONS], "lvl": 12},
        # TI
        {"dept": "TI", "name": "Desarrollador", "slug": "desarrollador", "perms": [Permission.VIEW_CONFIG, Permission.MANAGE_INTEGRATIONS, Permission.DEPLOY_UPDATES], "lvl": 12},
        {"dept": "TI", "name": "Administrador de Sistemas", "slug": "sysadmin", "perms": [Permission.VIEW_CONFIG, Permission.EDIT_CONFIG, Permission.ACCESS_LOGS, Permission.MANAGE_BACKUPS, Permission.RESET_PASSWORDS], "lvl": 8},
        {"dept": "TI", "name": "Soporte Técnico", "slug": "soporte_ti", "perms": [Permission.VIEW_USERS, Permission.HANDLE_TICKETS, Permission.RESET_PASSWORDS], "lvl": 15},
        # Marketing
        {"dept": "MKT", "name": "Community Manager", "slug": "community_manager", "perms": [Permission.MANAGE_SOCIAL_ACCOUNTS, Permission.SCHEDULE_POSTS, Permission.VIEW_METRICS], "lvl": 15},
        {"dept": "MKT", "name": "Especialista en Campañas", "slug": "especialista_campanas", "perms": [Permission.VIEW_CAMPAIGNS, Permission.CREATE_CAMPAIGNS, Permission.MANAGE_CAMPAIGNS, Permission.VIEW_EVENTS, Permission.CREATE_EVENTS], "lvl": 10},
        # Ventas
        {"dept": "COM", "name": "Ejecutivo de Ventas", "slug": "ejecutivo_ventas", "perms": [Permission.MANAGE_LEADS, Permission.TRACK_SALES, Permission.VIEW_CAMPAIGNS, Permission.ASSIGN_CLIENTS], "lvl": 12},
        # ATC
        {"dept": "ATC", "name": "Agente de Soporte", "slug": "agente_soporte", "perms": [Permission.VIEW_USERS, Permission.HANDLE_TICKETS, Permission.CLOSE_TICKETS, Permission.SEND_NOTIFICATIONS], "lvl": 15},
        {"dept": "ATC", "name": "Gestor de Tickets", "slug": "gestor_tickets", "perms": [Permission.VIEW_REPORTS, Permission.ASSIGN_REPORTS, Permission.FLAG_CONTENT], "lvl": 10},
        # Legal
        {"dept": "LGL", "name": "Especialista en Compliance", "slug": "compliance", "perms": [Permission.VIEW_REPORTS, Permission.HANDLE_REPORTS, Permission.APPROVE_POLICIES, Permission.AUDIT_ROLES, Permission.ACCESS_LOGS], "lvl": 8},
    ]
    
    print("🎭 Seeding Specialized Roles...")
    for r_data in specialized_roles:
        existing = await Role.find_one(Role.slug == r_data["slug"])
        if not existing:
            dept_id = dept_map.get(r_data["dept"])
            role = Role(
                name=r_data["name"],
                slug=r_data["slug"],
                description=f"Rol especializado para el departamento de {r_data['dept']}",
                permissions=r_data["perms"],
                hierarchy_level=r_data["lvl"],
                department_id=dept_id,
                is_system_role=False
            )
            await role.insert()
            print(f"✅ Created role: {role.slug} in dept {r_data['dept']}")
            
    print("🏁 Seeding complete!")
    await close_db()

if __name__ == "__main__":
    asyncio.run(seed())
