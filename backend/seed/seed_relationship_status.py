"""
Seed the `relationship_status` system options catalog.

The status combo in CivilStatusSection reads its items from
GET /options, which returns [] when this collection is empty.
Values are lowercase neutral keys matching RelationshipStatus enum;
labels are per-language.

Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_relationship_status.py
"""

import asyncio
import sys

sys.path.insert(0, "/app")

from src.db.utils.connection import init_db
from src.models.system_options import SystemOption

OPTIONS = [
    # (value, order, es, en, pt, fr)
    ("single", 0, "Soltero/a", "Single", "Solteiro/a", "Célibataire"),
    ("in_relationship", 1, "En relación", "In a relationship", "Em relacionamento", "En couple"),
    ("married", 2, "Casado/a", "Married", "Casado/a", "Marié/e"),
    ("divorced", 3, "Divorciado/a", "Divorced", "Divorciado/a", "Divorcé/e"),
    ("widowed", 4, "Viudo/a", "Widowed", "Viúvo/a", "Veuf/veuve"),
    ("complicated", 5, "Es complicado", "It's complicated", "É complicado", "C'est compliqué"),
    ("open_relationship", 6, "Relación abierta", "Open relationship", "Relacionamento aberto", "Relation ouverte"),
    ("prefer_not_to_say", 7, "Prefiero no decir", "Prefer not to say", "Prefiro não dizer", "Je préfère ne pas dire"),
]


async def main() -> None:
    await init_db()
    created = 0
    for value, order, es, en, pt, fr in OPTIONS:
        existing = await SystemOption.find_one(
            SystemOption.category == "relationship_status",
            SystemOption.value == value,
        )
        if existing:
            continue
        await SystemOption(
            category="relationship_status",
            value=value,
            label=es,
            label_es=es,
            label_en=en,
            label_pt=pt,
            label_fr=fr,
            order=order,
            is_active=True,
        ).insert()
        created += 1
    print(f"seed_relationship_status: created {created}, skipped {len(OPTIONS) - created}")


if __name__ == "__main__":
    asyncio.run(main())