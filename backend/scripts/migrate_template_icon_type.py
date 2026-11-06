"""
Migración: Agregar icon_type a plantillas existentes en MongoDB.

Las plantillas sociales (match, like, message) usan dynamic_avatar
(el usuario verá el avatar de quien originó la interacción).
El resto usan system_icon (se muestra el emoji del ícono del sistema).
"""

import asyncio
import sys
import os

# Configurar UTF-8 para evitar problemas de codificación en Windows con emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import init_db
from src.models.notification_template import NotificationTemplate


SOCIAL_CATEGORIES = {"match", "like", "message"}


async def migrate_icon_type():
    """
    Asigna icon_type a plantillas existentes basándose en su categoría.
    Idempotente: si ya tiene icon_type, no se modifica.
    """
    await init_db()

    # Obtener todas las plantillas que no tienen icon_type
    templates_without_icon_type = await NotificationTemplate.find(
        {"icon_type": {"$exists": False}}
    ).to_list()

    if not templates_without_icon_type:
        print("OK: Todas las plantillas ya tienen icon_type")
        return 0

    updated = 0
    for tpl in templates_without_icon_type:
        icon_type = "dynamic_avatar" if tpl.category in SOCIAL_CATEGORIES else "system_icon"
        tpl.icon_type = icon_type
        await tpl.save()
        print(f"  OK: {tpl.title} ({tpl.category}) -> icon_type={icon_type}")
        updated += 1

    print(f"\nOK: Migración completa: {updated} plantillas actualizadas")
    return updated


if __name__ == "__main__":
    asyncio.run(migrate_icon_type())
