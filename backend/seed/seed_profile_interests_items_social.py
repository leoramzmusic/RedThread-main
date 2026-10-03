"""
Seed items for Social Media category (profileSections.interests.items.*).
Idempotent: upserts. Run:
    docker exec -w /app redthread-backend python seed/seed_profile_interests_items_social.py
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
ITEMS = [
    ("instagram", "Instagram", "Instagram", "Instagram", "Instagram", "Instagram", "Instagram", "Инстаграм", "Instagram", "Instagram", "照片墙", "इंस्टाग्राम", "ইনস্টাগ্রাম", "インスタグラム", "인스타그램", "إنستغرام", "Instagram", "Instagram", "ኢንስታግራም", "Instagram", "Instagram", "Instagram"),
    ("tiktok", "TikTok", "TikTok", "TikTok", "TikTok", "TikTok", "TikTok", "ТикТок", "Tiktok", "TikTok", "抖音", "टिकटॉक", "টিকটক", "ティックトック", "틱톡", "تيك توك", "TikTok", "TikTok", "ቲክቶክ", "TikTok", "TikTok", "TikTok"),
    ("twitch", "Twitch", "Twitch", "Twitch", "Twitch", "Twitch", "Twitch", "Твич", "Twitch", "Twitch", "图奇", "ट्विच", "টুইচ", "ツイッチ", "트위치", "تويتش", "Twitch", "Twitch", "ትዊች", "Twitch", "Twitch", "Twitch"),
    ("podcast", "Podcast", "Podcast", "Podcast", "Podcast", "Podcast", "Podcast", "Подкаст", "Podd", "Podcast", "播客", "पॉडकास्ट", "পডকাস্ট", "ポッドキャスト", "팟캐스트", "بودكاست", "Podcast", "Podcast", "ፖድካስት", "Podcast", "Podcast", "Podcast"),
    ("netflix", "Netflix", "Netflix", "Netflix", "Netflix", "Netflix", "Netflix", "Нетфликс", "Netflix", "Netflix", "奈飞", "नेटफ्लिक्स", "নেটফ্লিক্স", "ネットフリックス", "넷플릭스", "نتفليكس", "Netflix", "Netflix", "ኔትፍሊክስ", "Netflix", "Netflix", "Netflix"),
    ("youtube", "Youtube", "YouTube", "YouTube", "YouTube", "YouTube", "YouTube", "Ютуб", "Youtube", "YouTube", "油管", "यूट्यूब", "ইউটিউব", "ユーチューブ", "유튜브", "يوتيوب", "Youtube", "Youtube", "ዩቲዩብ", "Youtube", "Youtube", "Youtube"),
    ("twitter", "Twitter", "Twitter/X", "Twitter", "Twitter", "Twitter", "Twitter", "Твиттер", "Twitter", "Twitter", "推特", "ट्विटर", "টুইটার", "ツイッター", "트위터", "تويتر", "Twitter", "Twitter", "ትዊተር", "Twitter", "Twitter", "Twitter"),
    ("facebook", "Facebook", "Facebook", "Facebook", "Facebook", "Facebook", "Facebook", "Фейсбук", "Facebook", "Facebook", "脸书", "फेसबुक", "ফেসবুক", "フェイスブック", "페이스북", "فيسبوك", "Facebook", "Facebook", "ፌስቡክ", "Facebook", "Facebook", "Facebook"),
    ("snapchat", "Snapchat", "Snapchat", "Snapchat", "Snapchat", "Snapchat", "Snapchat", "Снэпчат", "Snapchat", "Snapchat", "阅后即焚", "स्नैपचैट", "স্ন্যাপচ্যাট", "スナップチャット", "스냅챗", "سناب شات", "Snapchat", "Snapchat", "ስናፕቻት", "Snapchat", "Snapchat", "Snapchat"),
    ("reddit", "Reddit", "Reddit", "Reddit", "Reddit", "Reddit", "Reddit", "Реддит", "Reddit", "Reddit", "红迪", "रेडिट", "রেডিট", "レディット", "레딧", "ريديت", "Reddit", "Reddit", "ሬዲት", "Reddit", "Reddit", "Reddit"),
    ("discord", "Discord", "Discord", "Discord", "Discord", "Discord", "Discord", "Дискорд", "Discord", "Discord", "Discord", "डिस्कॉर्ड", "ডিসকর্ড", "ディスコード", "디스코드", "ديسكورد", "Discord", "Discord", "ዲስኮርድ", "Discord", "Discord", "Discord"),
    ("telegram", "Telegram", "Telegram", "Telegram", "Telegram", "Telegram", "Telegram", "Телеграм", "Telegram", "Telegram", "电报", "टेलीग्राम", "টেলিগ্রাম", "テレグラム", "텔레그램", "تيليغرام", "Telegram", "Telegram", "ቴሌግራም", "Telegram", "Telegram", "Telegram"),
    ("whatsapp", "Whatsapp", "WhatsApp", "WhatsApp", "WhatsApp", "WhatsApp", "WhatsApp", "Вотсап", "Whatsapp", "WhatsApp", "WhatsApp", "व्हाट्सऐप", "হোয়াটসঅ্যাপ", "ワッツアップ", "왓츠앱", "واتساب", "Whatsapp", "Whatsapp", "ዋትስአፕ", "Whatsapp", "Whatsapp", "Whatsapp"),
    ("linkedin", "Linkedin", "LinkedIn", "LinkedIn", "LinkedIn", "LinkedIn", "LinkedIn", "ЛинкедИн", "Linkedin", "LinkedIn", "领英", "लिंक्डइन", "লিংকডইন", "リンクトイン", "링크드인", "لينكدإن", "Linkedin", "Linkedin", "ሊንክድኢን", "Linkedin", "LinkedIn", "Linkedin"),
    ("pinterest", "Pinterest", "Pinterest", "Pinterest", "Pinterest", "Pinterest", "Pinterest", "Пинтерест", "Pinterest", "Pinterest", "拼趣", "पिंटरेस्ट", "পিন্টারেস্ট", "ピンタレスト", "핀터레스트", "بينترست", "Pinterest", "Pinterest", "ፒንትሬስት", "Pinterest", "Pinterest", "Pinterest"),
    ("tumblr", "Tumblr", "Tumblr", "Tumblr", "Tumblr", "Tumblr", "Tumblr", "Тамблер", "Tumblr", "Tumblr", "汤博乐", "टम्बलर", "টাম্বলার", "タンブラー", "텀블러", "تمبلر", "Tumblr", "Tumblr", "ተምብለር", "Tumblr", "Tumblr", "Tumblr"),
    ("vlogging", "Vlogging", "Vlogging", "Vlog", "Vlogging", "Vloggen", "Vlogging", "Видеоблоги", "Vloggande", "Vloggen", "视频博客", "व्लॉगिंग", "ভ্লগিং", "Vlog", "브이로그", "تدوين مرئي", "Vlogging", "Vlogging", "ቭሎጊንግ", "Vlogging", "Vlog", "Rangitaki ataata"),
    ("blogging", "Blogging", "Blogging", "Blog", "Blogging", "Bloggen", "Blogging", "Блогинг", "Bloggande", "Bloggen", "博客", "ब्लॉगिंग", "ব্লগিং", "ブログ", "블로깅", "تدوين", "Blogging", "Blogging", "ብሎጊንግ", "Blogging", "Blog", "Rangitaki"),
    ("streaming", "Streaming", "Streaming", "Streaming", "Streaming", "Streaming", "Streaming", "Стриминг", "Streaming", "Streamen", "流媒体", "स्ट्रीमिंग", "স্ট্রিমিং", "配信", "스트리밍", "بث", "Utiririshaji", "Yaɗa kai tsaye", "ስትሪሚንግ", "Streaming", "Penstriman", "Whakapāho"),
    ("gaming_streams", "Gaming Streams", "Gaming Streams", "Lives de Games", "Streams gaming", "Gaming-Streams", "Streaming di giochi", "Игровые стримы", "Gamingstreams", "Gamestreams", "游戏直播", "गेमिंग स्ट्रीम", "গেমিং স্ট্রিম", "ゲーム配信", "게임 방송", "بث الألعاب", "Michezo moja kwa moja", "Wasannin kai tsaye", "የጨዋታ ስርጭቶች", "Gaming streams", "Strim permainan", "Whakapāho kēmu"),
    ("irl_streams", "IRL Streams", "IRL Streams", "Lives IRL", "Streams IRL", "IRL-Streams", "Streaming IRL", "IRL-стримы", "IRL-streams", "IRL-streams", "现实直播", "आईआरएल स्ट्रीम", "আইআরএল স্ট্রিম", "IRL配信", "IRL 방송", "بث واقعي", "Matangazo ya moja kwa moja", "Watsa kai tsaye", "አይአርኤል ስርጭቶች", "IRL streams", "Strim IRL", "Whakapāho tūturu"),
    ("cooking_streams", "Cooking Streams", "Cooking Streams", "Lives de Culinária", "Streams cuisine", "Koch-Streams", "Streaming di cucina", "Кулинарные стримы", "Matstreams", "Kookstreams", "美食直播", "कुकिंग स्ट्रीम", "রান্নার স্ট্রিম", "料理配信", "요리 방송", "بث الطبخ", "Upishi moja kwa moja", "Girki kai tsaye", "የምግብ ስርጭቶች", "Cooking streams", "Strim masakan", "Whakapāho tunu kai"),
    ("art_streams", "Art Streams", "Art Streams", "Lives de Arte", "Streams d'art", "Kunst-Streams", "Streaming d'arte", "Арт-стримы", "Konststreams", "Kunststreams", "艺术直播", "आर्ट स्ट्रीम", "আর্ট স্ট্রিম", "アート配信", "아트 방송", "بث فني", "Sanaa moja kwa moja", "Zane kai tsaye", "የሥነ ጥበብ ስርጭቶች", "Art streams", "Strim seni", "Whakapāho toi"),
    ("music_streams", "Music Streams", "Music Streams", "Lives de Música", "Streams musicaux", "Musik-Streams", "Streaming musicali", "Музыкальные стримы", "Musikstreams", "Muziekstreams", "音乐直播", "म्यूज़िक स्ट्रीम", "মিউজিক স্ট্রিম", "音楽配信", "음악 방송", "بث موسيقي", "Muziki moja kwa moja", "Kiɗa kai tsaye", "የሙዚቃ ስርጭቶች", "Music streams", "Strim muzik", "Whakapāho puoro"),
    ("podcast_hosting", "Podcast Hosting", "Podcast Hosting", "Apresentar Podcast", "Animer un podcast", "Podcast hosten", "Condurre un podcast", "Вести подкаст", "Poddvärd", "Podcast hosten", "播客主持", "पॉडकास्ट होस्टिंग", "পডকাস্ট হোস্টিং", "ポッドキャスト配信", "팟캐스트 진행", "استضافة بودكاست", "Kuendesha podcast", "Gabatar da podcast", "ፖድካስት ማስተናገድ", "Podcast hosting", "Hos podcast", "Whakahaere podcast"),
    ("video_editing", "Video Edición", "Video Editing", "Edição de Vídeo", "Montage vidéo", "Videoschnitt", "Montaggio video", "Видеомонтаж", "Videoredigering", "Videobewerking", "视频剪辑", "वीडियो एडिटिंग", "ভিডিও এডিটিং", "動画編集", "영상 편집", "مونتاج فيديو", "Kuhariri video", "Gyaran bidiyo", "የቪዲዮ ማረም", "Pag-edit ng video", "Penyuntingan video", "Whakatika ataata"),
    ("photo_editing", "Photo Edición", "Photo Editing", "Edição de Fotos", "Retouche photo", "Fotobearbeitung", "Fotoritocco", "Обработка фото", "Bildredigering", "Fotobewerking", "修图", "फोटो एडिटिंग", "ছবি এডিটিং", "写真編集", "사진 편집", "تحرير الصور", "Kuhariri picha", "Gyaran hoto", "የፎቶ ማረም", "Pag-edit ng litrato", "Penyuntingan foto", "Whakatika whakaahua"),
    ("content_creation", "Content Creation", "Content Creation", "Criação de Conteúdo", "Création de contenu", "Content-Erstellung", "Creazione di contenuti", "Создание контента", "Innehållsskapande", "Contentcreatie", "内容创作", "कंटेंट निर्माण", "কন্টেন্ট তৈরি", "コンテンツ制作", "콘텐츠 제작", "صناعة المحتوى", "Uundaji maudhui", "Ƙirƙirar abun ciki", "ይዘት መፍጠር", "Paggawa ng content", "Penciptaan kandungan", "Waihanga ihirangi"),
    ("influencer", "Influencer", "Influencer", "Influenciador", "Influenceur", "Influencer", "Influencer", "Инфлюенсер", "Influencer", "Influencer", "网红", "इन्फ्लुएंसर", "ইনফ্লুয়েন্সার", "インフルエンサー", "인플루언서", "مؤثر", "Mshawishi", "Mai tasiri", "ኢንፍሉዌንሰር", "Influencer", "Pempengaruh", "Kaiwhakaawe"),
    ("social_media_marketing", "Social Media Marketing", "Social Media Marketing", "Marketing em Redes", "Marketing social", "Social-Media-Marketing", "Social media marketing", "Маркетинг в соцсетях", "Marknadsföring i sociala medier", "Socialmediamarketing", "社媒营销", "सोशल मीडिया मार्केटिंग", "সোশ্যাল মিডিয়া মার্কেটিং", "SNSマーケティング", "소셜 미디어 마케팅", "تسويق التواصل", "Masoko ya mitandao", "Tallan kafafen sada zumunta", "የማህበራዊ ሚዲያ ግብይት", "Social media marketing", "Pemasaran media sosial", "Hokohoko pāpāho"),
    ("community_management", "Community Management", "Community Management", "Gestão de Comunidade", "Gestion de communauté", "Community-Management", "Gestione community", "Управление сообществом", "Communityhantering", "Communitymanagement", "社群运营", "सामुदायिक प्रबंधन", "কমিউনিটি ব্যবস্থাপনা", "コミュニティ運営", "커뮤니티 관리", "إدارة المجتمع", "Usimamizi wa jamii", "Gudanar da al'umma", "የማህበረሰብ አስተዳደር", "Community management", "Pengurusan komuniti", "Whakahaere hapori"),
    ("memes", "Memes", "Memes", "Memes", "Mèmes", "Memes", "Meme", "Мемы", "Memes", "Memes", "表情包", "मीम्स", "মিম", "ミーム", "밈", "ميمز", "Memes", "Memes", "ሚምስ", "Memes", "Meme", "Meme"),
    ("viral_content", "Viral Content", "Viral Content", "Conteúdo Viral", "Contenu viral", "Virale Inhalte", "Contenuti virali", "Вирусный контент", "Viralt innehåll", "Virale content", "爆款内容", "वायरल कंटेंट", "ভাইরাল কন্টেন্ট", "バズコンテンツ", "바이럴 콘텐츠", "محتوى فيروسي", "Maudhui yanayosambaa", "Abun ciki mai yaɗuwa", "ቫይራል ይዘት", "Viral content", "Kandungan tular", "Ihirangi toro"),
    ("storytelling", "Storytelling", "Storytelling", "Contar Histórias", "Narration", "Storytelling", "Narrazione", "Сторителлинг", "Berättande", "Verhalen vertellen", "讲故事", "कहानी कहना", "গল্প বলা", "ストーリーテリング", "스토리텔링", "سرد القصص", "Usimulizi", "Ba da labari", "ታሪክ መንገር", "Pagkukuwento", "Penceritaan", "Pūrākau"),
    ("live_streaming", "Live Streaming", "Live Streaming", "Lives", "Streaming en direct", "Livestreaming", "Dirette streaming", "Прямые трансляции", "Livestreaming", "Livestreamen", "直播", "लाइव स्ट्रीमिंग", "লাইভ স্ট্রিমিং", "ライブ配信", "라이브 방송", "بث مباشر", "Matangazo ya moja kwa moja", "Watsa kai tsaye", "ቀጥታ ስርጭት", "Live streaming", "Siaran langsung", "Whakapāho ora"),
    ("youtube_shorts", "Youtube Shorts", "YouTube Shorts", "Shorts", "Shorts YouTube", "YouTube Shorts", "Shorts di YouTube", "YouTube Shorts", "Youtube Shorts", "YouTube Shorts", "油管短视频", "यूट्यूब शॉर्ट्स", "ইউটিউব শর্টস", "YouTubeショート", "유튜브 쇼츠", "يوتيوب شورتس", "Shorts", "Shorts", "ዩቲዩብ ሾርትስ", "Youtube Shorts", "Short Youtube", "Short Youtube"),
    ("reels", "Reels", "Reels", "Reels", "Reels", "Reels", "Reel", "Рилс", "Reels", "Reels", "短视频", "रील्स", "রিলস", "リール", "릴스", "ريلز", "Reels", "Reels", "ሪልስ", "Reels", "Reels", "Reels"),
    ("stories", "Stories", "Stories", "Stories", "Stories", "Storys", "Storie", "Истории", "Händelser", "Verhalen", "动态", "स्टोरीज़", "স্টোরিজ", "ストーリーズ", "스토리", "قصص", "Hadithi", "Labarai", "ታሪኮች", "Stories", "Cerita", "Kōrero"),
    ("threads", "Threads", "Threads", "Threads", "Threads", "Threads", "Threads", "Тредс", "Trådar", "Threads", "串文", "थ्रेड्स", "থ্রেডস", "スレッズ", "스레드", "ثريدز", "Threads", "Threads", "ትሬድስ", "Threads", "Thread", "Threads"),
    ("clubhouse", "Clubhouse", "Clubhouse", "Clubhouse", "Clubhouse", "Clubhouse", "Clubhouse", "Клабхаус", "Clubhouse", "Clubhouse", "俱乐部会所", "क्लबहाउस", "ক্লাবহাউস", "クラブハウス", "클럽하우스", "كلوب هاوس", "Clubhouse", "Clubhouse", "ክለብሃውስ", "Clubhouse", "Clubhouse", "Clubhouse"),
]

for _row in ITEMS:
    assert len(_row) == 22, _row[0]


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    order = 900
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
    print(f"seed social items: created {created}, updated {updated}")


if __name__ == "__main__":
    asyncio.run(main())
