from bson import ObjectId
from src.models.role import Role
from src.models.department import Department
from src.models.notification_template import NotificationTemplate

# SYSTEM_USER_ID se define aquí para evitar importaciones circulares
SYSTEM_USER_ID = "000000000000000000000000"


NOTIFICATION_TEMPLATES_SEED: list[dict] = [
    # ── Sistema ────────────────────────────────────────────────────────────────
    {
        "title": "Bienvenida a RETH",
        "body": "Hola {{first_name}}, bienvenido a RETH. ¡Descubre quién te está esperando!",
        "icon": "wave",
        "icon_type": "system_icon",
        "category": "system",
        "priority": "P1",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "user_registered",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "first_name", "type": "string"}],
    },
    {
        "title": "Anuncio General",
        "body": "{{titulo_anuncio}}\n\n{{mensaje}}",
        "icon": "announcement",
        "icon_type": "system_icon",
        "category": "system",
        "priority": "P0",
        "required_action": False,
        "critical": True,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["usuarios", "empleados", "marcas"],
        "evento_disparador": "system_announcement",
        "uso_principal": "global",
        "variables": [
            {"name": "titulo_anuncio", "type": "string"},
            {"name": "mensaje", "type": "string"},
        ],
    },
    {
        "title": "Mantenimiento Programado",
        "body": "Hola {{first_name}}, tendremos mantenimiento programado el {fecha_mantenimiento} de {hora_inicio} a {hora_fin}.",
        "icon": "build",
        "icon_type": "system_icon",
        "category": "system",
        "priority": "P1",
        "required_action": False,
        "critical": False,
        "persistent": True,
        "programmable": True,
        "silencable": False,
        "destinatarios": ["usuarios"],
        "evento_disparador": "maintenance_scheduled",
        "uso_principal": "portal_usuarios",
        "variables": [
            {"name": "first_name", "type": "string"},
            {"name": "fecha_mantenimiento", "type": "string"},
            {"name": "hora_inicio", "type": "string"},
            {"name": "hora_fin", "type": "string"},
        ],
    },
    # ── Social ─────────────────────────────────────────────────────────────────
    {
        "title": "Nuevo Match",
        "body": "¡Tienes un nuevo match con {{nombre_match}}!",
        "icon": "favorite",
        "icon_type": "dynamic_avatar",
        "category": "match",
        "priority": "P1",
        "required_action": True,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "match_created",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "nombre_match", "type": "string"}],
    },
    {
        "title": "Nuevo Like",
        "body": "{{nombre_usuario}} te ha dado like.",
        "icon": "thumb_up",
        "icon_type": "dynamic_avatar",
        "category": "like",
        "priority": "P2",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "like_received",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "nombre_usuario", "type": "string"}],
    },
    {
        "title": "Nuevo Mensaje",
        "body": "{{nombre_usuario}} te envió un mensaje.",
        "icon": "message",
        "icon_type": "dynamic_avatar",
        "category": "message",
        "priority": "P1",
        "required_action": True,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "new_message",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "nombre_usuario", "type": "string"}],
    },
    # ── CARE ───────────────────────────────────────────────────────────────────
    {
        "title": "Encuesta CARE Pendiente",
        "body": "Hola {{first_name}}, tienes {{cuestionarios_pendientes}} preguntas restantes de tu encuesta CARE.",
        "icon": "question_answer",
        "icon_type": "system_icon",
        "category": "survey",
        "priority": "P2",
        "required_action": True,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["usuarios"],
        "evento_disparador": "survey_pending",
        "uso_principal": "portal_usuarios",
        "variables": [
            {"name": "first_name", "type": "string"},
            {"name": "cuestionarios_pendientes", "type": "integer"},
        ],
    },
    {
        "title": "Encuesta CARE Completada",
        "body": "¡Gracias por completar tu encuesta CARE, {{first_name}}!",
        "icon": "check_circle",
        "icon_type": "system_icon",
        "category": "survey",
        "priority": "P3",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["usuarios"],
        "evento_disparador": "survey_completed",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "first_name", "type": "string"}],
    },
    # ── Perfil ─────────────────────────────────────────────────────────────────
    {
        "title": "Completa Tu Perfil",
        "body": "Hola {{first_name}}, tu perfil está incompleto. Añade más información para encontrar mejores matches.",
        "icon": "person",
        "icon_type": "system_icon",
        "category": "reminder",
        "priority": "P2",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "profile_incomplete",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "first_name", "type": "string"}],
    },
    {
        "title": "Sube Tu Primera Foto",
        "body": "Hola {{first_name}}, subir una foto aumenta tus posibilidades de match.",
        "icon": "add_a_photo",
        "icon_type": "system_icon",
        "category": "reminder",
        "priority": "P2",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "photo_missing",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "first_name", "type": "string"}],
    },
    # ── Premium ────────────────────────────────────────────────────────────────
    {
        "title": "Oferta Premium",
        "body": "¡Descubre los beneficios de RETH Premium para ti, {{first_name}}!",
        "icon": "star",
        "icon_type": "system_icon",
        "category": "promo",
        "priority": "P2",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": True,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "premium_offer",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "first_name", "type": "string"}],
    },
    {
        "title": "Beneficios VIP",
        "body": "Accede a beneficios exclusivos con RETH VIP.",
        "icon": "diamond",
        "icon_type": "system_icon",
        "category": "promo",
        "priority": "P3",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": True,
        "silencable": True,
        "destinatarios": ["usuarios"],
        "evento_disparador": "vip_benefits",
        "uso_principal": "portal_usuarios",
        "variables": [],
    },
    # ── Seguridad ──────────────────────────────────────────────────────────────
    {
        "title": "Inicio de Sesión Sospechoso",
        "body": "Se detectó un inicio de sesión desde un dispositivo nuevo en {{ciudad}}.",
        "icon": "security",
        "icon_type": "system_icon",
        "category": "security",
        "priority": "P0",
        "required_action": True,
        "critical": True,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["usuarios"],
        "evento_disparador": "suspicious_login",
        "uso_principal": "portal_usuarios",
        "variables": [{"name": "ciudad", "type": "string"}],
    },
    {
        "title": "Cambio de Contraseña",
        "body": "Tu contraseña ha sido cambiada correctamente.",
        "icon": "lock",
        "icon_type": "system_icon",
        "category": "security",
        "priority": "P1",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["usuarios"],
        "evento_disparador": "password_changed",
        "uso_principal": "portal_usuarios",
        "variables": [],
    },
    # ── Empleados ──────────────────────────────────────────────────────────────
    {
        "title": "Nueva tarea asignada",
        "body": "Hola {{first_name}}, tienes una nueva tarea asignada: {{task_title}}.",
        "icon": "assignment",
        "icon_type": "system_icon",
        "category": "operaciones",
        "priority": "P1",
        "required_action": True,
        "critical": False,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["empleados"],
        "evento_disparador": "task_assigned",
        "uso_principal": "portal_empleados",
        "variables": [
            {"name": "first_name", "type": "string"},
            {"name": "task_title", "type": "string"},
        ],
    },
    {
        "title": "Tarea vencida",
        "body": "Hola {{first_name}}, tu tarea {{task_title}} ha vencido. Por favor actualízala.",
        "icon": "error",
        "icon_type": "system_icon",
        "category": "operaciones",
        "priority": "P0",
        "required_action": True,
        "critical": True,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["empleados"],
        "evento_disparador": "task_overdue",
        "uso_principal": "portal_empleados",
        "variables": [
            {"name": "first_name", "type": "string"},
            {"name": "task_title", "type": "string"},
        ],
    },
    {
        "title": "Tarea completada",
        "body": "¡Tarea completada! {{first_name}}, has terminado {{task_title}}.",
        "icon": "check_circle",
        "icon_type": "system_icon",
        "category": "operaciones",
        "priority": "P2",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": True,
        "destinatarios": ["empleados"],
        "evento_disparador": "task_completed",
        "uso_principal": "portal_empleados",
        "variables": [
            {"name": "first_name", "type": "string"},
            {"name": "task_title", "type": "string"},
        ],
    },
    {
        "title": "Recordatorio de tarea",
        "body": "Hola {{first_name}}, recuerda que tienes {{task_title}} pendiente.",
        "icon": "schedule",
        "icon_type": "system_icon",
        "category": "operaciones",
        "priority": "P2",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": True,
        "silencable": True,
        "destinatarios": ["empleados"],
        "evento_disparador": "task_reminder",
        "uso_principal": "portal_empleados",
        "variables": [
            {"name": "first_name", "type": "string"},
            {"name": "task_title", "type": "string"},
        ],
    },
    # ── Marcas ─────────────────────────────────────────────────────────────────
    {
        "title": "Nuevo lead recibido",
        "body": "Hola {{brand_name}}, tienes un nuevo lead: {{lead_name}}.",
        "icon": "person_add",
        "icon_type": "system_icon",
        "category": "leads",
        "priority": "P1",
        "required_action": True,
        "critical": False,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["marcas"],
        "evento_disparador": "new_lead",
        "uso_principal": "portal_marcas",
        "variables": [
            {"name": "brand_name", "type": "string"},
            {"name": "lead_name", "type": "string"},
        ],
    },
    {
        "title": "Nuevo candidato compatible",
        "body": "Hola {{brand_name}}, se encontró un nuevo candidato compatible: {{candidate_name}}.",
        "icon": "person_search",
        "icon_type": "system_icon",
        "category": "leads",
        "priority": "P1",
        "required_action": True,
        "critical": False,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["marcas"],
        "evento_disparador": "candidate_match",
        "uso_principal": "portal_marcas",
        "variables": [
            {"name": "brand_name", "type": "string"},
            {"name": "candidate_name", "type": "string"},
        ],
    },
    {
        "title": "Pago recibido",
        "body": "Hola {{brand_name}}, se ha recibido un pago de {{amount}}.",
        "icon": "payment",
        "icon_type": "system_icon",
        "category": "facturación",
        "priority": "P0",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["marcas"],
        "evento_disparador": "payment_received",
        "uso_principal": "portal_marcas",
        "variables": [
            {"name": "brand_name", "type": "string"},
            {"name": "amount", "type": "string"},
        ],
    },
    {
        "title": "Campaña aprobada",
        "body": "Hola {{brand_name}}, tu campaña {{campaign_name}} ha sido aprobada.",
        "icon": "verified",
        "icon_type": "system_icon",
        "category": "campañas",
        "priority": "P1",
        "required_action": False,
        "critical": False,
        "persistent": False,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["marcas"],
        "evento_disparador": "campaign_approved",
        "uso_principal": "portal_marcas",
        "variables": [
            {"name": "brand_name", "type": "string"},
            {"name": "campaign_name", "type": "string"},
        ],
    },
    {
        "title": "Campaña rechazada",
        "body": "Hola {{brand_name}}, tu campaña {{campaign_name}} ha sido rechazada. Motivo: {{reason}}.",
        "icon": "error",
        "icon_type": "system_icon",
        "category": "campañas",
        "priority": "P1",
        "required_action": True,
        "critical": False,
        "persistent": True,
        "programmable": False,
        "silencable": False,
        "destinatarios": ["marcas"],
        "evento_disparador": "campaign_rejected",
        "uso_principal": "portal_marcas",
        "variables": [
            {"name": "brand_name", "type": "string"},
            {"name": "campaign_name", "type": "string"},
            {"name": "reason", "type": "string"},
        ],
    },
]


