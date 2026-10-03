"""
Seed the `profile_location_section` system options catalog for UI texts in the
Location & Scope section.

Keys resolve as profile.location.* (flat + badge.* nested via dots).

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_location_section.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh",
    "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi",
]


def L(**kw) -> dict:
    """Language-specific text. Raises if any supported language is missing."""
    missing = [lang for lang in LANGS if lang not in kw]
    if missing:
        raise ValueError(f"missing languages: {missing}")
    unknown = [key for key in kw if key not in LANGS]
    if unknown:
        raise ValueError(f"unknown languages: {unknown}")
    return kw


TEXTS = [
    {
        "value": "title",
        "order": 0,
        "translations": L(
            es="Ubicación y Alcance", en="Location & Scope",
            pt="Localização e Alcance", fr="Localisation et portée",
            de="Standort & Reichweite", it="Posizione e portata",
            ru="Местоположение и охват", sv="Plats & räckvidd",
            nl="Locatie & bereik", zh="位置与范围",
            hi="स्थान और दायरा", bn="অবস্থান ও পরিধি",
            ja="位置情報と範囲", ko="위치 및 범위",
            ar="الموقع والنطاق", sw="Mahali na wigo",
            ha="Wuri da iyaka", am="አካባቢ እና ወሰን",
            tl="Lokasyon at Saklaw", ms="Lokasi & Skop",
            mi="Wāhi me te korahi",
        ),
    },
    {
        "value": "baseTitle",
        "order": 1,
        "translations": L(
            es="📍 Tu ubicación base", en="📍 Your base location",
            pt="📍 Sua localização base", fr="📍 Votre position de base",
            de="📍 Dein Hauptstandort", it="📍 La tua posizione base",
            ru="📍 Ваше основное местоположение", sv="📍 Din basplats",
            nl="📍 Je basislocatie", zh="📍 你的常驻地",
            hi="📍 आपका मुख्य स्थान", bn="📍 আপনার মূল অবস্থান",
            ja="📍 あなたの拠点", ko="📍 내 기본 위치",
            ar="📍 موقعك الأساسي", sw="📍 Mahali pako pa msingi",
            ha="📍 Babban wurinka", am="📍 የእርስዎ መነሻ አካባቢ",
            tl="📍 Ang iyong base na lokasyon", ms="📍 Lokasi asas anda",
            mi="📍 Tō wāhi taketake",
        ),
    },
    {
        "value": "badge.curious",
        "order": 2,
        "translations": L(
            es="Curioso", en="Curious",
            pt="Curioso", fr="Curieux",
            de="Neugierig", it="Curioso",
            ru="Любопытный", sv="Nyfiken",
            nl="Nieuwsgierig", zh="好奇型",
            hi="जिज्ञासु", bn="কৌতূহলী",
            ja="好奇心型", ko="호기심형",
            ar="فضولي", sw="Mdadisi",
            ha="Mai son sani", am="ጉጉት ያለው",
            tl="Mausisa", ms="Ingin tahu",
            mi="Māhirahira",
        ),
    },
    {
        "value": "badge.adventurer",
        "order": 3,
        "translations": L(
            es="Aventurero", en="Adventurer",
            pt="Aventureiro", fr="Aventurier",
            de="Abenteurer", it="Avventuriero",
            ru="Искатель приключений", sv="Äventyrare",
            nl="Avonturier", zh="冒险家",
            hi="रोमांचप्रेमी", bn="দুঃসাহসী",
            ja="冒険家", ko="모험가",
            ar="مغامر", sw="Msafiri",
            ha="Mai kasada", am="ጀብደኛ",
            tl="Mapagsapalaran", ms="Pengembara",
            mi="Kaimōrearea",
        ),
    },
    {
        "value": "badge.explorer",
        "order": 4,
        "translations": L(
            es="Explorador", en="Explorer",
            pt="Explorador", fr="Explorateur",
            de="Entdecker", it="Esploratore",
            ru="Исследователь", sv="Utforskare",
            nl="Ontdekker", zh="探索者",
            hi="खोजकर्ता", bn="অভিযাত্রী",
            ja="探検家", ko="탐험가",
            ar="مستكشف", sw="Mpelelezi",
            ha="Mai bincike", am="አሳሽ",
            tl="Eksplorador", ms="Penjelajah",
            mi="Kaitūhura",
        ),
    },
    {
        "value": "badge.backpacker",
        "order": 5,
        "translations": L(
            es="Mochilero", en="Backpacker",
            pt="Mochileiro", fr="Routard",
            de="Rucksackreisender", it="Zaino in spalla",
            ru="Путешественник", sv="Ryggsäcksresenär",
            nl="Backpacker", zh="背包客",
            hi="बैकपैकर", bn="ব্যাকপ্যাকার",
            ja="バックパッカー", ko="배낭여행가",
            ar="رحالة", sw="Msafiri wa mgongoni",
            ha="Mai jakar baya", am="ቦርሳ ተጓዥ",
            tl="Backpacker", ms="Pengembara beg galas",
            mi="Kaihaere pēke",
        ),
    },
    {
        "value": "statesTitle",
        "order": 6,
        "translations": L(
            es="🌎 Estados", en="🌎 States",
            pt="🌎 Estados", fr="🌎 États",
            de="🌎 Bundesstaaten", it="🌎 Stati",
            ru="🌎 Штаты", sv="🌎 Delstater",
            nl="🌎 Staten", zh="🌎 州/省",
            hi="🌎 राज्य", bn="🌎 রাজ্য",
            ja="🌎 州", ko="🌎 주",
            ar="🌎 ولايات", sw="🌎 Majimbo",
            ha="🌎 Jihohi", am="🌎 ግዛቶች",
            tl="🌎 Mga estado", ms="🌎 Negeri",
            mi="🌎 Ngā wehenga",
        ),
    },
    {
        "value": "countriesTitle",
        "order": 7,
        "translations": L(
            es="🌍 Países", en="🌍 Countries",
            pt="🌍 Países", fr="🌍 Pays",
            de="🌍 Länder", it="🌍 Paesi",
            ru="🌍 Страны", sv="🌍 Länder",
            nl="🌍 Landen", zh="🌍 国家",
            hi="🌍 देश", bn="🌍 দেশ",
            ja="🌍 国", ko="🌍 국가",
            ar="🌍 دول", sw="🌍 Nchi",
            ha="🌍 Ƙasashe", am="🌍 ሀገራት",
            tl="🌍 Mga bansa", ms="🌍 Negara",
            mi="🌍 Ngā whenua",
        ),
    },
    {
        "value": "searchStates",
        "order": 8,
        "translations": L(
            es="Buscar en estados", en="Search states",
            pt="Buscar em estados", fr="Rechercher des États",
            de="Staaten suchen", it="Cerca stati",
            ru="Найти штаты", sv="Sök delstater",
            nl="Staten zoeken", zh="搜索州/省",
            hi="राज्य खोजें", bn="রাজ্য খুঁজুন",
            ja="州を検索", ko="주 검색",
            ar="بحث في الولايات", sw="Tafuta majimbo",
            ha="Nemi jihohi", am="ግዛቶች ፈልግ",
            tl="Maghanap ng estado", ms="Cari negeri",
            mi="Rapua ngā wehenga",
        ),
    },
    {
        "value": "searchCountries",
        "order": 9,
        "translations": L(
            es="Buscar en países", en="Search countries",
            pt="Buscar em países", fr="Rechercher des pays",
            de="Länder suchen", it="Cerca paesi",
            ru="Найти страны", sv="Sök länder",
            nl="Landen zoeken", zh="搜索国家",
            hi="देश खोजें", bn="দেশ খুঁজুন",
            ja="国を検索", ko="국가 검색",
            ar="بحث في الدول", sw="Tafuta nchi",
            ha="Nemi ƙasashe", am="ሀገራት ፈልግ",
            tl="Maghanap ng bansa", ms="Cari negara",
            mi="Rapua ngā whenua",
        ),
    },
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]

_VALUES = [item["value"] for item in TEXTS]
assert len(_VALUES) == len(set(_VALUES)), "duplicate seed values"
assert len(TEXTS) == 10, f"expected 10 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_location_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_location_section",
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
        f"seed_profile_location_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
