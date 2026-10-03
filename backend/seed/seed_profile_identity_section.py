"""
Seed the `profile_identity_section` system options catalog for UI texts in the
Basic Info / Identity section + identity info modal.

Keys resolve flat as profile.* (e.g. profile.nickname_label) and nested as
profile.identity.infoModal.* via dots.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_identity_section.py
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
        "value": "sections.identity.title",
        "order": 0,
        "translations": L(
            es="Identidad", en="Identity",
            pt="Identidade", fr="Identité",
            de="Identität", it="Identità",
            ru="Личность", sv="Identitet",
            nl="Identiteit", zh="身份",
            hi="पहचान", bn="পরিচয়",
            ja="身元", ko="신원",
            ar="الهوية", sw="Utambulisho",
            ha="Shaida", am="ማንነት",
            tl="Pagkakakilanlan", ms="Identiti",
            mi="Tuakiri",
        ),
    },
    {
        "value": "nickname_label",
        "order": 1,
        "translations": L(
            es="Apodo / Nickname", en="Nickname",
            pt="Apelido / Nickname", fr="Pseudo",
            de="Spitzname", it="Nickname",
            ru="Никнейм", sv="Smeknamn",
            nl="Bijnaam", zh="昵称",
            hi="उपनाम", bn="ডাকনাম",
            ja="ニックネーム", ko="닉네임",
            ar="اللقب", sw="Jina la utani",
            ha="Laƙabi", am="ቅጽል ስም",
            tl="Palayaw", ms="Nama samaran",
            mi="Ingoa karanga",
        ),
    },
    {
        "value": "nickname_placeholder",
        "order": 2,
        "translations": L(
            es="Cómo quieres que te llamen", en="What you want to be called",
            pt="Como você quer ser chamado", fr="Comment veux-tu qu'on t'appelle",
            de="Wie du genannt werden willst", it="Come vuoi essere chiamato",
            ru="Как к вам обращаться", sv="Vad du vill bli kallad",
            nl="Hoe je genoemd wilt worden", zh="希望别人怎么称呼你",
            hi="आपको क्या कहकर बुलाएं", bn="আপনাকে কী বলে ডাকবে",
            ja="呼ばれたい名前", ko="불리고 싶은 이름",
            ar="ماذا تريد أن ينادوك", sw="Unataka kuitwaje",
            ha="Yaya kake a kira ka", am="እንዴት እንዲጠሩህ ትፈልጋለህ",
            tl="Anong gusto mong itawag sa iyo", ms="Apa nama panggilan anda",
            mi="Me pēhea e karanga ai koe",
        ),
    },
    {
        "value": "nickname_helper",
        "order": 3,
        "translations": L(
            es="Este es el nombre que verán los demás. Puede contener espacios y acentos.",
            en="This is the name others will see. It may contain spaces and accents.",
            pt="Este é o nome que os outros verão. Pode conter espaços e acentos.",
            fr="C'est le nom que les autres verront. Espaces et accents acceptés.",
            de="Diesen Namen sehen andere. Leerzeichen und Akzente erlaubt.",
            it="Questo è il nome che vedranno gli altri. Può contenere spazi e accenti.",
            ru="Это имя увидят другие. Допустимы пробелы и ударения.",
            sv="Detta namn ser andra. Mellanslag och accenter går bra.",
            nl="Dit is de naam die anderen zien. Spaties en accenten mogen.",
            zh="这是别人看到的名字。可含空格和重音。",
            hi="यह वह नाम है जो दूसरे देखेंगे। इसमें स्पेस और उच्चारण चिह्न हो सकते हैं।",
            bn="এটি সেই নাম যা অন্যরা দেখবে। এতে স্পেস ও অ্যাকসেন্ট থাকতে পারে।",
            ja="これは他の人に表示される名前です。スペースやアクセント可。",
            ko="이 이름이 다른人に 표시됩니다. 공백과 악센트 가능.",
            ar="هذا هو الاسم الذي سيراه الآخرون. يمكن أن يحتوي مسافات وعلامات.",
            sw="Hili ndilo jina watakaloliona wengine. Linaweza kuwa na nafasi na lafudhi.",
            ha="Wannan shi ne sunan da wasu za su gani. Zai iya ɗaukar sarari da alamu.",
            am="ይህ ሌሎች የሚያዩት ስም ነው። ክፍተቶችን እና አነጋገሮችን ሊይዝ ይችላል።",
            tl="Ito ang pangalang makikita ng iba. Pwedeng may espasyo at diin.",
            ms="Inilah nama yang akan dilihat orang lain. Boleh mengandungi jarak dan aksen.",
            mi="Ko te ingoa tēnei ka kitea e ētahi atu. Ka āhei he mokowā me ngā tohu.",
        ),
    },
    {
        "value": "email_label",
        "order": 4,
        "translations": L(
            es="Email", en="Email",
            pt="E-mail", fr="E-mail",
            de="E-Mail", it="Email",
            ru="Эл. почта", sv="E-post",
            nl="E-mail", zh="邮箱",
            hi="ईमेल", bn="ইমেইল",
            ja="メール", ko="이메일",
            ar="البريد", sw="Barua pepe",
            ha="Imel", am="ኢሜይል",
            tl="Email", ms="E-mel",
            mi="Īmēra",
        ),
    },
    {
        "value": "email_helper",
        "order": 5,
        "translations": L(
            es="Tu correo electrónico", en="Your email address",
            pt="Seu e-mail", fr="Ton adresse e-mail",
            de="Deine E-Mail-Adresse", it="Il tuo indirizzo email",
            ru="Ваш адрес эл. почты", sv="Din e-postadress",
            nl="Je e-mailadres", zh="你的电子邮箱",
            hi="आपका ईमेल पता", bn="আপনার ইমেইল ঠিকানা",
            ja="あなたのメールアドレス", ko="당신의 이메일 주소",
            ar="بريدك الإلكتروني", sw="Barua pepe yako",
            ha="Imel ɗinka", am="የኢሜይል አድራሻህ",
            tl="Ang iyong email address", ms="Alamat e-mel anda",
            mi="Tō wāhitau īmēra",
        ),
    },
    {
        "value": "phone_label",
        "order": 6,
        "translations": L(
            es="Teléfono", en="Phone",
            pt="Telefone", fr="Téléphone",
            de="Telefon", it="Telefono",
            ru="Телефон", sv="Telefon",
            nl="Telefoon", zh="电话",
            hi="फ़ोन", bn="ফোন",
            ja="電話", ko="전화",
            ar="هاتف", sw="Simu",
            ha="Waya", am="ስልክ",
            tl="Telepono", ms="Telefon",
            mi="Waea",
        ),
    },
    {
        "value": "phone_helper",
        "order": 7,
        "translations": L(
            es="Puedes usar este número para iniciar sesión en tu cuenta",
            en="You can use this number to log into your account",
            pt="Você pode usar este número para entrar na conta",
            fr="Tu peux utiliser ce numéro pour te connecter",
            de="Du kannst diese Nummer zum Anmelden verwenden",
            it="Puoi usare questo numero per accedere al tuo account",
            ru="Этот номер можно использовать для входа",
            sv="Du kan använda numret för att logga in",
            nl="Je kunt dit nummer gebruiken om in te loggen",
            zh="可用此号码登录你的账户",
            hi="इस नंबर से खाते में लॉगिन कर सकते हैं",
            bn="এই নম্বর দিয়ে অ্যাকাউন্টে লগইন করতে পারেন",
            ja="この番号でアカウントにログインできます",
            ko="이 번호로 계정에 로그인할 수 있습니다",
            ar="يمكنك استخدام هذا الرقم لتسجيل الدخول",
            sw="Unaweza kutumia namba hii kuingia",
            ha="Za ka iya amfani da wannan lamba don shiga asusunka",
            am="ይህን ቁጥር ለመግባት መ Electionት መጠቀም ትችላለህ",
            tl="Magagamit mo ang numerong ito sa pag-log in",
            ms="Anda boleh guna nombor ini untuk log masuk",
            mi="Ka taea e koe te whakamahi i tēnei nama ki te takiuru",
        ),
    },
    {
        "value": "country_label",
        "order": 8,
        "translations": L(
            es="País", en="Country",
            pt="País", fr="Pays",
            de="Land", it="Paese",
            ru="Страна", sv="Land",
            nl="Land", zh="国家",
            hi="देश", bn="দেশ",
            ja="国", ko="국가",
            ar="الدولة", sw="Nchi",
            ha="Ƙasa", am="ሀገር",
            tl="Bansa", ms="Negara",
            mi="Whenua",
        ),
    },
    {
        "value": "country_placeholder",
        "order": 9,
        "translations": L(
            es="Buscar por país o código...", en="Search by country or code...",
            pt="Buscar por país ou código...", fr="Rechercher par pays ou code...",
            de="Nach Land oder Code suchen...", it="Cerca per paese o codice...",
            ru="Поиск по стране или коду...", sv="Sök på land eller kod...",
            nl="Zoek op land of code...", zh="按国家或代码搜索…",
            hi="देश या कोड से खोजें...", bn="দেশ বা কোড দিয়ে খুঁজুন...",
            ja="国またはコードで検索…", ko="국가 또는 코드로 검색…",
            ar="بحث حسب الدولة أو الرمز...", sw="Tafuta kwa nchi au msimbo...",
            ha="Nemi ta ƙasa ko lamba...", am="በሀገር ወይም በኮድ ፈልግ…",
            tl="Maghanap ayon sa bansa o code...", ms="Cari mengikut negara atau kod...",
            mi="Rapua mā te whenua, waehere rānei…",
        ),
    },
    {
        "value": "min_length_2",
        "order": 10,
        "translations": L(
            es="Mínimo 2 caracteres", en="Minimum 2 characters",
            pt="Mínimo 2 caracteres", fr="2 caractères minimum",
            de="Mindestens 2 Zeichen", it="Minimo 2 caratteri",
            ru="Минимум 2 символа", sv="Minst 2 tecken",
            nl="Minimaal 2 tekens", zh="至少2个字符",
            hi="न्यूनतम 2 अक्षर", bn="সর্বনিম্ন ২ অক্ষর",
            ja="2文字以上", ko="최소 2자",
            ar="حرفان على الأقل", sw="Herufi 2 angalau",
            ha="Aƙalla haruffa 2", am="ቢያንስ 2 ቁምፊዎች",
            tl="Hindi bababa sa 2 character", ms="Minimum 2 aksara",
            mi="Mōrahi 2 pūāhua",
        ),
    },
    {
        "value": "required_field",
        "order": 11,
        "translations": L(
            es="Este campo es requerido", en="This field is required",
            pt="Este campo é obrigatório", fr="Ce champ est requis",
            de="Dieses Feld ist erforderlich", it="Questo campo è obbligatorio",
            ru="Это поле обязательно", sv="Detta fält är obligatoriskt",
            nl="Dit veld is verplicht", zh="此字段为必填",
            hi="यह फ़ील्ड आवश्यक है", bn="এই ঘরটি আবশ্যক",
            ja="この項目は必須です", ko="이 항목은 필수입니다",
            ar="هذا الحقل مطلوب", sw="Sehemu hii inahitajika",
            ha="Wannan filin wajibi ne", am="ይህ መስክ ያስፈልጋል",
            tl="Kinakailangan ang field na ito", ms="Medan ini wajib",
            mi="Me whakakī i tēnei āpure",
        ),
    },
    {
        "value": "identity.infoModal.title",
        "order": 12,
        "translations": L(
            es="¿Por qué pedimos tu identidad?", en="Why do we ask for your identity?",
            pt="Por que pedimos sua identidade?", fr="Pourquoi demandons-nous ton identité ?",
            de="Warum fragen wir nach deiner Identität?", it="Perché chiediamo la tua identità?",
            ru="Зачем нам ваша личность?", sv="Varför frågar vi efter din identitet?",
            nl="Waarom vragen we je identiteit?", zh="为什么需要你的身份信息？",
            hi="हम आपकी पहचान क्यों मांगते हैं?", bn="আমরা আপনার পরিচয় কেন চাই?",
            ja="本人確認が必要な理由", ko="신원을 묻는 이유",
            ar="لماذا نطلب هويتك؟", sw="Kwa nini tunauliza utambulisho wako?",
            ha="Me ya sa muke tambayar shaida?", am="ማንነትህን ለምን እንጠይቃለን?",
            tl="Bakit namin hinihingi ang pagkakakilanlan mo?", ms="Mengapa kami meminta identiti anda?",
            mi="He aha mātou i tono ai i tō tuakiri?",
        ),
    },
    {
        "value": "identity.infoModal.text",
        "order": 13,
        "translations": L(
            es="Tu identidad nos ayuda a verificar tu perfil y mantener la seguridad de la comunidad. Nunca compartiremos tus datos sin tu consentimiento.",
            en="Your identity helps us verify your profile and keep the community safe. We will never share your data without consent.",
            pt="Sua identidade nos ajuda a verificar seu perfil e manter a comunidade segura. Nunca compartilharemos seus dados sem consentimento.",
            fr="Ton identité nous aide à vérifier ton profil et à garder la communauté sûre. Nous ne partagerons jamais tes données sans consentement.",
            de="Deine Identität hilft uns, dein Profil zu verifizieren. Wir geben deine Daten nie ohne Zustimmung weiter.",
            it="La tua identità ci aiuta a verificare il profilo. Non condivideremo mai i tuoi dati senza consenso.",
            ru="Личность помогает проверить профиль и безопасность. Мы никогда не передадим данные без согласия.",
            sv="Din identitet hjälper oss verifiera din profil. Vi delar aldrig dina uppgifter utan samtycke.",
            nl="Je identiteit helpt je profiel te verifiëren. We delen je gegevens nooit zonder toestemming.",
            zh="你的身份信息帮助我们验证资料、保障社区安全。未经同意绝不分享你的数据。",
            hi="आपकी पहचान प्रोफ़ाइल सत्यापित करने में मदद करती है। बिना सहमति डेटा साझा नहीं करेंगे।",
            bn="আপনার পরিচয় প্রোফাইল যাচাই করতে সাহায্য করে। সম্মতি ছাড়া তথ্য ভাগ করব না।",
            ja="本人情報はプロフィール確認と安全維持に使います。同意なく共有しません。",
            ko="신원 정보는 프로필 확인과 커뮤니티 안전에 사용됩니다. 동의 없이 공유하지 않습니다.",
            ar="تساعدنا هويتك في التحقق من ملفك. لن نشارك بياناتك دون موافقة.",
            sw="Utambulisho wako hutusaidia kuthibitisha wasifu. Hatutashiriki data bila ridhaa.",
            ha="Shaidarka tana taimaka mana tabbatar da bayanin martabarka. Ba za mu raba bayananka ba tare da izini ba.",
            am="ማንነትህ መገለጫህን ለማረጋገጥ ይረዳናል። ያለ እርስዎ ፈቃድ መረጃህን አናጋራም።",
            tl="Tinutulungan kami ng pagkakakilanlan mo na i-verify ang profile. Hindi namin ibabahagi ang datos nang walang pahintulot.",
            ms="Identiti anda membantu kami mengesahkan profil. Kami tidak akan berkongsi data tanpa keizinan.",
            mi="Mā tō tuakiri e āhei ai mātou ki te manatoko i tō kōtaha. E kore rawa e tuari i ō raraunga ki te kore whakaaetanga.",
        ),
    },
    {
        "value": "identity.infoModal.button",
        "order": 14,
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
assert len(TEXTS) == 15, f"expected 15 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_identity_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_identity_section",
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
        f"seed_profile_identity_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
