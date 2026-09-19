"""
seed.py — Datos maestros del sistema (departamentos + roles + permisos).

Se ejecuta automáticamente en cada startup de la app (dev, qa, prod, local).
Es completamente IDEMPOTENTE: usa upsert por slug/code, nunca duplica.

NO incluye empleados ni contraseñas — eso es responsabilidad del script
manual `src/seed_employees.py` que solo debe correr una vez por entorno.
"""

from datetime import datetime
from typing import Optional
from src.core.config import settings
from src.models.admin_rbac import Permission
from src.models.role import Role
from src.models.department import Department


# ─── Catálogo de Departamentos ────────────────────────────────────────────────

DEPARTMENTS: list[dict] = [
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


# ─── Catálogo de Roles ────────────────────────────────────────────────────────
# Formato: slug, name, dept_code, permissions[], hierarchy_level, is_system_role

_ALL = [p for p in Permission]

ROLES: list[dict] = [
    # ── Gerencia ──────────────────────────────────────────────────────────────
    {
        "slug": "superadmin",
        "name": "Super Administrador",
        "dept": "ADM",
        "perms": _ALL,
        "level": 0,
        "system": True,
        "description": "Acceso completo a todos los módulos del portal.",
    },
    {
        "slug": "admin",
        "name": "Administrador",
        "dept": "ADM",
        "perms": [
            Permission.VIEW_USERS, Permission.EDIT_USERS,
            Permission.VIEW_METRICS, Permission.VIEW_EMPLOYEES,
            Permission.VIEW_CONFIG, Permission.VIEW_FINANCES,
        ],
        "level": 1,
        "system": True,
        "description": "Administración general con acceso de lectura amplio.",
    },

    # ── Recursos Humanos ──────────────────────────────────────────────────────
    {
        "slug": "hr",
        "name": "Recursos Humanos",
        "dept": "HR",
        "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES, Permission.VIEW_USERS],
        "level": 2,
        "system": False,
        "description": "Gestión de personal y talento humano.",
    },
    {
        "slug": "gestor_empleados",
        "name": "Gestor de Empleados",
        "dept": "HR",
        "perms": [
            Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES,
            Permission.ASSIGN_ROLES, Permission.MANAGE_LEAVE_REQUESTS,
        ],
        "level": 3,
        "system": False,
        "description": "Administra altas, bajas y permisos de empleados.",
    },
    {
        "slug": "especialista_nomina",
        "name": "Especialista en Nómina",
        "dept": "HR",
        "perms": [
            Permission.VIEW_EMPLOYEES, Permission.VIEW_FINANCES,
            Permission.HANDLE_CONTRACTS, Permission.HANDLE_INVOICES,
        ],
        "level": 3,
        "system": False,
        "description": "Procesa nómina y contratos laborales.",
    },
    {
        "slug": "reclutador",
        "name": "Reclutador",
        "dept": "HR",
        "perms": [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES],
        "level": 4,
        "system": False,
        "description": "Selección y contratación de candidatos.",
    },

    # ── Finanzas ──────────────────────────────────────────────────────────────
    {
        "slug": "contador",
        "name": "Contador",
        "dept": "FIN",
        "perms": [
            Permission.VIEW_FINANCES, Permission.EDIT_FINANCES,
            Permission.HANDLE_INVOICES, Permission.APPROVE_BUDGETS,
        ],
        "level": 3,
        "system": False,
        "description": "Contabilidad y gestión de presupuestos.",
    },
    {
        "slug": "analista_financiero",
        "name": "Analista Financiero",
        "dept": "FIN",
        "perms": [
            Permission.VIEW_FINANCES, Permission.VIEW_METRICS,
            Permission.EXPORT_METRICS, Permission.VIEW_USERS,
        ],
        "level": 3,
        "system": False,
        "description": "Análisis de datos financieros y métricas.",
    },
    {
        "slug": "gestor_pagos",
        "name": "Gestor de Pagos",
        "dept": "FIN",
        "perms": [
            Permission.VIEW_FINANCES, Permission.PROCESS_REFUNDS,
            Permission.MANAGE_SUBSCRIPTIONS, Permission.VIEW_USERS,
        ],
        "level": 4,
        "system": False,
        "description": "Gestión de pagos, reembolsos y suscripciones.",
    },

    # ── Tecnología ────────────────────────────────────────────────────────────
    {
        "slug": "desarrollador",
        "name": "Desarrollador",
        "dept": "TECH",
        "perms": [Permission.VIEW_CONFIG, Permission.ACCESS_LOGS, Permission.DEPLOY_UPDATES],
        "level": 4,
        "system": False,
        "description": "Desarrollo y despliegue de software.",
    },
    {
        "slug": "sysadmin",
        "name": "Administrador de Sistemas",
        "dept": "TECH",
        "perms": [
            Permission.VIEW_CONFIG, Permission.EDIT_CONFIG,
            Permission.ACCESS_LOGS, Permission.MANAGE_INTEGRATIONS,
            Permission.MANAGE_BACKUPS,
        ],
        "level": 3,
        "system": False,
        "description": "Administración de infraestructura y configuración del sistema.",
    },
    {
        "slug": "soporte_ti",
        "name": "Soporte Técnico",
        "dept": "TECH",
        "perms": [Permission.VIEW_CONFIG, Permission.ACCESS_LOGS, Permission.RESET_PASSWORDS],
        "level": 4,
        "system": False,
        "description": "Soporte interno de TI y resolución de incidencias.",
    },

    # ── Marketing ─────────────────────────────────────────────────────────────
    {
        "slug": "community_manager",
        "name": "Community Manager",
        "dept": "MKT",
        "perms": [
            Permission.VIEW_CAMPAIGNS, Permission.MANAGE_SOCIAL_ACCOUNTS,
            Permission.SCHEDULE_POSTS,
        ],
        "level": 4,
        "system": False,
        "description": "Gestión de redes sociales y comunidad digital.",
    },
    {
        "slug": "especialista_campanas",
        "name": "Especialista en Campañas",
        "dept": "MKT",
        "perms": [
            Permission.VIEW_CAMPAIGNS, Permission.CREATE_CAMPAIGNS,
            Permission.MANAGE_CAMPAIGNS, Permission.VIEW_METRICS,
            Permission.SEND_NOTIFICATIONS, Permission.VIEW_USERS,
        ],
        "level": 3,
        "system": False,
        "description": "Diseño y ejecución de campañas de marketing.",
    },
    {
        "slug": "disenador_grafico",
        "name": "Diseñador Gráfico",
        "dept": "MKT",
        "perms": [Permission.VIEW_CAMPAIGNS, Permission.MODERATE_CONTENT],
        "level": 4,
        "system": False,
        "description": "Diseño de activos visuales y contenido gráfico.",
    },

    # ── Ventas ────────────────────────────────────────────────────────────────
    {
        "slug": "ejecutivo_ventas",
        "name": "Ejecutivo de Ventas",
        "dept": "SALE",
        "perms": [
            Permission.VIEW_USERS, Permission.MANAGE_LEADS,
            Permission.TRACK_SALES, Permission.ASSIGN_CLIENTS,
        ],
        "level": 4,
        "system": False,
        "description": "Gestión de ventas y pipeline comercial.",
    },
    {
        "slug": "gestor_cuentas",
        "name": "Gestor de Cuentas",
        "dept": "SALE",
        "perms": [Permission.VIEW_USERS, Permission.MANAGE_LEADS, Permission.ASSIGN_CLIENTS],
        "level": 4,
        "system": False,
        "description": "Administración de cuentas de clientes clave.",
    },
    {
        "slug": "rep_comercial",
        "name": "Representante Comercial",
        "dept": "SALE",
        "perms": [Permission.VIEW_USERS, Permission.TRACK_SALES],
        "level": 4,
        "system": False,
        "description": "Representación comercial y seguimiento de ventas.",
    },

    # ── Operaciones ───────────────────────────────────────────────────────────
    {
        "slug": "super_ops",
        "name": "Supervisor de Operaciones",
        "dept": "OPS",
        "perms": [Permission.VIEW_EVENTS, Permission.ASSIGN_TASKS, Permission.MANAGE_INVENTORY],
        "level": 3,
        "system": False,
        "description": "Supervisión de operaciones logísticas.",
    },
    {
        "slug": "coord_logistico",
        "name": "Coordinador Logístico",
        "dept": "OPS",
        "perms": [Permission.VIEW_EVENTS, Permission.TRACK_SHIPMENTS, Permission.ASSIGN_TASKS],
        "level": 4,
        "system": False,
        "description": "Coordinación de envíos y logística operativa.",
    },
    {
        "slug": "gestor_almacen",
        "name": "Gestor de Almacén",
        "dept": "OPS",
        "perms": [Permission.VIEW_EVENTS, Permission.MANAGE_INVENTORY],
        "level": 4,
        "system": False,
        "description": "Control de inventario y almacén.",
    },

    # ── Soporte ───────────────────────────────────────────────────────────────
    {
        "slug": "agente_soporte",
        "name": "Agente de Soporte",
        "dept": "SUPP",
        "perms": [
            Permission.VIEW_TICKETS, Permission.HANDLE_TICKETS,
            Permission.CLOSE_TICKETS, Permission.VIEW_USERS,
        ],
        "level": 4,
        "system": False,
        "description": "Atención a tickets y soporte a usuarios.",
    },
    {
        "slug": "gestor_tickets",
        "name": "Gestor de Tickets",
        "dept": "SUPP",
        "perms": [
            Permission.VIEW_TICKETS, Permission.HANDLE_TICKETS,
            Permission.ASSIGN_REPORTS,
        ],
        "level": 3,
        "system": False,
        "description": "Gestión y asignación de tickets de soporte.",
    },
    {
        "slug": "especialista_satisfaccion",
        "name": "Especialista en Satisfacción",
        "dept": "SUPP",
        "perms": [
            Permission.VIEW_TICKETS, Permission.VIEW_METRICS,
            Permission.EXPORT_METRICS, Permission.SEND_NOTIFICATIONS,
        ],
        "level": 4,
        "system": False,
        "description": "Análisis de satisfacción del cliente.",
    },

    # ── Legal ─────────────────────────────────────────────────────────────────
    {
        "slug": "compliance",
        "name": "Especialista en Compliance",
        "dept": "LEG",
        "perms": [
            Permission.VIEW_USERS, Permission.VIEW_REPORTS,
            Permission.AUDIT_ROLES, Permission.APPROVE_POLICIES,
            Permission.VIEW_CONFIG,
        ],
        "level": 3,
        "system": False,
        "description": "Cumplimiento normativo y auditoría de roles.",
    },
    {
        "slug": "abogado_interno",
        "name": "Abogado Interno",
        "dept": "LEG",
        "perms": [Permission.VIEW_REPORTS, Permission.APPROVE_POLICIES, Permission.VIEW_USERS],
        "level": 3,
        "system": False,
        "description": "Asesoría legal interna.",
    },
]


# ─── Función principal de seed ────────────────────────────────────────────────


def evaluate_seed_condition(
    target_env: str,
    role_count: int,
    dept_count: int,
    force: bool = False,
) -> tuple[bool, str]:
    """
    Evalúa si se debe ejecutar el seed según el ambiente y registros existentes.

    Reglas:
    - Local: se ejecuta si la tabla está vacía (count == 0).
    - DEV/QA: se corre en cada despliegue para asegurar consistencia.
    - PROD: se ejecuta solo si no existen registros (count == 0), evitando sobrescribir datos reales.
    - force=True: salta validaciones y fuerza la ejecución.

    Retorna: (should_run: bool, reason: str)
    """
    is_empty = (role_count == 0 and dept_count == 0)

    if force:
        return True, "forced"

    if target_env in ["prod", "production"]:
        if not is_empty:
            return False, "prod_has_data"
        return True, "prod_empty"

    if target_env == "local":
        if not is_empty:
            return False, "local_has_data"
        return True, "local_empty"

    if target_env in ["dev", "qa", "development", "staging"]:
        return True, f"{target_env}_deploy_consistency"

    if not is_empty:
        return False, "unknown_env_has_data"
    return True, "unknown_env_empty"


async def _perform_seed(target_env: str) -> dict:
    """Ejecuta la sincronización e inserción de departamentos y roles."""
    now = datetime.utcnow()

    # 1. Departamentos ─────────────────────────────────────────────────────────
    dept_id_by_code: dict[str, str] = {}
    created_depts = 0
    updated_depts = 0

    for d in DEPARTMENTS:
        existing = await Department.find_one(Department.code == d["code"])
        if existing:
            if existing.description != d["description"] or existing.name != d["name"]:
                existing.name = d["name"]
                existing.description = d["description"]
                existing.updated_at = now
                await existing.save()
                updated_depts += 1
            dept_id_by_code[d["code"]] = str(existing.id)
        else:
            dept = Department(
                name=d["name"],
                code=d["code"],
                description=d["description"],
            )
            await dept.insert()
            created_depts += 1
            dept_id_by_code[d["code"]] = str(dept.id)

    # 2. Roles ─────────────────────────────────────────────────────────────────
    created_roles = 0
    updated_roles = 0

    for r in ROLES:
        dept_id = dept_id_by_code.get(r["dept"])
        existing = await Role.find_one(Role.slug == r["slug"])

        if existing:
            changed = False
            if existing.permissions != r["perms"]:
                existing.permissions = r["perms"]
                changed = True
            if existing.hierarchy_level != r["level"]:
                existing.hierarchy_level = r["level"]
                changed = True
            if existing.department_id != dept_id:
                existing.department_id = dept_id
                changed = True
            if existing.description != r.get("description"):
                existing.description = r.get("description")
                changed = True
            if existing.name != r["name"]:
                existing.name = r["name"]
                changed = True
            if changed:
                existing.updated_at = now
                await existing.save()
                updated_roles += 1
        else:
            role = Role(
                slug=r["slug"],
                name=r["name"],
                description=r.get("description"),
                department_id=dept_id,
                permissions=r["perms"],
                hierarchy_level=r["level"],
                is_system_role=r.get("system", False),
            )
            await role.insert()
            created_roles += 1

    print(
        f"[seed] ✅ Seed completado ({target_env}): "
        f"Deptos (creados={created_depts}, actualizados={updated_depts}), "
        f"Roles (creados={created_roles}, actualizados={updated_roles})."
    )

    return {
        "status": "executed",
        "env": target_env,
        "created_departments": created_depts,
        "updated_departments": updated_depts,
        "created_roles": created_roles,
        "updated_roles": updated_roles,
    }


async def seed_system_data(env: Optional[str] = None, force: bool = False) -> dict:
    """
    Carga o sincroniza departamentos y roles del sistema según el ambiente:

    - Local: al levantar la app, se ejecuta si la tabla está vacía.
    - DEV/QA: se corre el seed en cada despliegue para asegurar consistencia.
    - PROD: se ejecuta solo si no existen registros, para evitar sobrescribir datos reales.
    - force=True: omite las verificaciones y fuerza la sincronización.
    """
    target_env = (env or settings.ENVIRONMENT or "local").lower().strip()

    role_count = await Role.find_all().count()
    dept_count = await Department.find_all().count()

    should_run, reason = evaluate_seed_condition(
        target_env=target_env,
        role_count=role_count,
        dept_count=dept_count,
        force=force,
    )

    if not should_run:
        if reason == "prod_has_data":
            print(
                f"[seed] 🔒 Ambiente PROD: Existen {role_count} roles y {dept_count} departamentos. "
                "Seed omitido para evitar sobrescribir datos reales."
            )
        elif reason == "local_has_data":
            print(
                f"[seed] ℹ️ Ambiente LOCAL: Existen {role_count} roles y {dept_count} departamentos. "
                "Seed omitido porque la tabla no está vacía."
            )
        else:
            print(f"[seed] ℹ️ Ambiente '{target_env}': Existen registros. Omitiendo seed por precaución.")

        return {
            "status": "skipped",
            "reason": reason,
            "env": target_env,
            "roles": role_count,
            "departments": dept_count,
        }

    if reason == "prod_empty":
        print("[seed] 🚀 Ambiente PROD: Base de datos vacía. Ejecutando seed inicial del sistema...")
    elif reason == "local_empty":
        print("[seed] 🚀 Ambiente LOCAL: Base de datos vacía. Ejecutando seed inicial del sistema...")
    elif "_deploy_consistency" in reason:
        print(f"[seed] 🔄 Ambiente {target_env.upper()}: Ejecutando seed para asegurar consistencia tras despliegue...")

    return await _perform_seed(target_env)


if __name__ == "__main__":
    import argparse
    import asyncio
    import os
    import sys

    # Asegura que backend esté en sys.path
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    from src.core.database import init_db, close_db

    parser = argparse.ArgumentParser(description="Seed system departments, roles and permissions by environment")
    parser.add_argument("--env", type=str, default=None, help="Environment: local, dev, qa, prod")
    parser.add_argument("--force", action="store_true", help="Force execution even if data exists")
    cli_args = parser.parse_args()

    async def main():
        if cli_args.env:
            os.environ["ENVIRONMENT"] = cli_args.env
            settings.ENVIRONMENT = cli_args.env

        # init_db() llama a seed_system_data() automáticamente con el entorno configurado.
        # Si se especificó --force, ejecutamos explícitamente con force=True.
        if cli_args.force:
            await init_db()
            result = await seed_system_data(env=cli_args.env, force=True)
            print(f"[seed-cli] Resultado forzado: {result}")
        else:
            await init_db()
            print("[seed-cli] Proceso finalizado exitosamente.")
        await close_db()

    asyncio.run(main())
