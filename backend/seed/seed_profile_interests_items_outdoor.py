"""
Seed items for Outdoor & Adventure category (profileSections.interests.items.*).

Values are item slugs; frontend resolves via profileSections.interests.items.{slug}.
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_outdoor.py
"""

import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh",
    "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi",
]


def L(**kw) -> dict:
    missing = [lang for lang in LANGS if lang not in kw]
    if missing:
        raise ValueError(f"missing languages: {missing}")
    unknown = [key for key in kw if key not in LANGS]
    if unknown:
        raise ValueError(f"unknown languages: {unknown}")
    return kw


# (slug, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi)
ITEMS = [
    ("remo", "Remo", "Rowing", "Remo", "Aviron", "Rudern", "Canottaggio", "Гребля", "Ro", "Roeien", "划船", "नाव चलाना", "নৌকা বাইচ", "ボート", "조정", "تجديف", "Kupiga makasia", "Tukwan jirgi", "መቅዘፊያ", "Pagsagwan", "Mendayung", "Hoe waka"),
    ("buceo", "Buceo", "Diving", "Mergulho", "Plongée", "Tauchen", "Immersione", "Дайвинг", "Dykning", "Duiken", "潜水", "गोताखोरी", "ডাইভিং", "ダイビング", "다이빙", "غوص", "Kupiga mbizi", "Nutsewa", "ው diving", "Pagsisid", "Menyelam", "Ruku kōtore"),
    ("esqui", "Esquí", "Skiing", "Esqui", "Ski", "Skifahren", "Sci", "Лыжи", "Skidåkning", "Skiën", "滑雪", "स्कीइंग", "স্কিইং", "スキー", "스키", "تزلج", "Kuteleza", "Tsallake", "ስኪ", "Pag-iiski", "Berski", "Retireti"),
    ("canotaje", "Canotaje", "Canoeing", "Canoagem", "Canoë", "Kanutour", "Canoa", "Гребля на каноэ", "Kanot", "Kanoën", "独木舟", "कैनोइंग", "ক্যানোয়িং", "カヌー", "카누", "تجديف بالكانو", "Mtumbwi", "Kwale-kwale", "ካኑ", "Pamamangka", "Berkayak", "Waka"),
    ("snowboard", "Snowboard", "Snowboard", "Snowboard", "Snowboard", "Snowboard", "Snowboard", "Сноуборд", "Snowboard", "Snowboarden", "单板滑雪", "स्नोबोर्ड", "স্নোবোর্ড", "スノーボード", "스노보드", "التزلج على الثلج", "Snowboard", "Snowboard", "ስኖቦርድ", "Snowboard", "Snowboard", "Papa hukarere"),
    ("surf", "Surf", "Surfing", "Surfe", "Surf", "Surfen", "Surf", "Сёрфинг", "Surfing", "Surfen", "冲浪", "सर्फिंग", "সার্ফিং", "サーフィン", "서핑", "ركوب الأمواج", "Kuteleza mawimbini", "Hawan igiyar ruwa", "ሰርፍ", "Pag-surf", "Meluncur", "Ngongaru"),
    ("senderismo", "Senderismo", "Hiking", "Trilha", "Randonnée", "Wandern", "Escursionismo", "Пеший туризм", "Vandring", "Wandelen", "徒步", "पैदल यात्रा", "হাইকিং", "ハイキング", "하이킹", "المشي لمسافات طويلة", "Kutembea mlimani", "Tafiya ƙasa", "እግር ጉዞ", "Pag-hiking", "Mendaki", "Hīkoi"),
    ("escalada", "Escalada", "Climbing", "Escalada", "Escalade", "Klettern", "Arrampicata", "Скалолазание", "Klättring", "Klimmen", "攀岩", "चढ़ाई", "আরোহণ", "クライミング", "클라이밍", "تسلق", "Kupanda", "Hawan dutse", "መውጣት", "Pag-akyat", "Memanjat", "Piki"),
    ("camping", "Camping", "Camping", "Camping", "Camping", "Camping", "Campeggio", "Кемпинг", "Camping", "Kamperen", "露营", "कैंपिंग", "ক্যাম্পিং", "キャンプ", "캠핑", "تخييم", "Kambi", "Sansani", "ካምፕ", "Camping", "Perkhemahan", "Punanga"),
    ("ciclismo_montana", "Ciclismo Montaña", "Mountain Biking", "Ciclismo de Montanha", "VTT", "Mountainbiken", "Mountain bike", "Горный велосипед", "Mountainbike", "Mountainbiken", "山地骑行", "माउंटेन बाइकिंग", "মাউন্টেন বাইকিং", "マウンテンバイク", "산악자전거", "ركوب الدراجات الجبلية", "Baiskeli ya mlimani", "Kekuna tsauni", "የተራራ ብስክሌት", "Mountain biking", "Berbasikal gunung", "Pahikara maunga"),
    ("parapente", "Parapente", "Paragliding", "Parapente", "Parapente", "Gleitschirm", "Parapendio", "Параплан", "Skärmflyg", "Paragliden", "滑翔伞", "पैराग्लाइडिंग", "প্যারাগ্লাইডিং", "パラグライダー", "패러글라이딩", "الطيران الشراعي", "Kuruka miavuli", "Jirgin sama", "ፓራግላይዲንግ", "Paragliding", "Paragliding", "Kererangi"),
    ("rafting", "Rafting", "Rafting", "Rafting", "Rafting", "Rafting", "Rafting", "Рафтинг", "Forsränning", "Raften", "漂流", "राफ्टिंग", "র‍্যাফটিং", "ラフティング", "래프팅", "التجديف", "Rafting", "Rafting", "ራፍቲንግ", "Rafting", "Rafting", "Whakatere waka"),
    ("kayak", "Kayak", "Kayaking", "Caiaque", "Kayak", "Kajak", "Kayak", "Каякинг", "Kajak", "Kajakken", "皮划艇", "कयाकिंग", "কায়াকিং", "カヤック", "카약", "التجديف بالكاياك", "Kayak", "Kayak", "ካያክ", "Kayak", "Berkayak", "Waka iti"),
    ("vela", "Vela", "Sailing", "Vela", "Voile", "Segeln", "Vela", "Парусный спорт", "Segling", "Zeilen", "帆船", "नौकायन", "পালতোলা", "セーリング", "요트", "إبحار", "Tanga", "Jirgin ruwa", "መርከብ", "Paglalayag", "Belayar", "Whakatere"),
    ("windsurf", "Windsurf", "Windsurfing", "Windsurf", "Planche à voile", "Windsurfen", "Windsurf", "Виндсёрфинг", "Vindsurfing", "Windsurfen", "帆板", "विंडसर्फिंग", "উইন্ডসার্ফিং", "ウインドサーフィン", "윈드서핑", "ركوب الأمواج الشراعية", "Windsurf", "Windsurf", "ዊንድሰርፍ", "Windsurfing", "Luncur angin", "Ngongaru hau"),
    ("kitesurf", "Kitesurf", "Kitesurfing", "Kitesurf", "Kitesurf", "Kitesurfen", "Kitesurf", "Кайтсёрфинг", "Kitesurfing", "Kitesurfen", "风筝冲浪", "काइटसर्फिंग", "কাইটসার্ফিং", "カイトサーフィン", "카이트서핑", "ركوب الطائرة الورقية", "Kitesurf", "Kitesurf", "ካይትሰርፍ", "Kitesurfing", "Luncur layang", "Ngongaru aho"),
    ("montanismo", "Montañismo", "Mountaineering", "Montanhismo", "Alpinisme", "Bergsteigen", "Alpinismo", "Альпинизм", "Bergsklättring", "Alpinisme", "登山", "पर्वतारोहण", "পর্বতারোহণ", "登山", "등산", "تسلق الجبال", "Kupanda milima", "Hawan tsaunuka", "ተራራ መውጣት", "Pamumundok", "Mendaki gunung", "Piki maunga"),
    ("trekking", "Trekking", "Trekking", "Trekking", "Trekking", "Trekking", "Trekking", "Треккинг", "Trekking", "Trekken", "徒步旅行", "ट्रेकिंग", "ট্রেকিং", "トレッキング", "트레킹", "الرحلات", "Kutembea", "Tafiya", "ጉዞ", "Pag-trekking", "Trekking", "Hīkoi roa"),
    ("pesca", "Pesca", "Fishing", "Pesca", "Pêche", "Angeln", "Pesca", "Рыбалка", "Fiske", "Vissen", "钓鱼", "मछली पकड़ना", "মাছ ধরা", "釣り", "낚시", "صيد السمك", "Uvuvi", "Kamakifi", "ዓሣ ማጥመድ", "Pangingisda", "Memancing", "Hī ika"),
    ("caza", "Caza", "Hunting", "Caça", "Chasse", "Jagd", "Caccia", "Охота", "Jakt", "Jagen", "狩猎", "शिकार", "শিকার", "狩猟", "사냥", "صيد", "Uwindaji", "Farauta", "አደን", "Pangangaso", "Memburu", "Whakangau"),
    ("observacion_aves", "Observación Aves", "Birdwatching", "Observação de Aves", "Observation des oiseaux", "Vogelbeobachtung", "Birdwatching", "Наблюдение за птицами", "Fågelskådning", "Vogels kijken", "观鸟", "पक्षी देखना", "পাখি দেখা", "バードウォッチング", "조류 관찰", "مراقبة الطيور", "Kutazama ndege", "Kallon tsuntsaye", "ወፎችን መመልከት", "Pagmamasid sa ibon", "Memerhati burung", "Mātakitaki manu"),
    ("fotografia_naturaleza", "Fotografía Naturaleza", "Nature Photography", "Fotografia de Natureza", "Photo nature", "Naturfotografie", "Fotografia naturalistica", "Природная фотография", "Naturfoto", "Natuurfotografie", "自然摄影", "प्रकृति फोटोग्राफी", "প্রকৃতি ফটোগ্রাফি", "自然写真", "자연 사진", "تصوير الطبيعة", "Upigaji picha za asili", "Ɗaukar hoton yanayi", "የተፈጥሮ ፎቶግራፍ", "Potograpiya ng kalikasan", "Fotografi alam", "Whakaahua taiao"),
    ("geocaching", "Geocaching", "Geocaching", "Geocaching", "Géocaching", "Geocaching", "Geocaching", "Геокэшинг", "Geocaching", "Geocachen", "地理寻宝", "जियोकैशिंग", "জিওক্যাশিং", "ジオキャッシング", "지오캐싱", "البحث عن الكنوز", "Geocaching", "Geocaching", "ጂኦካሺንግ", "Geocaching", "Geocaching", "Geocaching"),
    ("orientacion", "Orientación", "Orienteering", "Orientação", "Orientation", "Orientierungslauf", "Orientamento", "Спортивное ориентирование", "Orientering", "Oriëntatielopen", "定向越野", "ओरिएंटियरिंग", "ওরিয়েন্টিয়ারিং", "オリエンテーリング", "오리엔티어링", "سباقات التوجيه", "Mwelekeo", "Gane-gane", "አቅጣጫ", "Oryentasyon", "Orientasi", "Whakatere whenua"),
    ("slackline", "Slackline", "Slacklining", "Slackline", "Slackline", "Slackline", "Slackline", "Слэклайн", "Slackline", "Slacklinen", "走扁带", "स्लैकलाइन", "স্ল্যাকলাইন", "スラックライン", "슬랙라인", "المشي على الحبل", "Slackline", "Slackline", "ስላክላይን", "Slackline", "Slackline", "Taura whāro"),
    ("parkour", "Parkour", "Parkour", "Parkour", "Parkour", "Parkour", "Parkour", "Паркур", "Parkour", "Parkour", "跑酷", "पारकौर", "পারকোর", "パルクール", "파쿠르", "باركور", "Parkour", "Parkour", "ፓርኩር", "Parkour", "Parkour", "Parkour"),
    ("bmx", "BMX", "BMX", "BMX", "BMX", "BMX", "BMX", "BMX", "BMX", "BMX", "小轮车", "बीएमएक्स", "বিএমএক্স", "BMX", "BMX", "دراجات BMX", "BMX", "BMX", "ቢኤምኤክስ", "BMX", "BMX", "BMX"),
    ("skateboarding", "Skateboarding", "Skateboarding", "Skate", "Skateboard", "Skateboarden", "Skateboard", "Скейтбординг", "Skateboard", "Skateboarden", "滑板", "स्केटबोर्डिंग", "স্কেটবোর্ডিং", "スケートボード", "스케이트보드", "التزلج", "Skateboard", "Skateboard", "ስኬትቦርድ", "Skateboarding", "Papan luncur", "Papa reti"),
    ("patinaje", "Patinaje", "Skating", "Patinação", "Patinage", "Schlittschuhlaufen", "Pattinaggio", "Катание на коньках", "Skridskoåkning", "Schaatsen", "滑冰", "स्केटिंग", "স্কেটিং", "スケート", "스케이팅", "تزلج", "Kuteleza", "Tsalle-tsalle", "በ冰上 መንሸራተት", "Pag-iisketing", "Meluncur", "Retireti tio"),
    ("equitacion", "Equitación", "Horseback Riding", "Equitação", "Équitation", "Reiten", "Equitazione", "Верховая езда", "Ridning", "Paardrijden", "骑马", "घुड़सवारी", "ঘোড়ায় চড়া", "乗馬", "승마", "ركوب الخيل", "Kupanda farasi", "Hawan doki", "ፈረስ መንዳት", "Pangangabayo", "Menunggang kuda", "Eke hōiho"),
    ("safari", "Safari", "Safari", "Safári", "Safari", "Safari", "Safari", "Сафари", "Safari", "Safari", "野生动物游", "सफारी", "সাফারি", "サファリ", "사파리", "سفاري", "Safari", "Safari", "ሳፋሪ", "Safari", "Safari", "Tāpoi mohoao"),
    ("espeleologia", "Espeleología", "Caving", "Espeleologia", "Spéléologie", "Höhlenforschung", "Speleologia", "Спелеология", "Grottforskning", "Speleologie", "洞穴探险", "गुफा विज्ञान", "গুহা বিজ্ঞান", "洞窟探検", "동굴 탐험", "استكشاف الكهوف", "Uchunguzi wa mapango", "Binciken kogo", "የዋሻ ጥናት", "Pagsisiyasat ng kuweba", "Speleologi", "Tūhura ana"),
    ("barranquismo", "Barranquismo", "Canyoning", "Canyonismo", "Canyoning", "Canyoning", "Canyoning", "Каньонинг", "Canyoning", "Canyoning", "溪降", "कैन्यनिंग", "ক্যানিয়নিং", "キャニオニング", "캐니어닝", "التجديف في الأخاديد", "Kushuka makorongo", "Ruwan tsauni", "ሽርሽር", "Canyoning", "Canyoning", "Heke awaawa"),
    ("tirolesa", "Tirolesa", "Zipline", "Tirolesa", "Tyrolienne", "Zipline", "Zipline", "Зиплайн", "Zipline", "Zipline", "滑索", "ज़िपलाइन", "জিপলাইন", "ジップライン", "짚라인", "الانزلاق بالحبل", "Kuteleza kwa kamba", "Jirgin igiya", "ዚፕላይን", "Zipline", "Gelung gelongsor", "Kaka rererangi"),
    ("vuelo_parapente", "Vuelo Parapente", "Paragliding Flight", "Voo de Parapente", "Vol en parapente", "Gleitschirmflug", "Volo in parapendio", "Полёт на параплане", "Skärmflygning", "Paraglidevlucht", "滑翔伞飞行", "पैराग्लाइडिंग उड़ान", "প্যারাগ্লাইডিং ফ্লাইট", "パラグライダーフライト", "패러글라이딩 비행", "رحلة الطيران الشراعي", "Kuruka kwa mwavuli", "Tashi da jirgin sama", "በፓራግላይደር በረራ", "Paglipad ng paraglider", "Penerbangan paragliding", "Rere paramotara"),
    ("ala_delta", "Ala Delta", "Hang Gliding", "Asa Delta", "Deltaplane", "Drachenfliegen", "Deltaplano", "Дельтапланеризм", "Hängflyg", "Deltavliegen", "悬挂滑翔", "हैंग ग्लाइडिंग", "হ্যাং গ্লাইডিং", "ハンググライダー", "행글라이딩", "الطيران الشراعي المعلق", "Kuruka delta", "Jirgin aldelta", "ዴልታ በረራ", "Hang gliding", "Layang gantung", "Rere tarewa"),
    ("motocross", "Motocross", "Motocross", "Motocross", "Motocross", "Motocross", "Motocross", "Мотокросс", "Motocross", "Motorcross", "摩托越野", "मोटोक्रॉस", "মোটোক্রস", "モトクロス", "모토크로스", "موتوكروس", "Motocross", "Motocross", "ሞቶክሮስ", "Motocross", "Motocross", "Motocross"),
    ("quad", "Quad", "Quad Biking", "Quadriciclo", "Quad", "Quad", "Quad", "Квадроцикл", "Fyrhjuling", "Quadrijden", "四轮摩托", "क्वाड बाइकिंग", "কোয়াড বাইকিং", "四輪バギー", "사륜 바이크", "الدراجات الرباعية", "Pikipiki", "Babur mai ƙafa huɗu", "ኳድ", "Quad biking", "Kenderaan ATV", "Pahikara whā-wira"),
    ("jet_ski", "Jet Ski", "Jet Skiing", "Jet Ski", "Jet-ski", "Jetski", "Moto d'acqua", "Гидроцикл", "Vattenskoter", "Jetskiën", "喷射滑水", "जेट स्कीइंग", "জেট স্কিইং", "ジェットスキー", "제트스키", "جت سكي", "Jet ski", "Jet ski", "ጀት ስኪ", "Jet ski", "Jet ski", "Waka retireti"),
    ("buceo_apnea", "Buceo Apnea", "Freediving", "Mergulho Livre", "Apnée", "Apnoetauchen", "Apnea", "Фридайвинг", "Fridykning", "Freediven", "自由潜水", "फ्रीडाइविंग", "ফ্রিডাইভিং", "フリーダイビング", "프리다이빙", "الغوص الحر", "Kuzamia bila kifaa", "Nutsewa ba tare da kaya ba", "ነፃ ስork diving", "Freediving", "Selaman bebas", "Ruku hā"),
    ("snorkel", "Snorkel", "Snorkeling", "Snorkel", "Snorkeling", "Schnorcheln", "Snorkeling", "Сноркелинг", "Snorkling", "Snorkelen", "浮潜", "स्नॉर्कलिंग", "স্নরকেলিং", "シュノーケリング", "스노클링", "الغطس", "Snorkel", "Snorkel", "ስኖርክል", "Snorkeling", "Snorkeling", "Ngongaru ihu"),
]

# Typo guard
for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 100
    for row in ITEMS:
        slug = row[0]
        vals = dict(zip(LANGS, row[1:]))
        value = f"items.{slug}"
        existing = await SystemOption.find_one(
            SystemOption.category == "profile_interests_section",
            SystemOption.value == value,
        )
        doc_data = {
            "category": "profile_interests_section",
            "value": value,
            "label": vals["es"],
            "order": order,
            "is_active": True,
        }
        for lang in LANGS:
            doc_data[f"label_{lang}"] = vals.get(lang, "")
        if existing:
            for key, val in doc_data.items():
                setattr(existing, key, val)
            await existing.save()
            updated += 1
        else:
            await SystemOption(**doc_data).insert()
            created += 1
        order += 1
    print(f"seed outdoor items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
