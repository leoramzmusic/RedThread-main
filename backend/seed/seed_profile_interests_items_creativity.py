"""
Seed items for Creativity category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_creativity.py
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
    ("fotografia", "Fotografía", "Photography", "Fotografia", "Photographie", "Fotografie", "Fotografia", "Фотография", "Foto", "Fotografie", "摄影", "फोटोग्राफी", "ফটোগ্রাফি", "写真", "사진", "تصوير", "Upigaji picha", "Ɗaukar hoto", "ፎቶግራፍ", "Potograpiya", "Fotografi", "Whakaahua"),
    ("canto", "Canto", "Singing", "Canto", "Chant", "Gesang", "Canto", "Пение", "Sång", "Zang", "唱歌", "गायन", "গান", "歌唱", "노래", "غناء", "Kuimba", "Waƙa", "መዘመር", "Pag-awit", "Nyanyian", "Waiata"),
    ("poesia", "Poesía", "Poetry", "Poesia", "Poésie", "Poesie", "Poesia", "Поэзия", "Poesi", "Poëzie", "诗歌", "कविता", "কবিতা", "詩", "시", "شعر", "Ushairi", "Waƙoƙi", "ግጥም", "Tula", "Puisi", "Ruri"),
    ("pintura", "Pintura", "Painting", "Pintura", "Peinture", "Malerei", "Pittura", "Живопись", "Måleri", "Schilderen", "绘画", "चित्रकला", "চিত্রকলা", "絵画", "그림", "رسم", "Uchoraji", "Zane", "ሥዕል", "Pagpipinta", "Lukisan", "Peita"),
    ("dibujo", "Dibujo", "Drawing", "Desenho", "Dessin", "Zeichnen", "Disegno", "Рисунок", "Teckning", "Tekenen", "素描", "ड्राइंग", "অঙ্কন", "デッサン", "그림 그리기", "رسم", "Kuchora", "Zane", "ስዕል", "Pagguhit", "Lukisan", "Tuhituhi"),
    ("escultura", "Escultura", "Sculpture", "Escultura", "Sculpture", "Skulptur", "Scultura", "Скульптура", "Skulptur", "Beeldhouwen", "雕塑", "मूर्तिकला", "ভাস্কর্য", "彫刻", "조각", "نحت", "Uchongaji", "Sassaƙa", "ቅርጽ", "Eskultura", "Arca", "Whakairo"),
    ("ceramica", "Cerámica", "Ceramics", "Cerâmica", "Céramique", "Keramik", "Ceramica", "Керамика", "Keramik", "Keramiek", "陶瓷", "सिरेमिक", "সিরামিক", "陶芸", "도자기", "سيراميك", "Ufinyanzi", "Tukwanen ƙasa", "ሴራሚክ", "Seramika", "Seramik", "Ukuiku"),
    ("ilustracion", "Ilustración", "Illustration", "Ilustração", "Illustration", "Illustration", "Illustrazione", "Иллюстрация", "Illustration", "Illustratie", "插画", "चित्रण", "চিত্রণ", "イラスト", "일러스트", "رسم توضيحي", "Mchoro", "Misali", "ሥዕላዊ መግለጫ", "Ilustrasyon", "Ilustrasi", "Whakaahua pukapuka"),
    ("diseno_grafico", "Diseño Gráfico", "Graphic Design", "Design Gráfico", "Design graphique", "Grafikdesign", "Grafica", "Графический дизайн", "Grafisk design", "Grafisch ontwerp", "平面设计", "ग्राफिक डिज़ाइन", "গ্রাফিক ডিজাইন", "グラフィックデザイン", "그래픽 디자인", "تصميم جرافيك", "Ubunifu wa picha", "Zanen hoto", "ግራፊክ ዲዛይን", "Graphic design", "Reka bentuk grafik", "Hoahoa whakairoiro"),
    ("diseno_web", "Diseño Web", "Web Design", "Design Web", "Webdesign", "Webdesign", "Web design", "Веб-дизайн", "Webbdesign", "Webdesign", "网页设计", "वेब डिज़ाइन", "ওয়েব ডিজাইন", "ウェブデザイン", "웹 디자인", "تصميم ويب", "Ubunifu wa wavuti", "Zanen yanar gizo", "የድር ዲዛይን", "Web design", "Reka bentuk web", "Hoahoa paetukutuku"),
    ("animacion", "Animación", "Animation", "Animação", "Animation", "Animation", "Animazione", "Анимация", "Animation", "Animatie", "动画", "एनिमेशन", "অ্যানিমেশন", "アニメーション", "애니메이션", "تحريك", "Uhuishaji", "Rayarwa", "አኒሜሽን", "Animation", "Animasi", "Hākoritanga"),
    ("video_edicion", "Video Edición", "Video Editing", "Edição de Vídeo", "Montage vidéo", "Videoschnitt", "Montaggio video", "Видеомонтаж", "Videoredigering", "Videobewerking", "视频剪辑", "वीडियो एडिटिंग", "ভিডিও এডিটিং", "動画編集", "영상 편집", "مونتاج فيديو", "Kuhariri video", "Gyaran bidiyo", "የቪዲዮ ማረም", "Pag-edit ng video", "Penyuntingan video", "Whakatika ataata"),
    ("produccion_musical", "Producción Musical", "Music Production", "Produção Musical", "Production musicale", "Musikproduktion", "Produzione musicale", "Музыкальное продюсирование", "Musikproduktion", "Muziekproductie", "音乐制作", "संगीत उत्पादन", "সঙ্গীত প্রযোজনা", "音楽制作", "음악 프로덕션", "إنتاج موسيقي", "Utayarishaji wa muziki", "Samar da kiɗa", "የሙዚቃ ምርት", "Produksyong musikal", "Penerbitan muzik", "Whakaputa puoro"),
    ("dj", "DJ", "DJ", "DJ", "DJ", "DJ", "DJ", "Диджей", "DJ", "DJ", "DJ", "डीजे", "ডিজে", "DJ", "DJ", "دي جي", "DJ", "DJ", "ዲጄ", "DJ", "DJ", "DJ"),
    ("composicion", "Composición", "Composing", "Composição", "Composition", "Komponieren", "Composizione", "Сочинение музыки", "Komposition", "Componeren", "作曲", "संगीत रचना", "সুর রচনা", "作曲", "작곡", "تلحين", "Utungaji", "Tsarawa", "ስብስብ", "Paglikha", "Gubahan", "Tito waiata"),
    ("escritura", "Escritura", "Writing", "Escrita", "Écriture", "Schreiben", "Scrittura", "Письмо", "Skrivande", "Schrijven", "写作", "लेखन", "লেখা", "執筆", "글쓰기", "كتابة", "Uandishi", "Rubutu", "መጻፍ", "Pagsusulat", "Penulisan", "Tuhituhi"),
    ("novelas", "Novelas", "Novels", "Romances", "Romans", "Romane", "Romanzi", "Романы", "Romaner", "Romans", "小说", "उपन्यास", "উপন্যাস", "小説", "소설", "روايات", "Riwaya", "Littattafan almara", "ልብወለዶች", "Mga nobela", "Novel", "Pukapuka paki"),
    ("cuentos", "Cuentos", "Short Stories", "Contos", "Contes", "Erzählungen", "Racconti", "Рассказы", "Noveller", "Korte verhalen", "短篇故事", "कहानियाँ", "গল্প", "短編小説", "단편소설", "قصص قصيرة", "Hadithi fupi", "Gajerun labarai", "አጫጭር ታሪኮች", "Maiikling kuwento", "Cerpen", "Pakiwaitara poto"),
    ("guiones", "Guiones", "Screenplays", "Roteiros", "Scénarios", "Drehbücher", "Sceneggiature", "Сценарии", "Manus", "Scripts", "剧本", "पटकथा", "চিত্রনাট্য", "脚本", "각본", "سيناريوهات", "Hati", "Rubutun fim", "ስክሪፕቶች", "Iskrip", "Skrip", "Hōtuhi"),
    ("teatro", "Teatro", "Theater", "Teatro", "Théâtre", "Theater", "Teatro", "Театр", "Teater", "Theater", "戏剧", "रंगमंच", "থিয়েটার", "演劇", "연극", "مسرح", "Maigizo", "Wasan kwaikwayo", "ቲያትር", "Teatro", "Teater", "Whare tapere"),
    ("actuacion", "Actuación", "Acting", "Atuação", "Jeu d'acteur", "Schauspiel", "Recitazione", "Актёрское мастерство", "Skådespeleri", "Acteren", "表演", "अभिनय", "অভিনয়", "演技", "연기", "تمثيل", "Uigizaji", "Kwaikwayo", "ትወና", "Pag-arte", "Lakonan", "Whakaari"),
    ("improvisacion", "Improvisación", "Improv", "Improviso", "Improvisation", "Improvisation", "Improvvisazione", "Импровизация", "Improvisation", "Improvisatie", "即兴", "आशुरचना", "তাৎক্ষণিক অভিনয়", "即興", "즉흥", "ارتجال", "Kubuni papo", "Ƙirƙira", "ድንገተኛ", "Improv", "Improv", "Mahuri noa"),
    ("stand_up", "Stand Up", "Stand-up", "Stand-up", "Stand-up", "Stand-up", "Stand-up", "Стендап", "Ståupp", "Stand-up", "单口喜剧", "स्टैंड-अप", "স্ট্যান্ড-আপ", "スタンドアップ", "스탠드업", "ستاند أب", "Stand up", "Stand up", "ስታንድ አፕ", "Stand-up", "Stand-up", "Whakataukataka"),
    ("magia", "Magia", "Magic", "Mágica", "Magie", "Magie", "Magia", "Магия", "Magi", "Goochelen", "魔术", "जादू", "জাদু", "マジック", "마술", "سحر", "Uchawi", "Sihiri", "ማጊያ", "Mahika", "Silap mata", "Mākutu"),
    ("origami", "Origami", "Origami", "Origami", "Origami", "Origami", "Origami", "Оригами", "Origami", "Origami", "折纸", "ओरिगेमी", "অরিগামি", "折り紙", "종이접기", "أوريغامي", "Origami", "Origami", "ኦሪጋሚ", "Origami", "Origami", "Origami"),
    ("scrapbooking", "Scrapbooking", "Scrapbooking", "Scrapbook", "Scrapbooking", "Scrapbooking", "Scrapbooking", "Скрапбукинг", "Scrapbooking", "Scrapbooken", "剪贴簿", "स्क्रैपबुकिंग", "স্ক্র্যাপবুকিং", "スクラップブッキング", "스크랩북", "سكرابوكينغ", "Scrapbooking", "Scrapbooking", "ስክራፕቡኪንግ", "Scrapbooking", "Scrapbooking", "Scrapbooking"),
    ("lettering", "Lettering", "Lettering", "Lettering", "Lettrage", "Lettering", "Lettering", "Леттеринг", "Textning", "Belettering", "手写字体", "लेटरिंग", "লেটারিং", "レタリング", "레터링", "خط اليد الفني", "Lettering", "Lettering", "ሌተሪንግ", "Lettering", "Lettering", "Tuhituhi whakapaipai"),
    ("caligrafia", "Caligrafía", "Calligraphy", "Caligrafia", "Calligraphie", "Kalligraphie", "Calligrafia", "Каллиграфия", "Kalligrafi", "Kalligrafie", "书法", "सुलेख", "ক্যালিগ্রাফি", "カリグラフィー", "캘리그래피", "خط", "Uandishi mzuri", "Kyakkyawan rubutu", "ካሊግራፊ", "Kaligrapiya", "Kaligrafi", "Tuhituhi ātaahua"),
    ("graffiti", "Graffiti", "Graffiti", "Grafite", "Graffiti", "Graffiti", "Graffiti", "Граффити", "Graffiti", "Graffiti", "涂鸦", "ग्राफिटी", "গ্রাফিতি", "グラフィティ", "그래피티", "غرافيتي", "Graffiti", "Graffiti", "ግራፊቲ", "Graffiti", "Grafiti", "Graffiti"),
    ("street_art", "Street Art", "Street Art", "Arte Urbana", "Street art", "Street Art", "Street art", "Стрит-арт", "Street art", "Straatkunst", "街头艺术", "स्ट्रीट आर्ट", "স্ট্রিট আর্ট", "ストリートアート", "스트리트 아트", "فن الشارع", "Sanaa za mtaani", "Zanen titi", "የመንገድ ሥነ ጥበብ", "Street art", "Seni jalanan", "Toi tiriti"),
    ("tatuajes", "Tatuajes", "Tattoos", "Tatuagens", "Tatouages", "Tattoos", "Tatuaggi", "Татуировки", "Tatueringar", "Tatoeages", "纹身", "टैटू", "ট্যাটু", "タトゥー", "타투", "وشوم", "Tatoo", "Jarre", "ንቅሳት", "Tattoo", "Tatu", "Moko"),
    ("moda", "Moda", "Fashion", "Moda", "Mode", "Mode", "Moda", "Мода", "Mode", "Mode", "时尚", "फैशन", "ফ্যাশন", "ファッション", "패션", "موضة", "Mitindo", "Salo", "ፋሽን", "Fashion", "Fesyen", "Āhua"),
    ("diseno_ropa", "Diseño Ropa", "Fashion Design", "Design de Roupas", "Stylisme", "Modedesign", "Fashion design", "Дизайн одежды", "Modedesign", "Modeontwerp", "服装设计", "फैशन डिज़ाइन", "পোশাক ডিজাইন", "ファッションデザイン", "의상 디자인", "تصميم أزياء", "Ubunifu wa nguo", "Zanen kaya", "የልብስ ዲዛይን", "Disenyo ng damit", "Rekaan fesyen", "Hoahoa kākahu"),
    ("costura", "Costura", "Sewing", "Costura", "Couture", "Nähen", "Cucito", "Шитьё", "Sömnad", "Naaien", "缝纫", "सिलाई", "সেলাই", "裁縫", "바느질", "خياطة", "Kushona", "Dinki", "ስፌት", "Panahi", "Jahitan", "Tuituinga"),
    ("tejido", "Tejido", "Knitting", "Tricô", "Tricot", "Stricken", "Maglia", "Вязание", "Stickning", "Breien", "编织", "बुनाई", "বোনা", "編み物", "뜨개질", "حياكة", "Kufuma", "Saƙa", "ሽምግልና", "Pagniniting", "Mengait", "Raranga"),
    ("crochet", "Crochet", "Crochet", "Crochê", "Crochet", "Häkeln", "Uncinetto", "Вязание крючком", "Virka", "Haken", "钩针", "क्रोशिया", "ক্রোশে", "かぎ針編み", "코바늘", "كروشيه", "Kushona kwa ndoano", "Crochet", "ክሮሼት", "Gantsilyo", "Kait", "Mataira"),
    ("bordado", "Bordado", "Embroidery", "Bordado", "Broderie", "Stickerei", "Ricamo", "Вышивка", "Broderi", "Borduren", "刺绣", "कढ़ाई", "সূচিকর্ম", "刺繍", "자수", "تطريز", "Udarizi", "Dinki mai ƙawata", "ጥልፍ", "Burda", "Sulaman", "Whakairoiro"),
    ("joyeria", "Joyería", "Jewelry", "Joalheria", "Bijouterie", "Schmuck", "Gioielleria", "Ювелирное дело", "Smycken", "Sieraden", "珠宝", "आभूषण", "গহনা", "ジュエリー", "주얼리", "مجوهرات", "Vito", "Kayan ado", "ጌጣጌጥ", "Alahas", "Barang kemas", "Whakapaipai"),
    ("carpinteria", "Carpintería", "Woodworking", "Carpintaria", "Menuiserie", "Schreinerei", "Falegnameria", "Столярное дело", "Snickeri", "Houtbewerking", "木工", "बढ़ईगीरी", "কাঠের কাজ", "木工", "목공", "نجارة", "Useremala", "Kafinta", "የእንጨይት ሥራ", "Karpinterya", "Pertukangan", "Taratara"),
    ("bricolaje", "Bricolaje", "DIY", "Faça Você Mesmo", "Bricolage", "Heimwerken", "Fai da te", "Сделай сам", "Hemmafix", "Doe-het-zelf", "手工", "DIY", "নিজে করো", "DIY", "DIY", "اصنع بنفسك", "Jifanyie mwenyewe", "Yi da kanka", "DIY", "DIY", "DIY", "Mahia ake"),
    ("restauracion", "Restauración", "Restoration", "Restauração", "Restauration", "Restaurierung", "Restauro", "Реставрация", "Restaurering", "Restauratie", "修复", "पुनर्स्थापना", "পুনরুদ্ধার", "修復", "복원", "ترميم", "Ukarabati", "Maidowa", "እድሳት", "Restorasyon", "Pemulihan", "Whakaora"),
    ("upcycling", "Upcycling", "Upcycling", "Upcycling", "Surcyclage", "Upcycling", "Upcycling", "Апсайклинг", "Upcycling", "Upcyclen", "升级再造", "अपसाइक्लिंग", "আপসাইক্লিং", "アップサイクル", "업사이클링", "إعادة تدوير إبداعية", "Upcycling", "Upcycling", "አፕሳይክሊንግ", "Upcycling", "Upcycling", "Upcycling"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 500
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
    print(f"seed creativity items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
