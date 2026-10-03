"""
Seed items for Going Out category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_goingout.py
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
    ("bares", "Bares", "Bars", "Bares", "Bars", "Bars", "Bar", "Бары", "Barer", "Bars", "酒吧", "बार", "বার", "バー", "바", "حانات", "Baa", "Sandunan giya", "ባሮች", "Bar", "Bar", "Pae"),
    ("museos", "Museos", "Museums", "Museus", "Musées", "Museen", "Musei", "Музеи", "Museer", "Musea", "博物馆", "संग्रहालय", "জাদুঘর", "博物館", "박물관", "متاحف", "Makumbusho", "Gidajen tarihi", "ሙዚየሞች", "Museo", "Muzium", "Whare taonga"),
    ("festivales", "Festivales", "Festivals", "Festivais", "Festivals", "Festivals", "Festival", "Фестивали", "Festivaler", "Festivals", "节日", "त्योहार", "উৎসব", "フェスティバル", "축제", "مهرجانات", "Tamasha", "Bukukuwa", "በዓላት", "Pista", "Festival", "Hākari"),
    ("fiestas", "Fiestas", "Parties", "Festas", "Fêtes", "Partys", "Feste", "Вечеринки", "Fester", "Feesten", "派对", "पार्टियाँ", "পার্টি", "パーティー", "파티", "حفلات", "Sherehe", "Biki", "ድግሶች", "Party", "Parti", "Pāti"),
    ("clubes", "Clubes", "Clubs", "Clubes", "Clubs", "Clubs", "Club", "Клубы", "Klubbar", "Clubs", "俱乐部", "क्लब", "ক্লাব", "クラブ", "클럽", "نوادي", "Klabu", "Kulob", "ክለቦች", "Club", "Kelab", "Karapu"),
    ("discotecas", "Discotecas", "Nightclubs", "Baladas", "Boîtes de nuit", "Discos", "Discoteche", "Ночные клубы", "Nattklubbar", "Discotheken", "夜总会", "नाइटक्लब", "নাইটক্লাব", "ナイトクラブ", "나이트클럽", "نوادي ليلية", "Klabu za usiku", "Gidan rawa na dare", "የሌሊት ክለቦች", "Nightclub", "Kelab malam", "Karapu pō"),
    ("conciertos", "Conciertos", "Concerts", "Shows", "Concerts", "Konzerte", "Concerti", "Концерты", "Konserter", "Concerten", "演唱会", "संगीत कार्यक्रम", "কনসার্ট", "コンサート", "콘서트", "حفلات", "Konserti", "Kide-kide", "ኮንሰርቶች", "Concert", "Konsert", "Konohete"),
    ("teatro", "Teatro", "Theater", "Teatro", "Théâtre", "Theater", "Teatro", "Театр", "Teater", "Theater", "戏剧", "रंगमंच", "থিয়েটার", "演劇", "연극", "مسرح", "Maigizo", "Wasan kwaikwayo", "ቲያትር", "Teatro", "Teater", "Whare tapere"),
    ("opera", "Opera", "Opera", "Ópera", "Opéra", "Oper", "Opera", "Опера", "Opera", "Opera", "歌剧", "ओपेरा", "অপেরা", "オペラ", "오페라", "أوبرا", "Opera", "Opera", "ኦፔራ", "Opera", "Opera", "Opera"),
    ("ballet", "Ballet", "Ballet", "Balé", "Ballet", "Ballett", "Balletto", "Балет", "Balett", "Ballet", "芭蕾", "बैले", "ব্যালে", "バレエ", "발레", "باليه", "Ballet", "Ballet", "ባሌት", "Ballet", "Balet", "Ballet"),
    ("cine", "Cine", "Cinema", "Cinema", "Cinéma", "Kino", "Cinema", "Кино", "Bio", "Bioscoop", "电影院", "सिनेमा", "সিনেমা", "映画館", "영화관", "سينما", "Sinema", "Sinemar", "ሲኒማ", "Sinehan", "Pawagam", "Whare pikitia"),
    ("exposiciones", "Exposiciones", "Exhibitions", "Exposições", "Expositions", "Ausstellungen", "Mostre", "Выставки", "Utställningar", "Tentoonstellingen", "展览", "प्रदर्शनियाँ", "প্রদর্শনী", "展示会", "전시회", "معارض", "Maonyesho", "Nunin", "ኤግዚቢሽኖች", "Eksibisyon", "Pameran", "Whakaaturanga"),
    ("galerias_arte", "Galerías Arte", "Art Galleries", "Galerias de Arte", "Galeries d'art", "Kunstgalerien", "Gallerie d'arte", "Художественные галереи", "Konstgallerier", "Kunstgalerieën", "美术馆", "कला दीर्घाएँ", "আর্ট গ্যালারি", "画廊", "미술관", "صالات فنية", "Maghala ya sanaa", "Dakunan zane", "የሥነ ጥበብ ጋለሪዎች", "Art gallery", "Galeri seni", "Whare toi"),
    ("ferias", "Ferias", "Fairs", "Feiras", "Foires", "Messen", "Fiere", "Ярмарки", "Mässor", "Beurzen", "集市", "मेले", "মেলা", "見本市", "박람회", "معارض", "Maonyesho", "Kasuwanni", "ዕር satisfied", "Perya", "Pesta", "Hokohoko"),
    ("mercados", "Mercados", "Markets", "Mercados", "Marchés", "Märkte", "Mercati", "Рынки", "Marknader", "Markten", "市场", "बाज़ार", "বাজার", "市場", "시장", "أسواق", "Masoko", "Kasuwa", "ገበያዎች", "Palengke", "Pasar", "Mākete"),
    ("food_festivals", "Food Festivals", "Food Festivals", "Festivais Gastronômicos", "Festivals culinaires", "Food-Festivals", "Festival del cibo", "Гастрофестивали", "Matfestivaler", "Foodfestivals", "美食节", "फूड फेस्टिवल", "ফুড ফেস্টিভ্যাল", "フードフェス", "푸드 페스티벌", "مهرجانات طعام", "Tamasha za chakula", "Bikin abinci", "የምግብ ፌስቲቫሎች", "Food festival", "Festival makanan", "Hākari kai"),
    ("wine_tasting", "Wine Tasting", "Wine Tasting", "Degustação de Vinhos", "Dégustation de vins", "Weinverkostung", "Degustazione vini", "Дегустация вин", "Vinprovning", "Wijnproeverij", "品酒", "वाइन टेस्टिंग", "ওয়াইন টেস্টিং", "ワインテイスティング", "와인 시음", "تذوق النبيذ", "Kuonja mvinyo", "Ɗanɗanon giya", "የወይን ጣዕም", "Pagtikim ng alak", "Rasa wain", "Whakamatau wāina"),
    ("beer_tasting", "Beer Tasting", "Beer Tasting", "Degustação de Cerveja", "Dégustation de bière", "Bierverkostung", "Degustazione birra", "Дегустация пива", "Ölprovning", "Bierproeverij", "啤酒品鉴", "बीयर टेस्टिंग", "বিয়ার টেস্টিং", "ビールテイスティング", "맥주 시음", "تذوق البيرة", "Kuonja bia", "Ɗanɗanon giya", "የቢራ ጣዕም", "Pagtikim ng serbesa", "Rasa bir", "Whakamatau pia"),
    ("pub_crawl", "Pub Crawl", "Pub Crawl", "Tour de Bares", "Tournée des bars", "Kneipentour", "Giro dei pub", "Тур по барам", "Barrunda", "Kroegentocht", "酒吧巡游", "पब क्रॉल", "পাব ক্রল", "パブ巡り", "펍 크롤", "جولة حانات", "Ziara ya baa", "Yawon sandunan giya", "የባር ጉዞ", "Pub crawl", "Jelajah pub", "Hīkoi pae"),
    ("karaoke", "Karaoke", "Karaoke", "Karaokê", "Karaoké", "Karaoke", "Karaoke", "Караоке", "Karaoke", "Karaoke", "卡拉OK", "कराओके", "কারাওকে", "カラオケ", "노래방", "كاريوكي", "Karaoke", "Karaoke", "ካራኦኬ", "Karaoke", "Karaoke", "Karaoke"),
    ("comedy_shows", "Comedy Shows", "Comedy Shows", "Shows de Comédia", "Spectacles d'humour", "Comedy-Shows", "Spettacoli comici", "Комедийные шоу", "Humorshower", "Comedyshows", "喜剧秀", "कॉमेडी शो", "কমেডি শো", "コメディーショー", "코미디 쇼", "عروض كوميدية", "Maonyesho ya vichekesho", "Wasannin barkwanci", "የአስቂኝ ትርዒቶች", "Comedy show", "Pertunjukan komedi", "Whakakatakata"),
    ("stand_up", "Stand Up", "Stand-up", "Stand-up", "Stand-up", "Stand-up", "Stand-up", "Стендап", "Ståupp", "Stand-up", "单口喜剧", "स्टैंड-अप", "স্ট্যান্ড-আপ", "スタンドアップ", "스탠드업", "ستاند أب", "Stand up", "Stand up", "ስታንድ አፕ", "Stand-up", "Stand-up", "Whakataukataka"),
    ("open_mic", "Open Mic", "Open Mic", "Microfone Aberto", "Scène ouverte", "Offenes Mikro", "Open mic", "Открытый микрофон", "Öppen scen", "Open podium", "开放麦", "ओपन माइक", "ওপেন মাইক", "オープンマイク", "오픈 마이크", "مايك مفتوح", "Open mic", "Open mic", "ኦፐን ማይክ", "Open mic", "Mik terbuka", "Mik tuwhera"),
    ("jam_sessions", "Jam Sessions", "Jam Sessions", "Jam Sessions", "Bœufs", "Jam-Sessions", "Jam session", "Джем-сейшны", "Jamsessions", "Jamsessies", "即兴演奏会", "जैम सत्र", "জ্যাম সেশন", "ジャムセッション", "잼 세션", "جلسات ارتجالية", "Jam session", "Jam session", "ጃም ሴሽኖች", "Jam session", "Sesi jem", "Wāhanga whakatangi"),
    ("salsa_dancing", "Salsa Dancing", "Salsa Dancing", "Dança Salsa", "Danse salsa", "Salsa tanzen", "Ballare salsa", "Танцы сальса", "Salsadans", "Salsadansen", "萨尔萨舞", "साल्सा नृत्य", "সালসা নাচ", "サルサダンス", "살사 댄스", "رقص السالسا", "Kuimba salsa", "Rawar salsa", "ሳልሳ ዳንስ", "Pagsayaw ng salsa", "Tarian salsa", "Kanikani salsa"),
    ("bachata_dancing", "Bachata Dancing", "Bachata Dancing", "Dança Bachata", "Danse bachata", "Bachata tanzen", "Ballare bachata", "Танцы бачата", "Bachatadans", "Bachatadansen", "巴恰塔舞", "बचाता नृत्य", "বাচাতা নাচ", "バチャータダンス", "바차타 댄스", "رقص الباتشاتا", "Kuimba bachata", "Rawar bachata", "ባቻታ ዳንስ", "Pagsayaw ng bachata", "Tarian bachata", "Kanikani bachata"),
    ("tango", "Tango", "Tango", "Tango", "Tango", "Tango", "Tango", "Танго", "Tango", "Tango", "探戈", "टैंगो", "ট্যাঙ্গো", "タンゴ", "탱고", "تانغو", "Tango", "Tango", "ታንጎ", "Tango", "Tango", "Tango"),
    ("swing_dancing", "Swing Dancing", "Swing Dancing", "Dança Swing", "Danse swing", "Swing tanzen", "Ballo swing", "Танцы свинг", "Swingdans", "Swingdansen", "摇摆舞", "स्विंग नृत्य", "সুইং নাচ", "スウィングダンス", "스윙 댄스", "رقص السوينغ", "Kuimba swing", "Rawar swing", "ስዊንግ ዳንስ", "Pagsayaw ng swing", "Tarian swing", "Kanikani swing"),
    ("clubbing", "Clubbing", "Clubbing", "Balada", "Clubbing", "Clubbing", "Serate in discoteca", "Клубная жизнь", "Klubbliv", "Stappen", "夜店", "क्लबिंग", "ক্লাবিং", "クラブ通い", "클럽", "سهر", "Kwenda klabu", "Gidan rawa na dare", "ክለብ", "Clubbing", "Berkelab", "Karapu pō"),
    ("raves", "Raves", "Raves", "Raves", "Raves", "Raves", "Rave", "Рейвы", "Rave", "Raves", "锐舞派对", "रेव", "রেভ", "レイブ", "레이브", "حفلات ريف", "Rave", "Rave", "ሬቭ", "Rave", "Rave", "Rave"),
    ("afterparties", "Afterparties", "Afterparties", "After", "After", "Afterpartys", "Afterparty", "Афтепати", "Efterfester", "Afterparty's", "余兴派对", "आफ्टरपार्टी", "আফটারপার্টি", "アフターパーティー", "애프터파티", "حفلات لاحقة", "Sherehe za baadaye", "Biki bayan biki", "ድህረ-ድግሶች", "Afterparty", "Majlis selepas", "Pāti whai muri"),
    ("rooftop_bars", "Rooftop Bars", "Rooftop Bars", "Bares Terraço", "Bars sur les toits", "Dachbars", "Bar sui tetti", "Бары на крыше", "Takterrasser", "Dakterrassen", "屋顶酒吧", "रूफटॉप बार", "ছাদ বার", "ルーフトップバー", "루프탑 바", "بارات السطح", "Baa za paa", "Sandunan giya na saman gini", "የጣሪያ ባሮች", "Rooftop bar", "Bar atas bumbung", "Pae tuanui"),
    ("speakeasies", "Speakeasies", "Speakeasies", "Speakeasies", "Speakeasy", "Speakeasys", "Speakeasy", "Спикизи", "Lönnkrogar", "Speakeasy's", "地下酒吧", "स्पीकीज़ी", "স্পিকইজি", "スピークイージー", "스피크이지", "حانات سرية", "Baa za siri", "Sandunan giya na ɓoye", "ስፒኪዚዎች", "Speakeasy", "Bar rahsia", "Pae huna"),
    ("wine_bars", "Wine Bars", "Wine Bars", "Bares de Vinho", "Bars à vin", "Weinbars", "Enoteche", "Винные бары", "Vinbarer", "Wijnbars", "葡萄酒吧", "वाइन बार", "ওয়াইন বার", "ワインバー", "와인바", "حانات النبيذ", "Baa za mvinyo", "Sandunan giya", "የወይን ባሮች", "Wine bar", "Bar wain", "Pae wāina"),
    ("craft_beer_bars", "Craft Beer Bars", "Craft Beer Bars", "Bares de Cerveja Artesanal", "Bars à bière artisanale", "Craft-Bier-Bars", "Pub di birra artigianale", "Крафтовые пивные", "Hantverksölbarer", "Ambachtelijke bierbars", "精酿啤酒吧", "क्राफ्ट बीयर बार", "ক্রাফট বিয়ার বার", "クラフトビールバー", "수제 맥주 바", "حانات البيرة الحرفية", "Baa za bia", "Sandunan giyar gida", "ዕደ-ጥበብ የቢራ ባሮች", "Craft beer bar", "Bar bir kraf", "Pae pia whare"),
    ("sports_bars", "Sports Bars", "Sports Bars", "Bares Esportivos", "Bars sportifs", "Sportbars", "Sport bar", "Спортбары", "Sportbarer", "Sportcafés", "体育酒吧", "स्पोर्ट्स बार", "স্পোর্টস বার", "スポーツバー", "스포츠 바", "حانات رياضية", "Baa za michezo", "Sandunan wasanni", "የስፖርት ባሮች", "Sports bar", "Bar sukan", "Pae hākinakina"),
    ("lounges", "Lounges", "Lounges", "Lounges", "Lounges", "Lounges", "Lounge", "Лаунжи", "Lounger", "Lounges", "休息室", "लाउंज", "লাউঞ্জ", "ラウンジ", "라운지", "صالات", "Sebule", "Wuraren shakatawa", "ላውንጆች", "Lounge", "Ruang santai", "Rūma whakangā"),
    ("cafes", "Cafes", "Cafés", "Cafés", "Cafés", "Cafés", "Caffetterie", "Кафе", "Kaféer", "Cafés", "咖啡馆", "कैफे", "ক্যাফে", "カフェ", "카페", "مقاهي", "Mikahawa", "Shagunan shayi", "ካፌዎች", "Cafe", "Kafe", "Whare kawhe"),
    ("restaurantes", "Restaurantes", "Restaurants", "Restaurantes", "Restaurants", "Restaurants", "Ristoranti", "Рестораны", "Restauranger", "Restaurants", "餐厅", "रेस्तरां", "রেস্তোরাঁ", "レストラン", "레스토랑", "مطاعم", "Mikahawa", "Gidajen cin abinci", "ሬስቶራንቶች", "Restoran", "Restoran", "Wharekai"),
    ("brunch", "Brunch", "Brunch", "Brunch", "Brunch", "Brunch", "Brunch", "Бранч", "Brunch", "Brunch", "早午餐", "ब्रंच", "ব্রাঞ্চ", "ブランチ", "브런치", "برانش", "Brunch", "Brunch", "ብራንች", "Brunch", "Brunch", "Parakuihi"),
    ("cenas", "Cenas", "Dinners", "Jantares", "Dîners", "Abendessen", "Cene", "Ужины", "Middagar", "Diners", "晚餐", "रात का खाना", "রাতের খাবার", "ディナー", "저녁 식사", "عشاء", "Chakula cha jioni", "Abincin dare", "እራት", "Hapunan", "Makan malam", "Hapa"),
    ("picnics", "Picnics", "Picnics", "Piqueniques", "Pique-niques", "Picknicks", "Picnic", "Пикники", "Picknickar", "Picknicks", "野餐", "पिकनिक", "পিকনিক", "ピクニック", "소풍", "نزهات", "Picnic", "Fita-fita", "ፒክኒኮች", "Picnic", "Perkelahan", "Pikiniki"),
    ("parques", "Parques", "Parks", "Parques", "Parcs", "Parks", "Parchi", "Парки", "Parker", "Parken", "公园", "पार्क", "পার্ক", "公園", "공원", "حدائق", "Bustani", "Lambuna", "ፓርኮች", "Parke", "Taman", "Papa rēhia"),
    ("playas", "Playas", "Beaches", "Praias", "Plages", "Strände", "Spiagge", "Пляжи", "Stränder", "Stranden", "海滩", "समुद्र तट", "সৈকত", "ビーチ", "해변", "شواطئ", "Fukwe", "Tekuna", "ዳርቻዎች", "Dalampasigan", "Pantai", "Tātahi"),
    ("paseos", "Paseos", "Walks", "Passeios", "Promenades", "Spaziergänge", "Passeggiate", "Прогулки", "Promenader", "Wandelingen", "散步", "सैर", "হাঁটা", "散歩", "산책", "نزهات", "Matembezi", "Yawo", "እርምጃዎች", "Pamamasyal", "Berjalan-jalan", "Hīkoi poto"),
    ("turismo", "Turismo", "Sightseeing", "Turismo", "Tourisme", "Sightseeing", "Turismo", "Осмотр достопримечательностей", "Sightseeing", "Sightseeing", "观光", "पर्यटन", "পর্যটন", "観光", "관광", "سياحة", "Utalii", "Yawon buɗe ido", "ቱሪዝም", "Pamamasyal", "Pelancongan", "Tāpoi"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 1000
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
    print(f"seed goingout items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
