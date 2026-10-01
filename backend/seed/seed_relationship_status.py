"""
Seed the `relationship_status` system options catalog.

The status combo in CivilStatusSection reads its items from
GET /options, which returns [] when this collection is empty.
Values are lowercase neutral keys matching RelationshipStatus enum;
labels are per-language for all 21 supported languages.

Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_relationship_status.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

# (value, order, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi)
OPTIONS = [
    ("single", 0,
     "Soltero/a", "Single", "Solteiro/a", "Célibataire", "Single", "Single",
     "Холост/Не замужем", "Gift", "Ongehuwd", "单身", "अविवाहित", "অবিবাহিত",
     "独身", "미혼", "أعزب", "Mjomba", "Gwalla", "ገበር", "Walang asawa", "Bujang", "Mōkai"),
    ("in_relationship", 1,
     "En relación", "In a relationship", "Em relacionamento", "En couple",
     "In einer Beziehung", "In una relazione", "В отношениях", "I ett förhållande",
     "In een relatie", "恋爱中", "रिश्ते में", "রিলেশনশিপে",
     "交際中", "연애 중", "في علاقة", "Katika mahusiano", "Da fatan", "በተዛማች", "May relasyon", "Dalam hubungan", "Kei te whaihoahoa"),
    ("married", 2,
     "Casado/a", "Married", "Casado/a", "Marié/e",
     "Verheiratet", "Sposato/a", "Женат/Замужем", "Gift",
     "Getrouwd", "已婚", "विवाहित", "বিবাহিত",
     "既婚者", "기혼", "متزوج", "Ameoa", "Aure", "የተባለ", "Kasal", "Berkahwin", "Mārena"),
    ("divorced", 3,
     "Divorciado/a", "Divorced", "Divorciado/a", "Divorcé/e",
     "Geschieden", "Divorziato/a", "Разведен/Разведена", "Skild",
     "Gescheiden", "离婚", "तलाकशुदा", "তালাকপ্রাপ্ত",
     "離婚", "이혼", "مطلق", "Talaki", "Ya talaka", "የተፈታ", "Anakasala", "Bercerai", "Wātea"),
    ("widowed", 4,
     "Viudo/a", "Widowed", "Viúvo/a", "Veuf/veuve",
     "Verwitwet", "Vedovo/a", "Вдовец/Вдова", "Änka/Änklingsman",
     "Weduwe/Wees", "丧偶", "विधवा/विधुर", "বিধবা/বিধুর",
     "死別", "사별", "أرمل/أرملة", "Mjane/Mjane", "Mairauni", "የተወደደ", "Balo", "Balu", "Mate rawa"),
    ("complicated", 5,
     "Es complicado", "It's complicated", "É complicado", "C'est compliqué",
     "Es ist kompliziert", "È complicato", "Сложно", "Det är komplicerat",
     "Het is gecompliceerd", "很复杂", "यह जटिल है", "এটি জটিল",
     "複雑です", "복잡함", "معقد", "Ni ngumu", "Wannan matsalar", "አስቸጋሪ", "Complicated", "Rumit", "He kino"),
    ("open_relationship", 6,
     "Relación abierta", "Open relationship", "Relacionamento aberto", "Relation ouverte",
     "Offene Beziehung", "Relazione aperta", "Открытые отношения", "Öppet förhållande",
     "Open relatie", "开放式关系", "खुला रिश्ता", "খোলা সম্পর্ক",
     "オープンな関係", "오픈 릴레이션십", "علاقة مفتوحة", "Mahusiano wazi", "Fata waje", "ክፍተት ያለው ተዛማች", "Bukas na relasyon", "Hubungan terbuka", "Whakahoahoa wātea"),
    ("prefer_not_to_say", 7,
     "Prefiero no decir", "Prefer not to say", "Prefiro não dizer", "Je préfère ne pas dire",
     "Ich möchte das nicht sagen", "Preferisco non dire", "Предпочитаю не говорить", "För att inte säga",
     "Ik wil het niet zeggen", "不愿透露", "बताना नहीं चाहता/चाहती", "বলতে চাই না",
     "言いたくない", "말하고 싶지 않음", "أفضل عدم القول", "Sipendi kusema", "Ba ni yi ce", "አልፈልግም", "Ayoko sabihin", "Saya memilih untuk tidak berkata", "Kāore e hiahia kōrero"),
]


async def main() -> None:
    await init_db()
    created = 0
    for value, order, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi in OPTIONS:
        existing = await SystemOption.find_one(
            SystemOption.category == "relationship_status",
            SystemOption.value == value,
        )
        if existing:
            # Update existing with all languages
            existing.label = es
            existing.label_es = es
            existing.label_en = en
            existing.label_pt = pt
            existing.label_fr = fr
            existing.label_de = de
            existing.label_it = it
            existing.label_ru = ru
            existing.label_sv = sv
            existing.label_nl = nl
            existing.label_zh = zh
            existing.label_hi = hi
            existing.label_bn = bn
            existing.label_ja = ja
            existing.label_ko = ko
            existing.label_ar = ar
            existing.label_sw = sw
            existing.label_ha = ha
            existing.label_am = am
            existing.label_tl = tl
            existing.label_ms = ms
            existing.label_mi = mi
            existing.order = order
            existing.is_active = True
            await existing.save()
        else:
            await SystemOption(
                category="relationship_status",
                value=value,
                label=es,
                label_es=es,
                label_en=en,
                label_pt=pt,
                label_fr=fr,
                label_de=de,
                label_it=it,
                label_ru=ru,
                label_sv=sv,
                label_nl=nl,
                label_zh=zh,
                label_hi=hi,
                label_bn=bn,
                label_ja=ja,
                label_ko=ko,
                label_ar=ar,
                label_sw=sw,
                label_ha=ha,
                label_am=am,
                label_tl=tl,
                label_ms=ms,
                label_mi=mi,
                order=order,
                is_active=True,
            ).insert()
            created += 1
    print(f"seed_relationship_status: created {created}, skipped {len(OPTIONS) - created}")


if __name__ == "__main__":
    asyncio.run(main())