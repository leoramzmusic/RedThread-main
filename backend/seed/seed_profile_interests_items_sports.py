"""
Seed items for Sports & Fitness category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_sports.py
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
    ("gym", "Gym", "Gym", "Academia", "Salle de sport", "Fitnessstudio", "Palestra", "Тренажёрный зал", "Gym", "Sportschool", "健身房", "जिम", "জিম", "ジム", "헬스장", "صالة رياضية", "Jimu", "Dakin motsa jiki", "ጂም", "Gym", "Gim", "Whare hākinakina"),
    ("caminar", "Caminar", "Walking", "Caminhar", "Marche", "Spazieren", "Camminare", "Ходьба", "Promenader", "Wandelen", "散步", "पैदल चलना", "হাঁটা", "散歩", "걷기", "مشي", "Kutembea", "Tafiya", "መራመድ", "Paglalakad", "Berjalan", "Hīkoi"),
    ("futbol", "Fútbol", "Soccer", "Futebol", "Football", "Fußball", "Calcio", "Футбол", "Fotboll", "Voetbal", "足球", "फुटबॉल", "ফুটবল", "サッカー", "축구", "كرة القدم", "Mpira wa miguu", "Ƙwallon ƙafa", "እግር ኳስ", "Futbol", "Bola sepak", "Whutupaoro"),
    ("basketball", "Basketball", "Basketball", "Basquete", "Basket", "Basketball", "Basket", "Баскетбол", "Basket", "Basketbal", "篮球", "बास्केटबॉल", "বাস্কেটবল", "バスケットボール", "농구", "كرة السلة", "Mpira wa kikapu", "Kwando", "ቅርጫት ኳስ", "Basketball", "Bola keranjang", "Poitūkohu"),
    ("tennis", "Tennis", "Tennis", "Tênis", "Tennis", "Tennis", "Tennis", "Теннис", "Tennis", "Tennis", "网球", "टेनिस", "টেনিস", "テニス", "테니스", "تنس", "Tennis", "Tennis", "ቴኒስ", "Tennis", "Tenis", "Tēnehi"),
    ("volleyball", "Volleyball", "Volleyball", "Vôlei", "Volley", "Volleyball", "Pallavolo", "Волейбол", "Volleyboll", "Volleybal", "排球", "वॉलीबॉल", "ভলিবল", "バレーボール", "배구", "كرة طائرة", "Mpira wa wavu", "Kwallon raga", "ቮሊቦል", "Volleyball", "Bola tampar", "Poirewa"),
    ("baseball", "Baseball", "Baseball", "Beisebol", "Baseball", "Baseball", "Baseball", "Бейсбол", "Baseboll", "Honkbal", "棒球", "बेसबॉल", "বেসবল", "野球", "야구", "بيسبول", "Baseball", "Baseball", "ቤዝቦል", "Baseball", "Besbol", "Baseball"),
    ("rugby", "Rugby", "Rugby", "Rúgbi", "Rugby", "Rugby", "Rugby", "Регби", "Rugby", "Rugby", "橄榄球", "रग्बी", "রাগবি", "ラグビー", "럭비", "ركبي", "Rugby", "Rugby", "ራግቢ", "Rugby", "Ragbi", "Whutuporo"),
    ("hockey", "Hockey", "Hockey", "Hóquei", "Hockey", "Hockey", "Hockey", "Хоккей", "Hockey", "Hockey", "曲棍球", "हॉकी", "হকি", "ホッケー", "하키", "هوكي", "Hockey", "Hockey", "ሆኪ", "Hockey", "Hoki", "Hockey"),
    ("natacion", "Natación", "Swimming", "Natação", "Natation", "Schwimmen", "Nuoto", "Плавание", "Simning", "Zwemmen", "游泳", "तैराकी", "সাঁতার", "水泳", "수영", "سباحة", "Kuogelea", "Iyo", "መዋኘት", "Paglangoy", "Berenang", "Kaukau"),
    ("atletismo", "Atletismo", "Athletics", "Atletismo", "Athlétisme", "Leichtathletik", "Atletica", "Лёгкая атлетика", "Friidrott", "Atletiek", "田径", "एथलेटिक्स", "অ্যাথলেটিক্স", "陸上競技", "육상", "ألعاب القوى", "Riadha", "Wasannin motsa jiki", "አትሌቲክስ", "Atletika", "Olahraga", "Hākinakina"),
    ("boxeo", "Boxeo", "Boxing", "Boxe", "Boxe", "Boxen", "Pugilato", "Бокс", "Boxning", "Boksen", "拳击", "मुक्केबाजी", "বক্সিং", "ボクシング", "복싱", "ملاكمة", "Ndondi", "Dambe", "ቦክስ", "Boksing", "Tinju", "Mekemeke"),
    ("mma", "MMA", "MMA", "MMA", "MMA", "MMA", "MMA", "ММА", "MMA", "MMA", "综合格斗", "एमएमए", "এমএমএ", "総合格闘技", "MMA", "فنون قتالية مختلطة", "MMA", "MMA", "ኤምኤምኤ", "MMA", "MMA", "MMA"),
    ("karate", "Karate", "Karate", "Karatê", "Karaté", "Karate", "Karate", "Карате", "Karate", "Karate", "空手道", "कराटे", "কারাতে", "空手", "가라테", "كاراتيه", "Karate", "Karate", "ካራቴ", "Karate", "Karate", "Karate"),
    ("taekwondo", "Taekwondo", "Taekwondo", "Taekwondo", "Taekwondo", "Taekwondo", "Taekwondo", "Тхэквондо", "Taekwondo", "Taekwondo", "跆拳道", "ताइक्वांडो", "তায়কোয়ান্দো", "テコンドー", "태권도", "تايكواندو", "Taekwondo", "Taekwondo", "ቴኳንዶ", "Taekwondo", "Taekwondo", "Taekwondo"),
    ("judo", "Judo", "Judo", "Judô", "Judo", "Judo", "Judo", "Дзюдо", "Judo", "Judo", "柔道", "जूडो", "জুডো", "柔道", "유도", "جودو", "Judo", "Judo", "ጁዶ", "Judo", "Judo", "Judo"),
    ("jiu_jitsu", "Jiu Jitsu", "Jiu-Jitsu", "Jiu-Jitsu", "Jiu-jitsu", "Jiu-Jitsu", "Jiu-jitsu", "Джиу-джитсу", "Jiu-jitsu", "Jiu-jitsu", "巴西柔术", "जिउ-जित्सु", "জিউ-জিতসু", "柔術", "주짓수", "جيو جيتسو", "Jiu-jitsu", "Jiu-jitsu", "ጂዩ ጂትሱ", "Jiu-jitsu", "Jiu-jitsu", "Jiu-jitsu"),
    ("muay_thai", "Muay Thai", "Muay Thai", "Muay Thai", "Muay-thaï", "Muay Thai", "Muay thai", "Муай-тай", "Muay thai", "Muay Thai", "泰拳", "मुए थाई", "মুয়ে থাই", "ムエタイ", "무에타이", "مواي تاي", "Muay Thai", "Muay Thai", "ሙአይ ታይ", "Muay Thai", "Muay Thai", "Muay Thai"),
    ("kickboxing", "Kickboxing", "Kickboxing", "Kickboxing", "Kick-boxing", "Kickboxen", "Kickboxing", "Кикбоксинг", "Kickboxning", "Kickboksen", "踢拳", "किकबॉक्सिंग", "কিকবক্সিং", "キックボクシング", "킥복싱", "كيك بوكسينغ", "Kickboxing", "Kickboxing", "ኪክቦክሲንግ", "Kickboxing", "Kickboxing", "Kickboxing"),
    ("esgrima", "Esgrima", "Fencing", "Esgrima", "Escrime", "Fechten", "Scherma", "Фехтование", "Fäktning", "Schermen", "击剑", "तलवारबाजी", "ফেন্সিং", "フェンシング", "펜싱", "مبارزة", "Upanga", "Takobi", "ሰይፍ ጥይት", "Eskrima", "Lawan pedang", "Taiapa hoari"),
    ("tiro_arco", "Tiro Arco", "Archery", "Tiro com Arco", "Tir à l'arc", "Bogenschießen", "Tiro con l'arco", "Стрельба из лука", "Bågskytte", "Boogschieten", "射箭", "तीरंदाजी", "তীরন্দাজি", "アーチェリー", "양궁", "رماية", "Upinde", "Harbin baka", "ቀስት", "Pamamana", "Memanah", "Pere pana"),
    ("golf", "Golf", "Golf", "Golfe", "Golf", "Golf", "Golf", "Гольф", "Golf", "Golf", "高尔夫", "गोल्फ", "গলফ", "ゴルフ", "골프", "غولف", "Gofu", "Golf", "ጎልፍ", "Golf", "Golf", "Korowha"),
    ("bowling", "Bowling", "Bowling", "Boliche", "Bowling", "Bowling", "Bowling", "Боулинг", "Bowling", "Bowlen", "保龄球", "बॉलिंग", "বোলিং", "ボウリング", "볼링", "بولينغ", "Bowling", "Bowling", "ቦውሊንግ", "Bowling", "Boling", "Bowling"),
    ("ping_pong", "Ping Pong", "Table Tennis", "Tênis de Mesa", "Tennis de table", "Tischtennis", "Tennis tavolo", "Настольный теннис", "Bordtennis", "Tafeltennis", "乒乓球", "टेबल टेनिस", "টেবিল টেনিস", "卓球", "탁구", "تنس طاولة", "Meza tenisi", "Tenis na tebur", "የጠረጴዛ ቴኒስ", "Table tennis", "Ping pong", "Tēnehi tēpu"),
    ("badminton", "Badminton", "Badminton", "Badminton", "Badminton", "Badminton", "Badminton", "Бадминтон", "Badminton", "Badminton", "羽毛球", "बैडमिंटन", "ব্যাডমিন্টন", "バドミントン", "배드민턴", "ريشة طائرة", "Badminton", "Badminton", "ባድሚንተን", "Badminton", "Badminton", "Badminton"),
    ("squash", "Squash", "Squash", "Squash", "Squash", "Squash", "Squash", "Сквош", "Squash", "Squash", "壁球", "स्क्वैश", "স্কোয়াশ", "スカッシュ", "스쿼시", "سكواش", "Squash", "Squash", "ስኳሽ", "Squash", "Skuasy", "Squash"),
    ("padel", "Padel", "Padel", "Padel", "Padel", "Padel", "Padel", "Падел", "Padel", "Padel", "板式网球", "पैडल", "প্যাডেল", "パデル", "파델", "بادل", "Padel", "Padel", "ፓደል", "Padel", "Padel", "Padel"),
    ("ciclismo", "Ciclismo", "Cycling", "Ciclismo", "Cyclisme", "Radfahren", "Ciclismo", "Велоспорт", "Cykling", "Fietsen", "骑行", "साइकिलिंग", "সাইক্লিং", "サイクリング", "자전거", "ركوب الدراجات", "Baiskeli", "Keke", "ብስክሌት", "Pagbibisikleta", "Berbasikal", "Eke pahikara"),
    ("spinning", "Spinning", "Spinning", "Spinning", "Spinning", "Spinning", "Spinning", "Спиннинг", "Spinning", "Spinning", "动感单车", "स्पिनिंग", "স্পিনিং", "スピニング", "스피닝", "سبينينغ", "Spinning", "Spinning", "ስፒኒንግ", "Spinning", "Spinning", "Spinning"),
    ("running", "Running", "Running", "Corrida", "Running", "Laufen", "Running", "Бег", "Löpning", "Hardlopen", "跑步", "रनिंग", "রানিং", "ランニング", "러닝", "جري", "Kukimbia", "Gudu", "ሩጫ", "Pagtakbo", "Berlari", "Omaoma"),
    ("maraton", "Maratón", "Marathon", "Maratona", "Marathon", "Marathon", "Maratona", "Марафон", "Maraton", "Marathon", "马拉松", "मैराथन", "ম্যারাথন", "マラソン", "마라톤", "ماراثون", "Marathon", "Marathon", "ማራቶን", "Marathon", "Maraton", "Marathon"),
    ("triatlon", "Triatlón", "Triathlon", "Triatlo", "Triathlon", "Triathlon", "Triathlon", "Триатлон", "Triathlon", "Triatlon", "铁人三项", "ट्रायथलॉन", "ট্রায়াথলন", "トライアスロン", "트라이애슬론", "ترياثلون", "Triathlon", "Triathlon", "ትራያትሎን", "Triathlon", "Triatlon", "Triathlon"),
    ("crossfit", "Crossfit", "CrossFit", "Crossfit", "Crossfit", "Crossfit", "Crossfit", "Кроссфит", "Crossfit", "Crossfit", "交叉健身", "क्रॉसफिट", "ক্রসফিট", "クロスフィット", "크로스핏", "كروسفت", "Crossfit", "Crossfit", "ክሮስፊት", "Crossfit", "Crossfit", "Crossfit"),
    ("calistenia", "Calistenia", "Calisthenics", "Calistenia", "Callisthénie", "Calisthenics", "Calistenia", "Калистеника", "Calisthenics", "Calisthenics", "徒手健身", "कैलिस्थेनिक्स", "ক্যালিসথেনিক্স", "自重トレーニング", "맨몸운동", "تمارين وزن الجسم", "Mazoezi ya mwili", "Motsa jiki", "ካሊስቴኒክስ", "Calisthenics", "Kalistenik", "Kori tinana"),
    ("powerlifting", "Powerlifting", "Powerlifting", "Levantamento de Peso", "Force athlétique", "Kraftdreikampf", "Powerlifting", "Пауэрлифтинг", "Styrkelyft", "Powerliften", "力量举", "पावरलिफ्टिंग", "পাওয়ারলিফটিং", "パワーリフティング", "파워리프팅", "رفع الأثقال", "Powerlifting", "Powerlifting", "ፓወርሊፍቲንግ", "Powerlifting", "Powerlifting", "Hiki whakapakari"),
    ("halterofilia", "Halterofilia", "Weightlifting", "Levantamento Olímpico", "Haltérophilie", "Gewichtheben", "Sollevamento pesi", "Тяжёлая атлетика", "Tyngdlyftning", "Gewichtheffen", "举重", "भारोत्तोलन", "ভারোত্তোলন", "重量挙げ", "역도", "رفع الأثقال", "Kunanyua vyuma", "Ɗaukar ƙarfe", "ክብደት ማንሳት", "Weightlifting", "Angkat berat", "Hiki pauna"),
    ("zumba", "Zumba", "Zumba", "Zumba", "Zumba", "Zumba", "Zumba", "Зумба", "Zumba", "Zumba", "尊巴", "ज़ुम्बा", "জুম্বা", "ズンバ", "줌바", "زومبا", "Zumba", "Zumba", "ዙምባ", "Zumba", "Zumba", "Zumba"),
    ("aerobics", "Aerobics", "Aerobics", "Aeróbica", "Aérobic", "Aerobic", "Aerobica", "Аэробика", "Aerobics", "Aerobics", "有氧操", "एरोबिक्स", "অ্যারোবিক্স", "エアロビクス", "에어로빅", "أيروبيك", "Aerobics", "Aerobics", "ኤሮቢክስ", "Aerobics", "Aerobik", "Aerobics"),
    ("step", "Step", "Step", "Step", "Step", "Step-Aerobic", "Step", "Степ-аэробика", "Step", "Steppen", "踏板操", "स्टेप", "স্টেপ", "ステップ", "스텝", "ستيب", "Step", "Step", "ስቴፕ", "Step", "Step", "Step"),
    ("pole_dance", "Pole Dance", "Pole Dance", "Pole Dance", "Pole dance", "Pole Dance", "Pole dance", "Танец на пилоне", "Poledance", "Paaldansen", "钢管舞", "पोल डांस", "পোল ডান্স", "ポールダンス", "폴댄스", "رقص العمود", "Pole dance", "Pole dance", "ፖል ዳንስ", "Pole dance", "Tarian tiang", "Kanikani pou"),
    ("parkour", "Parkour", "Parkour", "Parkour", "Parkour", "Parkour", "Parkour", "Паркур", "Parkour", "Parkour", "跑酷", "पारकौर", "পারকোর", "パルクール", "파쿠르", "باركور", "Parkour", "Parkour", "ፓርኩር", "Parkour", "Parkour", "Parkour"),
    ("escalada_deportiva", "Escalada Deportiva", "Sport Climbing", "Escalada Esportiva", "Escalade sportive", "Sportklettern", "Arrampicata sportiva", "Спортивное скалолазание", "Sportklättring", "Sportklimmen", "竞技攀岩", "खेल चढ़ाई", "স্পোর্ট ক্লাইম্বিং", "スポーツクライミング", "스포츠 클라이밍", "تسلق رياضي", "Kupanda kwa michezo", "Hawan wasanni", "የስፖርት መውጣት", "Sport climbing", "Panjat tebing sukan", "Piki hākinakina"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 600
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
    print(f"seed sports items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
