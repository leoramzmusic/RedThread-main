import asyncio
import os
import sys

# Add the backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.database import init_db
from src.models.profile_module import ProfileModule


MODULES = [
    {"orden": 0, "key": "section-photos", "nombre": "Fotos", "origen": "core"},
    {"orden": 1, "key": "section-basic", "nombre": "Identidad básica", "origen": "core"},
    {"orden": 2, "key": "section-location", "nombre": "Ubicación", "origen": "core"},
    {"orden": 3, "key": "section-aboutme", "nombre": "Sobre mí", "origen": "core"},
    {"orden": 4, "key": "section-goals", "nombre": "Objetivos", "origen": "core"},
    {"orden": 5, "key": "section-interests", "nombre": "Intereses", "origen": "core"},
    {"orden": 6, "key": "section-pronouns", "nombre": "Pronombres", "origen": "core"},
    {"orden": 7, "key": "section-additional", "nombre": "Datos adicionales", "origen": "core"},
    {"orden": 8, "key": "section-professional", "nombre": "Profesional", "origen": "core"},
    {"orden": 9, "key": "section-music", "nombre": "Música", "origen": "integracion"},
    {"orden": 10, "key": "section-identity", "nombre": "Identidad", "origen": "core"},
    {"orden": 11, "key": "section-personality", "nombre": "Personalidad", "origen": "core"},
    {"orden": 12, "key": "section-cognitive", "nombre": "Cognitivo", "origen": "core"},
    {"orden": 13, "key": "section-wellness", "nombre": "Bienestar", "origen": "core"},
    {"orden": 14, "key": "section-status", "nombre": "Estado civil", "origen": "core"},
    {"orden": 15, "key": "section-languages", "nombre": "Idiomas", "origen": "core"},
]


async def seed_modules():
    print("Seeding Profile Modules...")
    await init_db()

    for m_data in MODULES:
        existing = await ProfileModule.find_one(ProfileModule.key == m_data["key"])
        if existing:
            print(f"Skipping existing: {m_data['key']}")
            continue
        module = ProfileModule(visible=True, **m_data)
        await module.insert()
        print(f"Created: {m_data['key']}")

    print("Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_modules())
