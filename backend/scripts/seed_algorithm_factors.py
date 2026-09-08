
import asyncio
import os
import sys
from datetime import datetime

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.database import init_db
from src.models.algorithm_management import AlgorithmFactor, AlgorithmType, FactorStatus, FactorDataType

async def seed_factors():
    print("🌱 Seeding Algorithm Factors...")
    await init_db()
    
    # 1. CARE Algorithm Factors (Weights must sum to 100)
    # Rebalanced Weights from implementation:
    # Age: 10%
    # Interests: 10%
    # Values: 10%
    # Lifestyle: 10%
    # Narrative: 5%
    # Height: 5%
    # Intent: 10%
    # Love Language: 10%
    # Communication Style: 10%
    # Proximity: 20%
    
    care_factors = [
        {
            "name": "Rango de Edad",
            "description": "Compatibilidad basada en las preferencias de edad declaradas.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Intereses Compartidos",
            "description": "Afinidad basada en intereses musicales y de estilo de vida.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Valores Core",
            "description": "Alineación de valores fundamentales y principios.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Modo de Vida",
            "description": "Compatibilidad entre estilos de vida (activo, hogareño, etc).",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Estilo Narrativo",
            "description": "Afinidad en la forma de expresarse y contar historias.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 5.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Preferencias de Altura",
            "description": "Filtro dinámico basado en etiquetas de altura.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 5.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Metas de Relación",
            "description": "Sintonía en los objetivos a corto y largo plazo.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Lenguaje del Amor",
            "description": "Compatibilidad en la forma de dar y recibir afecto.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Estilo de Comunicación",
            "description": "Sinergia en la forma y frecuencia de contacto.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 10.0,
            "status": FactorStatus.ACTIVE
        },
        {
            "name": "Proximidad Geográfica",
            "description": "Bonificación por distancia y facilidad de encuentro.",
            "algorithm_type": AlgorithmType.CARE,
            "weight": 20.0,
            "status": FactorStatus.ACTIVE
        }
    ]
    
    # 2. Compatibility Algorithm Criteria
    compatibility_criteria = [
        {
            "name": "Intereses Musicales",
            "description": "Coincidencia en géneros y artistas.",
            "algorithm_type": AlgorithmType.COMPATIBILITY,
            "weight": 25.0,
            "status": FactorStatus.ACTIVE,
            "data_type": FactorDataType.MULTIPLE
        },
        {
            "name": "Metas de Relación",
            "description": "Alineación de intenciones (serio, casual, etc).",
            "algorithm_type": AlgorithmType.COMPATIBILITY,
            "weight": 20.0,
            "status": FactorStatus.ACTIVE,
            "data_type": FactorDataType.CATALOG
        },
        {
            "name": "Lenguaje del Amor",
            "description": "Match emocional profundo.",
            "algorithm_type": AlgorithmType.COMPATIBILITY,
            "weight": 15.0,
            "status": FactorStatus.ACTIVE,
            "data_type": FactorDataType.CATALOG
        },
        {
            "name": "Estilo de Comunicación",
            "description": "Frecuencia y canales de chat/llamada.",
            "algorithm_type": AlgorithmType.COMPATIBILITY,
            "weight": 15.0,
            "status": FactorStatus.ACTIVE,
            "data_type": FactorDataType.CATALOG
        },
        {
            "name": "Valores",
            "description": "Empatía, lealtad y otros valores core.",
            "algorithm_type": AlgorithmType.COMPATIBILITY,
            "weight": 25.0,
            "status": FactorStatus.ACTIVE,
            "data_type": FactorDataType.MULTIPLE
        }
    ]
    
    # Process Seeding
    all_factors = care_factors + compatibility_criteria
    
    for f_data in all_factors:
        existing = await AlgorithmFactor.find_one(
            AlgorithmFactor.name == f_data["name"],
            AlgorithmFactor.algorithm_type == f_data["algorithm_type"]
        )
        
        if existing:
            # Update weights and status
            existing.weight = f_data["weight"]
            existing.status = f_data["status"]
            existing.description = f_data["description"]
            if "data_type" in f_data:
                existing.data_type = f_data["data_type"]
            await existing.save()
            print(f"✅ Updated factor: {f_data['name']}")
        else:
            factor = AlgorithmFactor(**f_data)
            await factor.insert()
            print(f"🆕 Created factor: {f_data['name']}")

    print("✨ Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_factors())
