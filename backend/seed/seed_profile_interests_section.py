"""
Seed the `profile_interests_section` system options catalog for UI texts in the
Interests section (title, header, search, categories).

Category names resolve via profileSections.interests.categories.{key}.name.
Items resolve via profileSections.interests.items.{slug} (seeded separately).

The texts read from GET /options/section/profile_interests_section.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_section.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh",
    "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi",
]


def L(**kw) -> dict:
    """Language-specific text. Raises if any supported language is missing."""
    missing = [lang for lang in LANGS if lang not in kw]
    if missing:
        raise ValueError(f"missing languages: {missing}")
    unknown = [key for key in kw if key not in LANGS]
    if unknown:
        raise ValueError(f"unknown languages: {unknown}")
    return kw


TEXTS = [
    {
        "value": "title",
        "order": 0,
        "translations": L(
            es="Intereses", en="Interests",
            pt="Interesses", fr="Centres d'intérêt",
            de="Interessen", it="Interessi",
            ru="Интересы", sv="Intressen",
            nl="Interesses", zh="兴趣",
            hi="रुचियाँ", bn="আগ্রহ",
            ja="興味", ko="관심사",
            ar="الاهتمامات", sw="Mambo yanayovutia",
            ha="Abubuwan sha'awa", am="ፍላጎቶች",
            tl="Mga interes", ms="Minat",
            mi="Ngā kaingākau",
        ),
    },
    {
        "value": "header",
        "order": 1,
        "translations": L(
            es="Intereses ({{count}} seleccionados)",
            en="Interests ({{count}} selected)",
            pt="Interesses ({{count}} selecionados)",
            fr="Centres d'intérêt ({{count}} sélectionnés)",
            de="Interessen ({{count}} ausgewählt)",
            it="Interessi ({{count}} selezionati)",
            ru="Интересы (выбрано: {{count}})",
            sv="Intressen ({{count}} valda)",
            nl="Interesses ({{count}} geselecteerd)",
            zh="兴趣（已选 {{count}} 项）",
            hi="रुचियाँ ({{count}} चयनित)",
            bn="আগ্রহ ({{count}}টি নির্বাচিত)",
            ja="興味（{{count}}件選択中）",
            ko="관심사 ({{count}}개 선택됨)",
            ar="الاهتمامات ({{count}} محددة)",
            sw="Mambo yanayovutia ({{count}} yamechaguliwa)",
            ha="Abubuwan sha'awa ({{count}} aka zaɓa)",
            am="ፍላጎቶች ({{count}} ተመርጠዋል)",
            tl="Mga interes ({{count}} napili)",
            ms="Minat ({{count}} dipilih)",
            mi="Ngā kaingākau ({{count}} kua tīpakohia)",
        ),
    },
    {
        "value": "searchPlaceholder",
        "order": 2,
        "translations": L(
            es="Buscar intereses...", en="Search interests...",
            pt="Buscar interesses...", fr="Rechercher des centres d'intérêt...",
            de="Interessen suchen...", it="Cerca interessi...",
            ru="Найти интересы...", sv="Sök intressen...",
            nl="Zoek interesses...", zh="搜索兴趣…",
            hi="रुचियाँ खोजें...", bn="আগ্রহ খুঁজুন...",
            ja="興味を検索…", ko="관심사 검색…",
            ar="بحث عن اهتمامات...", sw="Tafuta mambo yanayovutia...",
            ha="Nemi abubuwan sha'awa...", am="ፍላጎቶች ፈልግ…",
            tl="Maghanap ng interes...", ms="Cari minat...",
            mi="Rapua ngā kaingākau…",
        ),
    },
    {
        "value": "noResults",
        "order": 3,
        "translations": L(
            es="No se encontraron intereses.",
            en="No interests found.",
            pt="Nenhum interesse encontrado.",
            fr="Aucun centre d'intérêt trouvé.",
            de="Keine Interessen gefunden.",
            it="Nessun interesse trovato.",
            ru="Интересы не найдены.",
            sv="Inga intressen hittades.",
            nl="Geen interesses gevonden.",
            zh="未找到兴趣。",
            hi="कोई रुचि नहीं मिली।",
            bn="কোনো আগ্রহ পাওয়া যায়নি।",
            ja="興味が見つかりません。",
            ko="관심사를 찾을 수 없습니다.",
            ar="لم يتم العثور على اهتمامات.",
            sw="Hakuna mambo yanayovutia yaliyopatikana.",
            ha="Ba a sami abubuwan sha'awa ba.",
            am="ፍላጎቶች አልተገኙም።",
            tl="Walang nahanap na interes.",
            ms="Tiada minat ditemui.",
            mi="Kāore he kaingākau i kitea.",
        ),
    },
    {
        "value": "noneSelected",
        "order": 4,
        "translations": L(
            es="No hay intereses seleccionados",
            en="No interests selected",
            pt="Nenhum interesse selecionado",
            fr="Aucun centre d'intérêt sélectionné",
            de="Keine Interessen ausgewählt",
            it="Nessun interesse selezionato",
            ru="Интересы не выбраны",
            sv="Inga intressen valda",
            nl="Geen interesses geselecteerd",
            zh="未选择兴趣",
            hi="कोई रुचि चयनित नहीं",
            bn="কোনো আগ্রহ নির্বাচিত নয়",
            ja="興味が選択されていません",
            ko="선택된 관심사가 없습니다",
            ar="لا توجد اهتمامات محددة",
            sw="Hakuna mambo yanayovutia yaliyochaguliwa",
            ha="Babu abubuwan sha'awa da aka zaɓa",
            am="ምንም ፍላጎቶች አልተመረጡም",
            tl="Walang napiling interes",
            ms="Tiada minat dipilih",
            mi="Kāore he kaingākau kua tīpakohia",
        ),
    },
    {
        "value": "categories.outdoor_adventure.name",
        "order": 10,
        "translations": L(
            es="Aire libre y aventura", en="Outdoor & adventure",
            pt="Ar livre e aventura", fr="Plein air et aventure",
            de="Outdoor & Abenteuer", it="Aria aperta e avventura",
            ru="Активный отдых", sv="Friluftsliv & äventyr",
            nl="Buiten & avontuur", zh="户外与冒险",
            hi="आउटडोर और रोमांच", bn="আউটডোর ও অ্যাডভেঞ্চার",
            ja="アウトドア＆冒険", ko="아웃도어 & 모험",
            ar="الهواء الطلق والمغامرة", sw="Nje na adaventura",
            ha="Waje da kasada", am="ከቤት ውጪ እና ጀብዱ",
            tl="Outdoor at adventure", ms="Luar & pengembaraan",
            mi="Nga mahi o waho me ngā mōrearea",
        ),
    },
    {
        "value": "categories.wellness_lifestyle.name",
        "order": 11,
        "translations": L(
            es="Bienestar y estilo de vida", en="Wellness & lifestyle",
            pt="Bem-estar e estilo de vida", fr="Bien-être et style de vie",
            de="Wellness & Lifestyle", it="Benessere e stile di vita",
            ru="Здоровье и образ жизни", sv="Välmående & livsstil",
            nl="Wellness & levensstijl", zh="健康与生活方式",
            hi="वेलनेस और जीवनशैली", bn="সুস্থতা ও জীবনধারা",
            ja="ウェルネス＆ライフスタイル", ko="웰니스 & 라이프스타일",
            ar="العافية ونمط الحياة", sw="Ustawi na mtindo wa maisha",
            ha="Lafiya da salon rayuwa", am="ደህንነት እና የአኗኗር ዘይቤ",
            tl="Wellness at lifestyle", ms="Kesejahteraan & gaya hidup",
            mi="Hauora me te āhua noho",
        ),
    },
    {
        "value": "categories.food_drink.name",
        "order": 12,
        "translations": L(
            es="Comer y Beber", en="Food & drink",
            pt="Comer e Beber", fr="Manger et boire",
            de="Essen & Trinken", it="Mangiare e bere",
            ru="Еда и напитки", sv="Mat & dryck",
            nl="Eten & drinken", zh="美食美酒",
            hi="खाना और पेय", bn="খাওয়া ও পানীয়",
            ja="グルメ＆ドリンク", ko="음식 & 음료",
            ar="الطعام والشراب", sw="Chakula na vinywaji",
            ha="Abinci da abin sha", am="ምግብ እና መጠጥ",
            tl="Pagkain at inumin", ms="Makanan & minuman",
            mi="Kai me te inu",
        ),
    },
    {
        "value": "categories.fan_communities.name",
        "order": 13,
        "translations": L(
            es="Comunidades de fans", en="Fan communities",
            pt="Comunidades de fãs", fr="Communautés de fans",
            de="Fan-Communitys", it="Community di fan",
            ru="Фан-сообщества", sv="Fangemenskaper",
            nl="Fangemeenschappen", zh="粉丝社群",
            hi="फैन समुदाय", bn="ভক্ত সম্প্রদায়",
            ja="ファンコミュニティ", ko="팬 커뮤니티",
            ar="مجتمعات المعجبين", sw="Jumuiya za mashabiki",
            ha="Ƙungiyoyin masoya", am="የአድናቂዎች ማህበረሰቦች",
            tl="Mga komunidad ng fan", ms="Komuniti peminat",
            mi="Ngā hapori pā",
        ),
    },
    {
        "value": "categories.creativity.name",
        "order": 14,
        "translations": L(
            es="Creatividad", en="Creativity",
            pt="Criatividade", fr="Créativité",
            de="Kreativität", it="Creatività",
            ru="Творчество", sv="Kreativitet",
            nl="Creativiteit", zh="创意",
            hi="रचनात्मकता", bn="সৃজনশীলতা",
            ja="クリエイティビティ", ko="창의성",
            ar="الإبداع", sw="Ubunifu",
            ha="Ƙirƙira", am="ፈጠራ",
            tl="Pagkamalikhain", ms="Kreativiti",
            mi="Auahatanga",
        ),
    },
    {
        "value": "categories.sports_fitness.name",
        "order": 15,
        "translations": L(
            es="Deportes y fitness", en="Sports & fitness",
            pt="Esportes e fitness", fr="Sports et fitness",
            de="Sport & Fitness", it="Sport e fitness",
            ru="Спорт и фитнес", sv="Sport & träning",
            nl="Sport & fitness", zh="运动健身",
            hi="खेल और फिटनेस", bn="খেলা ও ফিটনেস",
            ja="スポーツ＆フィットネス", ko="스포츠 & 피트니스",
            ar="الرياضة واللياقة", sw="Michezo na mazoezi",
            ha="Wasanni da motsa jiki", am="ስፖርት እና የአካል ብቃት",
            tl="Sports at fitness", ms="Sukan & kecergasan",
            mi="Hākinakina me te whakapakari tinana",
        ),
    },
    {
        "value": "categories.music.name",
        "order": 16,
        "translations": L(
            es="Música",
            en="Music",
            pt="Música",
            fr="Musique",
            de="Musik",
            it="Musica",
            ru="Музыка",
            sv="Musik",
            nl="Muziek",
            zh="音乐",
            hi="संगीत",
            bn="সঙ্গীত",
            ja="音楽",
            ko="음악",
            ar="موسيقى",
            sw="Muziki",
            ha="Kiɗa",
            am="ሙዚቃ",
            tl="Musika",
            ms="Muzik",
            mi="Puoro"
        ),
    },
    {
        "value": "categories.staying_in.name",
        "order": 17,
        "translations": L(
            es="Planes en casa",
            en="Staying in",
            pt="Ficar em casa",
            fr="Rester à la maison",
            de="Zuhause bleiben",
            it="Restare a casa",
            ru="Оставаться дома",
            sv="Stanna hemma",
            nl="Thuisblijven",
            zh="在家休息",
            hi="घर पर रहना",
            bn="বাড়িতে থাকা",
            ja="家で過ごす",
            ko="집에서 보내기",
            ar="البقاء في المنزل",
            sw="Kukaa nyumbani",
            ha="Zama a gida",
            am="በቤት መቆየት",
            tl="Pagstay sa bahay",
            ms="Duduk di rumah",
            mi="Noho ki te kāinga"
        ),
    },
    {
        "value": "categories.social_media_content.name",
        "order": 18,
        "translations": L(
            es="Redes sociales",
            en="Social media",
            pt="Redes sociais",
            fr="Médias sociaux",
            de="Soziale Medien",
            it="Social media",
            ru="Социальные сети",
            sv="Sociala medier",
            nl="Sociale media",
            zh="社交媒体",
            hi="सोशल मीडिया",
            bn="সামাজিক মাধ্যম",
            ja="ソーシャルメディア",
            ko="소셜 미디어",
            ar="وسائل التواصل الاجتماعي",
            sw="Mitandao ya kijamii",
            ha="Soshiyal midiya",
            am="ማህበራዊ ሚዲያ",
            tl="Social media",
            ms="Media sosial",
            mi="Pāpāho pāpori"
        ),
    },
    {
        "value": "categories.going_out.name",
        "order": 19,
        "translations": L(
            es="Salir",
            en="Going out",
            pt="Sair",
            fr="Sortir",
            de="Ausgehen",
            it="Uscire",
            ru="Выходить",
            sv="Gå ut",
            nl="Uitgaan",
            zh="外出",
            hi="बाहर जाना",
            bn="বাইরে যাওয়া",
            ja="外出",
            ko="외출",
            ar="الخروج",
            sw="Kutoka nje",
            ha="Fita",
            am="መውጣት",
            tl="Lumabas",
            ms="Keluar",
            mi="Haere ki waho"
        ),
    },
    {
        "value": "categories.tv_movies.name",
        "order": 20,
        "translations": L(
            es="Televisión y cine",
            en="TV & movies",
            pt="TV e filmes",
            fr="Télévision et cinéma",
            de="Fernsehen & Filme",
            it="TV e film",
            ru="ТВ и фильмы",
            sv="TV och filmer",
            nl="TV en films",
            zh="电视和电影",
            hi="टीवी और फिल्में",
            bn="টিভি ও সিনেমা",
            ja="テレビと映画",
            ko="TV와 영화",
            ar="التلفاز والأفلام",
            sw="Mfululizo na filamu",
            ha="Jerin shirye-shirye da fina-finai",
            am="ተከታታይ ፊልሞች እና ሲኒማ",
            tl="Serye at pelikula",
            ms="Siri & filem",
            mi="Whakaari me ngā kiriata"
        ),
    },
    {
        "value": "categories.values_causes.name",
        "order": 21,
        "translations": L(
            es="Valores y causas",
            en="Values & causes",
            pt="Valores e causas",
            fr="Valeurs et causes",
            de="Werte & Anliegen",
            it="Valori e cause",
            ru="Ценности и дела",
            sv="Värderingar och orsaker",
            nl="Waarden en doelen",
            zh="价值观与事业",
            hi="मूल्य और कारण",
            bn="মূল্যবোধ ও কারণ",
            ja="価値観と活動",
            ko="가치와 원인",
            ar="القيم والقضايا",
            sw="Maadili na sababu",
            ha="Dabi'u da manufofi",
            am="እሴቶች እና ዓላማዎች",
            tl="Mga pagpapahalaga at adhikain",
            ms="Nilai & perjuangan",
            mi="Ngā uara me ngā kaupapa"
        ),
    },
    {
        "value": "categories.videogames.name",
        "order": 22,
        "translations": L(
            es="Videojuegos",
            en="Video games",
            pt="Videojogos",
            fr="Jeux vidéo",
            de="Videospiele",
            it="Videogiochi",
            ru="Видеоигры",
            sv="Videospel",
            nl="Videospellen",
            zh="电子游戏",
            hi="वीडियो गेम",
            bn="ভিডিও গেম",
            ja="ビデオゲーム",
            ko="비디오 게임",
            ar="ألعاب الفيديو",
            sw="Michezo ya video",
            ha="Wasannin bidiyo",
            am="የቪዲዮ ጨዋታዎች",
            tl="Mga video game",
            ms="Permainan video",
            mi="Ngā kēmu ataata"
        ),
    },
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]

_VALUES = [item["value"] for item in TEXTS]
assert len(_VALUES) == len(set(_VALUES)), "duplicate seed values"
assert len(TEXTS) == 18, f"expected 18 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_interests_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_interests_section",
            "value": value,
            "label": translations["es"],
            "order": order,
            "is_active": True,
        }
        for lang in LANGS:
            doc_data[f"label_{lang}"] = translations.get(lang, "")

        if existing:
            for key, val in doc_data.items():
                setattr(existing, key, val)
            await existing.save()
            updated += 1
        else:
            await SystemOption(**doc_data).insert()
            created += 1

    print(
        f"seed_profile_interests_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
