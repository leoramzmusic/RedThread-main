"""
Seed the `profile_pronouns_section` system options catalog for UI texts in the
Pronouns section (title, quote, dropdown label + categories/options).

The texts in PronounsSection read from GET /options/section/profile_pronouns_section.
Categories/options resolve via dynamic keys profile.pronouns.cat.* and
profile.pronouns.opt.* with the raw Spanish string as fallback.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_pronouns_section.py
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
            es="Pronombres", en="Pronouns",
            pt="Pronomes", fr="Pronoms",
            de="Pronomen", it="Pronomi",
            ru="Местоимения", sv="Pronomen",
            nl="Voornaamwoorden", zh="代词",
            hi="सर्वनाम", bn="সর্বনাম",
            ja="代名詞", ko="대명사",
            ar="الضمائر", sw="Viwakilishi",
            ha="Wakilan suna", am="ተውላጠ ስሞች",
            tl="Mga panghalip", ms="Kata ganti",
            mi="Tūwāhi",
        ),
    },
    {
        "value": "quote",
        "order": 1,
        "translations": L(
            es="“Tus pronombres definen cómo te nombramos, no cómo conectas.”",
            en="“Your pronouns define how we name you, not how you connect.”",
            pt="“Seus pronomes definem como te chamamos, não como você se conecta.”",
            fr="« Vos pronoms définissent comment on vous nomme, pas comment vous connectez. »",
            de="„Deine Pronomen bestimmen, wie wir dich benennen, nicht wie du dich verbindest.“",
            it="“I tuoi pronomi definiscono come ti chiamiamo, non come ti connetti.”",
            ru="«Ваши местоимения определяют, как мы вас называем, а не как вы общаетесь.»",
            sv="”Dina pronomen definierar hur vi benämner dig, inte hur du kopplar.”",
            nl="“Je voornaamwoorden bepalen hoe we je noemen, niet hoe je verbindt.”",
            zh="“你的代词定义我们如何称呼你，而非你如何连接。”",
            hi="“आपके सर्वनाम तय करते हैं कि हम आपको क्या कहें, न कि आप कैसे जुड़ते हैं।”",
            bn="“আপনার সর্বনাম নির্ধারণ করে আমরা আপনাকে কী বলে ডাকি, আপনি কীভাবে সংযোগ করেন তা নয়।”",
            ja="“あなたの代名詞は呼び方を決めるもので、つながり方ではありません。”",
            ko="“당신의 대명사는 우리가 당신을 어떻게 부르는지를 정의합니다, 연결 방식은 아닙니다.”",
            ar="“ضمائرك تحدد كيف نسميك، وليس كيف تتواصل.”",
            sw="“Viwakilishi vyako vinafafanua tunavyokuita, si unavyounganika.”",
            ha="“Wakilan sunanka sun bayyana yadda muke kiranka, ba yadda kake haɗuwa ba.”",
            am="“ተውላጠ ስሞችህ እንዴት እንደምንጠራህ ይገልጻሉ እንጂ እንዴት እንደምትገናኝ አይደለም።”",
            tl="“Tinutukoy ng iyong mga panghalip kung paano ka namin tawagin, hindi kung paano ka kumonekta.”",
            ms="“Kata ganti anda menentukan cara kami memanggil anda, bukan cara anda berhubung.”",
            mi="“Ko ō tūwāhi e whakamārama ana me pēhea mātou e karanga ai i a koe, ehara i te pēhea koe e tūhono ai.”",
        ),
    },
    {
        "value": "label",
        "order": 2,
        "translations": L(
            es="Pronombres", en="Pronouns",
            pt="Pronomes", fr="Pronoms",
            de="Pronomen", it="Pronomi",
            ru="Местоимения", sv="Pronomen",
            nl="Voornaamwoorden", zh="代词",
            hi="सर्वनाम", bn="সর্বনাম",
            ja="代名詞", ko="대명사",
            ar="الضمائر", sw="Viwakilishi",
            ha="Wakilan suna", am="ተውላጠ ስሞች",
            tl="Mga panghalip", ms="Kata ganti",
            mi="Tūwāhi",
        ),
    },
    {
        "value": "tooltip",
        "order": 3,
        "translations": L(
            es="Tu pronombre es parte de tu identidad. La compatibilidad se basa en la orientación sexual y otros factores.",
            en="Your pronoun is part of your identity. Compatibility is based on sexual orientation and other factors.",
            pt="Seu pronome faz parte da sua identidade. A compatibilidade baseia-se na orientação sexual e outros fatores.",
            fr="Votre pronom fait partie de votre identité. La compatibilité repose sur l'orientation sexuelle et d'autres facteurs.",
            de="Dein Pronomen ist Teil deiner Identität. Kompatibilität basiert auf sexueller Orientierung und anderen Faktoren.",
            it="Il tuo pronome fa parte della tua identità. La compatibilità si basa su orientamento sessuale e altri fattori.",
            ru="Ваше местоимение — часть вашей идентичности. Совместимость основана на сексуальной ориентации и других факторах.",
            sv="Ditt pronomen är en del av din identitet. Kompatibilitet baseras på sexuell läggning och andra faktorer.",
            nl="Je voornaamwoord is deel van je identiteit. Compatibiliteit is gebaseerd op seksuele oriëntatie en andere factoren.",
            zh="你的代词是你身份的一部分。匹配度基于性取向和其他因素。",
            hi="आपका सर्वनाम आपकी पहचान का हिस्सा है। अनुकूलता यौन अभिविन्यास और अन्य कारकों पर आधारित है।",
            bn="আপনার সর্বনাম আপনার পরিচয়ের অংশ। সামঞ্জস্য যৌন অভিমুখিতা ও অন্যান্য বিষয়ের উপর ভিত্তি করে।",
            ja="代名詞はあなたのアイデンティティの一部です。相性は性的指向や他の要素に基づきます。",
            ko="대명사는 당신의 정체성의 일부입니다. 궁합은 성적 지향 및 기타 요소에 기반합니다.",
            ar="ضميرك جزء من هويتك. يعتمد التوافق على التوجه الجنسي وعوامل أخرى.",
            sw="Kiwakilishi chako ni sehemu ya utambulisho wako. Upatanifu unategemea mwelekeo wa kingono na mambo mengine.",
            ha="Wakilin sunanka wani ɓangare ne na ainihin ka. Daidaituwa ta dogara ne da yanayin jima'i da wasu abubuwa.",
            am="ተውላጠ ስምህ የማንነትህ አካል ነው። ተኳሃኝነት በመነጨት ዝንባሌ እና በሌሎች ነገሮች ላይ የተመሠረተ ነው።",
            tl="Ang iyong panghalip ay bahagi ng iyong pagkakakilanlan. Ang compatibility ay nakabatay sa oryentasyong sekswal at iba pang salik.",
            ms="Kata ganti anda adalah sebahagian daripada identiti anda. Keserasian berdasarkan orientasi seksual dan faktor lain.",
            mi="Ko tō tūwāhi tētahi wāhanga o tō tuakiri. Kei te takoto te hototahi ki te ia whakapapa me ētahi atu āhuatanga.",
        ),
    },
    {
        "value": "cat.pronombres_tradicionales",
        "order": 4,
        "translations": L(
            es="Pronombres tradicionales", en="Traditional pronouns",
            pt="Pronomes tradicionais", fr="Pronoms traditionnels",
            de="Traditionelle Pronomen", it="Pronomi tradizionali",
            ru="Традиционные местоимения", sv="Traditionella pronomen",
            nl="Traditionele voornaamwoorden", zh="传统代词",
            hi="पारंपरिक सर्वनाम", bn="প্রথাগত সর্বনাম",
            ja="伝統的な代名詞", ko="전통적인 대명사",
            ar="الضمائر التقليدية", sw="Viwakilishi vya jadi",
            ha="Wakilan suna na gargajiya", am="ባህላዊ ተውላጠ ስሞች",
            tl="Tradisyonal na mga panghalip", ms="Kata ganti tradisional",
            mi="Ngā tūwāhi tuku iho",
        ),
    },
    {
        "value": "cat.pronombres_no_binarios",
        "order": 5,
        "translations": L(
            es="Pronombres no binarios", en="Non-binary pronouns",
            pt="Pronomes não binários", fr="Pronoms non binaires",
            de="Nicht-binäre Pronomen", it="Pronomi non binari",
            ru="Небинарные местоимения", sv="Ickebinära pronomen",
            nl="Non-binaire voornaamwoorden", zh="非二元代词",
            hi="गैर-द्विआधारी सर्वनाम", bn="নন-বাইনারি সর্বনাম",
            ja="ノンバイナリー代名詞", ko="논바이너리 대명사",
            ar="ضمائر غير ثنائية", sw="Viwakilishi visivyo vya jinsia mbili",
            ha="Wakilan suna marasa jinsi biyu", am="ሁለትዮሽ ያልሆኑ ተውላጠ ስሞች",
            tl="Non-binary na mga panghalip", ms="Kata ganti bukan binari",
            mi="Ngā tūwāhi ira-rua kore",
        ),
    },
    {
        "value": "cat.pronombres_neutros_internacionales",
        "order": 6,
        "translations": L(
            es="Pronombres neutros internacionales", en="International neutral pronouns",
            pt="Pronomes neutros internacionais", fr="Pronoms neutres internationaux",
            de="Internationale neutrale Pronomen", it="Pronomi neutri internazionali",
            ru="Международные нейтральные местоимения", sv="Internationella neutrala pronomen",
            nl="Internationale neutrale voornaamwoorden", zh="国际中性代词",
            hi="अंतर्राष्ट्रीय तटस्थ सर्वनाम", bn="আন্তর্জাতিক নিরপেক্ষ সর্বনাম",
            ja="国際中立代名詞", ko="국제 중립 대명사",
            ar="ضمائر محايدة دولية", sw="Viwakilishi vya kimataifa visivyoegemea",
            ha="Wakilan suna na tsaka-tsaki na duniya", am="ዓለም አቀፍ ገለልተኛ ተውላጠ ስሞች",
            tl="Internasyonal na neutral na mga panghalip", ms="Kata ganti neutral antarabangsa",
            mi="Ngā tūwāhi kūpapa ā-ao",
        ),
    },
    {
        "value": "opt.el",
        "order": 7,
        "translations": L(
            es="Él", en="He", pt="Ele", fr="Il", de="Er", it="Lui",
            ru="Он", sv="Han", nl="Hij", zh="他",
            hi="वह (पु.)", bn="সে (পুং)", ja="彼", ko="그",
            ar="هو", sw="Yeye", ha="Shi", am="እሱ",
            tl="Siya (lalaki)", ms="Dia (lelaki)", mi="Ia (tāne)",
        ),
    },
    {
        "value": "opt.ella",
        "order": 8,
        "translations": L(
            es="Ella", en="She", pt="Ela", fr="Elle", de="Sie", it="Lei",
            ru="Она", sv="Hon", nl="Zij", zh="她",
            hi="वह (स्त्री.)", bn="সে (স্ত্রী)", ja="彼女", ko="그녀",
            ar="هي", sw="Yeye", ha="Ita", am="እሷ",
            tl="Siya (babae)", ms="Dia (perempuan)", mi="Ia (wahine)",
        ),
    },
    {
        "value": "opt.elle",
        "order": 9,
        "translations": L(
            es="Elle", en="Elle", pt="Ile", fr="Iel", de="Xier", it="Lui/Lei",
            ru="Оно (гендерно-нейтральное)", sv="Hen", nl="Hen", zh="TA",
            hi="एले", bn="এলে", ja="エル", ko="엘르",
            ar="إيل", sw="Elle", ha="Elle", am="ኤል",
            tl="Siya (neutral)", ms="Elle", mi="Ia (kūpapa)",
        ),
    },
    {
        "value": "opt.ellx",
        "order": 10,
        "translations": L(
            es="Ellx", en="Ellx", pt="Elx", fr="Elleux", de="Xier", it="Lorx",
            ru="Оно (икс)", sv="Hen", nl="Henx", zh="TA(X)",
            hi="एलैक्स", bn="এলএক্স", ja="エルクス", ko="엘엑스",
            ar="إلكس", sw="Ellx", ha="Ellx", am="ኤልክስ",
            tl="Siya (x)", ms="Ellx", mi="Ia (x)",
        ),
    },
    {
        "value": "opt.ell",
        "order": 11,
        "translations": L(
            es="Ell@", en="Ell@", pt="El@", fr="Ell@", de="Xier", it="L@",
            ru="Оно (@)", sv="Hen", nl="Hen@", zh="TA(@)",
            hi="एल@ ", bn="এল@", ja="エル@", ko="엘@",
            ar="إل@", sw="Ell@", ha="Ell@", am="ኤል@",
            tl="Siya (@)", ms="Ell@", mi="Ia (@)",
        ),
    },
    {
        "value": "opt.they_them",
        "order": 12,
        "translations": L(
            es="They/Them", en="They/Them",
            pt="They/Them", fr="They/Them", de="They/Them", it="They/Them",
            ru="They/Them", sv="They/Them", nl="They/Them", zh="They/Them",
            hi="They/Them", bn="They/Them", ja="They/Them", ko="They/Them",
            ar="They/Them", sw="They/Them", ha="They/Them", am="They/Them",
            tl="They/Them", ms="They/Them", mi="They/Them",
        ),
    },
    {
        "value": "opt.ze_zir",
        "order": 13,
        "translations": L(
            es="Ze/Zir", en="Ze/Zir",
            pt="Ze/Zir", fr="Ze/Zir", de="Ze/Zir", it="Ze/Zir",
            ru="Ze/Zir", sv="Ze/Zir", nl="Ze/Zir", zh="Ze/Zir",
            hi="Ze/Zir", bn="Ze/Zir", ja="Ze/Zir", ko="Ze/Zir",
            ar="Ze/Zir", sw="Ze/Zir", ha="Ze/Zir", am="Ze/Zir",
            tl="Ze/Zir", ms="Ze/Zir", mi="Ze/Zir",
        ),
    },
    {
        "value": "opt.xe_xem",
        "order": 14,
        "translations": L(
            es="Xe/Xem", en="Xe/Xem",
            pt="Xe/Xem", fr="Xe/Xem", de="Xe/Xem", it="Xe/Xem",
            ru="Xe/Xem", sv="Xe/Xem", nl="Xe/Xem", zh="Xe/Xem",
            hi="Xe/Xem", bn="Xe/Xem", ja="Xe/Xem", ko="Xe/Xem",
            ar="Xe/Xem", sw="Xe/Xem", ha="Xe/Xem", am="Xe/Xem",
            tl="Xe/Xem", ms="Xe/Xem", mi="Xe/Xem",
        ),
    },
    {
        "value": "opt.fae_faer",
        "order": 15,
        "translations": L(
            es="Fae/Faer", en="Fae/Faer",
            pt="Fae/Faer", fr="Fae/Faer", de="Fae/Faer", it="Fae/Faer",
            ru="Fae/Faer", sv="Fae/Faer", nl="Fae/Faer", zh="Fae/Faer",
            hi="Fae/Faer", bn="Fae/Faer", ja="Fae/Faer", ko="Fae/Faer",
            ar="Fae/Faer", sw="Fae/Faer", ha="Fae/Faer", am="Fae/Faer",
            tl="Fae/Faer", ms="Fae/Faer", mi="Fae/Faer",
        ),
    },
    {
        "value": "infoModal.title",
        "order": 16,
        "translations": L(
            es="¿Por qué son importantes los pronombres?", en="Why are pronouns important?",
            pt="Por que os pronomes são importantes?", fr="Pourquoi les pronoms sont-ils importants ?",
            de="Warum sind Pronomen wichtig?", it="Perché i pronomi sono importanti?",
            ru="Почему местоимения важны?", sv="Varför är pronomen viktiga?",
            nl="Waarom zijn voornaamwoorden belangrijk?", zh="为什么代词很重要？",
            hi="सर्वनाम क्यों महत्वपूर्ण हैं?", bn="সর্বনাম কেন গুরুত্বপূর্ণ?",
            ja="なぜ代名詞が重要なのですか？", ko="왜 대명사가 중요한가요?",
            ar="لماذا الضمائر مهمة؟", sw="Kwa nini viwakilishi ni muhimu?",
            ha="Me ya sa wakilan suna suke da muhimmanci?", am="ተውላጠ ስሞች ለምን አስፈላጊ ናቸው?",
            tl="Bakit mahalaga ang mga panghalip?", ms="Mengapa kata ganti penting?",
            mi="He aha i hira ai ngā tūwāhi?",
        ),
    },
    {
        "value": "infoModal.text1",
        "order": 17,
        "translations": L(
            es="Los pronombres permiten a nuestrxs usuarixs darle mas profundidad y detalle a su perfil.",
            en="Pronouns let our users add more depth and detail to their profile.",
            pt="Os pronomes permitem que nossxs usuárixs deem mais profundidade e detalhe ao perfil.",
            fr="Les pronoms permettent à nos utilisateur·rice·s d'enrichir leur profil.",
            de="Pronomen geben unseren Nutzer*innen mehr Tiefe und Detail im Profil.",
            it="I pronomi permettono ai nostr* utent* di dare più profondità al profilo.",
            ru="Местоимения позволяют нашим пользователям сделать профиль глубже и детальнее.",
            sv="Pronomen låter våra användare ge profilen mer djup och detalj.",
            nl="Voornaamwoorden geven onze gebruikers meer diepgang in hun profiel.",
            zh="代词让用户为个人资料增添更多深度和细节。",
            hi="सर्वनाम हमारे उपयोगकर्ताओं को प्रोफ़ाइल में गहराई देने देते हैं।",
            bn="সর্বনাম আমাদের ব্যবহারকারীদের প্রোফাইলে গভীরতা যোগ করতে দেয়।",
            ja="代名詞によってプロフィールに深みと詳細を加えられます。",
            ko="대명사를 통해 프로필에 깊이와 디테일을 더할 수 있습니다.",
            ar="تتيح الضمائر لمستخدمينا إضفاء عمق وتفاصيل على الملف.",
            sw="Viwakilishi huwaruhusu watumiaji wetu kuongeza undani kwenye wasifu.",
            ha="Wakilan suna suna bai wa masu amfani damar ƙara zurfi a bayanin martaba.",
            am="ተውላጠ ስሞች ተጠቃሚዎቻችን ለመገለጫቸው ጥልቀት እንዲጨምሩ ያስችላሉ።",
            tl="Hinahayaan ng mga panghalip ang aming mga user na magdagdag ng lalim sa profile.",
            ms="Kata ganti membolehkan pengguna menambah kedalaman pada profil.",
            mi="Mā ngā tūwāhi e āhei ai ō mātou kaiwhakamahi ki te hōhonu ake i ō rātou kōtaha.",
        ),
    },
    {
        "value": "infoModal.text2",
        "order": 18,
        "translations": L(
            es="Los pronombres son parte importante de una persona y nos indican cómo referirnos correctamente a ella.",
            en="Pronouns are an important part of a person and tell us how to refer to them correctly.",
            pt="Os pronomes são parte importante de uma pessoa e indicam como nos referir corretamente a ela.",
            fr="Les pronoms sont une part importante d'une personne et indiquent comment s'y référer correctement.",
            de="Pronomen sind ein wichtiger Teil einer Person und zeigen, wie wir sie korrekt ansprechen.",
            it="I pronomi sono una parte importante di una persona e indicano come riferirsi correttamente a lei.",
            ru="Местоимения — важная часть человека и подсказывают, как к нему правильно обращаться.",
            sv="Pronomen är en viktig del av en person och visar hur vi ska tilltala hen korrekt.",
            nl="Voornaamwoorden zijn een belangrijk deel van iemand en tonen hoe we hen correct aanspreken.",
            zh="代词是个人身份的重要部分，指引我们如何正确称呼对方。",
            hi="सर्वनाम व्यक्ति का महत्वपूर्ण हिस्सा हैं और बताते हैं कि उन्हें सही से कैसे संबोधित करें।",
            bn="সর্বনাম একজন ব্যক্তির গুরুত্বপূর্ণ অংশ এবং তাকে সঠিকভাবে কীভাবে সম্বোধন করতে হয় তা নির্দেশ করে।",
            ja="代名詞はその人にとって大切な要素であり、正しい呼び方を示します。",
            ko="대명사는 한 사람의 중요한 부분이며 올바르게 지칭하는 법을 알려줍니다.",
            ar="الضمائر جزء مهم من الشخص وتوضح كيفية الإشارة إليه بشكل صحيح.",
            sw="Viwakilishi ni sehemu muhimu ya mtu na vinaonyesha jinsi ya kumtaja kwa usahihi.",
            ha="Wakilan suna wani muhimmin ɓangare ne na mutum kuma suna nuna yadda za a yi masa magana daidai.",
            am="ተውላጠ ስሞች የአንድ ሰው አስፈላጊ አካል ናቸው እና እንዴት በትክክል እንደምንጠቅሳቸው ያሳያሉ።",
            tl="Ang mga panghalip ay mahalagang bahagi ng isang tao at nagsasabi kung paano siya tukuyin nang tama.",
            ms="Kata ganti adalah bahagian penting seseorang dan menunjukkan cara merujuk kepadanya dengan betul.",
            mi="He wāhanga nui te tūwāhi o te tangata, e tohu ana me pēhea te tika o te karanga i a ia.",
        ),
    },
    {
        "value": "infoModal.button",
        "order": 19,
        "translations": L(
            es="De acuerdo", en="Got it",
            pt="Entendido", fr="D'accord",
            de="Verstanden", it="Va bene",
            ru="Понял", sv="Förstått",
            nl="Begrepen", zh="明白了",
            hi="ठीक है", bn="ঠিক আছে",
            ja="わかりました", ko="알겠습니다",
            ar="مفهوم", sw="Nimeelewa",
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
assert len(TEXTS) == 20, f"expected 20 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_pronouns_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_pronouns_section",
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
        f"seed_profile_pronouns_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
