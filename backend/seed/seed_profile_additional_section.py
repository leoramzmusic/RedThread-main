"""
Seed the `profile_additional_section` system options catalog for UI texts in the
"Datos adicionales" section.

The texts in AdditionalDataSection (and the selectors it renders) read from
GET /options/section/profile_additional_section.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_additional_section.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from src.core.database import init_db
from src.models.system_options import SystemOption

from additional_data.common import LANGS
from additional_data.title import TEXTS as TITLE_TEXTS
from additional_data.height import TEXTS as HEIGHT_TEXTS
from additional_data.relationship import TEXTS as RELATIONSHIP_TEXTS
from additional_data.zodiac import TEXTS as ZODIAC_TEXTS
from additional_data.family import TEXTS as FAMILY_TEXTS
from additional_data.communication import TEXTS as COMMUNICATION_TEXTS
from additional_data.love import TEXTS as LOVE_TEXTS

CATEGORY = "profile_additional_section"

TEXTS = [
    *TITLE_TEXTS,
    *HEIGHT_TEXTS,
    *RELATIONSHIP_TEXTS,
    *ZODIAC_TEXTS,
    *FAMILY_TEXTS,
    *COMMUNICATION_TEXTS,
    *LOVE_TEXTS,
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]

_VALUES = [item["value"] for item in TEXTS]
assert len(_VALUES) == len(set(_VALUES)), "duplicate seed values"
assert len(TEXTS) == 125, f"expected 125 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == CATEGORY,
            SystemOption.value == value,
        )

        doc_data = {
            "category": CATEGORY,
            "value": value,
            "label": translations["es"],
            "order": order,
            "is_active": True,
        }
        for lang in LANGS:
            doc_data[f"label_{lang}"] = translations.get(lang, "")

        if existing:
            for key, val in doc_data.items():
                setattr(existing, key, val)
            await existing.save()
            updated += 1
        else:
            await SystemOption(**doc_data).insert()
            created += 1

    print(
        f"seed_profile_additional_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())