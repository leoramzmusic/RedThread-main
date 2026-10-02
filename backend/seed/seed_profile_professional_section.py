"""
Seed the `profile_professional_section` system options catalog for UI texts in the
"Profesional y Académico" section.

The texts in ProfessionalAcademicSection read from
GET /options/section/profile_professional_section.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_professional_section.py
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
            es="Profesional y Académico", en="Professional & Academic",
            pt="Profissional e Acadêmico", fr="Professionnel et Académique",
            de="Beruflich & Akademisch", it="Professionale e Accademico",
            ru="Профессиональная и академическая", sv="Yrkesmässig och Akademisk",
            nl="Professioneel & Academisch", zh="职业与学术",
            hi="व्यावसायिक और शैक्षणिक", bn="পেশাদার ও একাডেমিক",
            ja="職業・学術", ko="직업 및 학력", ar="مهني وأكاديمي",
            sw="Kitaal na kitaalifu", ha="Kari da Ilimi",
            am="ሙያና ትምቅ", tl="Propesyonal at Akademiko",
            ms="Profesional dan Akademik", mi="Ngaio me te Mātauranga",
        ),
    },
    {
        "value": "intro",
        "order": 1,
        "translations": L(
            es="Tu historia profesional y académica es parte de tu camino. No define tu valor, pero puede conectar con quienes comparten experiencias similares.",
            en="Your professional and academic story is part of your journey. It doesn't define your worth, but it can connect you with people who share similar experiences.",
            pt="Sua história profissional e acadêmica faz parte da sua jornada. Não define o seu valor, mas pode conectar você com pessoas que têm experiências semelhantes.",
            fr="Votre parcours professionnel et académique fait partie de votre chemin. Il ne définit pas votre valeur, mais il peut vous rapprocher de ceux qui partagent des expériences similaires.",
            de="Deine berufliche und akademische Geschichte ist Teil deines Weges. Sie definiert nicht deinen Wert, aber sie kann dich mit Menschen verbinden, die ähnliche Erfahrungen gemacht haben.",
            it="La tua storia professionale e accademica fa parte del tuo percorso. Non definisce il tuo valore, ma può metterti in contatto con chi ha esperienze simili.",
            ru="Ваша профессиональная и академическая история — часть вашего пути. Она не определяет вашу ценность, но может связать вас с теми, у кого похожий опыт.",
            sv="Din yrkesmässiga och akademiska historia är en del av din väg. Den definierar inte ditt värde, men den kan koppla dig med andra som har liknande erfarenheter.",
            nl="Je professionele en academische verhaal maakt deel uit je reis. Het bepaalt je waarde niet, maar het kan je verbinden met mensen die vergelijkbare ervaringen hebben.",
            zh="你的职业和学业经历是你人生旅程的一部分。它并不定义你的价值，但能让你与有相似经历的人产生共鸣。",
            hi="आपकी व्यावसायिक और शैक्षणिक कहानी आपकी यात्रा का हिस्सा है। यह आपकी कीमत तय नहीं करती, लेकिन यह आपको ऐसे लोगों से जोड़ सकती है जिनका अनुभव समान हो।",
            bn="আপনার পেশাদার ও একাডেমিক গল্প আপনার পথের একটি অংশ। এটি আপনার মূল্য নির্ধারণ করে না, তবে এমন মানুষদের সাথে আপনাকে যুক্ত করতে পারে যাদের অভিজ্ঞতা একই।",
            ja="あなたの職業・学術の歩みは人生の旅の一部です。あなたの価値を左右するものではありませんが、似た経験を持つ人とつながることもあります。",
            ko="당신의 직업 및 학력 이야기는 여정의 한 부분입니다. 당신의 가치를 결정하지는 않지만, 비슷한 경험을 가진 사람들과 연결될 수 있습니다.",
            ar="قصتك المهنية والأكاديمية جزء من رحلتك. لا تحدد قيمتك، لكنها قد تصل بمن يشاركونك خبرات مشابهة.",
            sw="Hadithi yako ya kitaal na kitaalifu ni sehemu ya safari yako. Haielezwi thamani yako, lakini inaweza kukuunganisha na watu wenye uzoefu kama wako.",
            ha="Tarihin karfi da iliminka na banga na tafarkarko. Ba ya nuni girmamu ka, amma tafi hannu: yana iya hada da mutane da ke dafarori kama na kai.",
            am="የሙያና ትምቅህ ታሪክ ከመንገርህ የአንድ ክፍል ነው። የእርስህን መጠን አይቀምጥም፣ ግን ከተመሳሳይ ተሞክሮ ጋር ያገናኝህ ይችላል።",
            tl="Ang iyong kuwento sa propesyonal at akademiko ay bahagi ng iyong paglalakbay. Hindi nito tinutukoy ang iyong halaga, ngunit maaari itong ikonekta ka sa mga taong may katulad na karanasan.",
            ms="Kisah profesional dan akademik anda adalah sebahagian daripada perjalanan anda. Ia tidak menentukan nilai anda, tetapi ia boleh menghubungkan anda dengan mereka yang mempunyai pengalaman serupa.",
            mi="He tau hurihuri mō ngā tauka mahi ako me te mātauranga he wāhanga o tōu haerenga. Kāore tēnei e whakatau ana i tōu painga, engari ka āta whakapā ana ki ngā tangata he whairanga rite anō.",
        ),
    },
    {
        "value": "education",
        "order": 2,
        "translations": L(
            es="Educación", en="Education", pt="Educação", fr="Éducation",
            de="Bildung", it="Istruzione", ru="Образование", sv="Utbildning",
            nl="Onderwijs", zh="教育", hi="शिक्षा", bn="শিক্ষা",
            ja="学歴", ko="학력", ar="التعليم", sw="Elimu", ha="Ilimi",
            am="ትምቅ", tl="Edukasyon", ms="Pendidikan", mi="Mātauranga",
        ),
    },
    {
        "value": "schoolLabel",
        "order": 3,
        "translations": L(
            es="Centro de estudios", en="School or institution", pt="Escola ou instituição",
            fr="Établissement scolaire", de="Schule oder Hochschule", it="Scuola o istituto",
            ru="Учебное заведение", sv="Skola eller lärosäte", nl="School of instelling",
            zh="就读院校", hi="शिक्षा संस्थान", bn="শিক্ষা প্রতিষ্ঠান",
            ja="出身校", ko="출신 학교", ar="المدرسة أو المؤسسة",
            sw="Shule au taasisi", ha="Maktabar ko maktabar koyar",
            am="ትምቅት ቤት ወይም ተቋማት", tl="Paaralan o institusyon",
            ms="Sekolah atau institusi", mi="Kura ako te whare whakaako",
        ),
    },
    {
        "value": "schoolPlaceholder",
        "order": 4,
        "translations": L(
            es="Universidad o Institución", en="University or institution",
            pt="Universidade ou instituição", fr="Université ou institution",
            de="Universität oder Institution", it="Università o istituto",
            ru="Университет или учебное заведение",
            sv="Universitet eller lärosäte", nl="Universiteit of instituut",
            zh="大学或院校", hi="विश्वविद्यालय या संस्थान", bn="বিশ্ববিদ্যালয় বা প্রতিষ্ঠান",
            ja="大学または学校名", ko="대학교 또는 기관", ar="جامعة أو مؤسسة",
            sw="Chuo kikuu au taasisi", ha="Jami'a ko institusiyi",
            am="ዩኒቨርሲቲ ወይም ተቋማት", tl="Unibersidad o institusyon",
            ms="Universiti atau institusi", mi="Whare wānanga ko te whare whakaako",
        ),
    },
    {
        "value": "eduLevelLabel",
        "order": 5,
        "translations": L(
            es="Nivel Educativo", en="Education Level", pt="Nível de Educação",
            fr="Niveau d'études", de="Bildungsniveau", it="Livello di istruzione",
            ru="Уровень образования", sv="Utbildningsnivå", nl="Opleidingsniveau",
            zh="教育程度", hi="शैक्षणिक स्तर", bn="শিক্ষার স্তর",
            ja="学歴レベル", ko="학력 수준", ar="المستوى التعليمي",
            sw="Kiwango cha elimu", ha="Matin education", am="የትምቅ ደረጃ",
            tl="Antas ng Edukasyon", ms="Tahap Pendidikan", mi="Te taumata o te mātauranga",
        ),
    },
    {
        "value": "work",
        "order": 6,
        "translations": L(
            es="Profesional", en="Professional", pt="Profissional", fr="Professionnel",
            de="Beruflich", it="Professionale", ru="Профессиональная деятельность",
            sv="Yrkesmässigt", nl="Professioneel", zh="职业", hi="व्यावसायिक",
            bn="পেশাদার", ja="職業", ko="직업", ar="مهني",
            sw="Kitaal", ha="Kari", am="ሙያ", tl="Propesyonal",
            ms="Profesional", mi="Ngaio",
        ),
    },
    {
        "value": "jobLabel",
        "order": 7,
        "translations": L(
            es="Puesto laboral", en="Job title", pt="Cargo", fr="Intitulé du poste",
            de="Berufsbezeichnung", it="Posizione lavorativa", ru="Должность",
            sv="Jobbtitel", nl="Functietitel", zh="职位", hi="पद",
            bn="পদবি", ja="役職", ko="직책", ar="المسمى الوظيفي",
            sw="Nafasi ya kazi", ha="Matsa", am="የሥራ መደበኛ",
            tl="Posisyon", ms="Jawatan", mi="Tūranga mahi",
        ),
    },
    {
        "value": "jobPlaceholder",
        "order": 8,
        "translations": L(
            es="¿A qué te dedicas?", en="What do you do?", pt="O que você faz?",
            fr="Que faites-vous ?", de="Was ist Ihr Beruf?", it="Cosa fai?",
            ru="Чем вы занимаетесь?", sv="Vad gör du?", nl="Wat is je beroep?",
            zh="你的职业是什么？", hi="आप क्या करते हैं?", bn="আপনি কী করেন?",
            ja="お仕事は？", ko="무엇을 하시나요?", ar="ما مهامك؟",
            sw="Unafanya kazi gani?", ha="Me ka kai yi kama aiki?",
            am="ምን ሥራ ይሰራሉ?", tl="Ano ang trabaho mo?",
            ms="Apakah kerja anda?", mi="He aha koe e mahi ai?",
        ),
    },
    {
        "value": "companyLabel",
        "order": 9,
        "translations": L(
            es="Compañía", en="Company", pt="Empresa", fr="Entreprise",
            de="Unternehmen", it="Azienda", ru="Компания", sv="Företag",
            nl="Bedrijf", zh="公司", hi="कंपनी", bn="কোম্পানি",
            ja="会社名", ko="회사", ar="الشركة", sw="Kampuni", ha="Kamfani",
            am="የድርጅት ስም", tl="Kompanya", ms="Syarikat", mi="Kamupene",
        ),
    },
    {
        "value": "companyPlaceholder",
        "order": 10,
        "translations": L(
            es="Nombre de la empresa", en="Company name", pt="Nome da empresa",
            fr="Nom de l'entreprise", de="Name des Unternehmens",
            it="Nome dell'azienda", ru="Название компании", sv="Företagets namn",
            nl="Bedrijfsnaam", zh="公司名称", hi="कंपनी का नाम", bn="কোম্পানির নাম",
            ja="会社名を入力", ko="회사명", ar="اسم الشركة", sw="Jina la kampuni",
            ha="Sunan kamfani", am="የድርጅት ስም", tl="Pangalan ng kompanya",
            ms="Nama syarikat", mi="Ingoa o te kamupene",
        ),
    },
    {
        "value": "privacyTitle",
        "order": 11,
        "translations": L(
            es="Privacidad selectiva", en="Selective privacy",
            pt="Privacidade seletiva", fr="Confidentialité sélective",
            de="Selektiver Privatsphäre-Schutz", it="Privacy selettiva",
            ru="Выборочная приватность", sv="Selektiv integritet",
            nl="Selectieve privacy", zh="选择性隐私", hi="चयनात्मक गोपनीयता",
            bn="নির্বাচনমূলক গোপনীয়তা", ja="選択的なプライバシー",
            ko="선택적 개인정보", ar="خصوصية انتقائية", sw="Faragha chaguo-mshiwa",
            ha="Bambancin da sirri", am="የመረጃ ሰራጭ መስረት",
            tl="Selective na privacy", ms="Privasi pilihan",
            mi="Tīwhanga whiriwhiri",
        ),
    },
    {
        "value": "privacyDesc",
        "order": 12,
        "translations": L(
            es="Mostrar esta sección solo si hay coincidencias académicas o laborales.",
            en="Only show this section if there are academic or work matches.",
            pt="Mostrar esta seção apenas quando houver correspondências acadêmicas ou profissionais.",
            fr="N'afficher cette section qu'en cas de correspondances académiques ou professionnelles.",
            de="Diesen Abschnitt nur anzeigen, wenn es akademische oder berufliche Übereinstimmungen gibt.",
            it="Mostra questa sezione solo se ci sono corrispondenze accademiche o lavorative.",
            ru="Показывать этот раздел только при наличии академических или профессиональных совпадений.",
            sv="Visa det här avsnittet endast om det finns akademiska eller yrkesmässiga träffar.",
            nl="Toon deze sectie alleen als er academische of zakelijke overeenkomsten zijn.",
            zh="仅当存在学业或职业匹配时才显示此区块。",
            hi="यह अनुभाग तभी दिखाएं जब शैक्षणिक या व्यावसायिक मेल हों।",
            bn="এই অংশটি কেবল তখন দেখান যখন একাডেমিক বা পেশাদার মিল থাকে।",
            ja="学術的・职业的な一致がある場合のみこのセクションを表示します。",
            ko="학력 또는 직업이 일치하는 경우에만 이 섹션을 표시합니다.",
            ar="اعرض هذا القسم فقط عند وجود تطابق أكاديمي أو مهني.",
            sw="Onyesha sehemu hii tu ikiwa kuna mizizi ya kitaal au kielimu.",
            ha="Nuna wannan bangare kawai idan akwai mizaci na harkar ko ilimi.",
            am="ይህን ክፍል ብቻ አስየው ከሆነ የትምቅ ወይም የሥራ ተመሳሳይነት ካለበት።",
            tl="Ipakita lamang ang bahaging ito kung may academic o professional na tugma.",
            ms="Paparaskan bahagian ini hanya jika ada padanan akademik atau profesional.",
            mi="Whakaaturanga tēnei wāhanga anake he mātauranga, he mahi rānei e ōrite ana.",
        ),
    },
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_professional_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_professional_section",
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
        f"seed_profile_professional_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())