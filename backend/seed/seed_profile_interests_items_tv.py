"""
Seed items for TV & Movies category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_tv.py
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
    ("accion", "Acción", "Action", "Ação", "Action", "Action", "Azione", "Боевик", "Action", "Actie", "动作", "एक्शन", "অ্যাকশন", "アクション", "액션", "أكشن", "Vitendo", "Aiki", "ድርጊት", "Aksyon", "Aksi", "Mahi whawhai"),
    ("terror", "Terror", "Horror", "Terror", "Horreur", "Horror", "Horror", "Ужасы", "Skräck", "Horror", "恐怖", "हॉरर", "হরর", "ホラー", "호러", "رعب", "Vitisho", "Tsoro", "ሽብር", "Horror", "Seram", "Whakamataku"),
    ("romanticas", "Románticas", "Romance", "Romance", "Romance", "Liebesfilme", "Romantici", "Мелодрамы", "Romantik", "Romantiek", "爱情", "रोमांटिक", "রোমান্টিক", "恋愛", "로맨스", "رومانسية", "Mapenzi", "Soyayya", "የፍቅር", "Romansa", "Romantik", "Aroha"),
    ("comedia", "Comedia", "Comedy", "Comédia", "Comédie", "Komödie", "Commedia", "Комедия", "Komedi", "Komedie", "喜剧", "कॉमेडी", "কমেডি", "コメディ", "코미디", "كوميديا", "Vichekesho", "Barkwanci", "አስቂኝ", "Komedya", "Komedi", "Whakakata"),
    ("drama", "Drama", "Drama", "Drama", "Drame", "Drama", "Dramma", "Драма", "Drama", "Drama", "剧情", "ड्रामा", "নাটক", "ドラマ", "드라마", "دراما", "Drama", "Drama", "ድራማ", "Drama", "Drama", "Whakaari"),
    ("thriller", "Thriller", "Thriller", "Suspense", "Thriller", "Thriller", "Thriller", "Триллер", "Thriller", "Thriller", "惊悚", "थ्रिलर", "থ্রিলার", "スリラー", "스릴러", "إثارة", "Thriller", "Thriller", "ትሪለር", "Thriller", "Thriller", "Thriller"),
    ("suspense", "Suspense", "Suspense", "Suspense", "Suspense", "Spannung", "Suspense", "Саспенс", "Spänning", "Spanning", "悬疑", "सस्पेंस", "সাসপেন্স", "サスペンス", "서스펜스", "تشويق", "Suspense", "Suspense", "ሱስፔንስ", "Suspense", "Suspense", "Suspense"),
    ("ciencia_ficcion", "Ciencia Ficción", "Sci-Fi", "Ficção Científica", "Science-fiction", "Science-Fiction", "Fantascienza", "Фантастика", "Science fiction", "Sciencefiction", "科幻", "साइंस फिक्शन", "বৈজ্ঞানিক কল্পকাহিনী", "SF", "SF", "خيال علمي", "Sayansi ya kubuni", "Kimiyyar almara", "ሳይንስ ልብወለድ", "Sci-fi", "Fiksyen sains", "Pakimaero pūtaiao"),
    ("fantasia", "Fantasía", "Fantasy", "Fantasia", "Fantasy", "Fantasy", "Fantasy", "Фэнтези", "Fantasy", "Fantasie", "奇幻", "फंतासी", "ফ্যান্টাসি", "ファンタジー", "판타지", "فانتازيا", "Njozi", "Almara", "ቅዠት", "Pantasiya", "Fantasi", "Wawata"),
    ("aventura", "Aventura", "Adventure", "Aventura", "Aventure", "Abenteuer", "Avventura", "Приключения", "Äventyr", "Avontuur", "冒险", "एडवेंचर", "অ্যাডভেঞ্চার", "アドベンチャー", "어드벤처", "مغامرة", "Adaventura", "Kasada", "ጀብዱ", "Adventure", "Pengembaraan", "Mōrearea"),
    ("western", "Western", "Western", "Faroeste", "Western", "Western", "Western", "Вестерн", "Western", "Western", "西部片", "वेस्टर्न", "ওয়েস্টার্ন", "西部劇", "서부극", "ويسترن", "Western", "Western", "ዌስተርን", "Western", "Barat", "Western"),
    ("noir", "Noir", "Noir", "Noir", "Noir", "Noir", "Noir", "Нуар", "Noir", "Noir", "黑色电影", "नॉयर", "নোয়ার", "ノワール", "느와르", "نوار", "Noir", "Noir", "ኗር", "Noir", "Noir", "Noir"),
    ("documental", "Documental", "Documentary", "Documentário", "Documentaire", "Dokumentation", "Documentario", "Документальный", "Dokumentär", "Documentaire", "纪录片", "वृत्तचित्र", "তথ্যচিত্র", "ドキュメンタリー", "다큐멘터리", "وثائقي", "Makala", "Shirin gaskiya", "ዘጋቢ ፊልም", "Dokumentaryo", "Dokumentari", "Pakipūmuhu"),
    ("biografico", "Biográfico", "Biopic", "Biográfico", "Biopic", "Biopic", "Biografico", "Байопик", "Biografiskt", "Biografisch", "传记", "जीवनी", "জীবনীমূলক", "伝記", "전기", "سيرة ذاتية", "Wasifu", "Tarihin rayuwa", "የሕይወት ታሪክ", "Talambuhay", "Biografi", "Haurongo"),
    ("historico", "Histórico", "Historical", "Histórico", "Historique", "Historisch", "Storico", "Исторический", "Historiskt", "Historisch", "历史", "ऐतिहासिक", "ঐতিহাসিক", "時代劇", "사극", "تاريخي", "Kihistoria", "Tarihi", "ታሪካዊ", "Pangkasaysayan", "Sejarah", "Hītori"),
    ("guerra", "Guerra", "War", "Guerra", "Guerre", "Krieg", "Guerra", "Военный", "Krig", "Oorlog", "战争", "युद्ध", "যুদ্ধ", "戦争", "전쟁", "حرب", "Vita", "Yaƙi", "ጦርነት", "Digmaan", "Perang", "Pakanga"),
    ("crimen", "Crimen", "Crime", "Crime", "Policier", "Krimi", "Crime", "Криминал", "Kriminal", "Misdaad", "犯罪", "अपराध", "অপরাধ", "クライム", "범죄", "جريمة", "Uhalifu", "Laifi", "ወንጀል", "Krimen", "Jenayah", "Hara"),
    ("misterio", "Misterio", "Mystery", "Mistério", "Mystère", "Krimi", "Mistero", "Детектив", "Mysterium", "Mysterie", "悬疑", "रहस्य", "রহস্য", "ミステリー", "미스터리", "غموض", "Siri", "Asiri", "ምስጢር", "Misteryo", "Misteri", "Misterio"),
    ("policiaco", "Policiaco", "Police", "Policial", "Policier", "Polizei", "Poliziesco", "Полицейский", "Polis", "Politie", "警匪", "पुलिस", "পুলিশি", "刑事もの", "경찰물", "بوليسي", "Polisi", "Ƴansanda", "ፖሊስ", "Pulis", "Polis", "Pirihimana"),
    ("musical", "Musical", "Musical", "Musical", "Comédie musicale", "Musical", "Musical", "Мюзикл", "Musikal", "Musical", "音乐剧", "संगीतमय", "সঙ্গীতধর্মী", "ミュージカル", "뮤지컬", "موسيقي", "Musical", "Musical", "ሙዚቃዊ", "Musikal", "Muzikal", "Waiata whakaari"),
    ("animacion", "Animación", "Animation", "Animação", "Animation", "Animation", "Animazione", "Анимация", "Animation", "Animatie", "动画", "एनिमेशन", "অ্যানিমেশন", "アニメーション", "애니메이션", "تحريك", "Uhuishaji", "Rayarwa", "አኒሜሽን", "Animation", "Animasi", "Hākoritanga"),
    ("anime", "Anime", "Anime", "Anime", "Anime", "Anime", "Anime", "Аниме", "Anime", "Anime", "动漫", "एनीमे", "অ্যানিমে", "アニメ", "애니", "أنمي", "Anime", "Anime", "አኒሜ", "Anime", "Anime", "Anime"),
    ("shonen", "Shonen", "Shonen", "Shonen", "Shonen", "Shonen", "Shonen", "Сёнен", "Shonen", "Shonen", "少年漫", "शोनेन", "শোনেন", "少年向け", "소년물", "شونين", "Shonen", "Shonen", "ሾነን", "Shonen", "Shonen", "Shonen"),
    ("seinen", "Seinen", "Seinen", "Seinen", "Seinen", "Seinen", "Seinen", "Сэйнэн", "Seinen", "Seinen", "青年漫", "सीनेन", "সেইনেন", "青年向け", "청년물", "سينين", "Seinen", "Seinen", "ሴይነን", "Seinen", "Seinen", "Seinen"),
    ("shojo", "Shojo", "Shojo", "Shojo", "Shojo", "Shojo", "Shojo", "Сёдзё", "Shojo", "Shojo", "少女漫", "शोजो", "শোজো", "少女向け", "소녀물", "شوجو", "Shojo", "Shojo", "ሾጆ", "Shojo", "Shojo", "Shojo"),
    ("josei", "Josei", "Josei", "Josei", "Josei", "Josei", "Josei", "Дзёсэй", "Josei", "Josei", "女性漫", "जोसेई", "জোসেই", "女性向け", "여성물", "جوسي", "Josei", "Josei", "ጆሴይ", "Josei", "Josei", "Josei"),
    ("isekai", "Isekai", "Isekai", "Isekai", "Isekai", "Isekai", "Isekai", "Исэкай", "Isekai", "Isekai", "异世界", "इसेकाई", "ইসেকাই", "異世界", "이세계", "إيسيكاي", "Isekai", "Isekai", "ኢሴካይ", "Isekai", "Isekai", "Isekai"),
    ("mecha", "Mecha", "Mecha", "Mecha", "Mecha", "Mecha", "Mecha", "Меха", "Mecha", "Mecha", "机甲", "मेका", "মেকা", "メカ", "메카", "ميكا", "Mecha", "Mecha", "ሜካ", "Mecha", "Mecha", "Mecha"),
    ("slice_of_life", "Slice Of Life", "Slice of Life", "Cotidiano", "Tranche de vie", "Alltagsgeschichten", "Spaccato di vita", "Повседневность", "Vardagsliv", "Dagelijks leven", "日常", "जीवन की झलक", "জীবনের টুকরো", "日常系", "일상물", "شريحة من الحياة", "Maisha ya kila siku", "Rayuwar yau da kullum", "የዕለት ኑሮ", "Slice of life", "Hirisan kehidupan", "Oranga o ia rā"),
    ("sports_anime", "Sports Anime", "Sports Anime", "Anime Esportivo", "Anime de sport", "Sport-Anime", "Anime sportivi", "Спортивное аниме", "Sportanime", "Sportanime", "运动番", "खेल एनीमे", "স্পোর্টস অ্যানিমে", "スポーツアニメ", "스포츠 애니", "أنمي رياضي", "Anime za michezo", "Anime na wasanni", "የስፖርት አኒሜ", "Sports anime", "Anime sukan", "Anime hākinakina"),
    ("romance_anime", "Romance Anime", "Romance Anime", "Anime de Romance", "Anime romantique", "Romance-Anime", "Anime romantici", "Романтическое аниме", "Romantisk anime", "Romantische anime", "恋爱番", "रोमांस एनीमे", "রোমান্স অ্যানিমে", "恋愛アニメ", "로맨스 애니", "أنمي رومانسي", "Anime za mapenzi", "Anime na soyayya", "የፍቅር አኒሜ", "Romance anime", "Anime romantik", "Anime aroha"),
    ("marvel", "Marvel", "Marvel", "Marvel", "Marvel", "Marvel", "Marvel", "Марвел", "Marvel", "Marvel", "漫威", "मार्वल", "মার্ভেল", "マーベル", "마블", "مارفل", "Marvel", "Marvel", "ማርቬል", "Marvel", "Marvel", "Marvel"),
    ("dc", "DC", "DC", "DC", "DC", "DC", "DC", "DC", "DC", "DC", "DC", "डीसी", "ডিসি", "DC", "DC", "دي سي", "DC", "DC", "ዲሲ", "DC", "DC", "DC"),
    ("star_wars", "Star Wars", "Star Wars", "Star Wars", "Star Wars", "Star Wars", "Star Wars", "Звёздные войны", "Star Wars", "Star Wars", "星球大战", "स्टार वॉर्स", "স্টার ওয়ার্স", "スター・ウォーズ", "스타워즈", "حرب النجوم", "Star Wars", "Star Wars", "ስታር ዎርስ", "Star Wars", "Star Wars", "Star Wars"),
    ("disney", "Disney", "Disney", "Disney", "Disney", "Disney", "Disney", "Дисней", "Disney", "Disney", "迪士尼", "डिज़्नी", "ডিজনি", "ディズニー", "디즈니", "ديزني", "Disney", "Disney", "ዲዝኒ", "Disney", "Disney", "Disney"),
    ("pixar", "Pixar", "Pixar", "Pixar", "Pixar", "Pixar", "Pixar", "Пиксар", "Pixar", "Pixar", "皮克斯", "पिक्सर", "পিক্সার", "ピクサー", "픽사", "بيكسار", "Pixar", "Pixar", "ፒክሳር", "Pixar", "Pixar", "Pixar"),
    ("studio_ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Студия Гибли", "Studio Ghibli", "Studio Ghibli", "吉卜力", "स्टूडियो घिबली", "স্টুডিও ঘিবলি", "スタジオジブリ", "스튜디오 지브리", "استوديو غيبلي", "Studio Ghibli", "Studio Ghibli", "ስቱዲዮ ጊብሊ", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli"),
    ("netflix_originals", "Netflix Originals", "Netflix Originals", "Originais Netflix", "Créations Netflix", "Netflix Originals", "Originali Netflix", "Оригиналы Netflix", "Netflix original", "Netflix Originals", "网飞原创", "नेटफ्लिक्स ओरिजिनल", "নেটফ্লিক্স অরিজিনাল", "Netflixオリジナル", "넷플릭스 오리지널", "أعمال نتفليكس الأصلية", "Netflix asilia", "Netflix na musamman", "የኔትፍሊክስ ኦርጅናሎች", "Netflix originals", "Netflix original", "Netflix taketake"),
    ("hbo", "HBO", "HBO", "HBO", "HBO", "HBO", "HBO", "HBO", "HBO", "HBO", "HBO", "एचबीओ", "এইচবিও", "HBO", "HBO", "إتش بي أو", "HBO", "HBO", "ኤችቢኦ", "HBO", "HBO", "HBO"),
    ("amazon_prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "Amazon Prime", "亚马逊会员", "अमेज़न प्राइम", "অ্যামাজন প্রাইম", "アマゾンプライム", "아마존 프라임", "أمازون برايم", "Amazon Prime", "Amazon Prime", "አማዞን ፕራይም", "Amazon Prime", "Amazon Prime", "Amazon Prime"),
    ("apple_tv", "Apple TV", "Apple TV", "Apple TV", "Apple TV", "Apple TV", "Apple TV", "Apple TV", "Apple TV", "Apple TV", "苹果电视", "एप्पल टीवी", "অ্যাপল টিভি", "アップルTV", "애플TV", "آبل تي في", "Apple TV", "Apple TV", "አፕል ቲቪ", "Apple TV", "Apple TV", "Apple TV"),
    ("cine_clasico", "Cine Clásico", "Classic Cinema", "Cinema Clássico", "Cinéma classique", "Klassiker", "Cinema classico", "Классика кино", "Filmklassiker", "Filmklassiekers", "经典电影", "क्लासिक सिनेमा", "ক্লাসিক সিনেমা", "名作映画", "고전 영화", "سينما كلاسيكية", "Filamu za kale", "Fina-finan gargajiya", "ክላሲክ ሲኒማ", "Klasikong sine", "Filem klasik", "Kiriata matarohia"),
    ("cine_independiente", "Cine Independiente", "Indie Films", "Cinema Independente", "Cinéma indépendant", "Indie-Filme", "Cinema indipendente", "Независимое кино", "Indiefilm", "Indiefilms", "独立电影", "इंडी फिल्में", "ইন্ডি সিনেমা", "インディーズ映画", "인디 영화", "سينما مستقلة", "Filamu huru", "Fina-finan masu zaman kansu", "ገለልተኛ ሲኒማ", "Indie film", "Filem indie", "Kiriata motuhake"),
    ("cine_extranjero", "Cine Extranjero", "Foreign Films", "Cinema Estrangeiro", "Cinéma étranger", "Ausländische Filme", "Cinema straniero", "Зарубежное кино", "Utländsk film", "Buitenlandse films", "外国电影", "विदेशी फिल्में", "বিদেশি সিনেমা", "外国映画", "외국 영화", "أفلام أجنبية", "Filamu za kigeni", "Fina-finan ƙasashen waje", "የውጭ ሲኒማ", "Banyagang pelikula", "Filem asing", "Kiriata o tāwāhi"),
    ("cine_arte", "Cine Arte", "Arthouse", "Cinema de Arte", "Cinéma d'art", "Arthouse", "Cinema d'essai", "Артхаус", "Konstfilm", "Arthouse", "艺术电影", "आर्ट सिनेमा", "আর্ট সিনেমা", "アート系映画", "예술 영화", "سينما فنية", "Filamu za sanaa", "Fina-finan fasaha", "የሥነ ጥበብ ሲኒማ", "Art film", "Filem seni", "Kiriata toi"),
    ("cortometrajes", "Cortometrajes", "Short Films", "Curtas", "Courts-métrages", "Kurzfilme", "Cortometraggi", "Короткометражки", "Kortfilmer", "Korte films", "短片", "लघु फिल्में", "স্বল্পদৈর্ঘ্য চলচ্চিত্র", "短編映画", "단편영화", "أفلام قصيرة", "Filamu fupi", "Gajerun fina-finai", "አጫጭር ፊልሞች", "Maikling pelikula", "Filem pendek", "Kiriata poto"),
    ("series_coreanas", "Series Coreanas", "K-Dramas", "Doramas", "Séries coréennes", "K-Dramen", "K-drama", "Корейские дорамы", "K-draman", "K-drama's", "韩剧", "कोरियाई ड्रामा", "কোরিয়ান ড্রামা", "韓国ドラマ", "한국 드라마", "دراما كورية", "Drama za Kikorea", "Shirye-shiryen Korea", "የኮሪያ ድራሞች", "K-drama", "Drama Korea", "Whakaari Korea"),
    ("telenovelas", "Telenovelas", "Soap Operas", "Telenovelas", "Telenovelas", "Telenovelas", "Telenovelas", "Теленовеллы", "Såpoperor", "Soapseries", "肥皂剧", "टेलीनोवेला", "টেলিনোভেলা", "テレノベラ", "텔레노벨라", "مسلسلات", "Tamthilia", "Shirye-shiryen soyayya", "ቴሌኖቬላዎች", "Teleserye", "Telenovela", "Whakaari pouaka whakaata"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 1100
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
    print(f"seed tv items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
