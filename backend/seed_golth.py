import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.core.config import settings
from src.models.golth import GolthInterest

async def seed_golth():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[GolthInterest]
    )
    
    interests = [
        {
            "name": "Exploradores",
            "label": "Exploradores",
            "description": "Búsqueda de nuevas fronteras y descubrimiento mutuo.",
            "color": "#f59e0b"
        },
        {
            "name": "Conexiones múltiples",
            "label": "Conexiones múltiples",
            "description": "Afinidades grupales y círculos sociales expandidos.",
            "color": "#f59e0b"
        },
        {
            "name": "Afinidades ocultas",
            "label": "Afinidades ocultas",
            "description": "Vínculos lentos, misteriosos y seguros.",
            "color": "#f59e0b"
        },
        {
            "name": "Juego de roles",
            "label": "Juego de roles",
            "description": "Dinámicas lúdicas y narrativas compartidas.",
            "color": "#f59e0b"
        },
        {
            "name": "Dinámicas de pareja",
            "label": "Dinámicas de pareja",
            "description": "Exploración conjunta para enriquecer la relación.",
            "color": "#f59e0b"
        },
        {
            "name": "Exploración grupal",
            "label": "Exploración grupal",
            "description": "Integración y descubrimiento en comunidad.",
            "color": "#f59e0b"
        },
        {
            "name": "Narrativas compartidas",
            "label": "Narrativas compartidas",
            "description": "Construcción de historias y metáforas en común.",
            "color": "#f59e0b"
        }
    ]
    
    count = 0
    for interest_data in interests:
        existing = await GolthInterest.find_one(GolthInterest.name == interest_data["name"])
        if not existing:
            interest = GolthInterest(**interest_data)
            await interest.insert()
            print(f"✅ Interés creado: {interest_data['name']}")
            count += 1
        else:
            # Update description if needed
            if existing.description != interest_data["description"]:
                existing.description = interest_data["description"]
                await existing.save()
                print(f"🔄 Interés actualizado: {interest_data['name']}")
            else:
                print(f"ℹ️ Interés ya existe: {interest_data['name']}")
    
    print(f"Proceso completado. {count} nuevos intereses creados.")

if __name__ == "__main__":
    asyncio.run(seed_golth())
