"""
Seed items for Music category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_music.py
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
# Genre names stay largely identical; descriptions localized where needed.
ITEMS = [
    ("edm", "EDM", "EDM", "EDM", "EDM", "EDM", "EDM", "EDM", "EDM", "EDM", "电子舞曲", "ईडीएम", "ইডিএম", "EDM", "EDM", "موسيقى الرقص", "EDM", "EDM", "ኢዲኤም", "EDM", "EDM", "EDM"),
    ("pop", "Pop", "Pop", "Pop", "Pop", "Pop", "Pop", "Поп", "Pop", "Pop", "流行", "पॉप", "পপ", "ポップス", "팝", "بوب", "Pop", "Pop", "ፖፕ", "Pop", "Pop", "Pāhi"),
    ("rock", "Rock", "Rock", "Rock", "Rock", "Rock", "Rock", "Рок", "Rock", "Rock", "摇滚", "रॉक", "রক", "ロック", "록", "روك", "Rock", "Rock", "ሮክ", "Rock", "Rock", "Rock"),
    ("metal", "Metal", "Metal", "Metal", "Metal", "Metal", "Metal", "Метал", "Metal", "Metal", "金属", "मेटल", "মেটাল", "メタル", "메탈", "ميتال", "Metal", "Metal", "ሜታል", "Metal", "Metal", "Metal"),
    ("jazz", "Jazz", "Jazz", "Jazz", "Jazz", "Jazz", "Jazz", "Джаз", "Jazz", "Jazz", "爵士", "जैज़", "জ্যাজ", "ジャズ", "재즈", "جاز", "Jazz", "Jazz", "ጃዝ", "Jazz", "Jazz", "Jazz"),
    ("blues", "Blues", "Blues", "Blues", "Blues", "Blues", "Blues", "Блюз", "Blues", "Blues", "蓝调", "ब्लूज़", "ব্লুজ", "ブルース", "블루스", "بلوز", "Blues", "Blues", "ብሉዝ", "Blues", "Blues", "Blues"),
    ("reggae", "Reggae", "Reggae", "Reggae", "Reggae", "Reggae", "Reggae", "Регги", "Reggae", "Reggae", "雷鬼", "रेगे", "রেগে", "レゲエ", "레게", "ريغي", "Reggae", "Reggae", "ሬጌ", "Reggae", "Reggae", "Reggae"),
    ("hip_hop", "Hip Hop", "Hip-Hop", "Hip Hop", "Hip-hop", "Hip-Hop", "Hip hop", "Хип-хоп", "Hiphop", "Hiphop", "嘻哈", "हिप-हॉप", "হিপ-হপ", "ヒップホップ", "힙합", "هيب هوب", "Hip hop", "Hip hop", "ሂፕ ሆፕ", "Hip-hop", "Hip hop", "Hip-hop"),
    ("rap", "Rap", "Rap", "Rap", "Rap", "Rap", "Rap", "Рэп", "Rap", "Rap", "说唱", "रैप", "র‍্যাপ", "ラップ", "랩", "راب", "Rap", "Rap", "ራፕ", "Rap", "Rap", "Rap"),
    ("trap", "Trap", "Trap", "Trap", "Trap", "Trap", "Trap", "Трэп", "Trap", "Trap", "陷阱音乐", "ट्रैप", "ট্র্যাপ", "トラップ", "트랩", "تراب", "Trap", "Trap", "ትራፕ", "Trap", "Trap", "Trap"),
    ("reggaeton", "Reggaeton", "Reggaeton", "Reggaeton", "Reggaeton", "Reggaeton", "Reggaeton", "Реггетон", "Reggaeton", "Reggaeton", "雷鬼顿", "रेगेटन", "রেগেটন", "レゲトン", "레게톤", "ريغيتون", "Reggaeton", "Reggaeton", "ሬגեթን", "Reggaeton", "Reggaeton", "Reggaeton"),
    ("salsa", "Salsa", "Salsa", "Salsa", "Salsa", "Salsa", "Salsa", "Сальса", "Salsa", "Salsa", "萨尔萨", "साल्सा", "সালসা", "サルサ", "살사", "سالسا", "Salsa", "Salsa", "ሳልሳ", "Salsa", "Salsa", "Salsa"),
    ("bachata", "Bachata", "Bachata", "Bachata", "Bachata", "Bachata", "Bachata", "Бачата", "Bachata", "Bachata", "巴恰塔", "बचाता", "বাচাতা", "バチャータ", "바차타", "باتشاتا", "Bachata", "Bachata", "ባቻታ", "Bachata", "Bachata", "Bachata"),
    ("merengue", "Merengue", "Merengue", "Merengue", "Merengue", "Merengue", "Merengue", "Меренге", "Merengue", "Merengue", "梅伦格", "मेरेंगue", "মেরেঙ্গে", "メレンゲ", "메렝게", "ميرينغي", "Merengue", "Merengue", "መሬንጌ", "Merengue", "Merengue", "Merengue"),
    ("cumbia", "Cumbia", "Cumbia", "Cúmbia", "Cumbia", "Cumbia", "Cumbia", "Кумбия", "Cumbia", "Cumbia", "坎比亚", "कुम्बिया", "কুম্বিয়া", "クンビア", "쿰비아", "كومبيا", "Cumbia", "Cumbia", "ኩምቢያ", "Cumbia", "Cumbia", "Cumbia"),
    ("ranchera", "Ranchera", "Ranchera", "Rancheira", "Ranchera", "Ranchera", "Ranchera", "Ранчера", "Ranchera", "Ranchera", "牧场音乐", "रांचेरा", "রাঞ্চেরা", "ランチェーラ", "란체라", "رانشيرا", "Ranchera", "Ranchera", "ራንቼራ", "Ranchera", "Ranchera", "Ranchera"),
    ("mariachi", "Mariachi", "Mariachi", "Mariachi", "Mariachi", "Mariachi", "Mariachi", "Марьячи", "Mariachi", "Mariachi", "马里亚奇", "मारियाची", "মারিয়াচি", "マリアッチ", "마리아치", "مارياتشي", "Mariachi", "Mariachi", "ማሪያቺ", "Mariachi", "Mariachi", "Mariachi"),
    ("banda", "Banda", "Banda", "Banda", "Banda", "Banda", "Banda", "Банда", "Banda", "Banda", "班达", "बांदा", "বান্দা", "バンダ", "반다", "باندا", "Banda", "Banda", "ባንዳ", "Banda", "Banda", "Banda"),
    ("corridos", "Corridos", "Corridos", "Corridos", "Corridos", "Corridos", "Corridos", "Корридос", "Corridos", "Corrido's", "走廊民谣", "कोरिडोस", "করিডোস", "コリードス", "코리도스", "كوريدوس", "Corridos", "Corridos", "ኮሪዶስ", "Corridos", "Corridos", "Corridos"),
    ("country", "Country", "Country", "Country", "Country", "Country", "Country", "Кантри", "Country", "Country", "乡村", "कंट्री", "কান্ট্রি", "カントリー", "컨트리", "كانتري", "Country", "Country", "ካንትሪ", "Country", "Country", "Country"),
    ("folk", "Folk", "Folk", "Folk", "Folk", "Folk", "Folk", "Фолк", "Folk", "Folk", "民谣", "लोक", "ফোক", "フォーク", "포크", "فولك", "Folk", "Folk", "ፎልክ", "Folk", "Folk", "Folk"),
    ("indie", "Indie", "Indie", "Indie", "Indé", "Indie", "Indie", "Инди", "Indie", "Indie", "独立", "इंडी", "ইন্ডি", "インディー", "인디", "إندي", "Indie", "Indie", "ኢንዲ", "Indie", "Indie", "Indie"),
    ("alternative", "Alternative", "Alternative", "Alternativo", "Alternatif", "Alternative", "Alternative", "Альтернатива", "Alternativ", "Alternatief", "另类", "वैकल्पिक", "বিকল্প", "オルタナティブ", "얼터너티브", "بديل", "Mbadala", "Madadin", "አማራጭ", "Alternative", "Alternatif", "Kē atu"),
    ("punk", "Punk", "Punk", "Punk", "Punk", "Punk", "Punk", "Панк", "Punk", "Punk", "朋克", "पंक", "পাঙ্ক", "パンク", "펑크", "بانك", "Punk", "Punk", "ፓንክ", "Punk", "Punk", "Punk"),
    ("hardcore", "Hardcore", "Hardcore", "Hardcore", "Hardcore", "Hardcore", "Hardcore", "Хардкор", "Hardcore", "Hardcore", "硬核", "हार्डकोर", "হার্ডকোর", "ハードコア", "하드코어", "هاردكور", "Hardcore", "Hardcore", "ሃርድኮር", "Hardcore", "Hardcore", "Hardcore"),
    ("emo", "Emo", "Emo", "Emo", "Emo", "Emo", "Emo", "Эмо", "Emo", "Emo", " emo", "इमो", "ইমো", "エモ", "이모", "إيمو", "Emo", "Emo", "ኢሞ", "Emo", "Emo", "Emo"),
    ("grunge", "Grunge", "Grunge", "Grunge", "Grunge", "Grunge", "Grunge", "Гранж", "Grunge", "Grunge", "垃圾摇滚", "ग्रंज", "গ্রাঞ্জ", "グランジ", "그런지", "غرنج", "Grunge", "Grunge", "ግራንጅ", "Grunge", "Grunge", "Grunge"),
    ("classic_rock", "Classic Rock", "Classic Rock", "Rock Clássico", "Rock classique", "Classic Rock", "Classic rock", "Классический рок", "Klassisk rock", "Klassieke rock", "经典摇滚", "क्लासिक रॉक", "ক্লাসিক রক", "クラシックロック", "클래식 록", "روك كلاسيكي", "Rock ya zamani", "Classic rock", "ክላሲክ ሮክ", "Classic rock", "Rock klasik", "Rock tawhito"),
    ("hard_rock", "Hard Rock", "Hard Rock", "Hard Rock", "Hard rock", "Hardrock", "Hard rock", "Хард-рок", "Hårdrock", "Hardrock", "硬摇滚", "हार्ड रॉक", "হার্ড রক", "ハードロック", "하드 록", "هارد روك", "Hard rock", "Hard rock", "ሃርድ ሮክ", "Hard rock", "Hard rock", "Hard rock"),
    ("heavy_metal", "Heavy Metal", "Heavy Metal", "Heavy Metal", "Heavy metal", "Heavy Metal", "Heavy metal", "Хеви-метал", "Heavy metal", "Heavy metal", "重金属", "हैवी मेटल", "হেভি মেটাল", "ヘヴィメタル", "헤비메탈", "هيفي ميتال", "Heavy metal", "Heavy metal", "ሄቪ ሜታል", "Heavy metal", "Heavy metal", "Heavy metal"),
    ("death_metal", "Death Metal", "Death Metal", "Death Metal", "Death metal", "Death Metal", "Death metal", "Дэт-метал", "Death metal", "Deathmetal", "死亡金属", "डेथ मेटल", "ডেথ মেটাল", "デスメタル", "데스메탈", "ديث ميتال", "Death metal", "Death metal", "ደዝ ሜታል", "Death metal", "Death metal", "Death metal"),
    ("black_metal", "Black Metal", "Black Metal", "Black Metal", "Black metal", "Black Metal", "Black metal", "Блэк-метал", "Black metal", "Blackmetal", "黑金属", "ब्लैक मेटल", "ব্ল্যাক মেটাল", "ブラックメタル", "블랙메탈", "بلاك ميتال", "Black metal", "Black metal", "ብላክ ሜታል", "Black metal", "Black metal", "Black metal"),
    ("progressive", "Progressive", "Progressive", "Progressivo", "Progressif", "Progressive", "Progressive", "Прогрессив", "Progressiv", "Progressief", "前卫", "प्रोग्रेसिव", "প্রোগ্রেসিভ", "プログレッシブ", "프로그레시브", "تقدمي", "Progressive", "Progressive", "ፕሮግሬሲቭ", "Progressive", "Progresif", "Haere whakamua"),
    ("techno", "Techno", "Techno", "Techno", "Techno", "Techno", "Techno", "Техно", "Techno", "Techno", "铁克诺", "टेक्नो", "টেকনো", "テクノ", "테크노", "تكنو", "Techno", "Techno", "ቴክኖ", "Techno", "Techno", "Techno"),
    ("house", "House", "House", "House", "House", "House", "House", "Хаус", "House", "House", "浩室", "हाउस", "হাউস", "ハウス", "하우스", "هاوس", "House", "House", "ሃውስ", "House", "House", "House"),
    ("trance", "Trance", "Trance", "Trance", "Trance", "Trance", "Trance", "Транс", "Trance", "Trance", "迷幻", "ट्रांस", "ট্রান্স", "トランス", "트랜스", "ترانس", "Trance", "Trance", "ትራንስ", "Trance", "Trance", "Trance"),
    ("dubstep", "Dubstep", "Dubstep", "Dubstep", "Dubstep", "Dubstep", "Dubstep", "Дабстеп", "Dubstep", "Dubstep", "回响贝斯", "डबस्टेप", "ডাবস্টেপ", "ダブステップ", "덥스텝", "دبستيب", "Dubstep", "Dubstep", "ደብስቴፕ", "Dubstep", "Dubstep", "Dubstep"),
    ("drum_and_bass", "Drum And Bass", "Drum & Bass", "Drum and Bass", "Drum and bass", "Drum and Bass", "Drum and bass", "Драм-н-бейс", "Drum and bass", "Drum-'n-bass", "鼓打贝斯", "ड्रम एंड बेस", "ড্রাম অ্যান্ড বেস", "ドラムンベース", "드럼 앤 베이스", "درام آند بيس", "Drum and bass", "Drum and bass", "ድራም እና ቤዝ", "Drum and bass", "Drum dan bes", "Drum and bass"),
    ("ambient", "Ambient", "Ambient", "Ambient", "Ambient", "Ambient", "Ambient", "Эмбиент", "Ambient", "Ambient", "氛围", "एम्बिएंट", "অ্যাম্বিয়েন্ট", "アンビエント", "앰비언트", "أمبينت", "Ambient", "Ambient", "አምቢየንት", "Ambient", "Ambient", "Ambient"),
    ("classical", "Classical", "Classical", "Clássica", "Classique", "Klassik", "Classica", "Классика", "Klassiskt", "Klassiek", "古典", "शास्त्रीय", "শাস্ত্রীয়", "クラシック", "클래식", "كلاسيكية", "Classical", "Classical", "ክላሲካል", "Classical", "Klasik", "Puoro ōkawa"),
    ("opera", "Opera", "Opera", "Ópera", "Opéra", "Oper", "Opera", "Опера", "Opera", "Opera", "歌剧", "ओपेरा", "অপেরা", "オペラ", "오페라", "أوبرا", "Opera", "Opera", "ኦፔራ", "Opera", "Opera", "Opera"),
    ("flamenco", "Flamenco", "Flamenco", "Flamenco", "Flamenco", "Flamenco", "Flamenco", "Фламенко", "Flamenco", "Flamenco", "弗拉门戈", "फ्लेमेंको", "ফ্ল্যামেঙ্কো", "フラメンコ", "플라멩코", "فلامنكو", "Flamenco", "Flamenco", "ፍላሜንኮ", "Flamenco", "Flamenco", "Flamenco"),
    ("bossa_nova", "Bossa Nova", "Bossa Nova", "Bossa Nova", "Bossa-nova", "Bossa Nova", "Bossa nova", "Босса-нова", "Bossa nova", "Bossa nova", "巴萨诺瓦", "बोसा नोवा", "বোসা নোভা", "ボサノヴァ", "보사노바", "بوسا نوفا", "Bossa nova", "Bossa nova", "ቦሳ ኖቫ", "Bossa nova", "Bossa nova", "Bossa nova"),
    ("samba", "Samba", "Samba", "Samba", "Samba", "Samba", "Samba", "Самба", "Samba", "Samba", "桑巴", "साम्बा", "সাম্বা", "サンバ", "삼바", "سامبا", "Samba", "Samba", "ሳምባ", "Samba", "Samba", "Samba"),
    ("tango", "Tango", "Tango", "Tango", "Tango", "Tango", "Tango", "Танго", "Tango", "Tango", "探戈", "टैंगो", "ট্যাঙ্গো", "タンゴ", "탱고", "تانغو", "Tango", "Tango", "ታንጎ", "Tango", "Tango", "Tango"),
    ("kpop", "Kpop", "K-pop", "K-pop", "K-pop", "K-Pop", "K-pop", "К-поп", "K-pop", "K-pop", "韩流", "के-पॉप", "কে-পপ", "K-POP", "케이팝", "كيبوب", "Kpop", "Kpop", "ኬፖፕ", "Kpop", "Kpop", "K-pop"),
    ("jpop", "Jpop", "J-pop", "J-pop", "J-pop", "J-Pop", "J-pop", "Джей-поп", "J-pop", "J-pop", "日流", "जे-पॉप", "জে-পপ", "J-POP", "제이팝", "جيبوب", "Jpop", "Jpop", "ጄፖፕ", "Jpop", "Jpop", "J-pop"),
    ("afrobeat", "Afrobeat", "Afrobeat", "Afrobeat", "Afrobeat", "Afrobeat", "Afrobeat", "Афробит", "Afrobeat", "Afrobeat", "非洲节拍", "एफ्रोबीट", "আফ্রোবিট", "アフロビート", "아프로비트", "أفروبيت", "Afrobeat", "Afrobeat", "አፍሮቢት", "Afrobeat", "Afrobeat", "Afrobeat"),
    ("soul", "Soul", "Soul", "Soul", "Soul", "Soul", "Soul", "Соул", "Soul", "Soul", "灵魂乐", "सोल", "সোল", "ソウル", "소울", "سول", "Soul", "Soul", "ሶል", "Soul", "Soul", "Soul"),
    ("funk", "Funk", "Funk", "Funk", "Funk", "Funk", "Funk", "Фанк", "Funk", "Funk", "放克", "फंक", "ফাঙ্ক", "ファンク", "펑크", "فانك", "Funk", "Funk", "ፈንክ", "Funk", "Funk", "Funk"),
    ("disco", "Disco", "Disco", "Disco", "Disco", "Disco", "Disco", "Диско", "Disco", "Disco", "迪斯科", "डिस्को", "ডিস্কো", "ディスコ", "디스코", "ديسكو", "Disco", "Disco", "ዲስኮ", "Disco", "Disko", "Disco"),
    ("r_and_b", "R&B", "R&B", "R&B", "R&B", "R&B", "R&B", "R&B", "R&B", "R&B", "节奏布鲁斯", "आर एंड बी", "আর অ্যান্ড বি", "R&B", "R&B", "آر أند بي", "R&B", "R&B", "አር እና ቢ", "R&B", "R&B", "R&B"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 700
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
    print(f"seed music items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
