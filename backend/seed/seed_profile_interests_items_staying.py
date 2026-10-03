"""
Seed items for Staying In category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_staying.py
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
    ("leer", "Leer", "Reading", "Ler", "Lecture", "Lesen", "Lettura", "Чтение", "Läsning", "Lezen", "阅读", "पढ़ना", "পড়া", "読書", "독서", "قراءة", "Kusoma", "Karatu", "ማንበብ", "Pagbasa", "Membaca", "Pānui"),
    ("reposteria", "Repostería", "Pastry", "Confeitaria", "Pâtisserie", "Konditorei", "Pasticceria", "Кондитерское дело", "Bageri", "Banketbakkerij", "糕点", "पेस्ट्री", "পেস্ট্রি", "製菓", "제과", "حلويات", "Uokaji keki", "Yin burodi mai zaƙi", "ጣፋጭ ዳቦ", "Panaderya", "Pastri", "Tunu keke"),
    ("juegos_mesa", "Juegos Mesa", "Board Games", "Jogos de Tabuleiro", "Jeux de société", "Brettspiele", "Giochi da tavolo", "Настольные игры", "Brädspel", "Bordspellen", "桌游", "बोर्ड गेम", "বোর্ড গেম", "ボードゲーム", "보드게임", "ألعاب لوحية", "Michezo ya ubao", "Wasannin allo", "የቦርድ ጨዋታዎች", "Board games", "Permainan papan", "Kēmu papa"),
    ("puzzles", "Puzzles", "Puzzles", "Quebra-cabeças", "Puzzles", "Puzzle", "Puzzle", "Пазлы", "Pussel", "Puzzels", "拼图", "पहेलियाँ", "ধাঁধা", "パズル", "퍼즐", "ألغاز", "Mafumbo", "Wasannin wuyar gane", "እንቆቅልሾች", "Puzzle", "Teka-teki", "Panga"),
    ("jardineria", "Jardinería", "Gardening", "Jardinagem", "Jardinage", "Gärtnern", "Giardinaggio", "Садоводство", "Trädgårdsarbete", "Tuinieren", "园艺", "बागवानी", "বাগান", "ガーデニング", "원예", "بستنة", "Kilimo cha bustani", "Lambun gida", "የአትክልት ስፍራ", "Paghahalaman", "Berkebun", "Māra kai"),
    ("plantas", "Plantas", "Plants", "Plantas", "Plantes", "Pflanzen", "Piante", "Растения", "Växter", "Planten", "植物", "पौधे", "গাছপালা", "植物", "식물", "نباتات", "Mimea", "Tsirrai", "ዕንጨይቶች", "Mga halaman", "Tumbuhan", "Tipu"),
    ("acuarios", "Acuarios", "Aquariums", "Aquários", "Aquariums", "Aquarien", "Acquari", "Аквариумы", "Akvarier", "Aquaria", "水族馆", "एक्वेरियम", "অ্যাকুরিয়াম", "水族館", "수족관", "أحواض سمك", "Vidimbwi vya samaki", "Kifayen kifi", "አኳሪየሞች", "Aquarium", "Akuarium", "Whare ika"),
    ("terrarios", "Terrarios", "Terrariums", "Terrários", "Terrariums", "Terrarien", "Terrari", "Террариумы", "Terrarier", "Terraria", "生态箱", "टेरेरियम", "টেরারিয়াম", "テラリウム", "테라리움", "مرابي حيوانات", "Terrarium", "Terrarium", "ቴራሪየሞች", "Terrarium", "Terarium", "Whare ngārara"),
    ("cocina", "Cocina", "Cooking", "Cozinha", "Cuisine", "Kochen", "Cucina", "Кулинария", "Matlagning", "Koken", "烹饪", "खाना बनाना", "রান্না", "料理", "요리", "طبخ", "Upishi", "Girki", "ምግብ ማብሰል", "Pagluluto", "Memasak", "Tunu kai"),
    ("hornear", "Hornear", "Baking", "Assar", "Cuire au four", "Backen", "Infornare", "Выпечка", "Baka", "Bakken", "烘焙", "बेकिंग", "বেকিং", "ベーキング", "베이킹", "خبز", "Kuoka", "Gasa", "መጋገር", "Pagbe-bake", "Membakar", "Tunu"),
    ("manualidades", "Manualidades", "Crafts", "Artesanato", "Bricolage", "Basteln", "Hobbistica", "Рукоделие", "Pyssel", "Knutselen", "手工艺", "हस्तशिल्प", "হস্তশিল্প", "ハンドメイド", "수공예", "حرف يدوية", "Ufundi", "Aikin hannu", "ዕደ-ጥበብ", "Mga gawang-kamay", "Kraf tangan", "Mahi-ā-ringa"),
    ("pintura", "Pintura", "Painting", "Pintura", "Peinture", "Malerei", "Pittura", "Живопись", "Måleri", "Schilderen", "绘画", "चित्रकला", "চিত্রকলা", "絵画", "그림", "رسم", "Uchoraji", "Zane", "ሥዕል", "Pagpipinta", "Lukisan", "Peita"),
    ("dibujo", "Dibujo", "Drawing", "Desenho", "Dessin", "Zeichnen", "Disegno", "Рисунок", "Teckning", "Tekenen", "素描", "ड्राइंग", "অঙ্কন", "デッサン", "그림 그리기", "رسم", "Kuchora", "Zane", "ስዕል", "Pagguhit", "Lukisan", "Tuhituhi"),
    ("escritura", "Escritura", "Writing", "Escrita", "Écriture", "Schreiben", "Scrittura", "Письмо", "Skrivande", "Schrijven", "写作", "लेखन", "লেখা", "執筆", "글쓰기", "كتابة", "Uandishi", "Rubutu", "መጻፍ", "Pagsusulat", "Penulisan", "Tuhituhi"),
    ("podcasts", "Podcasts", "Podcasts", "Podcasts", "Podcasts", "Podcasts", "Podcast", "Подкасты", "Poddar", "Podcasts", "播客", "पॉडकास्ट", "পডকাস্ট", "ポッドキャスト", "팟캐스트", "بودكاست", "Podcast", "Podcast", "ፖድካስቶች", "Podcast", "Podcast", "Podcast"),
    ("audiolibros", "Audiolibros", "Audiobooks", "Audiolivros", "Livres audio", "Hörbücher", "Audiolibri", "Аудиокниги", "Ljudböcker", "Luisterboeken", "有声书", "ऑडियोबुक", "অডিওবুক", "オーディオブック", "오디오북", "كتب صوتية", "Vitabu vya sauti", "Littattafan sauti", "የድምጽ መጻሕፍት", "Audiobook", "Buku audio", "Pukapuka oro"),
    ("series", "Series", "TV Shows", "Séries", "Séries", "Serien", "Serie TV", "Сериалы", "Serier", "Series", "剧集", "सीरीज़", "সিরিজ", "ドラマ", "드라마", "مسلسلات", "Mfululizo", "Jerin shirye-shirye", "ተከታታይ ፊልሞች", "Serye", "Siri", "Whakaari pouaka whakaata"),
    ("peliculas", "Películas", "Movies", "Filmes", "Films", "Filme", "Film", "Фильмы", "Filmer", "Films", "电影", "फिल्में", "সিনেমা", "映画", "영화", "أفلام", "Filamu", "Fina-finai", "ፊልሞች", "Pelikula", "Filem", "Kiriata"),
    ("documentales", "Documentales", "Documentaries", "Documentários", "Documentaires", "Dokumentationen", "Documentari", "Документальные фильмы", "Dokumentärer", "Documentaires", "纪录片", "वृत्तचित्र", "তথ্যচিত্র", "ドキュメンタリー", "다큐멘터리", "وثائقيات", "Makala", "Shirye-shiryen gaskiya", "ዘጋቢ ፊልሞች", "Dokumentaryo", "Dokumentari", "Pakipūmuhu"),
    ("anime", "Anime", "Anime", "Anime", "Anime", "Anime", "Anime", "Аниме", "Anime", "Anime", "动漫", "एनीमे", "অ্যানিমে", "アニメ", "애니", "أنمي", "Anime", "Anime", "አኒሜ", "Anime", "Anime", "Anime"),
    ("videojuegos", "Videojuegos", "Video Games", "Videogames", "Jeux vidéo", "Videospiele", "Videogiochi", "Видеоигры", "TV-spel", "Videogames", "电子游戏", "वीडियो गेम", "ভিডিও গেম", "ゲーム", "비디오 게임", "ألعاب الفيديو", "Michezo ya video", "Wasannin bidiyo", "የቪዲዮ ጨዋታዎች", "Mga video game", "Permainan video", "Ngā kēmu ataata"),
    ("streaming", "Streaming", "Streaming", "Streaming", "Streaming", "Streaming", "Streaming", "Стриминг", "Streaming", "Streamen", "流媒体", "स्ट्रीमिंग", "স্ট্রিমিং", "配信", "스트리밍", "بث", "Utiririshaji", "Yaɗa kai tsaye", "ስትሪሚንግ", "Streaming", "Penstriman", "Whakapāho"),
    ("youtube", "Youtube", "YouTube", "YouTube", "YouTube", "YouTube", "YouTube", "Ютуб", "Youtube", "YouTube", "油管", "यूट्यूब", "ইউটিউব", "ユーチューブ", "유튜브", "يوتيوب", "Youtube", "Youtube", "ዩቲዩብ", "Youtube", "Youtube", "Youtube"),
    ("meditacion", "Meditación", "Meditation", "Meditação", "Méditation", "Meditation", "Meditazione", "Медитация", "Meditation", "Meditatie", "冥想", "ध्यान", "ধ্যান", "瞑想", "명상", "تأمل", "Kutafakari", "Tunani", "ሜዲቴሽን", "Pagninilay", "Meditasi", "Whakaaroaro"),
    ("yoga_casa", "Yoga Casa", "Home Yoga", "Ioga em Casa", "Yoga à la maison", "Yoga zuhause", "Yoga a casa", "Йога дома", "Hemmayoga", "Yoga thuis", "居家瑜伽", "घर पर योग", "বাড়িতে যোগা", "おうちヨガ", "홈요가", "يوغا منزلية", "Yoga nyumbani", "Yoga na gida", "የቤት ዮጋ", "Yoga sa bahay", "Yoga di rumah", "Yoga kāinga"),
    ("ejercicio_casa", "Ejercicio Casa", "Home Workout", "Exercício em Casa", "Sport à la maison", "Heimtraining", "Allenamento a casa", "Домашние тренировки", "Hemmaträning", "Thuissport", "居家锻炼", "घर पर व्यायाम", "বাড়িতে ব্যায়াম", "宅トレ", "홈트", "تمارين منزلية", "Mazoezi nyumbani", "Motsa jiki na gida", "የቤት ልምምድ", "Ehersisyo sa bahay", "Senaman di rumah", "Kori kāinga"),
    ("decoracion", "Decoración", "Decor", "Decoração", "Décoration", "Deko", "Arredamento", "Декор", "Inredning", "Decoratie", "装饰", "सजावट", "সাজসজ্জা", "インテリア", "인테리어", "ديكور", "Mapambo", "Kayan ado", "ማስጌጥ", "Dekorasyon", "Hiasan", "Whakapaipai"),
    ("organizacion", "Organización", "Organizing", "Organização", "Organisation", "Ordnung", "Organizzazione", "Организация", "Organisering", "Organiseren", "收纳", "आयोजन", "গোছানো", "整理整頓", "정리", "تنظيم", "Kupanga", "Tsari", "አደረጃጀት", "Pag-oorganisa", "Mengemas", "Whakaraupapa"),
    ("limpieza", "Limpieza", "Cleaning", "Limpeza", "Ménage", "Putzen", "Pulizie", "Уборка", "Städning", "Schoonmaken", "清洁", "सफाई", "পরিষ্কার", "掃除", "청소", "تنظيف", "Usafi", "Tsaftacewa", "ጽዳት", "Paglilinis", "Pembersihan", "Whakapai"),
    ("coleccionismo", "Coleccionismo", "Collecting", "Colecionismo", "Collection", "Sammeln", "Collezionismo", "Коллекционирование", "Samlande", "Verzamelen", "收藏", "संग्रह", "সংগ্রহ", "コレクション", "수집", "جمع المقتنيات", "Ukusanyaji", "Tara", "ስብስብ", "Pangongolekta", "Mengumpul", "Kohikohi"),
    ("modelismo", "Modelismo", "Modeling", "Modelismo", "Modélisme", "Modellbau", "Modellismo", "Моделизм", "Modellbygge", "Modelbouw", "模型", "मॉडलिंग", "মডেলিং", "プラモデル", "프라모델", "نمذجة", "Uundaji mifano", "Ƙirar samfura", "ሞዴሊንግ", "Pagmomodelo", "Permodelan", "Hanga tauira"),
    ("lego", "Lego", "Lego", "Lego", "Lego", "Lego", "Lego", "Лего", "Lego", "Lego", "乐高", "लेगो", "লেগো", "レゴ", "레고", "ليغو", "Lego", "Lego", "ሌጎ", "Lego", "Lego", "Lego"),
    ("origami", "Origami", "Origami", "Origami", "Origami", "Origami", "Origami", "Оригами", "Origami", "Origami", "折纸", "ओरिगेमी", "অরিগামি", "折り紙", "종이접기", "أوريغامي", "Origami", "Origami", "ኦሪጋሚ", "Origami", "Origami", "Origami"),
    ("scrapbooking", "Scrapbooking", "Scrapbooking", "Scrapbook", "Scrapbooking", "Scrapbooking", "Scrapbooking", "Скрапбукинг", "Scrapbooking", "Scrapbooken", "剪贴簿", "स्क्रैपबुकिंग", "স্ক্র্যাপবুকিং", "スクラップブッキング", "스크랩북", "سكرابوكينغ", "Scrapbooking", "Scrapbooking", "ስክራፕቡኪንግ", "Scrapbooking", "Scrapbooking", "Scrapbooking"),
    ("tejido", "Tejido", "Knitting", "Tricô", "Tricot", "Stricken", "Maglia", "Вязание", "Stickning", "Breien", "编织", "बुनाई", "বোনা", "編み物", "뜨개질", "حياكة", "Kufuma", "Saƙa", "ሽምግልና", "Pagniniting", "Mengait", "Raranga"),
    ("crochet", "Crochet", "Crochet", "Crochê", "Crochet", "Häkeln", "Uncinetto", "Вязание крючком", "Virka", "Haken", "钩针", "क्रोशिया", "ক্রোশে", "かぎ針編み", "코바늘", "كروشيه", "Kushona kwa ndoano", "Crochet", "ክሮሼት", "Gantsilyo", "Kait", "Mataira"),
    ("bordado", "Bordado", "Embroidery", "Bordado", "Broderie", "Stickerei", "Ricamo", "Вышивка", "Broderi", "Borduren", "刺绣", "कढ़ाई", "সূচিকর্ম", "刺繍", "자수", "تطريز", "Udarizi", "Dinki mai ƙawata", "ጥልፍ", "Burda", "Sulaman", "Whakairoiro"),
    ("costura", "Costura", "Sewing", "Costura", "Couture", "Nähen", "Cucito", "Шитьё", "Sömnad", "Naaien", "缝纫", "सिलाई", "সেলাই", "裁縫", "바느질", "خياطة", "Kushona", "Dinki", "ስፌት", "Panahi", "Jahitan", "Tuituinga"),
    ("carpinteria_casa", "Carpintería Casa", "Home Woodworking", "Marcenaria Caseira", "Menuiserie maison", "Heimwerken Holz", "Falegnameria casa", "Домашняя столярка", "Hemmasnickeri", "Houtbewerking thuis", "居家木工", "घरेलू बढ़ईगीरी", "বাড়ির কাঠের কাজ", "DIY木工", "홈목공", "نجارة منزلية", "Useremala nyumbani", "Kafinta na gida", "የቤት የእንጨይት ሥራ", "Karpinterya sa bahay", "Pertukangan rumah", "Taratara kāinga"),
    ("reparaciones", "Reparaciones", "Repairs", "Reparos", "Réparations", "Reparaturen", "Riparazioni", "Ремонт", "Reparationer", "Reparaties", "维修", "मरम्मत", "মেরামত", "修理", "수리", "إصلاحات", "Matengenezo", "Gyare-gyare", "ጥገናዎች", "Pagkukumpuni", "Pembaikan", "Whakatikatika"),
    ("bricolaje", "Bricolaje", "DIY", "Faça Você Mesmo", "Bricolage", "Heimwerken", "Fai da te", "Сделай сам", "Hemmafix", "Doe-het-zelf", "手工", "DIY", "নিজে করো", "DIY", "DIY", "اصنع بنفسك", "Jifanyie mwenyewe", "Yi da kanka", "DIY", "DIY", "DIY", "Mahia ake"),
    ("mascotas", "Mascotas", "Pets", "Animais de estimação", "Animaux", "Haustiere", "Animali domestici", "Питомцы", "Husdjur", "Huisdieren", "宠物", "पालतू जानवर", "পোষা প্রাণী", "ペット", "반려동물", "حيوانات أليفة", "Wanyama", "Dabbobi", "የቤት እንስሳት", "Mga alaga", "Haiwan peliharaan", "Mōkai"),
    ("cuidado_mascotas", "Cuidado Mascotas", "Pet Care", "Cuidado de Pets", "Soins aux animaux", "Tierpflege", "Cura animali", "Уход за питомцами", "Djurvård", "Huisdierzorg", "宠物护理", "पालतू देखभाल", "পোষা প্রাণীর যত্ন", "ペットケア", "반려동물 돌보기", "رعاية الحيوانات", "Utunzaji wa wanyama", "Kula da dabbobi", "የቤት እንስሳት እንክብካቤ", "Pag-aalaga ng alaga", "Penjagaan haiwan", "Tiaki mōkai"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 800
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
    print(f"seed staying items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
