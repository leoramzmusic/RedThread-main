"""
Fill the missing multilingual labels for the existing `education_level` options.

The options were seeded with es/en/pt/fr only, so the "Nivel Educativo" chips in
ProfessionalAcademicSection rendered blank for the other 17 languages.

This script only fills empty label_<lang> fields; it never overwrites a label that
is already populated, so the original es/en/pt/fr values are preserved.

Idempotent: safe to re-run.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_education_level_translations.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

CATEGORY = "education_level"

# Existing values: high_school, university, masters, phd, trade_school, other
TRANSLATIONS = {
    "de": {
        "high_school": "Sekundarschule",
        "university": "Universität",
        "masters": "Master",
        "phd": "Promotion",
        "trade_school": "Fachschule",
        "other": "Sonstiges",
    },
    "it": {
        "high_school": "Scuola superiore",
        "university": "Università",
        "masters": "Laurea magistrale",
        "phd": "Dottorato di ricerca",
        "trade_school": "Scuola tecnica",
        "other": "Altro",
    },
    "ru": {
        "high_school": "Средняя школа",
        "university": "Университет",
        "masters": "Магистратура",
        "phd": "Докторантура",
        "trade_school": "Техникум",
        "other": "Другое",
    },
    "sv": {
        "high_school": "Gymnasium",
        "university": "Universitet",
        "masters": "Masterexamen",
        "phd": "Doktorsexamen",
        "trade_school": "Yrkesskola",
        "other": "Övrigt",
    },
    "nl": {
        "high_school": "Voortgezet onderwijs",
        "university": "Universiteit",
        "masters": "Master",
        "phd": "Promotie",
        "trade_school": "MBO",
        "other": "Overig",
    },
    "zh": {
        "high_school": "中学",
        "university": "大学",
        "masters": "硕士",
        "phd": "博士",
        "trade_school": "职业学校",
        "other": "其他",
    },
    "hi": {
        "high_school": "हाई स्कूल",
        "university": "विश्वविद्यालय",
        "masters": "मास्टर",
        "phd": "पीएचडी",
        "trade_school": "तकनीकी विद्यालय",
        "other": "अन्य",
    },
    "bn": {
        "high_school": "মাধ্যমিক বিদ্যালয়",
        "university": "বিশ্ববিদ্যালয়",
        "masters": "মাস্টার্স",
        "phd": "পিএইচডি",
        "trade_school": "কারিগরি বিদ্যালয়",
        "other": "অন্যান্য",
    },
    "ja": {
        "high_school": "高等学校",
        "university": "大学",
        "masters": "修士",
        "phd": "博士",
        "trade_school": "専門学校",
        "other": "その他",
    },
    "ko": {
        "high_school": "고등학교",
        "university": "대학교",
        "masters": "석사",
        "phd": "박사",
        "trade_school": "전문학교",
        "other": "기타",
    },
    "ar": {
        "high_school": "ثانوية",
        "university": "جامعة",
        "masters": "ماجستير",
        "phd": "دكتوراه",
        "trade_school": "مدرسة فنية",
        "other": "أخرى",
    },
    "sw": {
        "high_school": "Sekondari",
        "university": "Chuo kikuu",
        "masters": "Mastasi",
        "phd": "Udaktoro",
        "trade_school": "Shule ya ufundi",
        "other": "Nyingine",
    },
    "ha": {
        "high_school": "Babban sakandare",
        "university": "Jami'a",
        "masters": "Masta",
        "phd": "Doktori",
        "trade_school": "Maktabar fasaha",
        "other": "Sauran",
    },
    "am": {
        "high_school": "ሰከማዊ ትምቅ",
        "university": "ዩኒቨርሲቲ",
        "masters": "ማስተርስ",
        "phd": "ዶክተር",
        "trade_school": "ቴክኒክ ትምቅ",
        "other": "ሌሎች",
    },
    "tl": {
        "high_school": "High School",
        "university": "Unibersidad",
        "masters": "Master's",
        "phd": "PhD",
        "trade_school": "Paaralang teknikal",
        "other": "Iba pa",
    },
    "ms": {
        "high_school": "Sekolah menengah",
        "university": "Universiti",
        "masters": "Sarjana",
        "phd": "Doktor",
        "trade_school": "Sekolah teknik",
        "other": "Lain-lain",
    },
    "mi": {
        "high_school": "Kura Tuarua",
        "university": "Whare Wānanga",
        "masters": "Tohu Paetahi",
        "phd": "Tohu Kairangi",
        "trade_school": "Kura Hangahanga",
        "other": "Ētahi",
    },
}

LANGS = list(TRANSLATIONS.keys())


async def main() -> None:
    await init_db()
    docs = await SystemOption.find(SystemOption.category == CATEGORY).to_list()

    if not docs:
        print(
            f"seed_education_level_translations: no documents found for "
            f"category '{CATEGORY}' — nothing to do."
        )
        return

    by_value = {doc.value: doc for doc in docs}
    unknown = set(TRANSLATIONS["de"]) ^ set(by_value)
    if unknown:
        raise SystemExit(
            f"value mismatch between script and database: {sorted(unknown)}"
        )

    filled = 0
    for lang in LANGS:
        for value, text in TRANSLATIONS[lang].items():
            doc = by_value[value]
            current = (getattr(doc, f"label_{lang}", "") or "").strip()
            if current:
                continue
            setattr(doc, f"label_{lang}", text)
            filled += 1
        for value in TRANSLATIONS[lang]:
            await by_value[value].save()

    print(
        f"seed_education_level_translations: {len(docs)} options, "
        f"{len(LANGS)} languages, filled {filled} empty labels"
    )


if __name__ == "__main__":
    asyncio.run(main())