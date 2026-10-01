"""
Seed the `languages` system options catalog for the profile edit section.

The languages combo in LanguagesSection reads its items from
GET /options?category=languages, which returns [] when this collection is empty.

Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_languages.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

# ISO 639-1 codes for all 21 supported languages
# (value, order, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi)
LANGUAGES = [
    ("es", 0, "Español", "Spanish", "Espanhol", "Espagnol", "Spanisch", "Spagnolo", "Испанский", "Spanska", "Spaans", "西班牙语", "स्पेनिश", "স্পেনিশ", "スペイン語", "스페인어", "الإسبانية", "Kispanola", "Sapain", "ስፓኒሽ", "Espanyol", "Bahasa Sepanyol", "Reo Paniora"),
    ("en", 1, "Inglés", "English", "Inglês", "Anglais", "Englisch", "Inglese", "Английский", "Engelska", "Engels", "英语", "अंग्रेज़ी", "ইংরেজি", "英語", "영어", "الإنجليزية", "Kiingereza", "Inglisi", "እንግሊዝኛ", "English", "Bahasa Inggeris", "Reo Ingarihi"),
    ("pt", 2, "Portugués", "Portuguese", "Português", "Portugais", "Portugiesisch", "Portoghese", "Португальский", "Portugisiska", "Portugees", "葡萄牙语", "पुर्तगाली", "পортуগিজ", "ポルトガル語", "포르투갈어", "البرتغالية", "Kireneno", "Pootukal", "ፖርቹጋል", "Portugis", "Bahasa Portugis", "Reo Potukiko"),
    ("fr", 3, "Francés", "French", "Francês", "Français", "Französisch", "Francese", "Французский", "Franska", "Frans", "法语", "फ्रेंच", "ফরাসি", "フランス語", "프랑스어", "الفرنسية", "Kifaransa", "Faransa", "ፈረንሳይ", "Pranse", "Bahasa Perancis", "Reo Wīwī"),
    ("de", 4, "Alemán", "German", "Alemão", "Allemand", "Deutsch", "Tedesco", "Немецкий", "Tyska", "Duits", "德语", "जर्मन", "জার্মান", "ドイツ語", "독일어", "الألمانية", "Kijerumani", "Jamus", "ጀርመን", "Aleman", "Bahasa Jerman", "Reo Tiamana"),
    ("it", 5, "Italiano", "Italian", "Italiano", "Italien", "Italienisch", "Italiano", "Итальянский", "Italienska", "Italiaans", "意大利语", "इतालवी", "ইতালীয়ান", "イタリア語", "이탈리아어", "الإيطالية", "Kiitaliano", "Talyan", "ጣልያን", "Italiano", "Bahasa Italia", "Reo Italia"),
    ("ru", 6, "Ruso", "Russian", "Russo", "Russe", "Russisch", "Russo", "Русский", "Ryska", "Russisch", "俄语", "रूसी", "রুশ", "ロシア語", "러시아어", "الروسية", "Kirusi", "Rasa", "ሩስያ", "Ruso", "Bahasa Rusia", "Reo Rūhia"),
    ("sv", 7, "Sueco", "Swedish", "Sueco", "Suédois", "Schwedisch", "Svedese", "Шведский", "Svenska", "Zweeds", "瑞典语", "स्वीडिश", "সুইডিশ", "スウェーデン語", "스웨덴어", "السويدية", "Kiswidi", "Suwidi", "ሱወዲሽ", "Swedish", "Bahasa Swedia", "Reo Ruwete"),
    ("nl", 8, "Neerlandés", "Dutch", "Neerlandês", "Néerlandais", "Niederländisch", "Olandese", "Нидерландский", "Nederländska", "Nederlands", "荷兰语", "荷兰语", "ডাচ", "オランダ語", "네덜란드어", "الهولندية", "Kiholanzi", "Datsi", "ደች", "Dutch", "Bahasa Belanda", "Reo Oranda"),
    ("zh", 9, "Chino (Mandarín)", "Chinese (Mandarin)", "Chinês (Mandarim)", "Chinois (Mandarin)", "Chinesisch (Mandarin)", "Cinese (Mandarino)", "Китайский (Мандарин)", "Kinesiska (Mandarin)", "Chinees (Mandarijn)", "中文 (普通话)", "चीनी (मंदारिन)", "চাইনিজ (মন্দারিন)", "中国語 (北京語)", "중국어 (만다린)", "الصينية (ماندرين)", "Kichina (Mandarin)", "Sin (Mandarin)", "ቻይንኛ (ማንዳሪን)", "Tsino (Mandarin)", "Bahasa Cina (Mandarin)", "Reo Hainamana (Mandarin)"),
    ("hi", 10, "Hindi", "Hindi", "Hindi", "Hindi", "Hindi", "Hindi", "Хинди", "Hindi", "Hindi", "印地语", "हिन्दी", "হিন্দি", "ヒンディー語", "힌디어", "الهندية", "Kihindi", "Hindi", "ሂንዲ", "Hindi", "Bahasa Hindi", "Reo Hindi"),
    ("bn", 11, "Bengalí", "Bengali", "Bengali", "Bengali", "Bengalisch", "Bengalese", "Бенгальский", "Bengali", "Bengaals", "孟加拉语", "बंगाली", "বাংলা", "ベンガル語", "벵골어", "البنغالية", "Kibengali", "Bengali", "በንጋሊ", "Bengali", "Bahasa Bengal", "Reo Pangali"),
    ("ja", 12, "Japonés", "Japanese", "Japonês", "Japonais", "Japanisch", "Giapponese", "Японский", "Japanska", "Japans", "日语", "日语", "জাপানি", "日本語", "일본어", "اليابانية", "Kijapani", "Japoni", "ጃፓንዝ", "Hapon", "Bahasa Jepun", "Reo Hapani"),
    ("ko", 13, "Coreano", "Korean", "Coreano", "Coréen", "Koreanisch", "Coreano", "Корейский", "Koreanska", "Koreaans", "韩语", "한국어", "করিয়ningen", "韓国語", "한국어", "الكورية", "Kikorea", "Korea", "ኮሪያዊ", "Koreano", "Bahasa Korea", "Reo Korea"),
    ("ar", 14, "Árabe", "Arabic", "Árabe", "Arabe", "Arabisch", "Arabo", "Арабский", "Arabiska", "Arabisch", "阿拉伯语", "अरबी", "আরবি", "アラビア語", "아랍어", "العربية", "Kiarabu", "Larab", "ዐረብኛ", "Arabo", "Bahasa Arab", "Reo Arapi"),
    ("sw", 15, "Suajili", "Swahili", "Suaíli", "Swahili", "Swahili", "Swahili", "Суахили", "Swahili", "Swahili", "斯瓦希里语", "斯瓦希里语", "সুয়াহিলি", "スワヒリ語", "스와힐리어", "السواحيلية", "Kiswahili", "Hausa", "ሱዋሂሊ", "Swahili", "Bahasa Swahili", "Reo Suahili"),
    ("ha", 16, "Hausa", "Hausa", "Hausa", "Haoussa", "Hausa", "Hausa", "Хауса", "Hausa", "Hausa", "豪萨语", "हौसा", "হাউসা", "ハウサ語", "하우사어", "الهوسا", "Kihausa", "Hausa", "ሃውሳ", "Hausa", "Bahasa Hausa", "Reo Hausa"),
    ("am", 17, "Amárico", "Amharic", "Amárico", "Amharique", "Amharisch", "Amarico", "Амхарский", "Amhariska", "Amhaars", "阿姆哈拉语", "अम्हारिक", "আমহারিক", "アムハラ語", "암하라어", "الأمهرية", "Kiamhari", "Amhari", "አማርኛ", "Amharic", "Bahasa Amharik", "Reo Amhara"),
    ("tl", 18, "Tagalo/Filipino", "Tagalog/Filipino", "Tagalo/Filipino", "Tagalog/Philippin", "Tagalog", "Tagalog", "Тагалог", "Tagalog", "Tagalog", "他加禄语/菲律宾语", "टैगालोग/फिलिपिनो", "টাগালোগ/ফিলিপিনো", "タガログ語/フィリピノ語", "타갈로그어/필리핀어", "التاغالوغية/الفلبينية", "Kitagalog", "Tagalog", "ታጋሎግ", "Tagalog", "Bahasa Tagalog", "Reo Tagalog"),
    ("ms", 19, "Malayo", "Malay", "Malaio", "Malais", "Malaiisch", "Malese", "Малайский", "Malajiska", "Maleis", "马来语", "马来语", "মালয়", "マレー語", "말레이어", "المالايوية", "Kimalei", "Malay", "ማሌይ", "Malay", "Bahasa Melayu", "Reo Mere"),
    ("mi", 20, "Maorí", "Māori", "Maori", "Maori", "Maori", "Maori", "Маори", "Maori", "Maori", "毛利语", "毛利语", "মাওরি", "マオリ語", "마오리어", "الماؤورية", "Kimaori", "Maori", "ማውሪ", "Maori", "Bahasa Maori", "Reo Māori"),
]


async def main() -> None:
    await init_db()
    created = 0
    for value, order, es, en, pt, fr, de, it, ru, sv, nl, zh, hi, bn, ja, ko, ar, sw, ha, am, tl, ms, mi in LANGUAGES:
        existing = await SystemOption.find_one(
            SystemOption.category == "languages",
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
                category="languages",
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
    print(f"seed_languages: created {created}, skipped {len(LANGUAGES) - created}")


if __name__ == "__main__":
    asyncio.run(main())