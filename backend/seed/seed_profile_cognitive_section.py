"""
Seed the `profile_cognitive_section` system options catalog for UI texts in the
Neurodiversity & Learning Preferences sections.

The texts in NeurodiversitySelector / LearningStyleSelector / CognitiveSection read from
GET /options/section/profile_cognitive_section.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_cognitive_section.py
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
            es="Neurodiversidad",
            en="Neurodiversity & Extras",
            pt="Neurodiversidade e Extras",
            fr="Neurodiversité et extras",
            de="Neurodiversität & Extras",
            it="Neurodiversità ed extra",
            ru="Нейроразнообразие и другое",
            sv="Neurodiversitet & extra",
            nl="Neurodiversiteit & extra's",
            zh="神经多样性与其他",
            hi="न्यूरोडायवर्सिटी और अन्य",
            bn="নিউরোডাইভার্সিটি ও অন্যান্য",
            ja="ニューロダイバーシティとその他",
            ko="신경다양성 및 기타",
            ar="التنوع العصبي وإضافات",
            sw="Neurodiversity na nyongeza",
            ha="Neurodiversity da ƙari",
            am="ኒውሮዳይቨርሲቲ እና ተጨማሪ",
            tl="Neurodiversity at iba pa",
            ms="Neurodiversiti dan tambahan",
            mi="Kanorau ā-roro me ētahi atu"
        )
    },
    {
        "value": "neurodiversity",
        "order": 1,
        "translations": L(
            es="Neurodiversidad",
            en="Neurodiversity",
            pt="Neurodiversidade",
            fr="Neurodiversité",
            de="Neurodiversität",
            it="Neurodiversità",
            ru="Нейроразнообразие",
            sv="Neurodiversitet",
            nl="Neurodiversiteit",
            zh="神经多样性",
            hi="न्यूरोडायवर्सिटी",
            bn="নিউরোডাইভার্সিটি",
            ja="ニューロダイバーシティ",
            ko="신경다양성",
            ar="التنوع العصبي",
            sw="Neurodiversity",
            ha="Neurodiversity",
            am="ኒውሮዳይቨርሲቲ",
            tl="Neurodiversity",
            ms="Neurodiversiti",
            mi="Kanorau ā-roro"
        )
    },
    {
        "value": "neurodiversity_show",
        "order": 2,
        "translations": L(
            es="Mostrar esta sección en mi perfil público",
            en="Show this section on my public profile",
            pt="Mostrar esta seção no meu perfil público",
            fr="Afficher cette section sur mon profil public",
            de="Diesen Abschnitt in meinem öffentlichen Profil anzeigen",
            it="Mostra questa sezione nel mio profilo pubblico",
            ru="Показать этот раздел в моём публичном профиле",
            sv="Visa detta avsnitt i min offentliga profil",
            nl="Toon dit gedeelte op mijn openbare profiel",
            zh="在我的公开资料中显示此部分",
            hi="मेरे सार्वजनिक प्रोफ़ाइल में यह अनुभाग दिखाएं",
            bn="আমার পাবলিক প্রোফাইলে এই বিভাগটি দেখান",
            ja="公開プロフィールにこのセクションを表示",
            ko="내 공개 프로필에 이 섹션 표시",
            ar="إظهار هذا القسم في ملفي العام",
            sw="Onyesha sehemu hii kwenye wasifu wangu wa umma",
            ha="Nuna wannan sashe a bayanin martaba na",
            am="ይህን ክፍል በመገለጫዬ ላይ አሳይ",
            tl="Ipakita ang seksyong ito sa aking pampublikong profile",
            ms="Tunjukkan bahagian ini pada profil awam saya",
            mi="Whakaaturia tēnei wāhanga ki tōku kōtaha tūmatanui"
        )
    },
    {
        "value": "neurodiversity_help_text",
        "order": 3,
        "translations": L(
            es="La neurodiversidad reconoce que las diferencias en el funcionamiento cerebral son variaciones naturales del genoma humano.",
            en="Neurodiversity recognizes that differences in brain functioning are natural variations of the human genome.",
            pt="A neurodiversidade reconhece que diferenças no funcionamento cerebral são variações naturais.",
            fr="La neurodiversité reconnaît que les différences de fonctionnement cérébral sont des variations naturelles.",
            de="Neurodiversität erkennt an, dass Unterschiede in der Gehirnfunktion natürliche Variationen sind.",
            it="La neurodiversità riconosce che le differenze nel funzionamento cerebrale sono variazioni naturali.",
            ru="Нейроразнообразие признаёт различия в работе мозга естественными вариациями.",
            sv="Neurodiversitet innebär att skillnader i hjärnans funktion är naturliga variationer.",
            nl="Neurodiversiteit erkent dat verschillen in hersenfunctie natuurlijke variaties zijn.",
            zh="神经多样性认为大脑功能差异是自然变异。",
            hi="न्यूरोडायवर्सिटी मानती है कि मस्तिष्क की कार्यप्रणाली में अंतर प्राकृतिक विविधताएँ हैं।",
            bn="নিউরোডাইভার্সিটি স্বীকার করে যে মস্তিষ্কের কার্যকারিতার পার্থক্য প্রাকৃতিক বৈচিত্র্য।",
            ja="ニューロダイバーシティは脳機能の違いを自然な多様性と認めます。",
            ko="신경다양성은 뇌 기능의 차이가 자연스러운 변이임을 인정합니다.",
            ar="يعترف التنوع العصبي بأن اختلافات وظائف الدماغ تنوعات طبيعية.",
            sw="Neurodiversity inatambua kuwa tofauti za utendaji wa ubongo ni tofauti za asili.",
            ha="Neurodiversity ta gane cewa bambance-bambance a aikin ƙwaƙwalwa yanayi ne na halitta.",
            am="ኒውሮዳይቨርሲቲ የአንጎል ተግባር ልዩነቶች ተፈጥሯዊ ልዩነቶች መሆናቸውን ያውቃል።",
            tl="Kinikilala ng neurodiversity na ang mga pagkakaiba sa paggana ng utak ay natural na baryasyon.",
            ms="Neurodiversiti mengiktiraf bahawa perbezaan fungsi otak adalah variasi semula jadi.",
            mi="E mōhio ana te kanorau ā-roro he rerekētanga māori ngā rerekētanga o te mahi roro."
        )
    },
    {
        "value": "neurodiversity_search",
        "order": 4,
        "translations": L(
            es="Buscar condición...",
            en="Search condition...",
            pt="Buscar condição...",
            fr="Rechercher un trouble...",
            de="Zustand suchen...",
            it="Cerca condizione...",
            ru="Найти состояние...",
            sv="Sök tillstånd...",
            nl="Zoek aandoening...",
            zh="搜索状况…",
            hi="स्थिति खोजें...",
            bn="অবস্থা খুঁজুন...",
            ja="状態を検索…",
            ko="상태 검색…",
            ar="بحث عن حالة...",
            sw="Tafuta hali...",
            ha="Nemi yanayi...",
            am="ሁኔታ ፈልግ…",
            tl="Maghanap ng kondisyon...",
            ms="Cari keadaan...",
            mi="Rapua āhuatanga…"
        )
    },
    {
        "value": "neurodiversity_other",
        "order": 5,
        "translations": L(
            es="Otro",
            en="Other",
            pt="Outro",
            fr="Autre",
            de="Andere",
            it="Altro",
            ru="Другое",
            sv="Annat",
            nl="Anders",
            zh="其他",
            hi="अन्य",
            bn="অন্যান্য",
            ja="その他",
            ko="기타",
            ar="أخرى",
            sw="Nyingine",
            ha="Wani",
            am="ሌላ",
            tl="Iba pa",
            ms="Lainnya",
            mi="Ētahi atu"
        )
    },
    {
        "value": "neurodiversity_add_custom",
        "order": 6,
        "translations": L(
            es="Especificar condición...",
            en="Specify condition...",
            pt="Especificar condição...",
            fr="Préciser le trouble...",
            de="Zustand angeben...",
            it="Specifica condizione...",
            ru="Указать состояние...",
            sv="Ange tillstånd...",
            nl="Aandoening opgeven...",
            zh="注明状况…",
            hi="स्थिति निर्दिष्ट करें...",
            bn="অবস্থা উল্লেখ করুন...",
            ja="状態を指定…",
            ko="상태 지정…",
            ar="تحديد الحالة...",
            sw="Bainisha hali...",
            ha="Ƙayyade yanayi...",
            am="ሁኔታ ግለጽ…",
            tl="Tukuyin ang kondisyon...",
            ms="Nyatakan keadaan...",
            mi="Tautuhi āhuatanga…"
        )
    },
    {
        "value": "neurodiversity_diagnosed",
        "order": 7,
        "translations": L(
            es="He sido diagnosticado por un profesional",
            en="I have been professionally diagnosed",
            pt="Fui diagnosticado por um profissional",
            fr="J'ai été diagnostiqué par un professionnel",
            de="Ich wurde professionell diagnostiziert",
            it="Sono stato diagnosticato da un professionista",
            ru="Мне поставили профессиональный диагноз",
            sv="Jag har fått en professionell diagnos",
            nl="Ik ben professioneel gediagnosticeerd",
            zh="我已获得专业诊断",
            hi="मेरा पेशेवर निदान हुआ है",
            bn="আমি পেশাদারভাবে নির্ণীত",
            ja="専門家による診断を受けました",
            ko="전문가 진단을 받았습니다",
            ar="تم تشخيصي مهنيًا",
            sw="Nimegunduliwa kitaalamu",
            ha="An gano mini cuta ta kwararre",
            am="በሙያ ተመርምሬያለሁ",
            tl="Na-diagnose ako ng propesyonal",
            ms="Saya telah didiagnosis secara profesional",
            mi="Kua whakamātauhia ahau e tētahi ngaio"
        )
    },
    {
        "value": "neurodiversity_diagnosed_help",
        "order": 8,
        "translations": L(
            es="Marca esta casilla si cuentas con un diagnóstico formal emitido por un profesional de la salud. Si no estás diagnosticado, tu selección será tratada como autoidentificación.",
            en="Check this box if you have a formal diagnosis from a health professional. If you are not diagnosed, your selection will be treated as self-identification.",
            pt="Marque esta caixa se você tem um diagnóstico formal de um profissional de saúde.",
            fr="Cochez cette case si vous avez un diagnostic formel d'un professionnel de santé.",
            de="Aktiviere dies, wenn du eine formale Diagnose hast.",
            it="Seleziona se hai una diagnosi formale di un professionista sanitario.",
            ru="Отметьте, если у вас есть официальный диагноз.",
            sv="Markera om du har en formell diagnos.",
            nl="Vink aan als je een formele diagnose hebt.",
            zh="如果你有专业医疗诊断，请勾选此框。",
            hi="यदि आपके पास स्वास्थ्य पेशेवर का औपचारिक निदान है तो इस बॉक्स को चेक करें।",
            bn="আপনার যদি স্বাস্থ্য পেশাদারের আনুষ্ঠানিক রোগ নির্ণয় থাকে তবে এই বাক্সে টিক দিন।",
            ja="医療専門家による正式な診断がある場合はチェックしてください。",
            ko="의료 전문가의 공식 진단을 받았다면 이 상자를 체크하세요.",
            ar="حدد هذا المربع إذا كان لديك تشخيص رسمي.",
            sw="Weka alama kama una uchunguzi rasmi.",
            ha="Duba wannan akwatin idan kana da cikakken ganewar asibiti.",
            am="ይህን ሳጥን ምልክት አድርግ የመ formally ምርመራ ካለህ።",
            tl="Lagyan ng tsek kung mayroon kang pormal na diagnosis.",
            ms="Tandakan kotak ini jika anda mempunyai diagnosis rasmi.",
            mi="Tohua tēnei pouaka mēnā he tātaritanga ōkawa tāu."
        )
    },
    {
        "value": "neurodiversity_self_id_help",
        "order": 9,
        "translations": L(
            es="Si no has sido diagnosticado por un profesional, esta selección se considera autoidentificación. No se usará para compatibilidad ni se mostrará públicamente sin tu consentimiento.",
            en="If you have not been professionally diagnosed, this selection is considered self-identification. It will not be used for compatibility or shown publicly without your consent.",
            pt="Se você não foi diagnosticado profissionalmente, esta seleção é considerada auto-identificação.",
            fr="Si vous n'avez pas été diagnostiqué, cette sélection est de l'auto-identification.",
            de="Ohne professionelle Diagnose gilt dies als Selbstidentifikation.",
            it="Senza diagnosi professionale, questa è auto-identificazione.",
            ru="Без профессионального диагноза это считается самоидентификацией.",
            sv="Utan professionell diagnos räknas detta som självidentifiering.",
            nl="Zonder professionele diagnose geldt dit als zelfidentificatie.",
            zh="若无专业诊断，此选择视为自我认定。",
            hi="यदि आपका पेशेवर निदान नहीं हुआ है, तो यह चयन आत्म-पहचान माना जाता है।",
            bn="আপনি পেশাদারভাবে নির্ণীত না হলে, এটি আত্ম-পরিচয় হিসাবে গণ্য হয়।",
            ja="専門家の診断がない場合、これは自己認識とみなされます。",
            ko="전문가 진단을 받지 않았다면 이는 자기 인식으로 간주됩니다.",
            ar="إذا لم يتم تشخيصك مهنيًا، فيُعتبر هذا تعريفًا ذاتيًا.",
            sw="Kama hujagunduliwa kitaalamu, hii ni kujitambua.",
            ha="Idan ba a gano maka cuta ta kwararre ba, wannan ganewar kanka ne.",
            am="በሙያ ካልተመረመርክ, ይህ ራስን መለየት ተብሎ ይቆጠራል።",
            tl="Kung hindi ka na-diagnose, ito ay self-identification.",
            ms="Jika anda belum didiagnosis, ini dianggap pengenalan diri.",
            mi="Mēnā kāore anō koe kia whakamātauhia, he tautuhi-whaiaro tēnei."
        )
    },
    {
        "value": "neurodiversity_tda",
        "order": 10,
        "translations": L(
            es="TDA (Déficit de Atención)",
            en="ADD (Attention Deficit)",
            pt="TDA (Déficit de Atenção)",
            fr="TDA (Déficit d'attention)",
            de="ADS (Aufmerksamkeitsdefizit)",
            it="ADD (Deficit di attenzione)",
            ru="СДВ (дефицит внимания)",
            sv="ADD (uppmärksamhetsbrist)",
            nl="ADD (aandachtstekort)",
            zh="注意力缺失症",
            hi="ध्यान अभाव (एडीडी)",
            bn="মনোযোগ ঘাটতি",
            ja="注意欠陥",
            ko="주의력 결핍",
            ar="اضطراب نقص الانتباه",
            sw="Upungufu wa umakini",
            ha="Rashin kulawa",
            am="የትኩረት ጉድለት",
            tl="ADD (kakulangan sa atensyon)",
            ms="ADD (defisit perhatian)",
            mi="Hauā aro"
        )
    },
    {
        "value": "neurodiversity_tdah",
        "order": 11,
        "translations": L(
            es="TDAH (con Hiperactividad)",
            en="ADHD (with Hyperactivity)",
            pt="TDAH (com Hiperatividade)",
            fr="TDAH (avec hyperactivité)",
            de="ADHS (mit Hyperaktivität)",
            it="ADHD (con iperattività)",
            ru="СДВГ (с гиперактивностью)",
            sv="ADHD (med hyperaktivitet)",
            nl="ADHD (met hyperactiviteit)",
            zh="多动症",
            hi="एडीएचडी (अतिसक्रियता सहित)",
            bn="এডিএইচডি",
            ja="ADHD（多動性あり）",
            ko="ADHD(과잉행동 동반)",
            ar="اضطراب فرط الحركة",
            sw="ADHD (yenye shughuli nyingi)",
            ha="ADHD (tare da wuce gudu)",
            am="ADHD (ከከፍተኛ እንቅስቃሴ ጋር)",
            tl="ADHD (may hyperactivity)",
            ms="ADHD (dengan hiperaktiviti)",
            mi="ADHD (me te whakakori)"
        )
    },
    {
        "value": "neurodiversity_dyslexia",
        "order": 12,
        "translations": L(
            es="Dislexia",
            en="Dyslexia",
            pt="Dislexia",
            fr="Dyslexie",
            de="Legasthenie",
            it="Dislessia",
            ru="Дислексия",
            sv="Dyslexi",
            nl="Dyslexie",
            zh="阅读障碍",
            hi="डिस्लेक्सिया",
            bn="ডিসলেক্সিয়া",
            ja="失読症",
            ko="난독증",
            ar="عسر القراءة",
            sw="Disleksia",
            ha="Disleksiya",
            am="ዲስሌክሲያ",
            tl="Dyslexia",
            ms="Disleksia",
            mi="Hauā pānui"
        )
    },
    {
        "value": "neurodiversity_autism",
        "order": 13,
        "translations": L(
            es="Autismo / TEA",
            en="Autism / ASD",
            pt="Autismo / TEA",
            fr="Autisme / TSA",
            de="Autismus / ASS",
            it="Autismo / ASD",
            ru="Аутизм / РАС",
            sv="Autism / AST",
            nl="Autisme / ASS",
            zh="自闭症",
            hi="ऑटिज्म",
            bn="অটিজম",
            ja="自閉症",
            ko="자폐증",
            ar="التوحد",
            sw="Tawahudi",
            ha="Autism",
            am="ኦቲዝም",
            tl="Autism",
            ms="Autisme",
            mi="Takiwātanga"
        )
    },
    {
        "value": "neurodiversity_discalculia",
        "order": 14,
        "translations": L(
            es="Discalculia",
            en="Dyscalculia",
            pt="Discalculia",
            fr="Dyscalculie",
            de="Dyskalkulie",
            it="Discalculia",
            ru="Дискалькулия",
            sv="Dyskalkyli",
            nl="Dyscalculie",
            zh="计算障碍",
            hi="डिस्कैलकुलिया",
            bn="ডিসক্যালকুলিয়া",
            ja="計算障害",
            ko="난산증",
            ar="عسر الحساب",
            sw="Diskalkulia",
            ha="Diskalkuliya",
            am="ዲስካልኩሊያ",
            tl="Dyscalculia",
            ms="Diskalkulia",
            mi="Hauā tatau"
        )
    },
    {
        "value": "neurodiversity_dispraxia",
        "order": 15,
        "translations": L(
            es="Dispraxia",
            en="Dyspraxia",
            pt="Dispraxia",
            fr="Dyspraxie",
            de="Dyspraxie",
            it="Disprassia",
            ru="Диспраксия",
            sv="Dyspraxi",
            nl="Dyspraxie",
            zh="运动障碍",
            hi="डिस्प्रैक्सिया",
            bn="ডিসপ্র্যাক্সিয়া",
            ja="発達性協調運動障害",
            ko="실행증",
            ar="عسر الأداء",
            sw="Dispraksia",
            ha="Dispraksiya",
            am="ዲስፕራክሲያ",
            tl="Dyspraxia",
            ms="Dispraksia",
            mi="Hauā nekehanga"
        )
    },
    {
        "value": "neurodiversity_tourette",
        "order": 16,
        "translations": L(
            es="Tourette",
            en="Tourette",
            pt="Tourette",
            fr="Tourette",
            de="Tourette",
            it="Tourette",
            ru="Туретт",
            sv="Tourette",
            nl="Tourette",
            zh="妥瑞氏症",
            hi="टॉरेट",
            bn="ট্যুরেট",
            ja="トゥレット",
            ko="투렛",
            ar="توريت",
            sw="Tourette",
            ha="Tourette",
            am="ቱሬት",
            tl="Tourette",
            ms="Tourette",
            mi="Tourette"
        )
    },
    {
        "value": "neurodiversity_apd",
        "order": 17,
        "translations": L(
            es="Procesamiento auditivo (APD)",
            en="Auditory Processing (APD)",
            pt="Processamento auditivo (APD)",
            fr="Traitement auditif (APD)",
            de="Auditive Verarbeitung (APD)",
            it="Elaborazione uditiva (APD)",
            ru="Слуховая обработка (APD)",
            sv="Auditiv bearbetning (APD)",
            nl="Auditieve verwerking (APD)",
            zh="听觉处理障碍",
            hi="श्रवण प्रसंस्करण (एपीडी)",
            bn="শ্রবণ প্রক্রিয়াকরণ",
            ja="聴覚情報処理障害",
            ko="청각 처리 장애",
            ar="اضطراب المعالجة السمعية",
            sw="Uchakataji wa kusikia",
            ha="Sarrafa ji",
            am="የመስማት ሂደት",
            tl="Pagproseso ng pandinig",
            ms="Pemprosesan auditori",
            mi="Hauā rongo"
        )
    },
    {
        "value": "neurodiversity_nvld",
        "order": 18,
        "translations": L(
            es="Aprendizaje no verbal (NVLD)",
            en="Non-verbal Learning (NVLD)",
            pt="Aprendizagem não verbal (NVLD)",
            fr="Apprentissage non verbal (NVLD)",
            de="Nonverbales Lernen (NVLD)",
            it="Apprendimento non verbale (NVLD)",
            ru="Невербальное обучение (NVLD)",
            sv="Icke-verbalt lärande (NVLD)",
            nl="Non-verbaal leren (NVLD)",
            zh="非语言学习障碍",
            hi="अशाब्दिक अधिगम",
            bn="অ-মৌখিক শিক্ষা",
            ja="非言語性学習障害",
            ko="비언어 학습 장애",
            ar="اضطراب التعلم غير اللفظي",
            sw="Kujifunza bila maneno",
            ha="Koyon ba da magana",
            am="ያልተነገረ መማር",
            tl="Di-berbal na pag-aaral",
            ms="Pembelajaran bukan lisan",
            mi="Ako kore-waha"
        )
    },
    {
        "value": "neurodiversity_language",
        "order": 19,
        "translations": L(
            es="Trastorno del lenguaje",
            en="Language Disorder",
            pt="Transtorno de linguagem",
            fr="Trouble du langage",
            de="Sprachstörung",
            it="Disturbo del linguaggio",
            ru="Речевое расстройство",
            sv="Språkstörning",
            nl="Taalstoornis",
            zh="语言障碍",
            hi="भाषा विकार",
            bn="ভাষা ব্যাধি",
            ja="言語障害",
            ko="언어 장애",
            ar="اضطراب اللغة",
            sw="Tatizo la lugha",
            ha="Ciwon harshe",
            am="የቋንቋ ችግር",
            tl="Karamdaman sa wika",
            ms="Gangguan bahasa",
            mi="Hauā reo"
        )
    },
    {
        "value": "neurodiversity_pas",
        "order": 20,
        "translations": L(
            es="Alta sensibilidad (PAS)",
            en="High Sensitivity (HSP)",
            pt="Alta sensibilidade (PAS)",
            fr="Haute sensibilité (HSP)",
            de="Hochsensibilität (HSP)",
            it="Alta sensibilità (PAS)",
            ru="Высокая чувствительность",
            sv="Högkänslighet (HSP)",
            nl="Hoogsensitiviteit (HSP)",
            zh="高敏感",
            hi="अति संवेदनशीलता",
            bn="অতি সংবেদনশীলতা",
            ja=" highly sensitive",
            ko="고감도",
            ar="فرط الحساسية",
            sw="Unyeti mkubwa",
            ha="Babbar hankali",
            am="ከፍተኛ ስሜት",
            tl="Mataas na sensitivity",
            ms="Sensitiviti tinggi",
            mi="Tairongo nui"
        )
    },
    {
        "value": "neurodiversity_gifted",
        "order": 21,
        "translations": L(
            es="Altas capacidades / Superdotación",
            en="High Capacities / Giftedness",
            pt="Altas habilidades / Superdotação",
            fr="Haut potentiel / Surdoué",
            de="Hochbegabung",
            it="Alte capacità / Plusdotazione",
            ru="Одарённость",
            sv="Särbegåvning",
            nl="Hoogbegaafdheid",
            zh="天赋异禀",
            hi="प्रतिभाशाली",
            bn="মেধাবী",
            ja="ギフテッド",
            ko="영재",
            ar="موهوب",
            sw="Kipaji",
            ha="Hazaka",
            am="ብልጽግና",
            tl="Gifted",
            ms="Berbakat",
            mi="Pūkenga"
        )
    },
    {
        "value": "neurodiversity_asperger",
        "order": 22,
        "translations": L(
            es="Síndrome de Asperger",
            en="Asperger's Syndrome",
            pt="Síndrome de Asperger",
            fr="Syndrome d'Asperger",
            de="Asperger-Syndrom",
            it="Sindrome di Asperger",
            ru="Синдром Аспергера",
            sv="Aspergers syndrom",
            nl="Syndroom van Asperger",
            zh="阿斯伯格综合征",
            hi="एस्परजर सिंड्रोम",
            bn="অ্যাসপারজার সিনড্রোম",
            ja="アスペルガー症候群",
            ko="아스퍼거 증후군",
            ar="متلازمة أسبرجر",
            sw="Asperger",
            ha="Asperger",
            am="የአስፐርገር ሲንድሮም",
            tl="Asperger syndrome",
            ms="Sindrom Asperger",
            mi="Mate Asperger"
        )
    },
    {
        "value": "neurodiversity_not_sure",
        "order": 23,
        "translations": L(
            es="No estoy seguro/a",
            en="I'm not sure",
            pt="Não tenho certeza",
            fr="Je ne suis pas sûr",
            de="Ich bin nicht sicher",
            it="Non sono sicuro",
            ru="Я не уверен",
            sv="Jag är osäker",
            nl="Ik weet het niet zeker",
            zh="不确定",
            hi="मुझे यकीन नहीं",
            bn="আমি নিশ্চিত নই",
            ja="よくわからない",
            ko="잘 모르겠음",
            ar="لست متأكدًا",
            sw="Sina uhakika",
            ha="Ban tabbata ba",
            am="እርግጠኛ አይደለሁም",
            tl="Hindi ako sigurado",
            ms="Saya tidak pasti",
            mi="Kāore au i te tino mōhio"
        )
    },
    {
        "value": "neurodiversity_prefer_not_to_say",
        "order": 24,
        "translations": L(
            es="Prefiero no responder",
            en="Prefer not to say",
            pt="Prefiro não responder",
            fr="Je préfère ne pas répondre",
            de="Ich antworte lieber nicht",
            it="Preferisco non rispondere",
            ru="Предпочитаю не отвечать",
            sv="Jag föredrar att inte svara",
            nl="Ik geef liever geen antwoord",
            zh="不愿回答",
            hi="जवाब न देना पसंद करूंगा",
            bn="উত্তর না দেওয়াই পছন্দ করি",
            ja="回答を控えたい",
            ko="답변하고 싶지 않음",
            ar="أفضل عدم الإجابة",
            sw="Napendelea kutokujibu",
            ha="Na fi yin shiru",
            am="መመለስ አልፈልግም",
            tl="Mas gusto kong huwag sumagot",
            ms="Saya lebih suka tidak menjawab",
            mi="He pai ake kia kaua e whakautu"
        )
    },
    {
        "value": "learning",
        "order": 25,
        "translations": L(
            es="Preferencias de aprendizaje",
            en="Learning Preferences",
            pt="Preferências de aprendizagem",
            fr="Préférences d'apprentissage",
            de="Lernpräferenzen",
            it="Preferenze di apprendimento",
            ru="Предпочтения в обучении",
            sv="Lärpreferenser",
            nl="Leervoorkeuren",
            zh="学习偏好",
            hi="सीखने की प्राथमिकताएँ",
            bn="শেখার পছন্দ",
            ja="学習の好み",
            ko="학습 선호도",
            ar="تفضيلات التعلم",
            sw="Mapendeleo ya kujifunza",
            ha="Zaɓin koyo",
            am="የመማር ምርጫዎች",
            tl="Mga kagustuhan sa pag-aaral",
            ms="Keutamaan pembelajaran",
            mi="Ngā manakohanga ako"
        )
    },
    {
        "value": "learning_help_title",
        "order": 26,
        "translations": L(
            es="Selecciona hasta 3 estilos",
            en="Select up to 3 styles",
            pt="Selecione até 3 estilos",
            fr="Sélectionnez jusqu'à 3 styles",
            de="Wähle bis zu 3 Stile",
            it="Seleziona fino a 3 stili",
            ru="Выберите до 3 стилей",
            sv="Välj upp till 3 stilar",
            nl="Selecteer maximaal 3 stijlen",
            zh="最多选择3种风格",
            hi="3 तक शैलियाँ चुनें",
            bn="সর্বাধিক ৩টি স্টাইল বেছে নিন",
            ja="最大3つのスタイルを選択",
            ko="최대 3가지 스타일 선택",
            ar="اختر حتى 3 أساليب",
            sw="Chagua hadi mitindo 3",
            ha="Zaɓi salo har 3",
            am="እስከ 3 ቅጦች ምረጥ",
            tl="Pumili ng hanggang 3 estilo",
            ms="Pilih sehingga 3 gaya",
            mi="Kōwhiria kia 3 kāhua"
        )
    },
    {
        "value": "learning_help",
        "order": 27,
        "translations": L(
            es="¿Cómo procesas mejor la información?\nConocer tu estilo de aprendizaje nos ayuda a sugerir mejores formas de comunicación y colaboración con otros usuarios.",
            en="How do you process information best?\nKnowing your learning style helps us suggest better ways to communicate and collaborate with other users.",
            pt="Como você processa melhor as informações? Conhecer seu estilo ajuda a sugerir conexões.",
            fr="Comment traitez-vous au mieux l'information ? Connaître votre style aide à suggérer.",
            de="Wie verarbeitest du Informationen am besten? Dein Stil hilft bei Vorschlägen.",
            it="Come elabori meglio le informazioni? Conoscere il tuo stile aiuta a suggerire.",
            ru="Как вы лучше обрабатываете информацию? Ваш стиль помогает предлагать.",
            sv="Hur bearbetar du information bäst? Din stil hjälper till att föreslå.",
            nl="Hoe verwerk je informatie het best? Je stijl helpt bij suggesties.",
            zh="你如何最有效地处理信息？了解你的风格有助于推荐。",
            hi="आप जानकारी को सबसे अच्छी तरह कैसे संसाधित करते हैं? आपकी शैली सुझाव देने में मदद करती है।",
            bn="আপনি তথ্য সবচেয়ে ভালোভাবে কীভাবে প্রক্রিয়া করেন? আপনার স্টাইল পরামর্শ দিতে সাহায্য করে।",
            ja="情報を最もよく処理する方法は？あなたのスタイルが提案に役立ちます。",
            ko="정보를 가장 잘 처리하는 방법은? 당신의 스타일이 제안에 도움이 됩니다.",
            ar="كيف تعالج المعلومات بشكل أفضل؟ أسلوبك يساعد في الاقتراح.",
            sw="Unachakata taarifa vipi vizuri? Mtindo wako husaidia kupendekeza.",
            ha="Yaya kake sarrafa bayani mafi kyau? Salonka yana taimakawa wajen bayar da shawara.",
            am="መረጃን በተሻለ እንዴት ታስኬዳለህ? ዘይቤህ ለማ ұсыныс pomáhá.",
            tl="Paano mo pinakamahusay na pinoproseso ang impormasyon? Nakatutulong ang estilo mo.",
            ms="Bagaimana anda memproses maklumat paling baik? Gaya anda membantu mencadangkan.",
            mi="Pēhea tō tino tukatuka i ngā mōhiohio? Ka āwhina tō kāhua ki te marohi."
        )
    },
    {
        "value": "learning_visual",
        "order": 28,
        "translations": L(
            es="Visual",
            en="Visual",
            pt="Visual",
            fr="Visuel",
            de="Visuell",
            it="Visivo",
            ru="Визуальный",
            sv="Visuell",
            nl="Visueel",
            zh="视觉型",
            hi="दृश्य",
            bn="ভিজ্যুয়াল",
            ja="視覚型",
            ko="시각형",
            ar="بصري",
            sw="Kuona",
            ha="Gani",
            am="ምስላዊ",
            tl="Biswal",
            ms="Visual",
            mi="Ataata"
        )
    },
    {
        "value": "learning_visual_desc",
        "order": 29,
        "translations": L(
            es="Aprendes mejor con imágenes, diagramas y colores.",
            en="You learn best with images, diagrams, and colors.",
            pt="Você aprende melhor com imagens, diagramas e cores.",
            fr="Vous apprenez mieux avec images, schémas et couleurs.",
            de="Du lernst am besten mit Bildern, Diagrammen und Farben.",
            it="Impari meglio con immagini, diagrammi e colori.",
            ru="Вы лучше всего учитесь с изображениями, схемами и цветами.",
            sv="Du lär dig bäst med bilder, diagram och färger.",
            nl="Je leert het best met beelden, diagrammen en kleuren.",
            zh="你通过图像、图表和颜色学得最好。",
            hi="आप चित्रों, आरेखों और रंगों से सबसे अच्छा सीखते हैं।",
            bn="আপনি ছবি, চিত্র ও রঙ দিয়ে সবচেয়ে ভালো শেখেন।",
            ja="画像や図、色で最もよく学べます。",
            ko="이미지, 도표, 색상으로 가장 잘 배웁니다.",
            ar="تتعلم بشكل أفضل بالصور والمخططات والألوان.",
            sw="Unajifunza vizuri kwa picha, michoro na rangi.",
            ha="Kana koyo mafi kyau da hotuna, zane da launuka.",
            am="በሥዕሎች፣ በሰንጠረዦች እና በቀለሞች በተሻለ ትማራለህ።",
            tl="Pinakamahusay kang matuto sa mga larawan, dayagram at kulay.",
            ms="Anda belajar paling baik dengan imej, rajah dan warna.",
            mi="He pai ake tō ako mā ngā pikitia, ngā hoahoa me ngā tae."
        )
    },
    {
        "value": "learning_auditory",
        "order": 30,
        "translations": L(
            es="Auditivo",
            en="Auditory",
            pt="Auditivo",
            fr="Auditif",
            de="Auditiv",
            it="Uditivo",
            ru="Аудиальный",
            sv="Auditiv",
            nl="Auditief",
            zh="听觉型",
            hi="श्रवण",
            bn="শ্রাব্য",
            ja="聴覚型",
            ko="청각형",
            ar="سمعي",
            sw="Kusikia",
            ha="Ji",
            am="መስማት",
            tl="Pandinig",
            ms="Auditori",
            mi="Rongo"
        )
    },
    {
        "value": "learning_auditory_desc",
        "order": 31,
        "translations": L(
            es="Retienes mejor lo que escuchas, música y ritmo.",
            en="You retain best what you hear, music, and rhythm.",
            pt="Você retém melhor o que ouve, música e ritmo.",
            fr="Vous retenez mieux ce que vous entendez, musique et rythme.",
            de="Du behältst Gehörtes, Musik und Rhythmus am besten.",
            it="Trattieni meglio ciò che ascolti, musica e ritmo.",
            ru="Вы лучше запоминаете услышанное, музыку и ритм.",
            sv="Du minns bäst det du hör, musik och rytm.",
            nl="Je onthoudt het best wat je hoort, muziek en ritme.",
            zh="你对听到的内容、音乐和节奏记得最牢。",
            hi="आप सुनी हुई बातें, संगीत और लय सबसे अच्छी तरह याद रखते हैं।",
            bn="আপনি যা শোনেন, সঙ্গীত ও ছন্দ সবচেয়ে ভালো মনে রাখেন।",
            ja="聞いたことや音楽、リズムを最もよく覚えます。",
            ko="들은 내용과 음악, 리듬을 가장 잘 기억합니다.",
            ar="تحتفظ بشكل أفضل بما تسمعه والموسيقى والإيقاع.",
            sw="Unakumbuka vizuri unachosikia, muziki na mdundo.",
            ha="Kana tuna abin da ka ji, kiɗa da ƙa'ida mafi kyau.",
            am="የምትሰማውን፣ ሙዚቃን እና ምትን በተሻለ ታስታውሳለህ።",
            tl="Pinakamahusay mong natatandaan ang naririnig, musika at ritmo.",
            ms="Anda paling ingat apa yang didengar, muzik dan irama.",
            mi="He pai ake tō maumahara i ngā mea ka rangona, te puoro me te manawataki."
        )
    },
    {
        "value": "learning_kinesthetic",
        "order": 32,
        "translations": L(
            es="Kinestésico",
            en="Kinesthetic",
            pt="Cinestésico",
            fr="Kinesthésique",
            de="Kinästhetisch",
            it="Cinestetico",
            ru="Кинестетический",
            sv="Kinestetisk",
            nl="Kinesthetisch",
            zh="动觉型",
            hi="गतिसंवेदी",
            bn="কাইনেসথেটিক",
            ja="身体感覚型",
            ko="신체감각형",
            ar="حركي",
            sw="Kutenda",
            ha="Motsi",
            am="ንቅናቄ",
            tl="Kinesthetic",
            ms="Kinestetik",
            mi="Nekehanga"
        )
    },
    {
        "value": "learning_kinesthetic_desc",
        "order": 33,
        "translations": L(
            es="Aprendes haciendo, moviéndote y experimentando físicamente.",
            en="You learn by doing, moving, and physical experimentation.",
            pt="Você aprende fazendo, movendo-se e experimentando fisicamente.",
            fr="Vous apprenez en faisant, en bougeant et en expérimentant.",
            de="Du lernst durch Tun, Bewegung und Ausprobieren.",
            it="Impari facendo, muovendoti e sperimentando fisicamente.",
            ru="Вы учитесь делая, двигаясь и экспериментируя.",
            sv="Du lär dig genom att göra, röra dig och experimentera.",
            nl="Je leert door te doen, te bewegen en te experimenteren.",
            zh="你通过动手、 movement 和实践学得最好。",
            hi="आप करके, हिलकर और प्रयोग करके सीखते हैं।",
            bn="আপনি করে, নড়ে ও পরীক্ষা করে শেখেন।",
            ja="実践し、動いて体験することで学びます。",
            ko="직접 하고 움직이며 체험하며 배웁니다.",
            ar="تتعلم بالممارسة والحركة والتجربة.",
            sw="Unajifunza kwa kufanya, kutembea na kujaribu.",
            ha="Kana koyo ta aikatawa, motsi da gwaji.",
            am="በማድረግ፣ በመንቀሳቀስ እና በመሞከር ትማራለህ።",
            tl="Natututo ka sa paggawa, paggalaw at pagsubok.",
            ms="Anda belajar dengan melakukan, bergerak dan mencuba.",
            mi="He pai ake tō ako mā te mahi, te neke me te whakamātau."
        )
    },
    {
        "value": "learning_verbal",
        "order": 34,
        "translations": L(
            es="Verbal",
            en="Verbal",
            pt="Verbal",
            fr="Verbal",
            de="Verbal",
            it="Verbale",
            ru="Вербальный",
            sv="Verbal",
            nl="Verbaal",
            zh="言语型",
            hi="शाब्दिक",
            bn="মৌখিক",
            ja="言語型",
            ko="언어형",
            ar="لفظي",
            sw="Maneno",
            ha="Magana",
            am="ቃላዊ",
            tl="Berbal",
            ms="Verbal",
            mi="Waha"
        )
    },
    {
        "value": "learning_verbal_desc",
        "order": 35,
        "translations": L(
            es="Prefieres leer, escribir y hablar para aprender.",
            en="You prefer reading, writing, and speaking to learn.",
            pt="Você prefere ler, escrever e falar para aprender.",
            fr="Vous préférez lire, écrire et parler pour apprendre.",
            de="Du lernst am liebsten durch Lesen, Schreiben und Sprechen.",
            it="Preferisci leggere, scrivere e parlare per imparare.",
            ru="Вы предпочитаете читать, писать и говорить.",
            sv="Du föredrar att läsa, skriva och tala för att lära.",
            nl="Je leert het liefst door te lezen, schrijven en spreken.",
            zh="你更喜欢通过阅读、写作和说话来学习。",
            hi="आप सीखने के लिए पढ़ना, लिखना और बोलना पसंद करते हैं।",
            bn="আপনি শিখতে পড়া, লেখা ও বলা পছন্দ করেন।",
            ja="読む・書く・話すことで学ぶのが好きです。",
            ko="읽고 쓰고 말하며 배우는 것을 선호합니다.",
            ar="تفضل القراءة والكتابة والتحدث للتعلم.",
            sw="Unapendelea kusoma, kuandika na kuzungumza kujifunza.",
            ha="Ka fi karatu, rubutu da magana don koyo.",
            am="ለመማር ማንበብ፣ መጻፍ እና መናገር ትመርጣለህ።",
            tl="Mas gusto mong magbasa, magsulat at magsalita upang matuto.",
            ms="Anda lebih suka membaca, menulis dan bercakap untuk belajar.",
            mi="He pai ake ki a koe te pānui, te tuhi me te kōrero kia ako ai."
        )
    },
    {
        "value": "learning_logical",
        "order": 36,
        "translations": L(
            es="Lógico",
            en="Logical",
            pt="Lógico",
            fr="Logique",
            de="Logisch",
            it="Logico",
            ru="Логический",
            sv="Logisk",
            nl="Logisch",
            zh="逻辑型",
            hi="तार्किक",
            bn="যৌক্তিক",
            ja="論理型",
            ko="논리형",
            ar="منطقي",
            sw="Mantiki",
            ha="Hankali",
            am="አመክንዮአዊ",
            tl="Lohikal",
            ms="Logik",
            mi="Arorau"
        )
    },
    {
        "value": "learning_logical_desc",
        "order": 37,
        "translations": L(
            es="Necesitas estructura, secuencias y patrones lógicos.",
            en="You need structure, sequences, and logical patterns.",
            pt="Você precisa de estrutura, sequências e padrões lógicos.",
            fr="Vous avez besoin de structure, séquences et schémas logiques.",
            de="Du brauchst Struktur, Abläufe und logische Muster.",
            it="Hai bisogno di struttura, sequenze e schemi logici.",
            ru="Вам нужны структура, последовательности и логические схемы.",
            sv="Du behöver struktur, sekvenser och logiska mönster.",
            nl="Je hebt structuur, volgordes en logische patronen nodig.",
            zh="你需要结构、顺序和逻辑模式。",
            hi="आपको संरचना, क्रम और तार्किक पैटर्न चाहिए।",
            bn="আপনার কাঠামো, ক্রম ও যৌক্তিক ধরন দরকার।",
            ja="構造や順序、論理的パターンが必要です。",
            ko="구조, 순서, 논리적 패턴이 필요합니다.",
            ar="تحتاج إلى هيكل وتسلسل وأنماط منطقية.",
            sw="Unahitaji muundo, mfuatano na ruwaza za kimantiki.",
            ha="Kana buƙatar tsari, jeri da ƙa'idoji masu ma'ana.",
            am="መዋቅር፣ ቅደም ተከተል እና አመክንዮአዊ ስርዓቶች ያስፈልጉሃል።",
            tl="Kailangan mo ng istruktura, pagkakasunod at lohikal na padron.",
            ms="Anda perlukan struktur, urutan dan corak logik.",
            mi="Me whai hanganga, raupapa me ngā tauira arorau."
        )
    },
    {
        "value": "learning_social",
        "order": 38,
        "translations": L(
            es="Social",
            en="Social",
            pt="Social",
            fr="Social",
            de="Sozial",
            it="Sociale",
            ru="Социальный",
            sv="Social",
            nl="Sociaal",
            zh="社交型",
            hi="सामाजिक",
            bn="সামাজিক",
            ja="社交型",
            ko="사회형",
            ar="اجتماعي",
            sw="Kijamii",
            ha="Zamantakewa",
            am="ማህበራዊ",
            tl="Panlipunan",
            ms="Sosial",
            mi="Pāpori"
        )
    },
    {
        "value": "learning_social_desc",
        "order": 39,
        "translations": L(
            es="Aprendes mejor en grupo compartiendo ideas.",
            en="You learn best in groups sharing ideas.",
            pt="Você aprende melhor em grupo compartilhando ideias.",
            fr="Vous apprenez mieux en groupe en partageant des idées.",
            de="Du lernst am besten in der Gruppe beim Ideenaustausch.",
            it="Impari meglio in gruppo condividendo idee.",
            ru="Вы лучше учитесь в группе, делясь идеями.",
            sv="Du lär dig bäst i grupp genom att dela idéer.",
            nl="Je leert het best in groep door ideeën te delen.",
            zh="你和小伙伴分享想法时学得最好。",
            hi="आप विचार साझा करके समूह में सबसे अच्छा सीखते हैं।",
            bn="আপনি ধারণা ভাগ করে দলে সবচেয়ে ভালো শেখেন।",
            ja="アイデアを共有しながらグループで学ぶのが得意です。",
            ko="아이디어를 나누며 그룹으로 배울 때 가장 잘 배웁니다.",
            ar="تتعلم بشكل أفضل ضمن مجموعة بمشاركة الأفكار.",
            sw="Unajifunza vizuri kikundi kwa kushiriki mawazo.",
            ha="Kana koyo mafi kyau a rukuni ta hanyar raba ra'ayoyi.",
            am="ሀሳቦችን ስታካፍል በቡድን በተሻለ ትማራለህ።",
            tl="Pinakamahusay kang matuto sa grupo sa pagbabahagi ng ideya.",
            ms="Anda belajar paling baik dalam kumpulan dengan berkongsi idea.",
            mi="He pai ake tō ako ā-rōpū mā te tiritiri whakaaro."
        )
    },
    {
        "value": "learning_solitary",
        "order": 40,
        "translations": L(
            es="Solitario",
            en="Solitary",
            pt="Solitário",
            fr="Solitaire",
            de="Einzelgängerisch",
            it="Solitario",
            ru="Одиночный",
            sv="Ensam",
            nl="Solitair",
            zh="独学型",
            hi="एकांत",
            bn="নির্জন",
            ja="孤独型",
            ko="독자형",
            ar="انفرادي",
            sw="Pekee",
            ha="Kaɗai",
            am="ብቸኛ",
            tl="Nag-iisa",
            ms="Berseorangan",
            mi="Mokemoke"
        )
    },
    {
        "value": "learning_solitary_desc",
        "order": 41,
        "translations": L(
            es="Prefieres aprender solo, en silencio y con reflexión.",
            en="You prefer learning alone, in silence, and with reflection.",
            pt="Você prefere aprender sozinho, em silêncio e com reflexão.",
            fr="Vous préférez apprendre seul, en silence et avec réflexion.",
            de="Du lernst am liebsten allein, in Stille und mit Reflexion.",
            it="Preferisci imparare da solo, in silenzio e con riflessione.",
            ru="Вы предпочитаете учиться в одиночку, в тишине и с размышлением.",
            sv="Du föredrar att lära ensam, i tystnad och med reflektion.",
            nl="Je leert het liefst alleen, in stilte en met reflectie.",
            zh="你更喜欢独自、安静地反思着学习。",
            hi="आप अकेले, शांति से और चिंतन के साथ सीखना पसंद करते हैं।",
            bn="আপনি একা, নীরবে ও প্রতিফলনসহ শিখতে পছন্দ করেন।",
            ja="一人で静かに振り返りながら学ぶのが好きです。",
            ko="혼자 조용히 성찰하며 배우는 것을 선호합니다.",
            ar="تفضل التعلم وحدك بهدوء وتأمل.",
            sw="Unapendelea kujifunza pekee, kimya na kutafakari.",
            ha="Ka fi koyo kaɗai, cikin shiru da tunani.",
            am="ብቻህን፣ በዝምታ እና በማሰላሰል መማር ትመርጣለህ።",
            tl="Mas gusto mong matuto nang mag-isa, tahimik at may pagninilay.",
            ms="Anda lebih suka belajar bersendirian, dalam senyap dan refleksi.",
            mi="He pai ake ki a koe te ako takitahi, i te wahangū me te huritao."
        )
    },
    {
        "value": "learning_not_sure",
        "order": 42,
        "translations": L(
            es="No estoy seguro/a",
            en="Not sure",
            pt="Não tenho certeza",
            fr="Je ne suis pas sûr",
            de="Ich bin nicht sicher",
            it="Non sono sicuro",
            ru="Я не уверен",
            sv="Jag är osäker",
            nl="Ik weet het niet zeker",
            zh="不确定",
            hi="मुझे यकीन नहीं",
            bn="আমি নিশ্চিত নই",
            ja="よくわからない",
            ko="잘 모르겠음",
            ar="لست متأكدًا",
            sw="Sina uhakika",
            ha="Ban tabbata ba",
            am="እርግጠኛ አይደለሁም",
            tl="Hindi ako sigurado",
            ms="Saya tidak pasti",
            mi="Kāore au i te tino mōhio"
        )
    },
    {
        "value": "learning_prefer_not_to_say",
        "order": 43,
        "translations": L(
            es="Prefiero no responder",
            en="Prefer not to say",
            pt="Prefiro não responder",
            fr="Je préfère ne pas répondre",
            de="Ich antworte lieber nicht",
            it="Preferisco non rispondere",
            ru="Предпочитаю не отвечать",
            sv="Jag föredrar att inte svara",
            nl="Ik geef liever geen antwoord",
            zh="不愿回答",
            hi="जवाब न देना पसंद करूंगा",
            bn="উত্তর না দেওয়াই পছন্দ করি",
            ja="回答を控えたい",
            ko="답변하고 싶지 않음",
            ar="أفضل عدم الإجابة",
            sw="Napendelea kutokujibu",
            ha="Na fi yin shiru",
            am="መመለስ አልፈልግም",
            tl="Mas gusto kong huwag sumagot",
            ms="Saya lebih suka tidak menjawab",
            mi="He pai ake kia kaua e whakautu"
        )
    },
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]

_VALUES = [item["value"] for item in TEXTS]
assert len(_VALUES) == len(set(_VALUES)), "duplicate seed values"
assert len(TEXTS) == 44, f"expected 44 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_cognitive_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_cognitive_section",
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
        f"seed_profile_cognitive_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())