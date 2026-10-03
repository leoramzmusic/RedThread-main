"""
Seed items for Wellness & Lifestyle category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_wellness.py
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
    ("amor_propio", "Amor Propio", "Self Love", "Amor Próprio", "Amour de soi", "Selbstliebe", "Amor proprio", "Любовь к себе", "Självkärlek", "Eigenliefde", "自爱", "आत्म प्रेम", "আত্ম-ভালোবাসা", "自己愛", "자기애", "حب الذات", "Kujipenda", "Son kai", "ራስን መውደድ", "Pagmamahal sa sarili", "Sayangi diri", "Aroha ki a koe"),
    ("probar_cosas_nuevas", "Probar Cosas Nuevas", "Trying New Things", "Experimentar Coisas Novas", "Essayer de nouvelles choses", "Neues ausprobieren", "Provare cose nuove", "Пробовать новое", "Prova nya saker", "Nieuwe dingen proberen", "尝试新事物", "नई चीजें आज़माना", "নতুন জিনিস চেষ্টা", "新しいことに挑戦", "새로운 것 시도", "تجربة أشياء جديدة", "Kujaribu vitu vipya", "Gwada sabbin abubuwa", "አዳዲስ ነገሮችን መሞከር", "Pagsubok ng bago", "Mencuba perkara baharu", "Whakamātau mea hou"),
    ("tarot", "Tarot", "Tarot", "Tarô", "Tarot", "Tarot", "Tarocchi", "Таро", "Tarot", "Tarot", "塔罗", "टैरो", "ট্যারোট", "タロット", "타로", "تاروت", "Tarot", "Tarot", "ታሮት", "Tarot", "Tarot", "Tarot"),
    ("spa", "Spa", "Spa", "Spa", "Spa", "Spa", "Spa", "Спа", "Spa", "Spa", "水疗", "स्पा", "স্পা", "スパ", "스파", "سبا", "Spa", "Spa", "ስፓ", "Spa", "Spa", "Spa"),
    ("yoga", "Yoga", "Yoga", "Ioga", "Yoga", "Yoga", "Yoga", "Йога", "Yoga", "Yoga", "瑜伽", "योग", "যোগব্যায়াম", "ヨガ", "요가", "يوغا", "Yoga", "Yoga", "ዮጋ", "Yoga", "Yoga", "Yoga"),
    ("meditacion", "Meditación", "Meditation", "Meditação", "Méditation", "Meditation", "Meditazione", "Медитация", "Meditation", "Meditatie", "冥想", "ध्यान", "ধ্যান", "瞑想", "명상", "تأمل", "Kutafakari", "Tunani", "ሜዲቴሽን", "Pagninilay", "Meditasi", "Whakaaroaro"),
    ("mindfulness", "Mindfulness", "Mindfulness", "Atenção plena", "Pleine conscience", "Achtsamkeit", "Mindfulness", "Осознанность", "Mindfulness", "Mindfulness", "正念", "माइंडफुलनेस", "মাইন্ডফুলনেস", "マインドフルネス", "마음챙김", "اليقظة الذهنية", "Um careful", "Kulawa", "ንቃተ-ህሊና", "Pagiging mapagmatyag", "Kesedaran", "Mahara"),
    ("pilates", "Pilates", "Pilates", "Pilates", "Pilates", "Pilates", "Pilates", "Пилатес", "Pilates", "Pilates", "普拉提", "पिलाटे", "পিলাটিস", "ピラティス", "필라테스", "بيلاتس", "Pilates", "Pilates", "ፒላተስ", "Pilates", "Pilates", "Pilates"),
    ("tai_chi", "Tai Chi", "Tai Chi", "Tai Chi", "Taï-chi", "Tai-Chi", "Tai Chi", "Тай-чи", "Tai chi", "Tai chi", "太极", "ताई ची", "তাই চি", "太極拳", "태극권", "تاي تشي", "Tai Chi", "Tai Chi", "ታይ ቺ", "Tai Chi", "Tai Chi", "Tai Chi"),
    ("reiki", "Reiki", "Reiki", "Reiki", "Reiki", "Reiki", "Reiki", "Рейки", "Reiki", "Reiki", "灵气", "रेकी", "রেইকি", "レイキ", "레이키", "ريكي", "Reiki", "Reiki", "ሬይኪ", "Reiki", "Reiki", "Reiki"),
    ("aromaterapia", "Aromaterapia", "Aromatherapy", "Aromaterapia", "Aromathérapie", "Aromatherapie", "Aromaterapia", "Ароматерапия", "Aromaterapi", "Aromatherapie", "芳香疗法", "अरोमाथेरेपी", "অ্যারোমাথেরাপি", "アロマテラピー", "아로마테라피", "العلاج بالروائح", "Tiba ya harufu", "Maganin ƙamshi", "የሽቱ ሕክምና", "Aromatherapy", "Aromaterapi", "Whakakakara"),
    ("acupuntura", "Acupuntura", "Acupuncture", "Acupuntura", "Acupuncture", "Akupunktur", "Agopuntura", "Иглоукалывание", "Akupunktur", "Acupunctuur", "针灸", "एक्यूपंक्चर", "আকুপাংচার", "鍼治療", "침술", "الوخز بالإبر", "Tiba ya sindano", "Allurar allura", "መርፌ ሕክምና", "Acupuncture", "Akupunktur", "Whakaweto"),
    ("masajes", "Masajes", "Massages", "Massagens", "Massages", "Massagen", "Massaggi", "Массаж", "Massage", "Massages", "按摩", "मालिश", "ম্যাসাজ", "マッサージ", "마사지", "تدليك", "Masaji", "Tausa", "마사지", "Masahe", "Urut", "Mirimiri"),
    ("sauna", "Sauna", "Sauna", "Sauna", "Sauna", "Sauna", "Sauna", "Сауна", "Bastu", "Sauna", "桑拿", "सॉना", "সনা", "サウナ", "사우나", "ساونا", "Sauna", "Sauna", "ሳውና", "Sauna", "Sauna", "Sauna"),
    ("ayurveda", "Ayurveda", "Ayurveda", "Aiurveda", "Ayurveda", "Ayurveda", "Ayurveda", "Аюрведа", "Ayurveda", "Ayurveda", "阿育吠陀", "आयुर्वेद", "আয়ুর্বেদ", "アーユルヴェーダ", "아유르베다", "أيورفيدا", "Ayurveda", "Ayurveda", "አዩርቬዳ", "Ayurveda", "Ayurveda", "Āyurveda"),
    ("nutricion", "Nutrición", "Nutrition", "Nutrição", "Nutrition", "Ernährung", "Nutrizione", "Питание", "Näring", "Voeding", "营养", "पोषण", "পুষ্টি", "栄養", "영양", "تغذية", "Lishe", "Abinci mai gina jiki", "ስነ-ምግብ", "Nutrisyon", "Pemakanan", "Kai tōtika"),
    ("veganismo", "Veganismo", "Veganism", "Veganismo", "Véganisme", "Veganismus", "Veganesimo", "Веганство", "Veganism", "Veganisme", "纯素主义", "वीगनवाद", "ভিগানবাদ", "ヴィーガニズム", "비거니즘", "النباتية الصرفة", "Ula mboga", "Cin ganyayyaki", "ቪጋኒዝም", "Veganism", "Veganisme", "Huawhenua kau"),
    ("vegetarianismo", "Vegetarianismo", "Vegetarianism", "Vegetarianismo", "Végétarisme", "Vegetarismus", "Vegetarianesimo", "Вегетарианство", "Vegetarianism", "Vegetarisme", "素食主义", "शाकाहार", "নিরামিষবাদ", "ベジタリアニズム", "채식주의", "النباتية", "Ula mbogamboga", "Cin kayan lambu", "ቬጀቴሪያኒዝም", "Vegetarianism", "Vegetarianisme", "Huawhenua"),
    ("detox", "Detox", "Detox", "Detox", "Détox", "Detox", "Detox", "Детокс", "Detox", "Detox", "排毒", "डिटॉक्स", "ডিটক্স", "デトックス", "디톡스", "ديتوكس", "Detox", "Detox", "ዲቶክስ", "Detox", "Detoks", "Whakawātea"),
    ("fitness", "Fitness", "Fitness", "Fitness", "Fitness", "Fitness", "Fitness", "Фитнес", "Fitness", "Fitness", "健身", "फिटनेस", "ফিটনেস", "フィットネス", "피트니스", "لياقة", "Mazoezi", "Motsa jiki", "አካል ብቃት", "Fitness", "Kecergasan", "Whakapakari"),
    ("running", "Running", "Running", "Corrida", "Course à pied", "Laufen", "Corsa", "Бег", "Löpning", "Hardlopen", "跑步", "दौड़ना", "দৌড়", "ランニング", "러닝", "الجري", "Kukimbia", "Gudu", "ሩጫ", "Pagtakbo", "Berlari", "Oma"),
    ("crossfit", "Crossfit", "CrossFit", "Crossfit", "Crossfit", "Crossfit", "Crossfit", "Кроссфит", "Crossfit", "Crossfit", "交叉健身", "क्रॉसफिट", "ক্রসফিট", "クロスフィット", "크로스핏", "كروسفت", "Crossfit", "Crossfit", "ክሮስፊት", "Crossfit", "Crossfit", "Crossfit"),
    ("calistenia", "Calistenia", "Calisthenics", "Calistenia", "Callisthénie", "Calisthenics", "Calistenia", "Калистеника", "Calisthenics", "Calisthenics", "徒手健身", "कैलिस्थेनिक्स", "ক্যালিসথেনিক্স", "自重トレーニング", "맨몸운동", "تمارين وزن الجسم", "Mazoezi ya mwili", "Motsa jiki ba kaya", "ካሊስቴኒክስ", "Calisthenics", "Kalistenik", "Kori tinana"),
    ("stretching", "Stretching", "Stretching", "Alongamento", "Étirements", "Dehnen", "Stretching", "Растяжка", "Stretching", "Stretchen", "拉伸", "स्ट्रेचिंग", "স্ট্রেচিং", "ストレッチ", "스트레칭", "تمدد", "Kunyoosha", "Miƙewa", "መዘርጋት", "Pag-uunat", "Regangan", "Whakawhānui"),
    ("respiracion", "Respiración", "Breathing", "Respiração", "Respiration", "Atmung", "Respirazione", "Дыхание", "Andning", "Ademhaling", "呼吸", "श्वास", "শ্বাস", "呼吸法", "호흡", "تنفس", "Kupumua", "Numfashi", "ትንፋሽ", "Paghinga", "Pernafasan", "Hā"),
    ("terapia", "Terapia", "Therapy", "Terapia", "Thérapie", "Therapie", "Terapia", "Терапия", "Terapi", "Therapie", "治疗", "थेरेपी", "থেরাপি", "セラピー", "테라피", "علاج", "Tiba", "Magani", "ሕክምና", "Therapy", "Terapi", "Haumanu"),
    ("coaching", "Coaching", "Coaching", "Coaching", "Coaching", "Coaching", "Coaching", "Коучинг", "Coaching", "Coaching", "教练", "कोचिंग", "কোচিং", "コーチング", "코칭", "تدريب", "Ufundishaji", "Koyarwa", "አሰልጣኝ", "Coaching", "Bimbingan", "Whakangungu"),
    ("desarrollo_personal", "Desarrollo Personal", "Personal Development", "Desenvolvimento Pessoal", "Développement personnel", "Persönlichkeitsentwicklung", "Crescita personale", "Личностный рост", "Personlig utveckling", "Persoonlijke ontwikkeling", "个人成长", "व्यक्तिगत विकास", "ব্যক্তিগত উন্নয়ন", "自己啓発", "자기계발", "تطوير الذات", "Maendeleo binafsi", "Ci gaban kai", "የግል እድገት", "Personal na pag-unlad", "Pembangunan diri", "Whanaketanga whaiaro"),
    ("lectura_autoayuda", "Lectura Autoayuda", "Self-Help Reading", "Leitura de Autoajuda", "Lecture de développement personnel", "Ratgeber lesen", "Lettura di auto-aiuto", "Чтение по саморазвитию", "Självhjälpsläsning", "Zelfhulpboeken lezen", "自助阅读", "स्व-सहायता पठन", "স্ব-সহায়ক পড়া", "自己啓発本", "자기계발서", "قراءة المساعدة الذاتية", "Kusoma vitabu vya kujisaidia", "Karatun taimakon kai", "የራስ እርዳታ ንባብ", "Pagbasa ng self-help", "Bacaan bantu diri", "Pukapuka āwhina-whaiaro"),
    ("journaling", "Journaling", "Journaling", "Diário", "Journal intime", "Tagebuch", "Diario", "Ведение дневника", "Dagbok", "Dagboek bijhouden", "写日记", "जर्नलिंग", "জার্নালিং", "ジャーナリング", "저널링", "كتابة اليوميات", "Kuandika jarida", "Rubutun jarida", "ማስታወሻ", "Pagsusulat ng journal", "Penjurnalan", "Tuhituhi rātaka"),
    ("gratitud", "Gratitud", "Gratitude", "Gratidão", "Gratitude", "Dankbarkeit", "Gratitudine", "Благодарность", "Tacksamhet", "Dankbaarheid", "感恩", "कृतज्ञता", "কৃতজ্ঞতা", "感謝", "감사", "امتنان", "Shukrani", "Godiya", "ምስጋና", "Pasasalamat", "Kesykuran", "Whakawhetai"),
    ("afirmaciones", "Afirmaciones", "Affirmations", "Afirmações", "Affirmations", "Affirmationen", "Affermazioni", "Аффирмации", "Affirmationer", "Affirmaties", "肯定语", "सकारात्मक कथन", "ইতিবাচক উক্তি", "アファメーション", "확언", "توكيدات", "Kauli nzuri", "Tabbatarwa", "ማረጋገጫዎች", "Mga afirmasyon", "Afirmasi", "Whakapuakanga"),
    ("visualizacion", "Visualización", "Visualization", "Visualização", "Visualisation", "Visualisierung", "Visualizzazione", "Визуализация", "Visualisering", "Visualisatie", "可视化", "विज़ुअलाइज़ेशन", "ভিজ্যুয়ালাইজেশন", "ビジュアライゼーション", "시각화", "تخيل", "Taswira", "Hangen nesa", "ምስል", "Biswalisasyon", "Visualisasi", "Whakakitenga"),
    ("feng_shui", "Feng Shui", "Feng Shui", "Feng Shui", "Feng Shui", "Feng Shui", "Feng Shui", "Фэн-шуй", "Feng shui", "Feng shui", "风水", "फेंग शुई", "ফেং শুই", "風水", "풍수", "فنغ شوي", "Feng Shui", "Feng Shui", "ፌንግ ሹይ", "Feng Shui", "Feng Shui", "Feng Shui"),
    ("cristales", "Cristales", "Crystals", "Cristais", "Cristaux", "Kristalle", "Cristalli", "Кристаллы", "Kristaller", "Kristallen", "水晶", "क्रिस्टल", "স্ফটিক", "クリスタル", "크리스탈", "بلورات", "Fuqwe", "Duwatsu", "ክሪስታሎች", "Mga kristal", "Kristal", "Kōhatu"),
    ("astrologia", "Astrología", "Astrology", "Astrologia", "Astrologie", "Astrologie", "Astrologia", "Астрология", "Astrologi", "Astrologie", "占星术", "ज्योतिष", "জ্যোতিষ", "占星術", "점성술", "علم التنجيم", "Unajimu", "Ilimin taurari", "ኮከብ ቆጠራ", "Astrolohiya", "Astrologi", "Matariki"),
    ("numerologia", "Numerología", "Numerology", "Numerologia", "Numérologie", "Numerologie", "Numerologia", "Нумерология", "Numerologi", "Numerologie", "数字命理", "अंकशास्त्र", "সংখ্যাতত্ত্ব", "数秘術", "수비학", "علم الأرقام", "Numerolojia", "Ilimin lamba", "ቁጥር ጥናት", "Numerolohiya", "Numerologi", "Tatau tau"),
    ("espiritualidad", "Espiritualidad", "Spirituality", "Espiritualidade", "Spiritualité", "Spiritualität", "Spiritualità", "Духовность", "Andlighet", "Spiritualiteit", "灵性", "आध्यात्मिकता", "আধ্যাত্মিকতা", "スピリチュアリティ", "영성", "روحانية", "Kiroho", "Ruhani", "መንፈሳዊነት", "Espiritwalidad", "Kerohanian", "Wairuatanga"),
    ("budismo", "Budismo", "Buddhism", "Budismo", "Bouddhisme", "Buddhismus", "Buddismo", "Буддизм", "Buddhism", "Boeddhisme", "佛教", "बौद्ध धर्म", "বৌদ্ধধর্ম", "仏教", "불교", "البوذية", "Ubuddha", "Addinin Buddha", "ቡዲዝም", "Budismo", "Buddha", "Pūdhism"),
    ("minimalismo", "Minimalismo", "Minimalism", "Minimalismo", "Minimalisme", "Minimalismus", "Minimalismo", "Минимализм", "Minimalism", "Minimalisme", "极简主义", "न्यूनतावाद", "সরল জীবন", "ミニマリズム", "미니멀리즘", "بساطة", "Urahisi", "Sauƙi", "ዝቅጠት", "Minimalism", "Minimalisme", "Torohū"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 200
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
    print(f"seed wellness items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
