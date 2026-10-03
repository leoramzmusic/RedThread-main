"""
Seed items for Values & Causes category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_values.py
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
    ("derecho_votar", "Derecho Votar", "Voting Rights", "Direito ao Voto", "Droit de vote", "Wahlrecht", "Diritto di voto", "Право голоса", "Rösträtt", "Stemrecht", "投票权", "मतदान अधिकार", "ভোটাধিকার", "投票権", "투표권", "حق التصويت", "Haki ya kupiga kura", "Haƙƙin zaɓe", "የመምረጥ መብት", "Karapatang bumoto", "Hak mengundi", "Mōtika pōti"),
    ("inclusividad", "Inclusividad", "Inclusivity", "Inclusividade", "Inclusivité", "Inklusion", "Inclusività", "Инклюзивность", "Inkludering", "Inclusiviteit", "包容性", "समावेशिता", "অন্তর্ভুক্তি", "包括性", "포용성", "شمولية", "Ujumuishi", "Haɗa kai", "አካታችነት", "Pagiging inklusibo", "Keterangkuman", "Whakaurunga"),
    ("voluntariado", "Voluntariado", "Volunteering", "Voluntariado", "Bénévolat", "Ehrenamt", "Volontariato", "Волонтёрство", "Volontärarbete", "Vrijwilligerswerk", "志愿服务", "स्वयंसेवा", "স্বেচ্ছাসেবা", "ボランティア", "자원봉사", "تطوع", "Kujitolea", "Aikin sa kai", "በጎ ፈቃድ ሥራ", "Bolunterismo", "Sukarelawan", "Tūao"),
    ("ecologismo", "Ecologismo", "Environmentalism", "Ecologismo", "Écologisme", "Umweltschutz", "Ecologismo", "Экологизм", "Miljörörelse", "Milieubeweging", "环保主义", "पर्यावरणवाद", "পরিবেশবাদ", "環境保護運動", "환경운동", "أنصار البيئة", "Uhifadhi wa mazingira", "Kare muhalli", "አካባቢ ጥበቃ", "Ekolohismo", "Alam sekitar", "Tiaki taiao"),
    ("feminismo", "Feminismo", "Feminism", "Feminismo", "Féminisme", "Feminismus", "Femminismo", "Феминизм", "Feminism", "Feminisme", "女权主义", "नारीवाद", "নারীবাদ", "フェミニズム", "페미니즘", "نسوية", "Ufeministi", "Mata", "ፌሚኒዝም", "Peminismo", "Feminisme", "Mana wahine"),
    ("igualdad_genero", "Igualdad Género", "Gender Equality", "Igualdade de Gênero", "Égalité des genres", "Geschlechtergleichheit", "Uguaglianza di genere", "Гендерное равенство", "Jämställdhet", "Gendergelijkheid", "性别平等", "लैंगिक समानता", "লিঙ্গ সমতা", "男女平等", "성평등", "مساواة النوع", "Usawa wa kijinsia", "Daidaiton jinsi", "የጾታ እኩልነት", "Pagkakapantay ng kasarian", "Kesaksamaan gender", "Ōritetanga ira"),
    ("lgbtq_rights", "LGBTQ Rights", "LGBTQ+ Rights", "Direitos LGBTQ+", "Droits LGBTQ+", "LGBTQ-Rechte", "Diritti LGBTQ+", "Права ЛГБТК+", "HBTQ-rättigheter", "LHBTQ-rechten", "性少数权利", "एलजीबीटीक्यू अधिकार", "এলজিবিটিকিউ অধিকার", "LGBTQの権利", "LGBTQ 권리", "حقوق المثليين", "Haki za LGBTQ", "Haƙƙoƙin LGBTQ", "የLGBTQ መብቶች", "Karapatan ng LGBTQ", "Hak LGBTQ", "Tika LGBTQ"),
    ("derechos_humanos", "Derechos Humanos", "Human Rights", "Direitos Humanos", "Droits humains", "Menschenrechte", "Diritti umani", "Права человека", "Mänskliga rättigheter", "Mensenrechten", "人权", "मानवाधिकार", "মানবাধিকার", "人権", "인권", "حقوق الإنسان", "Haki za binadamu", "Haƙƙoƙin ɗan adam", "የሰብአዊ መብቶች", "Karapatang pantao", "Hak asasi", "Tika tangata"),
    ("justicia_social", "Justicia Social", "Social Justice", "Justiça Social", "Justice sociale", "Soziale Gerechtigkeit", "Giustizia sociale", "Социальная справедливость", "Social rättvisa", "Sociale rechtvaardigheid", "社会正义", "सामाजिक न्याय", "সামাজিক ন্যায়", "社会正義", "사회 정의", "عدالة اجتماعية", "Haki ya jamii", "Adalcin zamantakewa", "ማህበራዊ ፍትህ", "Katarungang panlipunan", "Keadilan sosial", "Tika pāpori"),
    ("antirracismo", "Antirracismo", "Anti-Racism", "Antirracismo", "Antiracisme", "Antirassismus", "Antirazzismo", "Антирасизм", "Antirasism", "Antiracisme", "反种族主义", "नस्लवाद विरोध", "বর্ণবাদ বিরোধী", "反人種差別", "반인종차별", "مناهضة العنصرية", "Kupinga ubaguzi", "Yaƙi da wariyar launin fata", "ጸረ-ዘረኝነት", "Anti-rasismo", "Anti-perkauman", "Whakahē kaikiri"),
    ("diversidad", "Diversidad", "Diversity", "Diversidade", "Diversité", "Vielfalt", "Diversità", "Разнообразие", "Mångfald", "Diversiteit", "多样性", "विविधता", "বৈচিত্র্য", "多様性", "다양성", "تنوع", "Utofauti", "Banbance-banbance", "ልዩነት", "Pagkakaiba-iba", "Kepelbagaian", "Kanorau"),
    ("equidad", "Equidad", "Equity", "Equidade", "Équité", "Gerechtigkeit", "Equità", "Справедливость", "Rättvisa", "Billijkheid", "公平", "समता", "ন্যায্যতা", "公正", "공평", "إنصاف", "Usawa", "Adalci", "ፍትሃዊነት", "Pagkakapantay", "Ekuiti", "Tōkeke"),
    ("sostenibilidad", "Sostenibilidad", "Sustainability", "Sustentabilidade", "Durabilité", "Nachhaltigkeit", "Sostenibilità", "Устойчивость", "Hållbarhet", "Duurzaamheid", "可持续性", "स्थिरता", "টেকসই", "持続可能性", "지속가능성", "استدامة", "Uendelevu", "Dorewa", "ዘላቂነት", "Sustainability", "Kemampanan", "Toitū"),
    ("cambio_climatico", "Cambio Climático", "Climate Change", "Mudança Climática", "Changement climatique", "Klimawandel", "Cambiamento climatico", "Изменение климата", "Klimatförändring", "Klimaatverandering", "气候变化", "जलवायु परिवर्तन", "জলবায়ু পরিবর্তন", "気候変動", "기후변화", "تغير المناخ", "Mabadiliko ya tabianchi", "Sauyin yanayi", "የአየር ንብረት ለውጥ", "Pagbabago ng klima", "Perubahan iklim", "Huringa āhuarangi"),
    ("energia_renovable", "Energía Renovable", "Renewable Energy", "Energia Renovável", "Énergie renouvelable", "Erneuerbare Energie", "Energia rinnovabile", "Возобновляемая энергия", "Förnybar energi", "Hernieuwbare energie", "可再生能源", "नवीकरणीय ऊर्जा", "নবায়নযোগ্য শক্তি", "再生可能エネルギー", "재생에너지", "طاقة متجددة", "Nishati mbadala", "Sabunta makamashi", "ታዳሽ ኃይል", "Renewable energy", "Tenaga boleh baharu", "Pūngao whakahou"),
    ("reciclaje", "Reciclaje", "Recycling", "Reciclagem", "Recyclage", "Recycling", "Riciclaggio", "Переработка", "Återvinning", "Recycling", "回收", "रीसाइक्लिंग", "পুনর্ব্যবহার", "リサイクル", "재활용", "إعادة تدوير", "Urejelezaji", "Sake amfani", "እንደገና ጥቅም", "Pagrerecycle", "Kitar semula", "Hangarua"),
    ("zero_waste", "Zero Waste", "Zero Waste", "Lixo Zero", "Zéro déchet", "Zero Waste", "Rifiuti zero", "Ноль отходов", "Noll avfall", "Zero waste", "零废弃", "शून्य अपशिष्ट", "শূন্য বর্জ্য", "ゼロウェイスト", "제로 웨이스트", "صفر نفايات", "Taka sifuri", "Sharar sifili", "ዜሮ ቆሻሻ", "Zero waste", "Sifar sisa", "Para kore"),
    ("veganismo_etico", "Veganismo Ético", "Ethical Veganism", "Veganismo Ético", "Véganisme éthique", "Ethischer Veganismus", "Veganesimo etico", "Этичный веганизм", "Etisk veganism", "Ethisch veganisme", "伦理纯素", "नैतिक वीगनवाद", "নৈতিক ভিগানবাদ", "エシカルヴィーガン", "윤리적 비거니즘", "نباتية أخلاقية", "Ula mboga wa kimaadili", "Cin ganyayyaki na ɗabi'a", "ሥነ-ምግባራዊ ቪጋኒዝም", "Etikal na veganism", "Veganisme beretika", "Huawhenua matatika"),
    ("derechos_animales", "Derechos Animales", "Animal Rights", "Direitos Animais", "Droits des animaux", "Tierrechte", "Diritti degli animali", "Права животных", "Djurrätt", "Dierenrechten", "动物权利", "पशु अधिकार", "প্রাণী অধিকার", "動物の権利", "동물권", "حقوق الحيوان", "Haki za wanyama", "Haƙƙoƙin dabbobi", "የእንስሳት መብቶች", "Karapatan ng hayop", "Hak haiwan", "Tika kararehe"),
    ("proteccion_animal", "Protección Animal", "Animal Welfare", "Proteção Animal", "Protection animale", "Tierschutz", "Protezione animali", "Защита животных", "Djurskydd", "Dierenbescherming", "动物保护", "पशु कल्याण", "প্রাণী সুরক্ষা", "動物保護", "동물 보호", "حماية الحيوان", "Ulinzi wa wanyama", "Kare dabbobi", "የእንስሳት ጥበቃ", "Proteksyon ng hayop", "Kebajikan haiwan", "Tiaki kararehe"),
    ("conservacion", "Conservación", "Conservation", "Conservação", "Conservation", "Naturschutz", "Conservazione", "Охрана природы", "Naturvård", "Natuurbescherming", "自然保护", "संरक्षण", "সংরক্ষণ", "自然保護", "자연보호", "حفظ الطبيعة", "Uhifadhi", "Kiyayewa", "ጥበቃ", "Konserbasyon", "Pemuliharaan", "Tiaki taiao"),
    ("reforestacion", "Reforestación", "Reforestation", "Reflorestamento", "Reforestation", "Aufforstung", "Riforestazione", "Лесовосстановление", "Återbeskogning", "Herbebossing", "重新造林", "पुनर्वनीकरण", "বনায়ন", "植林", "재조림", "إعادة التشجير", "Upandaji miti", "Dasa bishiyoyi", "ደን መትከል", "Reforestation", "Penghutanan semula", "Whakato ngahere"),
    ("limpieza_oceanos", "Limpieza Océanos", "Ocean Cleanup", "Limpeza dos Oceanos", "Nettoyage des océans", "Meeressäuberung", "Pulizia oceani", "Очистка океана", "Havsstädning", "Oceaanopruiming", "海洋清理", "महासागर सफाई", "মহাসাগর পরিষ্কার", "海洋清掃", "해양 정화", "تنظيف المحيطات", "Usafishaji wa bahari", "Tsaftace tekuna", "የውቅያኖስ ጽዳት", "Paglilinis ng karagatan", "Pembersihan lautan", "Whakapai moana"),
    ("educacion", "Educación", "Education", "Educação", "Éducation", "Bildung", "Istruzione", "Образование", "Utbildning", "Onderwijs", "教育", "शिक्षा", "শিক্ষা", "教育", "교육", "تعليم", "Elimu", "Ilimi", "ትምህርት", "Edukasyon", "Pendidikan", "Mātauranga"),
    ("alfabetizacion", "Alfabetización", "Literacy", "Alfabetização", "Alphabétisation", "Alphabetisierung", "Alfabetizzazione", "Грамотность", "Läskunnighet", "Alfabetisering", "扫盲", "साक्षरता", "সাক্ষরতা", "識字率向上", "문해율", "محو الأمية", "Kujua kusoma", "Ilimin karatu", "ንባብና ጽሕፈት", "Literacy", "Literasi", "Reo matatini"),
    ("salud_mental", "Salud Mental", "Mental Health", "Saúde Mental", "Santé mentale", "Mentale Gesundheit", "Salute mentale", "Психическое здоровье", "Psykisk hälsa", "Mentale gezondheid", "心理健康", "मानसिक स्वास्थ्य", "মানসিক স্বাস্থ্য", "メンタルヘルス", "정신건강", "صحة نفسية", "Afya ya akili", "Lafiyar ƙwaƙwalwa", "የአእምሮ ጤና", "Kalusugang pangkaisipan", "Kesihatan mental", "Hauora hinengaro"),
    ("salud_publica", "Salud Pública", "Public Health", "Saúde Pública", "Santé publique", "Öffentliche Gesundheit", "Salute pubblica", "Общественное здоровье", "Folkhälsa", "Volksgezondheid", "公共卫生", "सार्वजनिक स्वास्थ्य", "জনস্বাস্থ্য", "公衆衛生", "공중보건", "صحة عامة", "Afya ya umma", "Lafiyar jama'a", "የሕዝብ ጤና", "Pampublikong kalusugan", "Kesihatan awam", "Hauora tūmatanui"),
    ("donacion_sangre", "Donación Sangre", "Blood Donation", "Doação de Sangue", "Don du sang", "Blutspende", "Donazione sangue", "Донорство крови", "Blodgivning", "Bloeddonatie", "献血", "रक्तदान", "রক্তদান", "献血", "헌혈", "تبرع بالدم", "Uchangiaji damu", "Bada jini", "የደም ልገሣ", "Donasyon ng dugo", "Derma darah", "Koha toto"),
    ("donacion_organos", "Donación Órganos", "Organ Donation", "Doação de Órgãos", "Don d'organes", "Organspende", "Donazione organi", "Донорство органов", "Organdonation", "Orgaandonatie", "器官捐献", "अंगदान", "অঙ্গদান", "臓器提供", "장기 기증", "تبرع بالأعضاء", "Uchangiaji viungo", "Bada gabobi", "የአካል ልገሣ", "Donasyon ng organ", "Derma organ", "Koha whekau"),
    ("caridad", "Caridad", "Charity", "Caridade", "Charité", "Wohltätigkeit", "Carità", "Благотворительность", "Välgörenhet", "Liefdadigheid", "慈善", "दान", "দান", "慈善", "자선", "صدقة", "Hisani", "Sadaka", "በጎ አድራጎት", "Kawanggawa", "Amal", "Aroha"),
    ("ayuda_humanitaria", "Ayuda Humanitaria", "Humanitarian Aid", "Ajuda Humanitária", "Aide humanitaire", "Humanitäre Hilfe", "Aiuti umanitari", "Гуманитарная помощь", "Humanitärt bistånd", "Humanitaire hulp", "人道援助", "मानवीय सहायता", "মানবিক সহায়তা", "人道支援", "인도적 지원", "مساعدة إنسانية", "Msaada wa kibinadamu", "Tallafin jinƙai", "የሰብአዊ እርዳታ", "Tulong makatao", "Bantuan kemanusiaan", "Āwhina tangata"),
    ("refugiados", "Refugiados", "Refugees", "Refugiados", "Réfugiés", "Geflüchtete", "Rifugiati", "Беженцы", "Flyktingar", "Vluchtelingen", "难民", "शरणार्थी", "শরণার্থী", "難民", "난민", "لاجئون", "Wakimbizi", "'Yan gudun hijira", "ስደተኞች", "Refugee", "Pelarian", "Rerenga"),
    ("pobreza", "Pobreza", "Poverty", "Pobreza", "Pauvreté", "Armut", "Povertà", "Бедность", "Fattigdom", "Armoede", "贫困", "गरीबी", "দারিদ্র্য", "貧困", "빈곤", "فقر", "Umaskini", "Talauci", "ድህነት", "Kahirapan", "Kemiskinan", "Rawakore"),
    ("hambre", "Hambre", "Hunger", "Fome", "Faim", "Hunger", "Fame", "Голод", "Hunger", "Honger", "饥饿", "भूख", "ক্ষুধা", "飢餓", "기아", "جوع", "Njaa", "Yunwa", "ረሃብ", "Gutom", "Kebuluran", "Hikai"),
    ("agua_potable", "Agua Potable", "Clean Water", "Água Potável", "Eau potable", "Trinkwasser", "Acqua potabile", "Чистая вода", "Rent vatten", "Drinkwater", "饮用水", "स्वच्छ जल", "নিরাপদ পানি", "安全な水", "깨끗한 물", "مياه نظيفة", "Maji safi", "Ruwa mai tsafta", "ንጹሕ ውኃ", "Malinis na tubig", "Air bersih", "Wai mā"),
    ("vivienda", "Vivienda", "Housing", "Moradia", "Logement", "Wohnen", "Alloggio", "Жильё", "Boende", "Huisvesting", "住房", "आवास", "আবাসন", "住居", "주거", "إسكان", "Makazi", "Gidaje", "መኖሪያ", "Pabahay", "Perumahan", "Whare"),
    ("empleo_justo", "Empleo Justo", "Fair Work", "Trabalho Justo", "Travail équitable", "Faire Arbeit", "Lavoro equo", "Справедливый труд", "Rättvist arbete", "Eerlijk werk", "公平就业", "निष्पक्ष रोजगार", "ন্যায্য কর্মসংস্থান", "公正な雇用", "공정한 일자리", "عمل عادل", "Ajira ya haki", "Aiki na adalci", "ፍትሐዊ ሥራ", "Matarung na trabaho", "Pekerjaan adil", "Mahi tika"),
    ("comercio_justo", "Comercio Justo", "Fair Trade", "Comércio Justo", "Commerce équitable", "Fairer Handel", "Commercio equo", "Справедливая торговля", "Rättvis handel", "Eerlijke handel", "公平贸易", "निष्पक्ष व्यापार", "ন্যায্য বাণিজ্য", "フェアトレード", "공정무역", "تجارة عادلة", "Biashara ya haki", "Kasuwanci na adalci", "ፍትሐዊ ንግድ", "Matarung na kalakalan", "Perdagangan adil", "Tauhokohoko tika"),
    ("etica_empresarial", "Ética Empresarial", "Business Ethics", "Ética Empresarial", "Éthique des affaires", "Unternehmensethik", "Etica aziendale", "Деловая этика", "Affärsetik", "Bedrijfsethiek", "商业道德", "व्यावसायिक नैतिकता", "ব্যবসায়িক নৈতিকতা", "企業倫理", "기업 윤리", "أخلاقيات الأعمال", "Maadili ya biashara", "Ɗabi'un kasuwanci", "የንግድ ሥነ-ምግባር", "Etika sa negosyo", "Etika perniagaan", "Matatika pakihi"),
    ("transparencia", "Transparencia", "Transparency", "Transparência", "Transparence", "Transparenz", "Trasparenza", "Прозрачность", "Transparens", "Transparantie", "透明度", "पारदर्शिता", "স্বচ্ছতা", "透明性", "투명성", "شفافية", "Uwazi", "Bayyana gaskiya", "ግልጽነት", "Transparency", "Ketelusan", "Māramatanga"),
    ("anticorrupcion", "Anticorrupción", "Anti-Corruption", "Anticorrupção", "Anticorruption", "Antikorruption", "Anticorruzione", "Борьба с коррупцией", "Antikorruption", "Anticorruptie", "反腐", "भ्रष्टाचार विरोध", "দুর্নীতি বিরোধী", "反汚職", "반부패", "مكافحة الفساد", "Kupinga rushwa", "Yaƙi da cin hanci", "ጸረ-ሙስና", "Anti-korapsyon", "Anti-rasuah", "Whawhai pirau"),
    ("democracia", "Democracia", "Democracy", "Democracia", "Démocratie", "Demokratie", "Democrazia", "Демократия", "Demokrati", "Democratie", "民主", "लोकतंत्र", "গণতন্ত্র", "民主主義", "민주주의", "ديمقراطية", "Demokrasia", "Dimokuraɗiyya", "ዲሞክራሲ", "Demokrasya", "Demokrasi", "Manapori"),
    ("libertad_expresion", "Libertad Expresión", "Free Speech", "Liberdade de Expressão", "Liberté d'expression", "Meinungsfreiheit", "Libertà di espressione", "Свобода слова", "Yttrandefrihet", "Vrijheid van meningsuiting", "言论自由", "अभिव्यक्ति की स्वतंत्रता", "মত প্রকাশের স্বাধীনতা", "表現の自由", "표현의 자유", "حرية التعبير", "Uhuru wa kujieleza", "'Yancin faɗar albarkacin baki", "የመናገር ነጻነት", "Kalayaan sa pagpapahayag", "Kebebasan bersuara", "Whakahua noa"),
    ("paz", "Paz", "Peace", "Paz", "Paix", "Frieden", "Pace", "Мир", "Fred", "Vrede", "和平", "शांति", "শান্তি", "平和", "평화", "سلام", "Amani", "Salama", "ሰላም", "Kapayapaan", "Keamanan", "Rangimārie"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 1200
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
    print(f"seed values items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
