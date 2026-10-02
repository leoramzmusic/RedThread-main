"""
Seed the `profile_personality_section` system options catalog for UI texts in Personality section.

The texts in PersonalitySection read from GET /options/section/profile_personality_section.
Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_personality_section.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

TEXTS = [
    {
        "value": "title",
        "order": 0,
        "translations": {
            "es": "Rasgos de personalidad", "en": "Personality Traits", "pt": "Traços de Personalidade", "fr": "Traits de Personnalité",
            "de": "Persönlichkeitsmerkmale", "it": "Tratti della Personalità", "ru": "Черты Личности", "sv": "Personlighetsdrag",
            "nl": "Persoonlijkheidskenmerken", "zh": "个性特征", "hi": "व्यक्तित्व लक्षण", "bn": "ব্যক্তিত্বের বৈশিষ্ট্য",
            "ja": "性格特徴", "ko": "성격 특성", "ar": "سمات الشخصية", "sw": "Sifa za Tabia",
            "ha": "Hali na Murya", "am": "የድርጊት ባህሪዎች", "tl": "Katangiang Pagkatao", "ms": "Ciri-ciri Personaliti", "mi": "Āhuatanga Āhua",
        }
    },
    {
        "value": "social.label",
        "order": 1,
        "translations": {
            "es": "Estilo social", "en": "Social Style", "pt": "Estilo Social", "fr": "Style Social",
            "de": "Sozialer Stil", "it": "Stile Sociale", "ru": "Социальный Стиль", "sv": "Social Stil",
            "nl": "Sociale Stijl", "zh": "社交风格", "hi": "सामाजिक शैली", "bn": "সামাজিক শৈলী",
            "ja": "社交スタイル", "ko": "사회적 스타일", "ar": "الأسلوب الاجتماعي", "sw": "Mtindo wa Kijamii",
            "ha": "Yadda Mu'amala", "am": "የማህበራዊ ልምድ", "tl": "Estilo sa Lipunan", "ms": "Gaya Sosial", "mi": "Āhua Whanaungatanga",
        }
    },
    {
        "value": "social.extrovert.label",
        "order": 2,
        "translations": {
            "es": "Extrovertido", "en": "Extrovert", "pt": "Extrovertido", "fr": "Extraverti",
            "de": "Extravertiert", "it": "Estroverso", "ru": "Экстраверт", "sv": "Extrovert",
            "nl": "Extravert", "zh": "外向", "hi": "बहिर्मुखी", "bn": "বহির্মুখী",
            "ja": "外向的", "ko": "외향적", "ar": "انطوائي", "sw": "Mwenye Ushirikiano",
            "ha": "Mai Hira", "am": "የውጭ የሆነ", "tl": "Extrovert", "ms": "Ekstrovert", "mi": "Poto Waho",
        }
    },
    {
        "value": "social.extrovert.description",
        "order": 3,
        "translations": {
            "es": "Full pila social, aguanto la fiesta.", "en": "Full social battery, I can party all night.",
            "pt": "Bateria social cheia, aguento a festa.", "fr": "Batterie sociale pleine, je tiens la fête.",
            "de": "Voller sozialer Akku, ich halte die Party durch.", "it": "Batteria sociale al massimo, reggo la festa.",
            "ru": "Полная социальная батарея, выдерживаю вечеринку.", "sv": "Full social batteri, håller festen hela natten.",
            "nl": "Volle sociale batterij, ik hou de feest vol.", "zh": "社交电量满格，派对通宵不倒。",
            "hi": "सामाजिक बैटरी फुल, पार्टी पूरी रात चलती है।", "bn": "সামাজিক ব্যাটারি ফুল, পার্টি সারারাত চলে।",
            "ja": "社交バッテリー満タン、パーティーは朝まで。", "ko": "사회적 배터리 풀충전, 파티 밤새 버팀.", "ar": "بطارية اجتماعية ممتلئة، أحتفل طوال الليل.",
            "sw": "Bateria ya kijamii imekua, ninavumilia sherehe.", "ha": "Batterin zamuwa daya, ina karɓar bikin kwamfuta.", "am": "የማህበራዊ ባትሪ ሙሉ ነው፣ በዚያው ሁሉ አለሁ።",
            "tl": "Busog ang social battery, kaya ko ang party.", "ms": "Bateri sosial penuh, boleh party seharian.", "mi": "Kīia te pūngao ā-hapori, e taea e au te whakangahau.",
        }
    },
    {
        "value": "social.ambivert.label",
        "order": 4,
        "translations": {
            "es": "Ambivertido", "en": "Ambivert", "pt": "Ambivertido", "fr": "Ambiverti",
            "de": "Ambivertiert", "it": "Ambiiverso", "ru": "Амбиверт", "sv": "Ambivert",
            "nl": "Ambivert", "zh": "双向型", "hi": "उभयमुखी", "bn": "উভয়মুখী",
            "ja": "アンビバート", "ko": "양향성", "ar": "متوسط", "sw": "Kati",
            "ha": "Tsakani", "am": "በመካከል ያለ", "tl": "Ambivert", "ms": "Ambivert", "mi": "Wāwāhi",
        }
    },
    {
        "value": "social.ambivert.description",
        "order": 5,
        "translations": {
            "es": "Me adapto, pero también me engento.", "en": "I adapt, but I also need my space.",
            "pt": "Eu me adapto, mas também preciso do meu espaço.", "fr": "Je m'adapte, mais j'ai aussi besoin de mon espace.",
            "de": "Ich passe mich an, aber brauche auch meinen Freiraum.", "it": "Mi adatto, ma ho anche bisogno del mio spazio.",
            "ru": "Я адаптируюсь, но мне также нужно мое пространство.", "sv": "Jag anpassar mig, men behöver också mitt utrymme.",
            "nl": "Ik pas me aan, maar heb ook mijn ruimte nodig.", "zh": "我能适应，但也需要我的空间。",
            "hi": "मैं ढल जाता हूं, लेकिन मुझे अपनी जगह भी चाहिए।", "bn": "আমি খাপ খাই, কিন্তু আমার জায়গাও দরকার।",
            "ja": "適応するけど、自分の空間も必要。", "ko": "적응하지만 내 공간도 필요해.", "ar": "أتكيف، لكنني بحاجة لمساحتي الخاصة.",
            "sw": "Ninaweza kukubali, lakini ninahitaji nafasi yangu pia.", "ha": "Ina iya sauya, amma ina buƙatar wurin na.", "am": "እተገባለሁ፣ ግን የኔን ቦታም አስፈላጊ ነው።",
            "tl": "Naaakma ako, pero kailangan ko rin ang space ko.", "ms": "Saya beradaptasi, tapi saya perlukan ruang saya.", "mi": "Ka whakaaetia e au, engari me whai wāhi au anō.",
        }
    },
    {
        "value": "social.introvert.label",
        "order": 6,
        "translations": {
            "es": "Introvertido", "en": "Introvert", "pt": "Introvertido", "fr": "Introversé",
            "de": "Introvertiert", "it": "Introverso", "ru": "Интроверт", "sv": "Introvers",
            "nl": "Introvert", "zh": "内向", "hi": "अंतर्मुखी", "bn": "অন্তর্মুখী",
            "ja": "内向的", "ko": "내향적", "ar": "انطوائي", "sw": "Mwenye Ushirikiano Mdogo",
            "ha": "Mai Gida", "am": "የውስጥ የሆነ", "tl": "Introvert", "ms": "Introvert", "mi": "Poto Roto",
        }
    },
    {
        "value": "social.introvert.description",
        "order": 7,
        "translations": {
            "es": "Mi batería se acaba rápido, necesito mi mira.", "en": "My battery drains fast, I need my me-time.",
            "pt": "Minha bateria acaba rápido, preciso do meu tempo.", "fr": "Ma batterie se vide vite, j'ai besoin de mon temps.",
            "de": "Meine Batterie leert sich schnell, ich brauche meine Zeit.", "it": "La mia batteria si scarica in fretta, ho bisogno del mio tempo.",
            "ru": "Моя батарея садится быстро, мне нужно время для себя.", "sv": "Min batteri drar snabbt, jag behöver min tid.",
            "nl": "Mijn batterij loopt snel leeg, ik heb mijn tijd nodig.", "zh": "电量消耗快，我需要独处时间。",
            "hi": "मेरी बैटरी जल्दी खत्म होती है, मुझे मेरा समय चाहिए।", "bn": "আমার ব্যাটারি দ্রুত খালি হয়, আমার সময় লাগে।",
            "ja": "バッテリーがすぐ切れる、一人の時間が必要。", "ko": "배터리가 빨리 닳아, 나만의 시간이 필요해.", "ar": "بطاريتي تنفد بسرعة، أحتاج لوقتي الخاص.",
            "sw": "Bateria yangu huisha haraka, nahitaji wakati wangu.", "ha": "Batterin na kashe haraka, ina buƙatar lokacin na.", "am": "ባትሪዬ በቅርብ ትበቃለች፣ ለእኔ ጊዜ ያስፈልጋል።",
            "tl": "Mabilis maubos ang battery ko, kailangan ko ng me-time.", "ms": "Bateri saya cepat habis, saya perlukan masa saya.", "mi": "Ka ngaro te pūngao tere, he wā māku anake te hiahia.",
        }
    },
    {
        "value": "social.test_button",
        "order": 8,
        "translations": {
            "es": "¿No sabes cuál eres?", "en": "Don't know which one you are?",
            "pt": "Não sabe qual é você?", "fr": "Ne savez-vous pas lequel vous êtes?",
            "de": "Wissen Sie nicht, wer Sie sind?", "it": "Non sai chi sei?",
            "ru": "Не знаете, кто вы?", "sv": "Vet du inte vilken du är?",
            "nl": "Weet je niet wie je bent?", "zh": "不知道你是哪一种？",
            "hi": "पता नहीं आप कौन से हैं?", "bn": "জেনে না আপনি কে?",
            "ja": "自分がどれかわからない？", "ko": "자신이 어떤 유형인지 모르겠어요?", "ar": "لا تعرف أي نوع أنت؟",
            "sw": "Hujui wewe ni ipi?", "ha": "Ba ka sani ka ke wane?",
            "am": "አልታወቅም እንዴት ነህ?", "tl": "Hindi mo alam kung alin ka?", "ms": "Tidak tahu yang mana awak?", "mi": "Kāore koe e mōhio ko wai koe?",
        }
    },
]


async def main() -> None:
    await init_db()
    created = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]
        
        existing = await SystemOption.find_one(
            SystemOption.category == "profile_personality_section",
            SystemOption.value == value,
        )
        
        # Build document
        doc_data = {
            "category": "profile_personality_section",
            "value": value,
            "label": translations["es"],
            "order": order,
            "is_active": True,
        }
        for lang in ["es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh", "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi"]:
            doc_data[f"label_{lang}"] = translations.get(lang, "")
        
        if existing:
            # Update existing
            for key, val in doc_data.items():
                setattr(existing, key, val)
            await existing.save()
        else:
            await SystemOption(**doc_data).insert()
            created += 1
    print(f"seed_profile_personality_section: created {created}, skipped {len(TEXTS) - created}")


if __name__ == "__main__":
    asyncio.run(main())