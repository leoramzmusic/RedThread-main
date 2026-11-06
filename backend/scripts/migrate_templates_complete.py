"""
Migración completa de plantillas de notificación.

Actualiza las plantillas existentes en MongoDB con:
1. icon_type (si no lo tienen)
2. persistent, programmatic, silencable (campos de OPCIONES)
"""

import asyncio
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import init_db
from src.models.notification_template import NotificationTemplate
from src.core.seed import NOTIFICATION_TEMPLATES_SEED


async def migrate_templates():
    """Actualiza plantillas existentes con icon_type y campos de OPCIONES."""
    await init_db()

    # Construir mapa de seed por (título, categoría)
    seed_map = {}
    for t in NOTIFICATION_TEMPLATES_SEED:
        key = (t["title"], t["category"])
        seed_map[key] = t

    # Obtener todas las plantillas existentes
    all_templates = await NotificationTemplate.find().to_list()

    if not all_templates:
        print("OK: No hay plantillas existentes para migrar")
        return 0

    updated = 0
    for tpl in all_templates:
        key = (tpl.title, tpl.category)
        seed_data = seed_map.get(key)

        if not seed_data:
            print(f"  SKIP: {tpl.title} ({tpl.category}) - no está en el seed")
            continue

        changes = []

        # Actualizar icon_type si no existe o es diferente
        current_icon_type = getattr(tpl, 'icon_type', None)
        seed_icon_type = seed_data.get("icon_type", "system_icon")
        if current_icon_type != seed_icon_type:
            tpl.icon_type = seed_icon_type
            changes.append(f"icon_type={seed_icon_type}")

        # Actualizar campos de OPCIONES
        current_persistent = getattr(tpl, 'persistent', False)
        seed_persistent = seed_data.get("persistent", False)
        if current_persistent != seed_persistent:
            tpl.persistent = seed_persistent
            changes.append(f"persistent={seed_persistent}")

        current_programmable = getattr(tpl, 'programmable', False)
        seed_programmable = seed_data.get("programmable", False)
        if current_programmable != seed_programmable:
            tpl.programmable = seed_programmable
            changes.append(f"programmable={seed_programmable}")

        current_silencable = getattr(tpl, 'silencable', False)
        seed_silencable = seed_data.get("silencable", False)
        if current_silencable != seed_silencable:
            tpl.silencable = seed_silencable
            changes.append(f"silencable={seed_silencable}")

        if changes:
            await tpl.save()
            print(f"  OK: {tpl.title} ({tpl.category}) -> {', '.join(changes)}")
            updated += 1
        else:
            print(f"  SKIP: {tpl.title} ({tpl.category}) - ya actualizado")

    print(f"\nOK: Migración completa: {updated} plantillas actualizadas")
    return updated


if __name__ == "__main__":
    asyncio.run(migrate_templates())
