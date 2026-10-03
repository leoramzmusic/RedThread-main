"""
Seed the `profile_goals_section` system options catalog for UI texts in the
Relationship Goals section (title, subtitle, 8 options + descriptions, info modal).

Keys resolve as profile.fields.goals, profile.goals_subtitle,
profile.intentions_map.*, profile.intentions_desc.*, profile.goals_info.*.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_goals_section.py
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
        "value": "fields.goals",
        "order": 0,
        "translations": L(
            es="Objetivos de relación", en="Relationship goals",
            pt="Objetivos de relacionamento", fr="Objectifs relationnels",
            de="Beziehungsziele", it="Obiettivi di relazione",
            ru="Цели отношений", sv="Relationsmål",
            nl="Relatiedoelen", zh="关系目标",
            hi="संबंध लक्ष्य", bn="সম্পর্কের লক্ষ্য",
            ja="関係の目標", ko="관계 목표",
            ar="أهداف العلاقة", sw="Malengo ya uhusiano",
            ha="Manufofin dangantaka", am="የግንኙነት ዓላማዎች",
            tl="Mga layunin sa relasyon", ms="Matlamat hubungan",
            mi="Ngā whāinga hononga",
        ),
    },
    {
        "value": "goals_subtitle",
        "order": 1,
        "translations": L(
            es="Selecciona lo que buscas en este momento",
            en="Select what you are looking for right now",
            pt="Selecione o que você procura neste momento",
            fr="Sélectionnez ce que vous cherchez en ce moment",
            de="Wähle, was du gerade suchst",
            it="Seleziona cosa cerchi in questo momento",
            ru="Выберите, что вы ищете сейчас",
            sv="Välj vad du söker just nu",
            nl="Selecteer wat je nu zoekt",
            zh="选择你目前想找的",
            hi="अभी आप क्या खोज रहे हैं चुनें",
            bn="এই মুহূর্তে আপনি কী খুঁজছেন তা বেছে নিন",
            ja="今求めているものを選択",
            ko="지금 찾고 있는 것을 선택하세요",
            ar="اختر ما تبحث عنه الآن",
            sw="Chagua unachotafuta kwa sasa",
            ha="Zaɓi abin da kake nema a yanzu",
            am="አሁን የሚፈልጉትን ይምረጡ",
            tl="Piliin ang hinahanap mo ngayon",
            ms="Pilih perkara yang anda cari sekarang",
            mi="Tīpakohia tāu e rapu ana ināianei",
        ),
    },
    {
        "value": "intentions_map.serious_relationship",
        "order": 2,
        "translations": L(
            es="Relación seria", en="Serious relationship",
            pt="Relacionamento sério", fr="Relation sérieuse",
            de="Ernste Beziehung", it="Relazione seria",
            ru="Серьёзные отношения", sv="Seriös relation",
            nl="Serieuze relatie", zh="认真交往",
            hi="गंभीर संबंध", bn="গুরুতর সম্পর্ক",
            ja="真剣な交際", ko="진지한 관계",
            ar="علاقة جدية", sw="Uhusiano wa dhati",
            ha="Dangantaka mai tsanani", am="ከባድ ግንኙነት",
            tl="Seryosong relasyon", ms="Hubungan serius",
            mi="Hononga taumaha",
        ),
    },
    {
        "value": "intentions_desc.serious_relationship",
        "order": 3,
        "translations": L(
            es="Buscas un vínculo estable y emocional con compromiso.",
            en="You seek a stable emotional bond with commitment.",
            pt="Você busca um vínculo estável e emocional com compromisso.",
            fr="Vous cherchez un lien stable et émotionnel avec engagement.",
            de="Du suchst eine stabile emotionale Bindung mit Verbindlichkeit.",
            it="Cerchi un legame stabile ed emotivo con impegno.",
            ru="Вы ищете стабильную эмоциональную связь с обязательствами.",
            sv="Du söker ett stabilt känslomässigt band med engagemang.",
            nl="Je zoekt een stabiele emotionele band met toewijding.",
            zh="你想要稳定、有承诺的情感联结。",
            hi="आप प्रतिबद्धता के साथ स्थिर भावनात्मक बंधन चाहते हैं।",
            bn="আপনি প্রতিশ্রুতিসহ স্থিতিশীল মানসিক বন্ধন চান।",
            ja="真剣で安定した心のつながりを求めています。",
            ko="진지하고 안정적인 정서적 유대를 원합니다.",
            ar="تبحث عن رابط عاطفي مستقر مع التزام.",
            sw="Unatafuta uhusiano thabiti wa kihisia na kujitolea.",
            ha="Kana neman haɗi mai ƙarfi da zuciya tare da jajircewa.",
            am="ከቁርጠኝነት ጋር የተረጋጋ ስሜታዊ ትስስር ትፈልጋለህ።",
            tl="Naghahanap ka ng matatag na emosyonal na ugnayan na may dedikasyon.",
            ms="Anda mencari ikatan emosi yang stabil dengan komitmen.",
            mi="Kei te rapu koe i te here kare ā-roto pūmau me te ū.",
        ),
    },
    {
        "value": "intentions_map.open_relationship",
        "order": 4,
        "translations": L(
            es="Relación, pero no me cierro", en="Relationship but open",
            pt="Relacionamento, mas aberto", fr="Relation mais ouverte",
            de="Beziehung, aber offen", it="Relazione, ma aperto",
            ru="Отношения, но открыто", sv="Relation men öppen",
            nl="Relatie, maar open", zh="交往，但保持开放",
            hi="रिश्ता, पर खुला", bn="সম্পর্ক, তবে খোলা",
            ja="交際中だがオープン", ko="관계 중이지만 열려 있음",
            ar="علاقة لكن منفتحة", sw="Uhusiano lakini wazi",
            ha="Dangantaka, amma a buɗe", am="ግንኙነት ግን ክፍት",
            tl="Relasyon pero bukas", ms="Hubungan tetapi terbuka",
            mi="Hononga engari tuwhera",
        ),
    },
    {
        "value": "intentions_desc.open_relationship",
        "order": 5,
        "translations": L(
            es="Abierto/a a un vínculo serio, pero con flexibilidad para explorar.",
            en="Open to a serious bond, but with flexibility to explore.",
            pt="Aberto/a a um vínculo sério, mas com flexibilidade para explorar.",
            fr="Ouvert/e à un lien sérieux, mais avec flexibilité pour explorer.",
            de="Offen für eine ernsthafte Bindung, aber flexibel zum Erkunden.",
            it="Aperto/a a un legame serio, ma con flessibilità per esplorare.",
            ru="Открыты к серьёзной связи, но с гибкостью.",
            sv="Öppen för ett seriöst band, men flexibel.",
            nl="Open voor een serieuze band, maar flexibel.",
            zh="对认真的关系持开放态度，但保持探索的灵活性。",
            hi="गंभीर बंधन के लिए खुले, पर खोज की लचक के साथ।",
            bn="গুরুতর বন্ধনের জন্য উন্মুক্ত, তবে অন্বেষণের নমনীয়তা সহ।",
            ja="真剣な関係にオープンだが、柔軟性も大切に。",
            ko="진지한 관계에 열려 있지만 탐색의 유연성도 중시.",
            ar="منفتح على رابط جدي مع مرونة للاستكشاف.",
            sw="Wazi kwa uhusiano wa dhati lakini na unyumbufu.",
            ha="A buɗe ga haɗi mai tsanani, amma da sassauci.",
            am="ለከባድ ትስስር ክፍት ግን ለመዳሰስ ተለዋዋጭ።",
            tl="Bukas sa seryosong ugnayan ngunit may kakayahang mag-explore.",
            ms="Terbuka kepada ikatan serius tetapi fleksibel.",
            mi="Tuwhera ki te here taumaha engari ngāwari ki te tūhura.",
        ),
    },
    {
        "value": "intentions_map.casual_fun",
        "order": 6,
        "translations": L(
            es="Diversión, pero no me cierro", en="Fun but open",
            pt="Diversão, mas aberto", fr="Fun mais ouvert",
            de="Spaß, aber offen", it="Divertimento, ma aperto",
            ru="Веселье, но открыто", sv="Kul men öppen",
            nl="Plezier, maar open", zh="开心就好，但不封闭",
            hi="मज़ा, पर खुला", bn="মজা, তবে খোলা",
            ja="楽しみ重視だがオープン", ko="재미 위주지만 열려 있음",
            ar="مرح لكن منفتح", sw="Furaha lakini wazi",
            ha="Nishaɗi, amma a buɗe", am="መዝናኛ ግን ክፍት",
            tl="Saya pero bukas", ms="Seronok tetapi terbuka",
            mi="Ngahau engari tuwhera",
        ),
    },
    {
        "value": "intentions_desc.casual_fun",
        "order": 7,
        "translations": L(
            es="Buscas experiencias ligeras, aunque no descartas una conexión si fluye.",
            en="You seek light experiences, though open to connection.",
            pt="Você busca experiências leves, sem descartar conexão.",
            fr="Vous cherchez des expériences légères, ouvert/e à la connexion.",
            de="Du suchst lockere Erfahrungen, offen für mehr.",
            it="Cerchi esperienze leggere, aperto/a a una connessione.",
            ru="Вы ищете лёгкие впечатления, открыты к связи.",
            sv="Du söker lätta upplevelser, öppen för mer.",
            nl="Je zoekt lichte ervaringen, open voor connectie.",
            zh="想要轻松的体验，但也不排斥深入的连接。",
            hi="हल्के अनुभव चाहते हैं, पर जुड़ाव से परहेज नहीं।",
            bn="হালকা অভিজ্ঞতা চান, তবে সংযোগে আপত্তি নেই।",
            ja="気軽な体験を求めつつ、つながりにもオープン。",
            ko="가벼운 경험을 원하지만 연결에도 열려 있음.",
            ar="تبحث عن تجارب خفيفة مع الانفتاح على التواصل.",
            sw="Unatafuta mambo mepesi lakini wazi kwa uhusiano.",
            ha="Kana neman abubuwan sauƙi, amma a buɗe ga haɗi.",
            am="ቀላል ተሞክሮዎችን ትፈልጋለህ ግን ለግንኙነት ክፍት።",
            tl="Naghahanap ng magagaan na karanasan, bukas sa koneksyon.",
            ms="Anda mahukan pengalaman ringan, terbuka kepada hubungan.",
            mi="Kei te rapu i ngā wheako māmā, tuwhera ki te hononga.",
        ),
    },
    {
        "value": "intentions_map.short_term_fun",
        "order": 8,
        "translations": L(
            es="Relación abierta", en="Open relationship",
            pt="Relacionamento aberto", fr="Relation ouverte",
            de="Offene Beziehung", it="Relazione aperta",
            ru="Открытые отношения", sv="Öppen relation",
            nl="Open relatie", zh="开放式关系",
            hi="खुला रिश्ता", bn="খোলা সম্পর্ক",
            ja="オープンリレーションシップ", ko="오픈 릴레이션십",
            ar="علاقة مفتوحة", sw="Uhusiano wazi",
            ha="Dangantaka a buɗe", am="ክፍት ግንኙነት",
            tl="Open na relasyon", ms="Hubungan terbuka",
            mi="Hononga tuwhera",
        ),
    },
    {
        "value": "intentions_desc.short_term_fun",
        "order": 9,
        "translations": L(
            es="Abierto/a a vínculos no monógamos o relaciones poliamorosas.",
            en="Open to non-monogamous bonds or polyamorous relationships.",
            pt="Aberto/a a vínculos não monogâmicos ou poliamorosos.",
            fr="Ouvert/e aux liens non monogames ou polyamoureux.",
            de="Offen für nicht-monogame oder polyamore Beziehungen.",
            it="Aperto/a a legami non monogami o poliamorosi.",
            ru="Открыты к немоногамным или полиаморным отношениям.",
            sv="Öppen för ickemonogama eller polyamorösa relationer.",
            nl="Open voor niet-monogame of polyamoreuze relaties.",
            zh="接受非一夫一妻或多角关系。",
            hi="गैर-एकविवाही या बहुप्रेमी संबंधों के लिए खुले।",
            bn="অ-একগামী বা বহুপ্রেমী সম্পর্কে উন্মুক্ত।",
            ja="ノンモノガミーやポリアモリーにオープン。",
            ko="비일부일처제나 폴리아모리에 열려 있음.",
            ar="منفتح على علاقات غير أحادية أو متعددة.",
            sw="Wazi kwa mahusiano yasiyo ya mke mmoja.",
            ha="A buɗe ga alaƙa marasa aure ɗaya ko na soyayya da yawa.",
            am="ለሞኖጋሚ ላልሆኑ ወይም ለፖሊአመር ግንኙነቶች ክፍት።",
            tl="Bukas sa non-monogamous o polyamorous na relasyon.",
            ms="Terbuka kepada hubungan bukan monogami atau poliamori.",
            mi="Tuwhera ki ngā hononga ehara i te takitahi, polyamory rānei.",
        ),
    },
    {
        "value": "intentions_map.friendship",
        "order": 10,
        "translations": L(
            es="Hacer amigos", en="Making friends",
            pt="Fazer amigos", fr="Se faire des amis",
            de="Freunde finden", it="Fare amicizia",
            ru="Завести друзей", sv="Få vänner",
            nl="Vrienden maken", zh="交朋友",
            hi="दोस्त बनाना", bn="বন্ধু বানানো",
            ja="友達作り", ko="친구 사귀기",
            ar="تكوين صداقات", sw="Kupata marafiki",
            ha="Samar da abokai", am="ጓደኞች ማፍራት",
            tl="Pakikipagkaibigan", ms="Berkawan",
            mi="Whakahoa",
        ),
    },
    {
        "value": "intentions_desc.friendship",
        "order": 11,
        "translations": L(
            es="Buscas conectar con gente nueva sin expectativas románticas.",
            en="You seek to connect with new people with no romantic expectations.",
            pt="Você busca conectar com gente nova sem expectativas românticas.",
            fr="Vous cherchez à rencontrer de nouvelles personnes sans attentes romantiques.",
            de="Du willst neue Leute kennenlernen, ohne romantische Erwartungen.",
            it="Vuoi conoscere persone nuove senza aspettative romantiche.",
            ru="Вы хотите знакомиться с новыми людьми без романтических ожиданий.",
            sv="Du vill träffa nya människor utan romantiska förväntningar.",
            nl="Je wilt nieuwe mensen ontmoeten zonder romantische verwachtingen.",
            zh="想认识新朋友，没有浪漫期待。",
            hi="बिना रोमांटिक उम्मीदों के नए लोगों से जुड़ना चाहते हैं।",
            bn="রোমান্টিক প্রত্যাশা ছাড়াই নতুন মানুষের সাথে যুক্ত হতে চান।",
            ja="恋愛抜きで新しい人とつながりたい。",
            ko="로맨틱한 기대 없이 새로운 사람들과 만나고 싶음.",
            ar="تريد التواصل مع أشخاص جدد دون توقعات رومانسية.",
            sw="Unataka kuungana na watu wapya bila matarajio ya kimapenzi.",
            ha="Kana son haɗuwa da sabbin mutane ba tare da tsammanin soyayya ba.",
            am="ያለ ፍቅር ጥ expectations ከአዳዲስ ሰዎች ጋር መገናኘት ትፈልጋለህ።",
            tl="Nais makipag-ugnayan sa mga bagong tao nang walang romantikong inaasahan.",
            ms="Anda mahu berhubung dengan orang baharu tanpa jangkaan romantik.",
            mi="Kei te hiahia koe ki te tūtaki i ngā tāngata hou, kāore he tumanako ā-romance.",
        ),
    },
    {
        "value": "intentions_map.hobbies",
        "order": 12,
        "translations": L(
            es="Compartir gustos", en="Sharing hobbies",
            pt="Compartilhar gostos", fr="Partager des passions",
            de="Hobbys teilen", it="Condividere hobby",
            ru="Общие увлечения", sv="Dela intressen",
            nl="Hobby's delen", zh="分享爱好",
            hi="शौक साझा करना", bn="শখ ভাগ করা",
            ja="趣味を共有", ko="취미 공유",
            ar="مشاركة الهوايات", sw="Kushiriki mambo unayopenda",
            ha="Raba abubuwan sha'awa", am="취미 ማጋራት",
            tl="Pagbabahagi ng hilig", ms="Berkongsi hobi",
            mi="Tiri ngā pārekareka",
        ),
    },
    {
        "value": "intentions_desc.hobbies",
        "order": 13,
        "translations": L(
            es="Buscas afinidad en cultura, música o pasatiempos específicos.",
            en="You seek affinity in culture, music or specific hobbies.",
            pt="Você busca afinidade em cultura, música ou hobbies específicos.",
            fr="Vous cherchez des affinités culturelles, musicales ou de loisirs.",
            de="Du suchst Gleichgesinnte in Kultur, Musik oder Hobbys.",
            it="Cerchi affinità in cultura, musica o hobby specifici.",
            ru="Вы ищете общность в культуре, музыке или хобби.",
            sv="Du söker samhörighet i kultur, musik eller hobbys.",
            nl="Je zoekt gelijkgestemden in cultuur, muziek of hobby's.",
            zh="想在文化、音乐或特定爱好上找到共鸣。",
            hi="संस्कृति, संगीत या खास शौक में समानता चाहते हैं।",
            bn="সংস্কৃতি, সঙ্গীত বা নির্দিষ্ট শখে মিল চান।",
            ja="文化や音楽、趣味の相性を求めています。",
            ko="문화, 음악, 특정 취향의 공감을 원합니다.",
            ar="تبحث عن توافق في الثقافة أو الموسيقى أو الهوايات.",
            sw="Unatafuta upatanifu wa kitamaduni, muziki au burudani.",
            ha="Kana neman daidaito a al'ada, kiɗa ko abubuwan sha'awa.",
            am="በባህል፣ በሙዚቃ ወይም በትርጉም 취미 ውስጥ ተመሳሳይነት ትፈልጋለህ።",
            tl="Naghahanap ng pagkakatugma sa kultura, musika o libangan.",
            ms="Anda mencari keserasian dalam budaya, muzik atau hobi.",
            mi="Kei te rapu i te riterite ā-ahurea, ā-puoro, ā-pārekareka.",
        ),
    },
    {
        "value": "intentions_map.travel",
        "order": 14,
        "translations": L(
            es="Viajar/Eventos", en="Travel/Events",
            pt="Viajar/Eventos", fr="Voyages/Événements",
            de="Reisen/Events", it="Viaggi/Eventi",
            ru="Путешествия/События", sv="Resor/Evenemang",
            nl="Reizen/Evenementen", zh="旅行/活动",
            hi="यात्रा/कार्यक्रम", bn="ভ্রমণ/ইভেন্ট",
            ja="旅行／イベント", ko="여행/이벤트",
            ar="سفر/فعاليات", sw="Safari/Matukio",
            ha="Tafiya/Bukukuwa", am="ጉዞ/ዝግጅቶች",
            tl="Paglalakbay/Kaganapan", ms="Jalan/Acara",
            mi="Haere/Kaupapa",
        ),
    },
    {
        "value": "intentions_desc.travel",
        "order": 15,
        "translations": L(
            es="Buscas compañía para experiencias, viajes o eventos puntuales.",
            en="You seek company for experiences, trips or one-off events.",
            pt="Você busca companhia para experiências, viagens ou eventos.",
            fr="Vous cherchez de la compagnie pour expériences, voyages ou événements.",
            de="Du suchst Gesellschaft für Erlebnisse, Reisen oder Events.",
            it="Cerchi compagnia per esperienze, viaggi o eventi.",
            ru="Вы ищете компанию для впечатлений, поездок или событий.",
            sv="Du söker sällskap för upplevelser, resor eller evenemang.",
            nl="Je zoekt gezelschap voor ervaringen, reizen of evenementen.",
            zh="想找人一起体验、旅行或参加活动。",
            hi="अनुभवों, यात्राओं या आयोजनों के लिए साथ चाहते हैं।",
            bn="অভিজ্ঞতা, ভ্রমণ বা অনুষ্ঠানের জন্য সঙ্গী চান।",
            ja="体験や旅行、イベントの同伴者を求めています。",
            ko="체험, 여행, 이벤트를 함께할 동반자를 원합니다.",
            ar="تبحث عن رفقة للتجارب والسفر والفعاليات.",
            sw="Unatafuta kampani ya matukio, safari au hafla.",
            ha="Kana neman abokin tafiya don abubuwan da suka faru.",
            am="ለተሞክሮዎች፣ ለጉዞዎች ወይም ለዝግጅቶች ጓደኝነት ትፈልጋለህ።",
            tl="Naghahanap ng kasama sa karanasan, biyahe o kaganapan.",
            ms="Anda mencari teman untuk pengalaman, perjalanan atau acara.",
            mi="Kei te rapu hoa mō ngā wheako, ngā haerenga, ngā kaupapa.",
        ),
    },
    {
        "value": "intentions_map.undecided",
        "order": 16,
        "translations": L(
            es="Lo sigo pensando", en="Still thinking",
            pt="Ainda pensando", fr="Encore en réflexion",
            de="Denke noch nach", it="Ci sto ancora pensando",
            ru="Ещё думаю", sv="Funderar fortfarande",
            nl="Denk er nog over", zh="还在考虑",
            hi="अभी सोच रहा/रही हूँ", bn="এখনও ভাবছি",
            ja="まだ考え中", ko="아직 고민 중",
            ar="ما زلت أفكر", sw="Bado nafikiria",
            ha="Ina nan ina tunani", am="አሁንም እያሰብኩ ነው",
            tl="Pinag-iisipan pa", ms="Masih berfikir",
            mi="Kei te whakaaro tonu",
        ),
    },
    {
        "value": "intentions_desc.undecided",
        "order": 17,
        "translations": L(
            es="En modo exploratorio. No quieres definirte aún y prefieres fluir.",
            en="In exploratory mode. You don't want labels yet, prefer to flow.",
            pt="Em modo exploratório. Sem rótulos por enquanto, prefere fluir.",
            fr="En mode exploration. Pas d'étiquettes pour l'instant, préférez le flow.",
            de="Im Entdeckermodus. Keine Labels, lieber treiben lassen.",
            it="In modalità esplorativa. Niente etichette, meglio fluire.",
            ru="В режиме исследования. Без ярлыков, предпочитаете плыть по течению.",
            sv="I utforskande läge. Inga etiketter, föredrar att flyta med.",
            nl="In verkenningsmodus. Geen labels, liever flowen.",
            zh="探索模式。不想被定义，顺其自然。",
            hi="खोज मोड में। अभी कोई परिभाषा नहीं, बहना पसंद है।",
            bn="অন্বেষণ মোডে। এখনও সংজ্ঞায়িত হতে চান না, প্রবাহ পছন্দ করেন।",
            ja="探索モード。まだ決めたくなく、流れに任せたい。",
            ko="탐색 모드. 아직 정의하고 싶지 않고 흐름에 맡기고 싶음.",
            ar="في وضع الاستكشاف. لا تريد تعريفًا بعد وتفضل الانسيابية.",
            sw="Katika hali ya uchunguzi. Hutaki lebo bado, unapendelea kutiririka.",
            ha="A yanayin bincike. Ba ka son a ayyana ka tukuna, ka fi son tafiya da kwarara.",
            am="በአሰሳ ሁነታ። ገና መግለጽ አልፈልግም እና መ flowing ትመርጣለህ።",
            tl="Nasa exploratory mode. Ayaw pang magpakahulugan, mas gustong dumaloy.",
            ms="Dalam mod penerokaan. Belum mahu ditakrifkan, lebih suka mengalir.",
            mi="Kei te aratau tūhura. Kāore anō e hiahia whakamārama, he pai ake te rere.",
        ),
    },
    {
        "value": "goals_info.title",
        "order": 18,
        "translations": L(
            es="Las emociones cambian", en="Emotions change",
            pt="As emoções mudam", fr="Les émotions changent",
            de="Gefühle ändern sich", it="Le emozioni cambiano",
            ru="Эмоции меняются", sv="Känslor förändras",
            nl="Emoties veranderen", zh="情绪会变",
            hi="भावनाएँ बदलती हैं", bn="আবেগ বদলায়",
            ja="感情は変わるもの", ko="감정은 변합니다",
            ar="المشاعر تتغير", sw="Hisia hubadilika",
            ha="Motsin rai yana canzawa", am="ስሜቶች ይለወጣሉ",
            tl="Nagbabago ang damdamin", ms="Emosi berubah",
            mi="Ka huri ngā kare ā-roto",
        ),
    },
    {
        "value": "goals_info.body",
        "order": 19,
        "translations": L(
            es="Te preguntaremos de vez en cuando en caso de que tu opinión haya cambiado. O si prefieres, actualiza tus objetivos en tu perfil.",
            en="We will ask from time to time in case your mind changed. Or update your goals in your profile.",
            pt="Perguntaremos de vez em quando caso sua opinião tenha mudado. Ou atualize seus objetivos no perfil.",
            fr="Nous demanderons de temps en temps si votre avis a changé. Ou mettez à jour vos objectifs dans votre profil.",
            de="Wir fragen ab und zu nach, falls sich deine Meinung geändert hat. Oder aktualisiere deine Ziele im Profil.",
            it="Chiederemo di tanto in tanto se la tua opinione è cambiata. Oppure aggiorna i tuoi obiettivi nel profilo.",
            ru="Мы будем спрашивать время от времени, вдруг ваше мнение изменилось. Или обновите цели в профиле.",
            sv="Vi frågar då och då om din åsikt ändrats. Eller uppdatera dina mål i profilen.",
            nl="We vragen af en toe of je mening is veranderd. Of werk je doelen bij in je profiel.",
            zh="我们会时不时询问，以防你的想法变了。或者直接在个人资料里更新目标。",
            hi="हम समय-समय पर पूछेंगे कि कहीं आपका मन तो नहीं बदला। या प्रोफ़ाइल में लक्ष्य अपडेट करें।",
            bn="আপনার মত বদলেছে কিনা মাঝে মাঝে জিজ্ঞেস করব। অথবা প্রোফাইলে লক্ষ্য আপডেট করুন।",
            ja="気が変わっていないか時々お尋ねします。またはプロフィールで目標を更新してください。",
            ko="마음이 바뀌었는지 가끔 물어볼게요. 또는 프로필에서 목표를 업데이트하세요.",
            ar="سنسال من وقت لآخر إن تغير رأيك. أو حدّث أهدافك في ملفك.",
            sw="Tutakuuliza mara kwa mara endapo mawazo yako yamebadilika. Au sasisha malengo kwenye wasifu.",
            ha="Za mu tambaya lokaci-lokaci idan ra'ayinka ya canza. Ko sabunta manufofinka a bayanin martabarka.",
            am="አመለካከትህ ከተቀየረ ከጊዜ ወደ ጊዜ እንጠይቃለን። ወይም ዓላማዎችህን በመገለጫህ ላይ አዘምን።",
            tl="Magtatanong kami paminsan-minsan kung nagbago ang isip mo. O i-update ang mga layunin sa profile.",
            ms="Kami akan bertanya dari semasa ke semasa sekiranya fikiran anda berubah. Atau kemas kini matlamat di profil.",
            mi="Ka pātai mātou i ia wā mēnā kua huri tō whakaaro. Rānei whakahoutia ō whāinga ki tō kōtaha.",
        ),
    },
    {
        "value": "goals_info.button",
        "order": 20,
        "translations": L(
            es="Entendido", en="Got it",
            pt="Entendido", fr="Compris",
            de="Verstanden", it="Capito",
            ru="Понял", sv="Fattat",
            nl="Begrepen", zh="明白了",
            hi="समझ गया", bn="বুঝেছি",
            ja="了解", ko="알겠어요",
            ar="فهمت", sw="Nimeelewa",
            ha="Na gane", am="ገብቶኛል",
            tl="Naintindihan", ms="Faham",
            mi="Kua mārama",
        ),
    },
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]

_VALUES = [item["value"] for item in TEXTS]
assert len(_VALUES) == len(set(_VALUES)), "duplicate seed values"
assert len(TEXTS) == 21, f"expected 21 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_goals_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_goals_section",
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
        f"seed_profile_goals_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
