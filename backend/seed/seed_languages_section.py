"""
Seed the `languages_section` system options catalog for UI texts in Languages section.

The texts in LanguagesSection read from GET /options?category=languages_section.
Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_languages_section.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

# Texts for the Languages section UI
# (value, order, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi)
TEXTS = [
    # title
    ("title", 0,
     "Idiomas", "Languages", "Idiomas", "Langues", "Sprachen", "Lingue", "Языки", "Språk", "Talen", "语言", "भाषाएँ", "ভাষা", "言語", "언어", "اللغات", "Lugha", "Harshe", "ቋንቋ", "Wika", "Bahasa", "Reo"),
    # spokenLabel
    ("spokenLabel", 1,
     "Idiomas que hablo", "Languages I speak", "Idiomas que falo", "Langues que je parle", "Sprachen, die ich spreche", "Lingue che parlo", "Языки, которые я говорю", "Språk jag talar", "Talen die ik spreek", "我会说的语言", "मैं जिन भाषाओं को बोलता हूँ", "আমি যেসব ভাষা বলি", "私が話す言語", "내가 하는 언어", "اللغات التي أتحدثها", "Lugha ninazungumza", "Harshen da na jin dadin magana", "ቋንቋዎች የሚናገሩት", "Mga wikang sinasalita ko", "Bahasa yang saya bicarakan", "Ngā reo e kōrerotia ana e au"),
    # affinityTitle
    ("affinityTitle", 2,
     "Afinidad Lingüística Global", "Global Linguistic Affinity", "Afinidade Linguística Global", "Affinité Linguistique Mondiale", "Globale Sprachliche Affinität", "Affinità Linguistica Globale", "Глобальная лингвистическая аффининость", "Global Lingvistisk Affinitet", "Wereldwijde Taalkundige Affiniteit", "全球语言亲和力", "वैश्विक भाषाई समानता", "বিশ্বব্যাপী ভাষাগতfinity", "グローバル言語親和性", "글로벌 언어 친화도", "العلاقة اللغوية العالمية", "Uhusiano wa Lugha Duniani", "Alumanci na Harsuna Duniya", "ዓለም አቀፍ ቋንቋ ማሳያ", "Pandaigdigang Linggwistik na Affinity", "Afinitas Linguistik Global", "Hononga Reo Ao Whānui"),
    # affinityQuote
    ("affinityQuote", 3,
     "Tus idiomas son puentes. CARE los usa para conectar con personas que puedan entenderte de verdad.", "Your languages are bridges. CARE uses them to connect you with people who can truly understand you.", "Suas línguas são pontes. CARE as usa para conectar você com pessoas que podem realmente te entender.", "Vos langues sont des ponts. CARE les utilise pour vous connecter avec des gens qui peuvent vraiment vous comprendre.", "Deine Sprachen sind Brücken. CARE nutzt sie, um dich mit Menschen zu verbinden, die dich wirklich verstehen können.", "Le tue lingue sono ponti. CARE li usa per connetterti con persone che possono capirti davvero.", "Ваши языки — это мосты. CARE использует их, чтобы связать вас с людьми, которые могут по-настоящему понять вас.", "Dina språk är broar. CARE använder dem för att koppla dig med människor som verkligen kan förstå dig.", "Jouw talen zijn bruggen. CARE gebruikt ze om je te verbinden met mensen die je echt kunnen begrijpen.", "你的语言是桥梁。CARE 用它们将你与真正能理解你的人联系起来。", "आपकी भाषाएँ सेतु हैं। CARE उनका उपयोग आपको उन लोगों से जोड़ने के लिए करता है जो आपको सचमुच समझ सकें।", "আপনার ভাষাগুলো সেতু। CARE তাদের ব্যবহার করে আপনাকে olyan লোকlerle যোগাযোগ দেয় যারা আপনাকে সত্যিকারের বুঝতে পারে।", "あなたの言語は架け橋です。CAREはそれを使って、あなたを真に理解できる人々とつなぎます。", "당신의 언어는 다리입니다. CARE는 그것을 사용하여 진정으로 당신을 이해할 수 있는 사람들과 연결합니다.", "لغاتك جسور. يستخدمها CARE لربطك بأشخاص يمكنهم فهمك حقًا.", "Lugha zako ni miambao. CARE hutumia kukuunganisha na watu wanaoweza kukuelewa kwa kweli.", "Harsunanku zafi kogi. CARE yana amfani da su don hada kai da mutane da zai iya fahimta kai a cikin gaskiya.", "ቋንቋዎችዎ ድልዎች ናቸው። CARE እነሱን ለመገናኘት እያንዳንዱዎች ሰዎች ከተማ ይጠቀማል።", "Ang iyong mga wika ay mga tulay. Ginagamit ito ng CARE upang ikonekta ka sa mga taong tunay na makakaintindi sa iyo.", "Bahasa-bahasa Anda adalah jembatan. CARE menggunakannya untuk menghubungkan Anda dengan orang-orang yang benar-benar memahami Anda.", "Ko ō reo he tuanui. Ka whakamahia e CARE hei tuhono i a koe ki ngā tāngata e mārama ana ki a koe."),
    # filterLabel
    ("filterLabel", 4,
     "Usar mis idiomas para filtrar matches", "Use my languages to filter matches", "Usar meus idiomas para filtrar matches", "Utiliser mes langues pour filtrer les correspondances", "Meine Sprachen zum Filtern von Matches verwenden", "Usa le mie lingue per filtrare i match", "Использовать мои языки для фильтрации совпадений", "Använd mina språk för att filtrera matchningar", "Gebruik mijn talen om matches te filteren", "使用我的语言筛选匹配", "मेरी भाषाओं का उपयोग मैच फ़िल्टर करने के लिए करें", "আমার ভাষাগুলো ব্যবহার করে ম্যাচ ফিল্টার করুন", "自分の言語を使ってマッチをフィルタリング", "내 언어로 매치 필터링하기", "استخدم لغاتي لتصفية التطابقات", "Tumia lugha zangu kuichuja matches", "Yi amfani da harsunana don tsafta matches", "የእርስዎን ቋንቋዎችን ለማጠቃለያ ይጠቀሙ", "Gamitin ang aking mga wika upang i-filter ang mga match", "Gunakan bahasa saya untuk memfilter kecocokan", "Whakamahi i ōku reo hei whiriwhiri i ngā hua tāpiri"),
    # filterOn
    ("filterOn", 5,
     "Priorizando personas que hablan tus idiomas para una comunicación fluida.", "Prioritizing people who speak your languages for fluent communication.", "Priorizando pessoas que falam seus idiomas para uma comunicação fluida.", "Prioriser les personnes qui parlent vos langues pour une communication fluide.", "Personen priorisieren, die Ihre Sprachen sprechen, für flüssige Kommunikation.", "Dando priorità a chi parla le tue lingue per una comunicazione fluida.", "Приоритет людям, говорящим на ваших языках, для бесшовного общения.", "Prioritera människor som talar dina språk för flytande kommunikation.", "Prioriteren van mensen die jouw talen spreken voor vloeiende communicatie.", "优先考虑说你语言的人以实现流畅沟通。", "आपकी भाषाएँ बोलने वाले लोगों को प्राथमिकता देकर सुचारु संचार के लिए।", "আপনার ভাষা বলা লোকদের প্রাধান্য দিয়ে স bailar যোগাযোগের জন্য।", "あなたの言語を話す人を優先して円滑なコミュニケーションを実現。", "당신의 언어를 구사하는 사람들을 우선시하여 원활한 소통을 위해.", "إعطاء الأولوية للأشخاص الذين يتحدثون لغاتك للتواصل السلس.", "Kipaumbe watu wanaozungumza lugha zako kwa mawasiliano yasiyo na kizuizi.", "Mamman mutanen da ke magana da harsunanku don hirafwa mai sauki.", "የቋንቋዎችዎን የሚናገሩትን ሰዎች ለቀላል ግንዛቤ ለማስተዳደር በፈተና ያደርጋሉ።", "Pinoprioridad ang mga taong nagsasalita ng iyong mga wika para sa madalas na komunikasyon.", "Memprioritaskan orang yang berbicara bahasa Anda untuk komunikasi yang lancar.", "Kei te tuhono i ngā tāngata e kōrero ana i ō reo mō te kōrero puta noa."),
    # filterOff
    ("filterOff", 6,
     "Modo explorador activado: Abierto a conexiones interculturales sin barreras lingüísticas.", "Explorer mode activated: Open to cross-cultural connections without language barriers.", "Modo explorador ativado: Aberto a conexões interculturais sem barreiras linguísticas.", "Mode explorateur activé : Ouvert aux connexions interculturelles sans barrières linguistiques.", "Entdeckermodus aktiviert: Offen für interkulturelle Verbindungen ohne Sprachbarrieren.", "Modalità esploratore attivata: Aperto a connessioni interculturali senza barriere linguistiche.", "Режим исследователя активирован: Открыт для межкультурных связей без языковых барьеров.", "Utforskarläge aktiverat: Öppet för tvärkulturella kopplingar utan språkliga barriärer.", "Verkenmodus geactiveerd: Open voor interculturele connecties zonder taalbarrières.", "探索模式已激活：开放跨文化连接，无语言障碍。", "एक्सप्लोरर मोड सक्रिय: भाषा की बाधाओं के बिना अंतर-सांस्कृतिक कनेक्शन के लिए खुला।", "এক্সপ্লোরার মোড সক্রিয়: ভাষাগত বাধা ছাড়া�� সংস্কৃতি প্রভাবিত সংযোগের জন্য খোলা।", "探索モード有効: 言語の壁のない異文化間のつながりにオープン。", "탐색 모드 활성화: 언어 장벽 없는 다문화 연결에 열려 있음.", "تم تفعيل وضع المستكشف: منفتح على الاتصالات بين الثقافات دون حواجز لغوية.", "Hali ya mchungaji imefunguliwa: Wazi kwa uhusiano wa kitamaduni bila vikwazo vya lugha.", "A gyara 'explorer' ya faru: Waziri ga haɗin al'adu ba tare da kuzari harshe.", "ምርጫ ၂ር አስተካክለዋል፡ የቋንቋ አስቀረዎች የለም የባህል ግንዛቤ አይተ ይቻላል።", "Naka-activate na ang explorer mode: Bukas sa cross-cultural connections nang walang hadlang sa wika.", "Mode penjelajah diaktifkan: Terbuka untuk koneksi lintas budaya tanpa hambatan bahasa.", "Kua oho te āhua toro: Wātea ki ngā hononga ahurea kē i ngā aukati reo."),
    # badge2
    ("badge2", 7,
     "Bilingüe", "Bilingual", "Bilíngue", "Bilingue", "Zweisprachig", "Bilingue", "Двуязычный", "Tvåspråkig", "Tweetalig", "双语", "द्विभाषी", "দ্বিভাষী", "バイリンガル", "이중 언어", "ثنائي اللغة", "Kiwango cha lugha mbili", "Ƙwarai biyu", "የሁለት ቋንቋ", "Bilinggwal", "Bilingual", "Reo e rua"),
    # badge3
    ("badge3", 8,
     "Trilingüe", "Trilingual", "Trilíngue", "Trilingue", "Dreisprachig", "Trilingue", "Трехъязычный", "Trespråkig", "Drietaling", "三语", "त्रिभाषी", "ত্রিভাষী", "トリリンガル", "삼중 언어", "ثلاثي اللغة", "Kiwango cha lugha tatu", "Ƙwarai uku", "የሶስት ቋንቋ", "Trilinggwal", "Trilingual", "Reo e toru"),
    # badge4
    ("badge4", 9,
     "Políglota", "Polyglot", "Poliglota", "Polyglotte", "Polyglott", "Poliglotta", "Полиглот", "Flerspråkig", "Meertalig", "多语者", "बहुभाषी", "বহুভাষী", "ポリグロット", "다국어 구사자", "متعدد اللغات", "Mwingi lugha", "Mai yawan harsuna", "ብዙ ቋንቋ ያውቃል", "Polyglot", "Polyglot", "Maha reo"),
    # all
    ("all", 10,
     "Todos los idiomas", "All languages", "Todos os idiomas", "Toutes les langues", "Alle Sprachen", "Tutte le lingue", "Все языки", "Alla språk", "Alle talen", "所有语言", "सभी भाषाएँ", "সমস্ত ভাষা", "すべての言語", "모든 언어", "جميع اللغات", "Lugha zote", "Duk harsuna", "ሁሉም ቋንቋዎች", "Lahat ng wika", "Semua bahasa", "Ngā reo katoa"),
]


async def main() -> None:
    await init_db()
    created = 0
    for value, order, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi in TEXTS:
        existing = await SystemOption.find_one(
            SystemOption.category == "languages_section",
            SystemOption.value == value,
        )
        if existing:
            # Update existing with all languages
            existing.label = es
            existing.label_es = es
            existing.label_en = en
            existing.label_pt = pt
            existing.label_fr = fr
            existing.label_de = de
            existing.label_it = it
            existing.label_ru = ru
            existing.label_sv = sv
            existing.label_nl = nl
            existing.label_zh = zh
            existing.label_hi = hi
            existing.label_bn = bn
            existing.label_ja = ja
            existing.label_ko = ko
            existing.label_ar = ar
            existing.label_sw = sw
            existing.label_ha = ha
            existing.label_am = am
            existing.label_tl = tl
            existing.label_ms = ms
            existing.label_mi = mi
            existing.order = order
            existing.is_active = True
            await existing.save()
        else:
            await SystemOption(
                category="languages_section",
                value=value,
                label=es,
                label_es=es,
                label_en=en,
                label_pt=pt,
                label_fr=fr,
                label_de=de,
                label_it=it,
                label_ru=ru,
                label_sv=sv,
                label_nl=nl,
                label_zh=zh,
                label_hi=hi,
                label_bn=bn,
                label_ja=ja,
                label_ko=ko,
                label_ar=ar,
                label_sw=sw,
                label_ha=ha,
                label_am=am,
                label_tl=tl,
                label_ms=ms,
                label_mi=mi,
                order=order,
                is_active=True,
            ).insert()
            created += 1
    print(f"seed_languages_section: created {created}, skipped {len(TEXTS) - created}")


if __name__ == "__main__":
    asyncio.run(main())