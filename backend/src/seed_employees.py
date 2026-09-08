import asyncio
import os
import sys
from datetime import datetime

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.core.utils.security import get_password_hash
from src.models.employee import Employee, EmployeeStatus
from src.models.department import Department, DepartmentStatus
from src.models.role import Role
from src.models.admin_rbac import Permission

async def seed_data():
    await init_db()
    print("🚀 Starting seeding process...")

    # 1. Define Departments
    departments_data = [
        {"name": "Gerencia", "code": "ADM", "description": "Alta dirección y administración general"},
        {"name": "Recursos Humanos", "code": "HR", "description": "Gestión de talento y personal"},
        {"name": "Finanzas", "code": "FIN", "description": "Contabilidad, pagos y análisis financiero"},
        {"name": "Tecnología", "code": "TECH", "description": "Desarrollo de software y sistemas"},
        {"name": "Marketing", "code": "MKT", "description": "Publicidad, campañas y diseño"},
        {"name": "Ventas", "code": "SALE", "description": "Ventas y gestión de cuentas"},
        {"name": "Operaciones", "code": "OPS", "description": "Logística y almacén"},
        {"name": "Soporte", "code": "SUPP", "description": "Atención al cliente y tickets"},
        {"name": "Legal", "code": "LEG", "description": "Cumplimiento y asuntos legales"},
    ]

    dept_map = {}
    for d_data in departments_data:
        dept = await Department.find_one(Department.code == d_data["code"])
        if not dept:
            dept = Department(**d_data)
            await dept.insert()
            print(f"✅ Created department: {dept.name}")
        else:
            # Update description if needed
            dept.description = d_data["description"]
            await dept.save()
            print(f"ℹ️ Department already exists: {dept.name}")
        dept_map[d_data["code"]] = str(dept.id)

    # 2. Define Roles
    roles_data = [
        # ADM
        {"slug": "superadmin", "name": "Super Administrador", "dept": "ADM", "perms": [p for p in Permission], "level": 0},
        {"slug": "admin", "name": "Administrador", "dept": "ADM", "perms": [Permission.VIEW_USERS, Permission.EDIT_USERS, Permission.VIEW_METRICS, Permission.VIEW_EMPLOYEES, Permission.VIEW_CONFIG, Permission.VIEW_FINANCES], "level": 1},
        
        # HR
        {"slug": "hr", "name": "Recursos Humanos", "dept": "HR", "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES, Permission.VIEW_USERS], "level": 2},
        {"slug": "gestor_empleados", "name": "Gestor de Empleados", "dept": "HR", "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES, Permission.ASSIGN_ROLES, Permission.MANAGE_LEAVE_REQUESTS], "level": 3},
        {"slug": "especialista_nomina", "name": "Especialista en Nómina", "dept": "HR", "perms": [Permission.VIEW_EMPLOYEES, Permission.VIEW_FINANCES, Permission.HANDLE_CONTRACTS, Permission.HANDLE_INVOICES], "level": 3},
        {"slug": "reclutador", "name": "Reclutador", "dept": "HR", "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES], "level": 4},
        
        # FIN
        {"slug": "contador", "name": "Contador", "dept": "FIN", "perms": [Permission.VIEW_FINANCES, Permission.EDIT_FINANCES, Permission.HANDLE_INVOICES, Permission.APPROVE_BUDGETS], "level": 3},
        {"slug": "analista_financiero", "name": "Analista Financiero", "dept": "FIN", "perms": [Permission.VIEW_FINANCES, Permission.VIEW_METRICS, Permission.EXPORT_METRICS, Permission.VIEW_USERS], "level": 3},
        {"slug": "gestor_pagos", "name": "Gestor de Pagos", "dept": "FIN", "perms": [Permission.VIEW_FINANCES, Permission.PROCESS_REFUNDS, Permission.MANAGE_SUBSCRIPTIONS, Permission.VIEW_USERS], "level": 4},
        
        # TECH
        {"slug": "desarrollador", "name": "Desarrollador", "dept": "TECH", "perms": [Permission.VIEW_CONFIG, Permission.ACCESS_LOGS, Permission.DEPLOY_UPDATES], "level": 4},
        {"slug": "sysadmin", "name": "Administrador de Sistemas", "dept": "TECH", "perms": [Permission.VIEW_CONFIG, Permission.EDIT_CONFIG, Permission.ACCESS_LOGS, Permission.MANAGE_INTEGRATIONS, Permission.MANAGE_BACKUPS], "level": 3},
        {"slug": "soporte_ti", "name": "Soporte Técnico", "dept": "TECH", "perms": [Permission.VIEW_CONFIG, Permission.ACCESS_LOGS, Permission.RESET_PASSWORDS], "level": 4},
        
        # MKT
        {"slug": "community_manager", "name": "Community Manager", "dept": "MKT", "perms": [Permission.VIEW_CAMPAIGNS, Permission.MANAGE_SOCIAL_ACCOUNTS, Permission.SCHEDULE_POSTS], "level": 4},
        {"slug": "especialista_campanas", "name": "Especialista en Campañas", "dept": "MKT", "perms": [Permission.VIEW_CAMPAIGNS, Permission.CREATE_CAMPAIGNS, Permission.MANAGE_CAMPAIGNS, Permission.VIEW_METRICS, Permission.SEND_NOTIFICATIONS, Permission.VIEW_USERS], "level": 3},
        {"slug": "disenador_grafico", "name": "Diseñador Gráfico", "dept": "MKT", "perms": [Permission.VIEW_CAMPAIGNS, Permission.MODERATE_CONTENT], "level": 4},
        
        # SALE
        {"slug": "ejecutivo_ventas", "name": "Ejecutivo de Ventas", "dept": "SALE", "perms": [Permission.VIEW_USERS, Permission.MANAGE_LEADS, Permission.TRACK_SALES, Permission.ASSIGN_CLIENTS], "level": 4},
        {"slug": "gestor_cuentas", "name": "Gestor de Cuentas", "dept": "SALE", "perms": [Permission.VIEW_USERS, Permission.MANAGE_LEADS, Permission.ASSIGN_CLIENTS], "level": 4},
        {"slug": "rep_comercial", "name": "Representante Comercial", "dept": "SALE", "perms": [Permission.VIEW_USERS, Permission.TRACK_SALES], "level": 4},
        
        # OPS
        {"slug": "super_ops", "name": "Supervisor de Operaciones", "dept": "OPS", "perms": [Permission.VIEW_EVENTS, Permission.ASSIGN_TASKS, Permission.MANAGE_INVENTORY], "level": 3},
        {"slug": "coord_logistico", "name": "Coordinador Logístico", "dept": "OPS", "perms": [Permission.VIEW_EVENTS, Permission.TRACK_SHIPMENTS, Permission.ASSIGN_TASKS], "level": 4},
        {"slug": "gestor_almacen", "name": "Gestor de Almacén", "dept": "OPS", "perms": [Permission.VIEW_EVENTS, Permission.MANAGE_INVENTORY], "level": 4},
        
        # SUPP
        {"slug": "agente_soporte", "name": "Agente de Soporte", "dept": "SUPP", "perms": [Permission.VIEW_TICKETS, Permission.HANDLE_TICKETS, Permission.CLOSE_TICKETS, Permission.VIEW_USERS], "level": 4},
        {"slug": "gestor_tickets", "name": "Gestor de Tickets", "dept": "SUPP", "perms": [Permission.VIEW_TICKETS, Permission.HANDLE_TICKETS, Permission.ASSIGN_REPORTS], "level": 3},
        {"slug": "especialista_satisfaccion", "name": "Especialista en Satisfacción", "dept": "SUPP", "perms": [Permission.VIEW_TICKETS, Permission.VIEW_METRICS, Permission.EXPORT_METRICS, Permission.SEND_NOTIFICATIONS], "level": 4},
        
        # LEG
        {"slug": "compliance", "name": "Especialista en Compliance", "dept": "LEG", "perms": [Permission.VIEW_USERS, Permission.VIEW_REPORTS, Permission.AUDIT_ROLES, Permission.APPROVE_POLICIES, Permission.VIEW_CONFIG], "level": 3},
        {"slug": "abogado_interno", "name": "Abogado Interno", "dept": "LEG", "perms": [Permission.VIEW_REPORTS, Permission.APPROVE_POLICIES, Permission.VIEW_USERS], "level": 3},
    ]

    for r_data in roles_data:
        role = await Role.find_one(Role.slug == r_data["slug"])
        dept_id = dept_map.get(r_data["dept"])
        if not role:
            role = Role(
                slug=r_data["slug"],
                name=r_data["name"],
                department_id=dept_id,
                permissions=r_data["perms"],
                hierarchy_level=r_data["level"],
                is_system_role=True if r_data["slug"] in ["superadmin", "admin"] else False
            )
            await role.insert()
            print(f"✅ Created role: {role.name}")
        else:
            role.permissions = r_data["perms"]
            role.department_id = dept_id
            role.hierarchy_level = r_data["level"]
            await role.save()
            print(f"ℹ️ Updated role: {role.name}")

    # 3. Create Employees
    employee_count = 0
    hashed_pw = get_password_hash("RedThread#2025")
    hire_date = datetime(2025, 12, 23)

    for i, r_data in enumerate(roles_data):
        email = f"{r_data['slug']}@redthread.com"
        emp = await Employee.find_one(Employee.email == email)
        
        first_name = r_data["name"].split()[0]
        last_name = "Test"
        if r_data["slug"] == "superadmin":
            first_name, last_name = "Mateo", "Super"
        elif r_data["slug"] == "admin":
            first_name, last_name = "Sofia", "Admin"
        elif r_data["slug"] == "hr":
            first_name, last_name = "Valentina", "HR"
            
        emp_id = f"EMP-{1000 + i}"

        if not emp:
            emp = Employee(
                email=email,
                hashed_password=hashed_pw,
                employee_id=emp_id,
                first_name=first_name,
                last_name=last_name,
                roles=[r_data["slug"]],
                department_id=dept_map.get(r_data["dept"]),
                status=EmployeeStatus.ACTIVE,
                hire_date=hire_date,
                is_email_verified=True
            )
            await emp.insert()
            print(f"✅ Created employee: {emp.display_name} ({email})")
            employee_count += 1
        else:
            emp.roles = [r_data["slug"]]
            emp.department_id = dept_map.get(r_data["dept"])
            await emp.save()
            print(f"ℹ️ Employee already exists: {emp.display_name} ({email})")

    print(f"\n🎉 Finished seeding! Created {employee_count} new employees.")

if __name__ == "__main__":
    asyncio.run(seed_data())
