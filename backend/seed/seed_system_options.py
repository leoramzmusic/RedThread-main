"""
Seed the `sexual_orientation` system options catalog.

The orientation combo in IdentitySection reads its items from
GET /options, which returns [] when this collection is empty.
Values are lowercase neutral keys because IdentitySection compares
`orientation.toLowerCase()` against them; labels are per-language.

Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_system_options.py
"""

import asyncio
import sys

sys.path.insert(0, "/app")

from src.db.utils.connection import init_db
from src.models.system_options import SystemOption

OPTIONS = [
    # (value, order, es, en, pt, fr)
    ("heterosexual", 0, "Heterosexual", "Heterosexual", "Heterossexual", "Hétérosexuel"),
    ("homosexual", 1, "Homosexual", "Homosexual", "Homossexual", "Homosexuel"),
    ("bisexual", 2, "Bisexual", "Bisexual", "Bissexual", "Bisexuel"),
    ("pansexual", 3, "Pansexual", "Pansexual", "Pansexual", "Pansexuel"),
    ("asexual", 4, "Asexual", "Asexual", "Assexual", "Asexuel"),
    ("queer", 5, "Queer", "Queer", "Queer", "Queer"),
    ("demisexual", 6, "Demisexual", "Demisexual", "Demissexual", "Demisexuel"),
    ("sapioerotico", 7, "Sapioerótico/Sapiosexual", "Sapioerotic/Sapiosexual", "Sapioerótico/Sapiossexual", "Sapioérotique/Sapiosexuel"),
    ("prefer_not_to_say", 8, "Prefiero no decir", "Prefer not to say", "Prefiro não dizer", "Je préfère ne pas dire"),
]


async def main() -> None:
    await init_db()
    created = 0
    for value, order, es, en, pt, fr in OPTIONS:
        existing = await SystemOption.find_one(
            SystemOption.category == "sexual_orientation",
            SystemOption.value == value,
        )
        if existing:
            continue
        await SystemOption(
            category="sexual_orientation",
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
    print(f"seed_system_options: created {created}, skipped {len(OPTIONS) - created}")


if __name__ == "__main__":
    asyncio.run(main())