def evaluate_seed_condition(
    env: str,
    role_count: int,
    dept_count: int,
    force: bool = False,
) -> tuple[bool, str]:
    """
    Decide si el seed debe ejecutarse según el ambiente y los datos existentes.

    Retorna (should_run, reason).
    """
    if force:
        return True, "forced"

    has_data = role_count > 0 or dept_count > 0

    if env == "local":
        if has_data:
            return False, "local_has_data"
        return True, "local_empty"

    if env in ("dev", "qa"):
        return True, f"deploy_consistency: {env}"

    if env == "prod":
        if has_data:
            return False, "prod_has_data"
        return True, "prod_empty"

    return False, f"unknown_env: {env}"


async def _perform_seed(env: str) -> dict:
    """Stub: ejecuta el seed real para el ambiente dado."""
    return {"status": "executed", "env": env}


async def ensure_notification_templates_seeded() -> int:
    """
    Crea las plantillas de notificación iniciales si no existen.
    Idempotente: nunca duplica, usa upsert por título + categoría.
    """
    created = 0
    for t_data in NOTIFICATION_TEMPLATES_SEED:
        existing = await NotificationTemplate.find_one(
            NotificationTemplate.title == t_data["title"],
            NotificationTemplate.category == t_data["category"],
        )
        if existing:
            continue
        await NotificationTemplate(
            title=t_data["title"],
            body=t_data["body"],
            icon=t_data["icon"],
            icon_type=t_data.get("icon_type", "system_icon"),
            category=t_data["category"],
            priority=t_data["priority"],
            required_action=t_data["required_action"],
            critical=t_data["critical"],
            persistent=t_data.get("persistent", False),
            programmable=t_data.get("programmable", False),
            silencable=t_data.get("silencable", False),
            destinatarios=t_data.get("destinatarios", ["usuarios"]),
            evento_disparador=t_data.get("evento_disparador"),
            uso_principal=t_data.get("uso_principal"),
            variables=t_data["variables"],
            created_by=ObjectId(SYSTEM_USER_ID),
        ).insert()
        created += 1
    if created:
        print(f"[seed] ✅ Plantillas de notificación creadas: {created}")
    return created


# ── Stubs para funciones de seed de otros módulos ──
# Estas funciones existen en otros módulos del sistema y se importan desde
# database.py. Se dejan como no-op para evitar importaciones rotas.


async def seed_system_data(env: str) -> dict:
    """
    Ejecuta el seed de datos del sistema según el ambiente y los datos existentes.

    Retorna un dict con el estado y la razón.
    """
    role_count = await Role.find_all().count()
    dept_count = await Department.find_all().count()

    should_run, reason = evaluate_seed_condition(
        env, role_count=role_count, dept_count=dept_count
    )

    if not should_run:
        return {"status": "skipped", "reason": reason}

    result = await _perform_seed(env)
    return result


async def ensure_profile_modules_seeded() -> None:
    """Stub: seed de módulos de perfil."""
    return None


async def ensure_integration_defaults() -> None:
    """Stub: seed de integraciones por defecto."""
    return None


async def ensure_care_dimension_map_seeded() -> None:
    """Stub: seed de mapa de dimensiones CARE."""
    return None
