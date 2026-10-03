"""
Seed items for Fan Communities category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_fan.py
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
# Proper nouns stay identical; common words translated.
ITEMS = [
    ("convenciones", "Convenciones", "Conventions", "Convenções", "Conventions", "Conventions", "Convention", "Конвенты", "Konvent", "Conventies", "漫展", "सम्मेलन", "সম্মেলন", "コンベンション", "컨벤션", "مؤتمرات", "Mikutano", "Taro", "ኮንቬንሽኖች", "Mga convention", "Konvensyen", "Huihuinga"),
    ("comics", "Comics", "Comics", "Quadrinhos", "BD", "Comics", "Fumetti", "Комиксы", "Serier", "Strips", "漫画", "कॉमिक्स", "কমিক্স", "漫画", "만화", "قصص مصورة", "Komic", "Littattafan ban dariya", "ኮሚክስ", "Komiks", "Komik", "Pukapuka pikitia"),
    ("harry_potter", "Harry Potter", "Harry Potter", "Harry Potter", "Harry Potter", "Harry Potter", "Harry Potter", "Гарри Поттер", "Harry Potter", "Harry Potter", "哈利·波特", "हैरी पॉटर", "হ্যারি পটার", "ハリー・ポッター", "해리 포터", "هاري بوتر", "Harry Potter", "Harry Potter", "ሀሪ ፖተር", "Harry Potter", "Harry Potter", "Harry Potter"),
    ("star_wars", "Star Wars", "Star Wars", "Star Wars", "Star Wars", "Star Wars", "Star Wars", "Звёздные войны", "Star Wars", "Star Wars", "星球大战", "स्टार वॉर्स", "স্টার ওয়ার্স", "スター・ウォーズ", "스타워즈", "حرب النجوم", "Star Wars", "Star Wars", "ስታር ዎርስ", "Star Wars", "Star Wars", "Star Wars"),
    ("marvel", "Marvel", "Marvel", "Marvel", "Marvel", "Marvel", "Marvel", "Марвел", "Marvel", "Marvel", "漫威", "मार्वल", "মার্ভেল", "マーベル", "마블", "مارفل", "Marvel", "Marvel", "ማርቬል", "Marvel", "Marvel", "Marvel"),
    ("dc_comics", "DC Comics", "DC Comics", "DC Comics", "DC Comics", "DC Comics", "DC Comics", "DC Comics", "DC Comics", "DC Comics", "DC漫画", "डीसी कॉमिक्स", "ডিসি কমিক্স", "DCコミックス", "DC 코믹스", "دي سي كوميكس", "DC Comics", "DC Comics", "ዲሲ ኮሚክስ", "DC Comics", "DC Comics", "DC Comics"),
    ("anime", "Anime", "Anime", "Anime", "Anime", "Anime", "Anime", "Аниме", "Anime", "Anime", "动漫", "एनीमे", "অ্যানিমে", "アニメ", "애니", "أنمي", "Anime", "Anime", "አኒሜ", "Anime", "Anime", "Anime"),
    ("manga", "Manga", "Manga", "Mangá", "Manga", "Manga", "Manga", "Манга", "Manga", "Manga", "漫画", "मांगा", "মাঙ্গা", "漫画", "만화", "مانغا", "Manga", "Manga", "ማንጋ", "Manga", "Manga", "Manga"),
    ("cosplay", "Cosplay", "Cosplay", "Cosplay", "Cosplay", "Cosplay", "Cosplay", "Косплей", "Cosplay", "Cosplay", "角色扮演", "कॉसप्ले", "কসপ্লে", "コスプレ", "코스프레", "كوسبلاي", "Cosplay", "Cosplay", "ኮስፕሌይ", "Cosplay", "Cosplay", "Cosplay"),
    ("comic_con", "Comic Con", "Comic Con", "Comic Con", "Comic Con", "Comic Con", "Comic Con", "Комик-Кон", "Comic Con", "Comic Con", "漫展", "कॉमिक कॉन", "কমিক কন", "コミコン", "코믹콘", "كوميك كون", "Comic Con", "Comic Con", "ኮሚክ ኮን", "Comic Con", "Comic Con", "Comic Con"),
    ("star_trek", "Star Trek", "Star Trek", "Star Trek", "Star Trek", "Star Trek", "Star Trek", "Звёздный путь", "Star Trek", "Star Trek", "星际迷航", "स्टार ट्रेक", "স্টার ট্রেক", "スター・トレック", "스타트렉", "ستار تريك", "Star Trek", "Star Trek", "ስታር ትሬክ", "Star Trek", "Star Trek", "Star Trek"),
    ("doctor_who", "Doctor Who", "Doctor Who", "Doctor Who", "Doctor Who", "Doctor Who", "Doctor Who", "Доктор Кто", "Doctor Who", "Doctor Who", "神秘博士", "डॉक्टर हू", "ডক্টর হু", "ドクター・フー", "닥터 후", "دكتور هو", "Doctor Who", "Doctor Who", "ዶክተር ሁ", "Doctor Who", "Doctor Who", "Doctor Who"),
    ("game_of_thrones", "Game Of Thrones", "Game of Thrones", "Game of Thrones", "Game of Thrones", "Game of Thrones", "Game of Thrones", "Игра престолов", "Game of Thrones", "Game of Thrones", "权力的游戏", "गेम ऑफ थ्रोन्स", "গেম অফ থ্রোনস", "ゲーム・オブ・スローンズ", "왕좌의 게임", "صراع العروش", "Game of Thrones", "Game of Thrones", "ጨዋታ ኦፍ ትሮንስ", "Game of Thrones", "Game of Thrones", "Game of Thrones"),
    ("lord_of_the_rings", "Lord Of The Rings", "Lord of the Rings", "Senhor dos Anéis", "Le Seigneur des anneaux", "Herr der Ringe", "Il Signore degli Anelli", "Властелин колец", "Sagan om ringen", "In de Ban van de Ring", "指环王", "लॉर्ड ऑफ द रिंग्स", "লর্ড অফ দ্য রিংস", "ロード・オブ・ザ・リング", "반지의 제왕", "سيد الخواتم", "Lord of the Rings", "Lord of the Rings", "ጌታ ኦፍ ዘ ሪንግስ", "Lord of the Rings", "Lord of the Rings", "Lord of the Rings"),
    ("disney", "Disney", "Disney", "Disney", "Disney", "Disney", "Disney", "Дисней", "Disney", "Disney", "迪士尼", "डिज़्नी", "ডিজনি", "ディズニー", "디즈니", "ديزني", "Disney", "Disney", "ዲዝኒ", "Disney", "Disney", "Disney"),
    ("pixar", "Pixar", "Pixar", "Pixar", "Pixar", "Pixar", "Pixar", "Пиксар", "Pixar", "Pixar", "皮克斯", "पिक्सर", "পিক্সার", "ピクサー", "픽사", "بيكسار", "Pixar", "Pixar", "ፒክሳር", "Pixar", "Pixar", "Pixar"),
    ("studio_ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli", "Студия Гибли", "Studio Ghibli", "Studio Ghibli", "吉卜力", "स्टूडियो घिबली", "স্টুডিও ঘিবলি", "スタジオジブリ", "스튜디오 지브리", "استوديو غيبلي", "Studio Ghibli", "Studio Ghibli", "ስቱዲዮ ጊብሊ", "Studio Ghibli", "Studio Ghibli", "Studio Ghibli"),
    ("pokemon", "Pokemon", "Pokémon", "Pokémon", "Pokémon", "Pokémon", "Pokémon", "Покемон", "Pokémon", "Pokémon", "宝可梦", "पोकेमॉन", "পোকেমন", "ポケモン", "포켓몬", "بوكيمون", "Pokemon", "Pokemon", "ፖኬሞን", "Pokemon", "Pokemon", "Pokemon"),
    ("dragon_ball", "Dragon Ball", "Dragon Ball", "Dragon Ball", "Dragon Ball", "Dragon Ball", "Dragon Ball", "Драгонболл", "Dragon Ball", "Dragon Ball", "龙珠", "ड्रैगन बॉल", "ড্রাগন বল", "ドラゴンボール", "드래곤볼", "دراغون بول", "Dragon Ball", "Dragon Ball", "ድራጎን ቦል", "Dragon Ball", "Dragon Ball", "Dragon Ball"),
    ("naruto", "Naruto", "Naruto", "Naruto", "Naruto", "Naruto", "Naruto", "Наруто", "Naruto", "Naruto", "火影忍者", "नारुतो", "নারুতো", "ナルト", "나루토", "ناروتو", "Naruto", "Naruto", "ናሩቶ", "Naruto", "Naruto", "Naruto"),
    ("one_piece", "One Piece", "One Piece", "One Piece", "One Piece", "One Piece", "One Piece", "Ван-Пис", "One Piece", "One Piece", "海贼王", "वन पीस", "ওয়ান পিস", "ワンピース", "원피스", "ون بيس", "One Piece", "One Piece", "ዋን ፒስ", "One Piece", "One Piece", "One Piece"),
    ("attack_on_titan", "Attack On Titan", "Attack on Titan", "Attack on Titan", "L'Attaque des Titans", "Attack on Titan", "L'attacco dei giganti", "Атака титанов", "Attack on Titan", "Attack on Titan", "进击的巨人", "अटैक ऑन टाइटन", "অ্যাটাক অন টাইটান", "進撃の巨人", "진격의 거인", "هجوم العمالقة", "Attack on Titan", "Attack on Titan", "ጥቃት ኦን ታይታን", "Attack on Titan", "Attack on Titan", "Attack on Titan"),
    ("my_hero_academia", "My Hero Academia", "My Hero Academia", "My Hero Academia", "My Hero Academia", "My Hero Academia", "My Hero Academia", "Моя геройская академия", "My Hero Academia", "My Hero Academia", "我的英雄学院", "माई हीरो एकेडेमिया", "মাই হিরো অ্যাকাডেমিয়া", "僕のヒーローアカデミア", "나의 히어로 아카데미아", "أكاديمية بطلي", "My Hero Academia", "My Hero Academia", "ማይ ሂሮ አካዳሚያ", "My Hero Academia", "My Hero Academia", "My Hero Academia"),
    ("supernatural", "Supernatural", "Supernatural", "Supernatural", "Supernatural", "Supernatural", "Supernatural", "Сверхъестественное", "Supernatural", "Supernatural", "邪恶力量", "सुपरनैचुरल", "সুপারন্যাচারাল", "スーパーナチュラル", "수퍼내추럴", "خارق للطبيعة", "Supernatural", "Supernatural", "ሱፐርናቹራል", "Supernatural", "Supernatural", "Supernatural"),
    ("stranger_things", "Stranger Things", "Stranger Things", "Stranger Things", "Stranger Things", "Stranger Things", "Stranger Things", "Очень странные дела", "Stranger Things", "Stranger Things", "怪奇物语", "स्ट्रेंजर थिंग्स", "স্ট্রেঞ্জার থিংস", "ストレンジャー・シングス", "기묘한 이야기", "أشياء غريبة", "Stranger Things", "Stranger Things", "ስትሬንጀር ቲንግስ", "Stranger Things", "Stranger Things", "Stranger Things"),
    ("the_witcher", "The Witcher", "The Witcher", "The Witcher", "The Witcher", "The Witcher", "The Witcher", "Ведьмак", "The Witcher", "The Witcher", "猎魔人", "द विचर", "দ্য উইচার", "ウィッチャー", "위쳐", "الساحر", "The Witcher", "The Witcher", "ደ ዊቸር", "The Witcher", "The Witcher", "The Witcher"),
    ("breaking_bad", "Breaking Bad", "Breaking Bad", "Breaking Bad", "Breaking Bad", "Breaking Bad", "Breaking Bad", "Во все тяжкие", "Breaking Bad", "Breaking Bad", "绝命毒师", "ब्रेकिंग बैड", "ব্রেকিং ব্যাড", "ブレイキング・バッド", "브레이킹 배드", "اختلال ضال", "Breaking Bad", "Breaking Bad", "ብሬኪንግ ባድ", "Breaking Bad", "Breaking Bad", "Breaking Bad"),
    ("friends", "Friends", "Friends", "Friends", "Friends", "Friends", "Friends", "Друзья", "Vänner", "Friends", "老友记", "फ्रेंड्स", "ফ্রেন্ডস", "フレンズ", "프렌즈", "الأصدقاء", "Friends", "Friends", "ጓደኞች", "Friends", "Friends", "Friends"),
    ("the_office", "The Office", "The Office", "The Office", "The Office", "The Office", "The Office", "Офис", "Kontoret", "The Office", "办公室", "द ऑफिस", "দ্য অফিস", "ザ・オフィス", "더 오피스", "المكتب", "The Office", "The Office", "ደ ኦፊስ", "The Office", "The Office", "The Office"),
    ("rick_and_morty", "Rick And Morty", "Rick and Morty", "Rick e Morty", "Rick et Morty", "Rick and Morty", "Rick e Morty", "Рик и Морти", "Rick and Morty", "Rick en Morty", "瑞克和莫蒂", "रिक एंड मोर्टी", "রিক অ্যান্ড মর্টি", "リック・アンド・モーティ", "릭 앤 모티", "ريك ومورتي", "Rick and Morty", "Rick and Morty", "ሪክ እና ሞርቲ", "Rick and Morty", "Rick and Morty", "Rick and Morty"),
    ("adventure_time", "Adventure Time", "Adventure Time", "Hora de Aventura", "Adventure Time", "Adventure Time", "Adventure Time", "Время приключений", "Äventyrstid", "Avontuurlijke Tijd", "探险活宝", "एडवेंचर टाइम", "অ্যাডভেঞ্চার টাইম", "アドベンチャー・タイム", "어드벤처 타임", "وقت المغامرة", "Adventure Time", "Adventure Time", "አድቬንቸር ታይም", "Adventure Time", "Adventure Time", "Adventure Time"),
    ("avatar", "Avatar", "Avatar", "Avatar", "Avatar", "Avatar", "Avatar", "Аватар", "Avatar", "Avatar", "阿凡达", "अवतार", "অবতার", "アバター", "아바타", "أفاتار", "Avatar", "Avatar", "አቫታር", "Avatar", "Avatar", "Avatar"),
    ("kpop", "Kpop", "K-pop", "K-pop", "K-pop", "K-Pop", "K-pop", "К-поп", "K-pop", "K-pop", "韩流", "के-पॉप", "কে-পপ", "K-POP", "케이팝", "كيبوب", "Kpop", "Kpop", "ኬፖፕ", "Kpop", "Kpop", "K-pop"),
    ("jpop", "Jpop", "J-pop", "J-pop", "J-pop", "J-Pop", "J-pop", "Джей-поп", "J-pop", "J-pop", "日流", "जे-पॉप", "জে-পপ", "J-POP", "제이팝", "جيبوب", "Jpop", "Jpop", "ጄፖፕ", "Jpop", "Jpop", "J-pop"),
    ("fanfiction", "Fanfiction", "Fanfiction", "Fanfic", "Fanfiction", "Fanfiction", "Fanfiction", "Фанфики", "Fanfiction", "Fanfictie", "同人小说", "फैनफिक्शन", "ফ্যানফিকশন", "二次創作", "팬픽", "قصص المعجبين", "Hadithi za mashabiki", "Labaran masoya", "የአድናቂዎች ልብወለድ", "Fanfiction", "Fanfiksi", "Pakiwaitara pā"),
    ("roleplay", "Roleplay", "Roleplay", "RPG", "Jeu de rôle", "Rollenspiel", "GDR", "Ролевые игры", "Rollspel", "Rollenspel", "角色扮演", "रोलप्ले", "রোলপ্লে", "ロールプレイ", "롤플레이", "لعب الأدوار", "Kujifanya", "Kwaikwayo", "ሚና መጫወት", "Roleplay", "Main peranan", "Whakaari"),
    ("coleccionismo", "Coleccionismo", "Collecting", "Colecionismo", "Collection", "Sammeln", "Collezionismo", "Коллекционирование", "Samlande", "Verzamelen", "收藏", "संग्रह", "সংগ্রহ", "コレクション", "수집", "جمع المقتنيات", "Ukusanyaji", "Tara", "ስብስብ", "Pangongolekta", "Mengumpul", "Kohikohi"),
    ("figuras_accion", "Figuras Acción", "Action Figures", "Figuras de Ação", "Figurines", "Actionfiguren", "Action figure", "Фигурки", "Actionfigurer", "Actiefiguren", "手办", "एक्शन फिगर", "অ্যাকশন ফিগার", "アクションフィギュア", "액션 피규어", "مجسمات", "Sanamu", "Hotunan wasa", "የእርምጃ ምስሎች", "Action figures", "Figura aksi", "Whakairoiri"),
    ("funko_pop", "Funko Pop", "Funko Pop", "Funko Pop", "Funko Pop", "Funko Pop", "Funko Pop", "Фанко Поп", "Funko Pop", "Funko Pop", "Funko潮玩", "फंको पॉप", "ফানকো পপ", "ファンコポップ", "펀코팝", "فانكو بوب", "Funko Pop", "Funko Pop", "ፈንኮ ፖፕ", "Funko Pop", "Funko Pop", "Funko Pop"),
    ("merchandising", "Merchandising", "Merchandise", "Produtos", "Produits dérivés", "Merchandise", "Merchandising", "Мерч", "Merchandise", "Merchandise", "周边", "मर्चेंडाइज़", "মার্চেন্ডাইজ", "グッズ", "굿즈", "بضائع", "Bidhaa", "Kayayyaki", "ሸቀጦች", "Merchandise", "Barangan", "Taonga hoko"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 400
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
    print(f"seed fan items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
