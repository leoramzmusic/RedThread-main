import asyncio
import os
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.database import init_db, close_db
from src.models.role import Role

async def migrate():
    print("🚀 Initializing DB for Hierarchy Migration...")
    await init_db()
    
    roles = await Role.find_all().to_list()
    
    # 0: Super Admin
    # 1: Admin
    # 2: Jefe de Departamento
    # 3: Supervisor / Coordinador
    # 4: Empleado
    # 5: Invitado
    
    migration_map = {
        "superadmin": 0,
        "admin": 1,
        "hr": 2,
        # Specialized
        "gestor_empleados": 3,
        "especialista_nomina": 3,
        "reclutador": 4,
        "contador": 3,
        "analista_financiero": 3,
        "gestor_pagos": 4,
        "desarrollador": 4,
        "sysadmin": 3,
        "soporte_ti": 4,
        "community_manager": 4,
        "especialista_campanas": 3,
        "disenador_grafico": 4,
        "ejecutivo_ventas": 4,
        "gestor_cuentas": 4,
        "rep_comercial": 4,
        "super_ops": 3,
        "coord_logistico": 4,
        "gestor_almacen": 4,
        "agente_soporte": 4,
        "gestor_tickets": 3,
        "especialista_satisfaccion": 4,
        "compliance": 3,
        "abogado_interno": 3
    }
    
    updated_count = 0
    for role in roles:
        target_level = migration_map.get(role.slug)
        
        # Default fallbacks if not in map
        if target_level is None:
            if role.hierarchy_level <= 1:
                target_level = role.hierarchy_level # Keep 0/1
            elif role.hierarchy_level <= 5:
                target_level = 2 # Area Head
            elif role.hierarchy_level <= 10:
                target_level = 3 # Supervisor
            else:
                target_level = 4 # Empleado
        
        if role.hierarchy_level != target_level:
            old_level = role.hierarchy_level
            role.hierarchy_level = target_level
            await role.save()
            print(f"✅ Migrated {role.slug}: {old_level} -> {role.hierarchy_level}")
            updated_count += 1
            
    print(f"🏁 Migration complete! Total updated: {updated_count}")
    await close_db()

if __name__ == "__main__":
    asyncio.run(migrate())
