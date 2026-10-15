"""
Seed the `sexual_orientation` system options catalog in all 21 languages.

The orientation combo in IdentitySection reads its items from GET /options.
Values are lowercase neutral keys because IdentitySection compares
`orientation.toLowerCase()` against them; labels are per-language.

Other SystemOption categories (languages, relationship status, ...) already
ship all 21 languages; orientation previously only had es/en/pt/fr, so the
combo rendered blank labels for the other 17 locales.

Idempotent: existing values are updated in place, missing values inserted.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_system_options.py
"""

import asyncio
import sys

sys.path.insert(0, "/app")

from src.core.database import init_db
from src.models.system_options import SystemOption

# Canonical order used by every label list below (matches the API SUPPORTED_LANGS).
LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl",
    "zh", "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am",
    "tl", "ms", "mi",
]

# (value, order, labels in LANGS order)
ROWS = [
    (
        "heterosexual",
        0,
        [
            "Heterosexual", "Heterosexual", "Heterossexual", "Hétérosexuel",
            "Heterosexuell", "Eterosessuale", "Гетеросексуал", "Heterosexuell",
            "Heteroseksueel", "异性恋", "विषमलिंगी", "বিপরীতকামী", "異性愛",
            "이성애", "مغاير", "Heterosexual", "Heterosexual", "ሄትሮሴክሹዋል",
            "Heterosexual", "Heteroseksual", "Takatahitahi",
        ],
    ),
    (
        "homosexual",
        1,
        [
            "Homosexual", "Homosexual", "Homossexual", "Homosexuel",
            "Homosexuell", "Omosessuale", "Гомосексуал", "Homosexuell",
            "Homoseksueel", "同性恋", "समलिंगी", "সমকামী", "同性愛",
            "동성애", "مثلي", "Homosexual", "Homosexual", "ሆሞሴክሹዋል",
            "Homosexual", "Homoseksual", "Takatāpui",
        ],
    ),
    (
        "bisexual",
        2,
        [
            "Bisexual", "Bisexual", "Bissexual", "Bisexuel",
            "Bisexuell", "Bisessuale", "Бисексуал", "Bisexuell",
            "Biseksueel", "双性恋", "उभयलिंगी", "উভকামী", "両性愛",
            "양성애", "مزدوج", "Bisexual", "Bisexual", "ባይሴክሹዋል",
            "Bisexual", "Biseksual", "Takahitua",
        ],
    ),
    (
        "pansexual",
        3,
        [
            "Pansexual", "Pansexual", "Pansexual", "Pansexuel",
            "Pansexuell", "Pansessuale", "Пансексуал", "Pansexuell",
            "Panseksueel", "泛性恋", "सर्वलिंगी", "সর্বকামী", "全性愛",
            "범성애", "شامل", "Pansexual", "Pansexual", "ፓንሴክሹዋል",
            "Pansexual", "Panseksual", "Takamaha",
        ],
    ),
    (
        "asexual",
        4,
        [
            "Asexual", "Asexual", "Assexual", "Asexuel",
            "Asexuell", "Asessuale", "Асексуал", "Asexuell",
            "Aseksueel", "无性恋", "अलिंगी", "অকামী", "無性愛",
            "무성애", "لاجنسي", "Asexual", "Asexual", "አሴክሹዋል",
            "Asexual", "Aseksual", "Takakore",
        ],
    ),
    (
        "queer",
        5,
        [
            "Queer", "Queer", "Queer", "Queer",
            "Queer", "Queer", "Квир", "Queer",
            "Queer", "酷儿", "क्वीयर", "কুইয়ার", "クィア",
            "퀴어", "كوير", "Queer", "Queer", "ኩዊር",
            "Queer", "Queer", "Queer",
        ],
    ),
    (
        "demisexual",
        6,
        [
            "Demisexual", "Demisexual", "Demissexual", "Demisexuel",
            "Demisexuell", "Demisessuale", "Демисексуал", "Demisexuell",
            "Demiseksueel", "半性恋", "डेमीसेक्शुअल", "ডেমিসেক্সুয়াল",
            "デミセクシュアル", "데미섹슈얼", "ديميسكشوال", "Demisexual",
            "Demisexual", "ደሚሴክሹዋል", "Demisexual", "Demiseksual", "Demisexual",
        ],
    ),
    (
        "sapioerotico",
        7,
        [
            "Sapioerótico/Sapiosexual", "Sapioerotic/Sapiosexual",
            "Sapioerótico/Sapiossexual", "Sapioérotique/Sapiosexuel",
            "Sapioerotisch/Sapiosexuell", "Sapioerotico/Sapiosessuale",
            "Сапиоэротик/Сапиосексуал", "Sapioerotisk/Sapiosexuell",
            "Sapio-erotisch/Sapioseksueel", "智性恋", "सैपियोइरोटिक",
            "স্যাপিওইরোটিক", "サピオエロティック/サピオセクシュアル",
            "사피오에로틱/사피오섹슈얼", "سابيوإيروتيكي", "Sapioerotic",
            "Sapioerotic", "ሳፒዮኤሮቲክ", "Sapioerotic", "Sapioerotik", "Sapioerotic",
        ],
    ),
    (
        "prefer_not_to_say",
        8,
        [
            "Prefiero no decir", "Prefer not to say", "Prefiro não dizer",
            "Je préfère ne pas dire", "Keine Angabe", "Preferisco non dirlo",
            "Предпочитаю не указывать", "Vill inte ange", "Zeg ik liever niet",
            "不愿透露", "बताना नहीं चाहते", "বলতে চাই না", "回答しない",
            "밝히지 않음", "أفضل عدم الإفصاح", "Sipendi kusema",
            "Ba na so in faɗa", "መናገር አልፈልግም", "Ayokong sabihin",
            "Tidak mahu menyatakan", "Kāore e hiahia ana ki te kī",
        ],
    ),
]


def build_kwargs(value: str, order: int, labels: list) -> dict:
    if len(labels) != len(LANGS):
        raise ValueError(f"{value}: expected {len(LANGS)} labels, got {len(labels)}")
    kwargs = {
        "category": "sexual_orientation",
        "value": value,
        "label": labels[LANGS.index("es")],
        "order": order,
        "is_active": True,
    }
    for lang, label in zip(LANGS, labels):
        kwargs[f"label_{lang}"] = label
    return kwargs


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for value, order, labels in ROWS:
        kwargs = build_kwargs(value, order, labels)
        existing = await SystemOption.find_one(
            SystemOption.category == "sexual_orientation",
            SystemOption.value == value,
        )
        if existing:
            changed = False
            for key, val in kwargs.items():
                if getattr(existing, key) != val:
                    setattr(existing, key, val)
                    changed = True
            if changed:
                await existing.save()
                updated += 1
            continue
        await SystemOption(**kwargs).insert()
        created += 1
    print(
        f"seed_system_options: created {created}, updated {updated}, "
        f"total {len(ROWS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
