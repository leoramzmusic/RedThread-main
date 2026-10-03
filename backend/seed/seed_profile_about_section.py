"""
Seed the `profile_about_section` system options catalog for UI texts in the
Self-introduction section (AboutMe) + safety modal.

Keys resolve as profile.aboutMe, profile.bio_placeholder, ... (flat) and
profile.safety.title, profile.safety.body, ... (nested via dots).

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_about_section.py
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
        "value": "aboutMe",
        "order": 0,
        "translations": L(
            es="Sobre mí", en="About me",
            pt="Sobre mim", fr="À propos de moi",
            de="Über mich", it="Su di me",
            ru="Обо мне", sv="Om mig",
            nl="Over mij", zh="关于我",
            hi="मेरे बारे में", bn="আমার সম্পর্কে",
            ja="自己紹介", ko="자기소개",
            ar="عني", sw="Kuhusu mimi",
            ha="Game da ni", am="ስለ እኔ",
            tl="Tungkol sa akin", ms="Tentang saya",
            mi="Mōku",
        ),
    },
    {
        "value": "max_chars_500",
        "order": 1,
        "translations": L(
            es="Máximo 500 caracteres", en="Maximum 500 characters",
            pt="Máximo 500 caracteres", fr="500 caractères maximum",
            de="Maximal 500 Zeichen", it="Massimo 500 caratteri",
            ru="Максимум 500 символов", sv="Max 500 tecken",
            nl="Maximaal 500 tekens", zh="最多500个字符",
            hi="अधिकतम 500 अक्षर", bn="সর্বাধিক ৫০০ অক্ষর",
            ja="最大500文字", ko="최대 500자",
            ar="500 حرف كحد أقصى", sw="Herufi 500 maximum",
            ha="Matsakaicin haruffa 500", am="ከፍተኛ 500 ቁምፊዎች",
            tl="Pinakamataas na 500 character", ms="Maksimum 500 aksara",
            mi="Mōrahi 500 pūāhua",
        ),
    },
    {
        "value": "bio_placeholder",
        "order": 2,
        "translations": L(
            es="Esta es tu voz sin imagen. Haz que tu descripción sea tu primer gesto de conexión.",
            en="This is your voice without image. Make your description your first gesture of connection.",
            pt="Esta é sua voz sem imagem. Faça sua descrição seu primeiro gesto de conexão.",
            fr="C'est ta voix sans image. Fais de ta description ton premier geste de connexion.",
            de="Das ist deine Stimme ohne Bild. Mach deine Beschreibung zu deiner ersten Geste der Verbindung.",
            it="Questa è la tua voce senza immagine. Fai della tua descrizione il tuo primo gesto di connessione.",
            ru="Это ваш голос без изображения. Сделайте описание первым жестом связи.",
            sv="Detta är din röst utan bild. Gör din beskrivning till din första kontaktgest.",
            nl="Dit is je stem zonder beeld. Maak van je beschrijving je eerste verbindingsgebaar.",
            zh="这是你不用露脸的声音。让你的描述成为连接的第一步。",
            hi="यह बिना तस्वीर आपकी आवाज़ है। अपने विवरण को जुड़ाव का पहला कदम बनाएं।",
            bn="এটি ছবি ছাড়া আপনার কণ্ঠ। আপনার বিবরণকে সংযোগের প্রথম অঙ্গভঙ্গি করুন।",
            ja="これは画像なしのあなたの声です。説明を最初のつながりの一歩にしましょう。",
            ko="이것은 이미지 없는 당신의 목소리입니다. 설명을 첫 연결의 몸짓으로 만드세요.",
            ar="هذا صوتك دون صورة. اجعل وصفك أول بادرة تواصل.",
            sw="Hii ni sauti yako bila picha. Fanya maelezo yako yawe ishara yako ya kwanza ya uhusiano.",
            ha="Wannan muryarka ce ba tare da hoto ba. Ka sanya bayaninka ya zama farkon alamar haɗuwa.",
            am="ይህ ያለ ምስል ድምጽህ ነው። መግለጫህን የመጀመሪያ የግንኙነት ምልክት አድርግ።",
            tl="Ito ang iyong boses nang walang larawan. Gawin mong unang kilos ng koneksyon ang paglalarawan.",
            ms="Inilah suara anda tanpa gambar. Jadikan penerangan anda isyarat hubungan pertama.",
            mi="Ko tō reo tēnei, kāore he atahanga. Meinga tō whakaahuatanga hei tohu hononga tuatahi.",
        ),
    },
    {
        "value": "prompts_title",
        "order": 3,
        "translations": L(
            es="Pregúntame sobre...", en="Ask me about...",
            pt="Pergunte-me sobre...", fr="Demande-moi...",
            de="Frag mich nach...", it="Chiedimi di...",
            ru="Спроси меня о...", sv="Fråga mig om...",
            nl="Vraag me naar...", zh="问我关于……",
            hi="मुझसे पूछें...", bn="আমাকে জিজ্ঞেস করুন...",
            ja="私に聞いて…", ko="나에게 물어보세요…",
            ar="اسألني عن...", sw="Niulize kuhusu...",
            ha="Tambaye ni game da...", am="ስለ… ጠይቀኝ",
            tl="Tanungin mo ako tungkol sa...", ms="Tanya saya tentang...",
            mi="Pātai mai mō...",
        ),
    },
    {
        "value": "prompts_subtitle",
        "order": 4,
        "translations": L(
            es="Escoge hasta 5 de las siguientes frases para que te conozcan un poco mejor.",
            en="Pick up to 5 of the following prompts so they get to know you better.",
            pt="Escolha até 5 das frases a seguir para te conhecerem melhor.",
            fr="Choisis jusqu'à 5 de ces phrases pour qu'on te connaisse mieux.",
            de="Wähle bis zu 5 der folgenden Sätze, damit man dich besser kennenlernt.",
            it="Scegli fino a 5 delle seguenti frasi per farti conoscere meglio.",
            ru="Выберите до 5 фраз, чтобы вас лучше узнали.",
            sv="Välj upp till 5 av följande meningar så folk lär känna dig bättre.",
            nl="Kies maximaal 5 zinnen zodat men je beter leert kennen.",
            zh="最多选5句话，让大家更了解你。",
            hi="ताकि लोग आपको बेहतर जानें, निम्न में से 5 तक वाक्य चुनें।",
            bn="যাতে আপনাকে আরও ভালোভাবে জানা যায়, নিচের মধ্যে থেকে সর্বাধিক ৫টি বাক্য বেছে নিন।",
            ja="もっと知ってもらうために、次のフレーズから最大5つ選んでください。",
            ko="더 잘 알 수 있도록 다음 문구 중 최대 5개를 고르세요.",
            ar="اختر حتى 5 من العبارات التالية ليتعرفوا عليك أكثر.",
            sw="Chagua hadi misemo 5 kati ya yafuatayo ili wakufahamu vyema.",
            ha="Zaɓi har jimloli 5 daga cikin waɗannan don a san ka sosai.",
            am="እንዲያውቁህ ከሚከተሉት ሐረጎች እስከ 5 ምረጥ።",
            tl="Pumili ng hanggang 5 sa mga sumusunod na parirala para mas makilala ka.",
            ms="Pilih sehingga 5 frasa berikut agar mereka lebih mengenali anda.",
            mi="Kōwhiria kia 5 ngā rerenga e whai ake nei kia mōhio ai rātou ki a koe.",
        ),
    },
    {
        "value": "add_prompt",
        "order": 5,
        "translations": L(
            es="Agregar frase", en="Add phrase",
            pt="Adicionar frase", fr="Ajouter une phrase",
            de="Satz hinzufügen", it="Aggiungi frase",
            ru="Добавить фразу", sv="Lägg till fras",
            nl="Zin toevoegen", zh="添加句子",
            hi="वाक्य जोड़ें", bn="বাক্য যোগ করুন",
            ja="フレーズを追加", ko="문구 추가",
            ar="إضافة عبارة", sw="Ongeza sentensi",
            ha="Ƙara jimla", am="ሐረግ ጨምር",
            tl="Magdagdag ng parirala", ms="Tambah frasa",
            mi="Tāpiri rerenga",
        ),
    },
    {
        "value": "safety.title",
        "order": 6,
        "translations": L(
            es="Consejos de Seguridad", en="Safety tips",
            pt="Dicas de segurança", fr="Conseils de sécurité",
            de="Sicherheitstipps", it="Consigli di sicurezza",
            ru="Советы по безопасности", sv="Säkerhetstips",
            nl="Veiligheidstips", zh="安全提示",
            hi="सुरक्षा सुझाव", bn="নিরাপত্তা পরামর্শ",
            ja="安全のヒント", ko="안전 팁",
            ar="نصائح السلامة", sw="Vidokezo vya usalama",
            ha="Shawarwarin tsaro", am="የደህንነት ምክሮች",
            tl="Mga tip sa kaligtasan", ms="Petua keselamatan",
            mi="Ngā tīwhiri haumaru",
        ),
    },
    {
        "value": "safety.body",
        "order": 7,
        "translations": L(
            es="⚠️ Por tu seguridad, no incluyas nombres de usuario de redes sociales ni información de contacto directa en tu biografía.",
            en="⚠️ For your safety, do not include social media usernames or direct contact info in your bio.",
            pt="⚠️ Para sua segurança, não inclua nomes de usuário de redes sociais nem contato direto na biografia.",
            fr="⚠️ Pour ta sécurité, n'inclus pas de pseudos ni de coordonnées directes dans ta bio.",
            de="⚠️ Zu deiner Sicherheit keine Social-Media-Namen oder Kontaktdaten in die Bio.",
            it="⚠️ Per la tua sicurezza, non includere username social o contatti diretti nella bio.",
            ru="⚠️ Ради безопасности не указывайте ники соцсетей и контакты в био.",
            sv="⚠️ För din säkerhet, inkludera inte användarnamn eller kontaktuppgifter i bion.",
            nl="⚠️ Voor je veiligheid geen socialmedia-namen of contactgegevens in je bio.",
            zh="⚠️ 为了安全，请勿在简介中放社交账号或直接联系方式。",
            hi="⚠️ सुरक्षा हेतु बायो में सोशल मीडिया यूज़रनेम या सीधा संपर्क न डालें।",
            bn="⚠️ নিরাপত্তার জন্য বায়োতে সোশ্যাল মিডিয়া ইউজারনেম বা সরাসরি যোগাযোগ দেবেন না।",
            ja="⚠️ 安全のため、自己紹介にSNS名や直接の連絡先を書かないでください。",
            ko="⚠️ 안전을 위해 자기소개에 SNS 아이디나 직접 연락처를 넣지 마세요.",
            ar="⚠️ لسلامتك، لا تضع أسماء التواصل أو بيانات اتصال مباشرة في نبذتك.",
            sw="⚠️ Kwa usalama wako, usiweke majina ya mitandao wala mawasiliano kwenye wasifu.",
            ha="⚠️ Don amincinka, kar ka saka sunayen kafafen sada zumunta ko bayanan tuntuɓa kai tsaye a bayanin martabarka.",
            am="⚠️ ለደህንነትህ የማህበራዊ ሚዲያ ስሞች ወይም ቀጥተኛ አድራሻ በመገለጫህ ላይ አታስቀምጥ።",
            tl="⚠️ Para sa kaligtasan mo, huwag ilagay ang social media username o direktang contact sa bio.",
            ms="⚠️ Demi keselamatan, jangan letak nama media sosial atau maklumat hubungan langsung dalam bio.",
            mi="⚠️ Mō tō haumaru, kaua e whakauru i ngā ingoa pāpāho, ngā hoapā tika rānei ki tō kōtaha.",
        ),
    },
    {
        "value": "safety.linkPrefix",
        "order": 8,
        "translations": L(
            es="Aprende más sobre nuestras ", en="Learn more about our ",
            pt="Saiba mais sobre nossas ", fr="En savoir plus sur nos ",
            de="Mehr über unsere ", it="Scopri di più sulle nostre ",
            ru="Узнайте больше о наших ", sv="Läs mer om våra ",
            nl="Lees meer over onze ", zh="了解更多关于我们的",
            hi="हमारे बारे में और जानें ", bn="আমাদের সম্পর্কে আরও জানুন ",
            ja="私たちの詳細はこちら ", ko="우리에 대해 더 알아보기 ",
            ar="اعرف المزيد عن ", sw="Jifunze zaidi kuhusu ",
            ha="Ƙara sani game da ", am="ስለ እኛ የበለጠ እወቅ ",
            tl="Alamin pa ang tungkol sa aming ", ms="Ketahui lebih lanjut tentang ",
            mi="Me ako anō mō ō mātou ",
        ),
    },
    {
        "value": "safety.linkText",
        "order": 9,
        "translations": L(
            es="Reglas de la comunidad", en="Community rules",
            pt="Regras da comunidade", fr="Règles de la communauté",
            de="Community-Regeln", it="Regole della community",
            ru="Правила сообщества", sv="Gemenskapsregler",
            nl="Communityregels", zh="社区规则",
            hi="सामुदायिक नियम", bn="কমিউনিটি নিয়ম",
            ja="コミュニティルール", ko="커뮤니티 규칙",
            ar="قواعد المجتمع", sw="Sheria za jamii",
            ha="Dokokin al'umma", am="የማህበረሰብ ደንቦች",
            tl="Mga panuntunan ng komunidad", ms="Peraturan komuniti",
            mi="Ngā ture hapori",
        ),
    },
    {
        "value": "safety.button",
        "order": 10,
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
assert len(TEXTS) == 11, f"expected 11 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_about_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_about_section",
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
        f"seed_profile_about_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
