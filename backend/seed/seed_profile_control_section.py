"""
Seed the `profile_control_section` system options catalog for UI texts in Profile Control section.

The texts in ProfileControlSection read from GET /options/section/profile_control_section.
Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_control_section.py
"""

import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

# All 21 supported languages in order
LANGS = ["es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh", "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi"]

TEXTS = [
    {
        "value": "title",
        "order": 0,
        "translations": {
            "es": "Control de perfil",
            "en": "Profile Control",
            "pt": "Controle de perfil",
            "fr": "Contrôle de profil",
            "de": "Profilkontrolle",
            "it": "Controllo profilo",
            "ru": "Контроль профиля",
            "sv": "Profilkontroll",
            "nl": "Profielbeheer",
            "zh": "档案控制",
            "hi": "प्रोफ़ाइल नियंत्रण",
            "bn": "প্রোফাইল নিয়ন্ত্রণ",
            "ja": "プロフィール管理",
            "ko": "프로필 제어",
            "ar": "التحكم في الملف الشخصي",
            "sw": "Udhibiti wa Profaili",
            "ha": "Gudanar Shafin",
            "am": "የፕሮፋይል ቁጠባ",
            "tl": "Kontrol ng Profile",
            "ms": "Kawalan Profil",
            "mi": "Tino Whakahaere",
        }
    },
    {
        "value": "subtitle",
        "order": 1,
        "translations": {
            "es": "Tu privacidad, tu narrativa",
            "en": "Your privacy, your narrative",
            "pt": "Sua privacidade, sua narrativa",
            "fr": "Votre vie privée, votre histoire",
            "de": "Ihre Privatsphäre, Ihre Geschichte",
            "it": "La tua privacy, la tua narrazione",
            "ru": "Ваша приватность, ваша история",
            "sv": "Din integritet, din berättelse",
            "nl": "Jouw privacy, jouw verhaal",
            "zh": "你的隐私，你的故事",
            "hi": "आपकी गोपनीयता, आपकी कहानी",
            "bn": "আপনার গোপনীয়তা, আপনার কাহিনী",
            "ja": "あなたのプライバシー、あなたの物語",
            "ko": "당신의 프라이버시, 당신의 이야기",
            "ar": "خصوصيتك، روايتك",
            "sw": "Faragha yako, hadithi yako",
            "ha": "Kulikoyi, tarihin",
            "am": "የግል ጽድትህ የአንተ ታሪክ",
            "tl": "Iyong privacy, iyong kwento",
            "ms": "Privasi Anda, cerita Anda",
            "mi": "Tō matatapu, tō kōrero",
        }
    },
    {
        "value": "description",
        "order": 2,
        "translations": {
            "es": "Tú decides qué mostrar. CARE respeta tus decisiones y ajusta la forma en que te presenta a los demás. Si ocultas información, CARE interpretará esto como una preferencia por la privacidad y modulará la conexión.",
            "en": "You decide what to show. CARE respects your choices and adjusts how you're presented to others. If you hide information, CARE will interpret this as a privacy preference and modulate the connection.",
            "pt": "Você decide o que mostrar. O CARE respeita suas escolhas e ajusta como você é apresentado aos outros. Se você ocultar informações, o CARE interpretará isso como uma preferência de privacidade e modulará a conexão.",
            "fr": "Vous décidez ce que vous montrez. CARE respecte vos choix et ajuste la façon dont vous êtes présenté aux autres. Si vous cachez des informations, CARE l'interprétera comme une préférence de confidentialité et modulera la connexion.",
            "de": "Du entscheidest, was du zeigst. CARE respektiert deine Entscheidungen und passt an, wie du anderen präsentiert wirst. Wenn du Informationen ausblendest, interpretiert CARE dies als Privatsphäre-Präferenz und moduliert die Verbindung.",
            "it": "Decidi tu cosa mostrare. CARE rispetta le tue scelte e adatta come vieni presentato agli altri. Se nascondi informazioni, CARE interpreterà questo come una preferenza per la privacy e modulerà la connessione.",
            "ru": "Вы решаете, что показывать. CARE уважает ваш выбор и корректирует, как вы представлены другим. Если вы скрываете информацию, CARE интерпретирует это как предпочтение конфиденциальности и модулирует связь.",
            "sv": "Du bestämmer vad som visas. CARE respektar dina val och justerar hur du presenteras för andra. Om du doljer information tolkas detta som en integritetsönskan och kopplingen modulariseras.",
            "nl": "Jij beslist wat je toont. CARE respecteert je keuzes en past aan hoe je wordt getoond aan anderen. Als je informatie verbergt, interpreteert CARE dit als een privacyvoorkeur en moduleert de connectie.",
            "zh": "你决定展示什么。CARE尊重你的选择并调整向他人展示你的方式。如果你隐藏信息，CARE会将其视为隐私偏好并调节连接。",
            "hi": "आप तय करते हैं कि क्या दिखाना है। CARE आपके विकल्पों का सम्मान करता है और समायोजित करता है कि आपको दूसरों के सामने कैसे प्रस्तुत किया जाता है। यदि आप जानकारी छिपाते हैं, तो CARE इसे गोपनीयता वरीयता के रूप में व्याख्या करेगा और कनेक्शन को संग्राहक करेगा।",
            "bn": "আপনি সিদ্ধান্ত নেন কী দেখাতে হবে। CARE আপনার পছন্দকে সম্মান করে এবং আপনাকে অন্যদের কাছে কীভাবে উপস্থাপন করা হবে তা সমন্বয় করে। আপনি যদি তথ্য লুকিয়ে রাখেন, CARE এটিকে গোপনীয়তা পছন্দ হিসেবে ব্যাখ্যা করবে এবং সংযোগকেcontrollers করবে।",
            "ja": "あなたが何を表示するか決めます。CAREはあなたの選択を尊重し、他者にどのように表示されるかを調整します。情報を隠す場合、CAREはそれをプライバシーの設定として解釈し、接続を調整します。",
            "ko": "당신은 무엇을 보여줄지 결정합니다. CARE는 당신의 선택을 존중하고 타인에게 어떻게 보여질지 조정합니다. 정보를 숨기면 CARE는 이를 프라이버시 선호로 해석하고 연결을 조절합니다.",
            "ar": "أنت تقرر ما تظهر. CARE يحترم قراراتك ويعدل طريقة تقديمك للآخرين. إذا أخفيت معلومات، سيفسر CARE ذلك كتفضيل للخصوصية وينظم الاتصال。",
            "sw": "Wewe unachagua nini kuonyesha. CARE heshimu chaguo lako na kuboresha jinsi unavyoonekana kwa wengine. Ukificha taarifa, CARE itatafsiri hilo kama upendeleo wa faragha na kugeuza uhusiano.",
            "ha": "Kai tsare kun nufin da ka nuna. CARE taba da zaɓuɓuɓukan ku da kuma sauya yadda ake nuna muku ga masu. Idan ka kura bayani, CARE zata fassara wannan kamar sha'awar farashi da kuma sauya haɗin kai.",
            "am": "አንተ ምን ማሳየት እንደሚፈልግ አንተ ነህ የሚፈልግ። CARE ፈቃድህን ይከታተል እና ለሌሎች እንዴት እንደሚታየህ ይቀይራል። ማስቀር ከፈለግህ ፣ CARE ይህን እንደ ግል ነበር ፈቃድ ያስብ ቁጠባ ያደርጋል።",
            "tl": "Ikaw ang nagdedesisyon kung ano ang ipapakita. Rerespetuhin ng CARE ang iyong mga desisyon at aayustahan kung paano ka ipapakita sa iba. Kung itatago mo ang impormasyon, ituturing ito ng CARE na preference sa privacy at ia-adjust ang koneksyon.",
            "ms": "Anda memutuskan apa yang ditampilkan. CARE menghormati pilihan Anda dan menyesuaikan cara Anda ditampilkan kepada orang lain. Jika Anda menyembunyikan informasi, CARE akan menginterpretasikannya sebagai preferensi privasi dan memodulasi koneksi.",
            "mi": "Ko koe te kaiwhakatau i te mea e whakaaturia. Ka whakaute te CARE i ō kōwhiringa ka whakatikatika i te pēhea koe e whakaaturia ai ki ētahi atu. Mēnā ka huna e koe ngā mōhiohio, ka whakamāoritia e te CARE hei whakahiahia matatapu ka whakatikatika te hononga.",
        }
    },
    {
        "value": "age.label",
        "order": 3,
        "translations": {
            "es": "Edad visible", "en": "Age visible", "pt": "Idade visível", "fr": "Âge visible",
            "de": "Alter sichtbar", "it": "Età visibile", "ru": "Возраст виден", "sv": "Ålder synlig",
            "nl": "Leeftijd zichtbaar", "zh": "年龄可见", "hi": "उम्र दिखाई दे रही है",
            "bn": "বয়স দৃশ্যমান", "ja": "年齢表示", "ko": "나이 표시", "ar": "العمر مرئي",
            "sw": "Umri Unaonekana", "ha": "Shekara Sunan Gani", "am": "ዕድሜ ይታያል",
            "tl": "Edad Nakikita", "ms": "Usia Terlihat", "mi": "Pakeke Kitea",
        }
    },
    {
        "value": "age.description",
        "order": 4,
        "translations": {
            "es": "Un tono ajustado a tu etapa de vida.",
            "en": "A tone adjusted to your stage of life.",
            "pt": "Um tom ajustado à sua etapa de vida.",
            "fr": "Un ton ajusté à votre étape de vie.",
            "de": "Ein auf Ihre Lebensphase abgestimmter Ton.",
            "it": "Un tono adatto alla tua fase di vita.",
            "ru": "Тон, адаптированный к вашему этапу жизни.",
            "sv": "En ton anpassad efter din livsfas.",
            "nl": "Een toon aangepast aan jouw levensfase.",
            "zh": "适合你人生阶段的语调。",
            "hi": "आपके जीवन चरण के अनुरूप लहजा।",
            "bn": "আপনার জীবনের পর্যায় অনুযায়ী সুর।",
            "ja": "あなたの人生の段階に合わせたトーン。",
            "ko": "당신의 인생 단계에 맞춘 톤.",
            "ar": "نبرة مخصصة لمرحلة حياتك。",
            "sw": "Sauti iliyolingana na kipindi chako cha maisha.",
            "ha": "Tsanayin da ke dace da karkashin rayuwa.",
            "am": "የህይወት ደረጃዎችዎን የሚስተናግድ ድምፅ።",
            "tl": "Tono na nakaugnay sa yugto ng iyong buhay.",
            "ms": "Nada yang disesuaikan dengan tahap hidup Anda.",
            "mi": "Te tōnga e whakaritea ana ki tō wā o te oranga.",
        }
    },
    {
        "value": "age.careOn",
        "order": 5,
        "translations": {
            "es": "CARE dice: Se mostrará tu edad real.",
            "en": "CARE says: Your real age will be shown.",
            "pt": "CARE diz: Sua idade real será mostrada.",
            "fr": "CARE dit : Votre vrai âge sera affiché.",
            "de": "CARE sagt: Dein echtes Alter wird angezeigt.",
            "it": "CARE dice: La tua età reale sarà mostrata.",
            "ru": "CARE говорит: Ваш настоящий возраст будет показан.",
            "sv": "CARE säger: Din riktiga ålder visas.",
            "nl": "CARE zegt: Je echte leeftijd wordt getoond.",
            "zh": "CARE说：将显示你的真实年龄。",
            "hi": "CARE कहता है: आपकी असली उम्र दिखाई जाएगी।",
            "bn": "CARE বলে: আপনার আসল বয়স দেখানো হবে।",
            "ja": "CAREはこう言います：あなたの実年齢が表示されます。",
            "ko": "CARE가 말합니다: 실제 나이가 표시됩니다.",
            "ar": "CARE يقول: سيتم عرض عمرك الحقيقي。",
            "sw": "CARE anasema: Umri wako halisi utaonyeshwa.",
            "ha": "CARE cewa: Shekaru da gaske zai nuna.",
            "am": "CARE ይላል፡ አንደኛው ዕድሜህ ያሳያል።",
            "tl": "CARE nagsasabi: Ipakikita ang iyong tunay na edad.",
            "ms": "CARE berkata: Usia asli Anda akan ditampilkan.",
            "mi": "Ka kī te CARE: Ka whakakitea tō pakeke tūturu.",
        }
    },
    {
        "value": "age.careOff",
        "order": 6,
        "translations": {
            "es": "CARE dice: Se usará el símbolo 🎭 para indicar misterio.",
            "en": "CARE says: The 🎭 symbol will be used to indicate mystery.",
            "pt": "CARE diz: O símbolo 🎭 será usado para indicar mistério.",
            "fr": "CARE dit : Le symbole 🎭 sera utilisé pour indiquer le mystère.",
            "de": "CARE sagt: Das 🎭-Symbol wird verwendet, um Mysterium anzuzeigen.",
            "it": "CARE dice: Il simbolo 🎭 sarà usato per indicare mistero.",
            "ru": "CARE говорит: Символ 🎭 будет использоваться для обозначения тайны.",
            "sv": "CARE säger: Symbolen 🎭 används för att indikera mysterium.",
            "nl": "CARE zegt: Het 🎭-symbool wordt gebruikt om mysterie aan te duiden.",
            "zh": "CARE说：将使用🎭符号表示神秘。",
            "hi": "CARE कहता है: रहस्य दर्शाने के लिए 🎭 प्रतीक का उपयोग किया जाएगा।",
            "bn": "CARE বলে: রহস্যকে নির্দেশ করতে 🎭 চিহ্ন ব্যবহার করা হবে।",
            "ja": "CAREはこう言います：謎を示すために🎭記号が使われます。",
            "ko": "CARE가 말합니다: 신비를 나타내기 위해 🎭 기호가 사용됩니다。",
            "ar": "CARE يقول: سيتم استخدام رمز 🎭 للإشارة إلى الغموض。",
            "sw": "CARE anasema: Alama ya 🎭 itatumwa kuonyesha siri.",
            "ha": "CARE cewa: Alamar 🎭 zai iya nuna mamaki.",
            "am": "CARE ይላል፡ የ🎭 ምልክት ለማሳየት ይጠቀማል።",
            "tl": "CARE nagsasabi: Ang simbolong 🎭 ay gagamitin upang ipakita ang misteryo.",
            "ms": "CARE berkata: Simbol 🎭 akan digunakan untuk menunjukkan misteri.",
            "mi": "Ka kī te CARE: Ka whakamahia te tohu 🎭 hei whakakite i te mea ngaro.",
        }
    },
    {
        "value": "distance.label",
        "order": 7,
        "translations": {
            "es": "Distancia visible", "en": "Distance visible", "pt": "Distância visível", "fr": "Distance visible",
            "de": "Distanz sichtbar", "it": "Distanza visibile", "ru": "Расстояние видно", "sv": "Avstånd synlig",
            "nl": "Afstand zichtbaar", "zh": "距离可见", "hi": "दूरी दिखाई दे रही है",
            "bn": "দূরত্ব দৃশ্যমান", "ja": "距離表示", "ko": "거리 표시", "ar": "المسافة مرئية",
            "sw": "Umbu Unaonekana", "ha": "Nisa Sunan Gani", "am": "ርቀት ይታያል",
            "tl": "Distansya Nakikita", "ms": "Jarak Terlihat", "mi": "Wāhiwa Kitea",
        }
    },
    {
        "value": "distance.description",
        "order": 8,
        "translations": {
            "es": "Facilita encuentros cercanos.",
            "en": "Facilitates nearby encounters.",
            "pt": "Facilita encontros próximos.",
            "fr": "Facilite les rencontres proches.",
            "de": "Erleichtert nahe Begegnungen.",
            "it": "Agevola incontri vicini.",
            "ru": "Облегчает ближайшие встречи.",
            "sv": "Underlättar närliggande möten.",
            "nl": "Vergemakkelijkt nabije ontmoetingen.",
            "zh": "促进附近的相遇。",
            "hi": "आपके पास के मिलन को सुविधाजनक बनाता है।",
            "bn": "আপনার কাছেের মিলনকে সুবিধাজনক করে।",
            "ja": "近くの出会いを促進します。",
            "ko": "가까운 만남을 용이하게 합니다。",
            "ar": "تسهل اللقاءات القريبة。",
            "sw": "Inarahisha mihusiano ya karibu.",
            "ha": "Saula allada masu daga jima.",
            "am": "ቀላል የሆኑ ውይይቶችን ያስችላል።",
            "tl": "Nakapagbibigay-daan sa mga salubungang malapit.",
            "ms": "Memudahkan pertemuan dekat.",
            "mi": "Whakahauhau i ngā tutaki tata.",
        }
    },
    {
        "value": "distance.careOn",
        "order": 9,
        "translations": {
            "es": "CARE sugiere: \"¿Te gustaría iniciar una conversación cercana?\"",
            "en": "CARE suggests: \"Would you like to start a nearby conversation?\"",
            "pt": "CARE sugere: \"Gostaria de iniciar uma conversa próxima?\"",
            "fr": "CARE suggère : \"Voulez-vous entamer une conversation de proximité ?\"",
            "de": "CARE schlägt vor: \"Möchten Sie ein nahes Gespräch beginnen?\"",
            "it": "CARE suggerisce: \"Vuoi iniziare una conversazione vicina?\"",
            "ru": "CARE предлагает: «Хотите начать ближайший разговор?»",
            "sv": "CARE föreslår: \"Vill du börja ett närliggande samtal?\"",
            "nl": "CARE stelt voor: \"Wil je een nabij gesprek beginnen?\"",
            "zh": "CARE建议：“您想开始一次附近的对话吗？”",
            "hi": "CARE सुझाव देता है: \"क्या आप पास की बातचीत शुरू करना चाहेंगे?\"",
            "bn": "CARE পরামর্শ দেয়: \"আপনি কি একটি নিকটবর্তী কথোপকথন শুরু করতে চান?\"",
            "ja": "CAREは提案します：「近くの会話を始めたいですか？」",
            "ko": "CARE는 제안합니다: \"가까운 대화를 시작하고 싶으신가요?\"",
            "ar": "CARE يقترح: \"هل ترغب في بدء محادثة قريبة؟\"",
            "sw": "CARE inayopendekeza: \"Je, ungependa kuanza mazungumzo ya karibu?\"",
            "ha": "CARE yana shawara: \"Kuna da hankali ka fara hira da wani karibu?\"",
            "am": "CARE ምክር ያስቀራል፡ \"ቀላል ማውራያ መጀመር ወደሚፈልጉ ነው?\"",
            "tl": "CARE ay nagmumungkahi: \"Gusto mo bang simulan ang isang malapit na usapan?\"",
            "ms": "CARE menyarankan: \"Apakah Anda ingin memulai percakapan yang dekat?\"",
            "mi": "Ka kī te CARE: Ka tuku whakaaro: \"Kei te hiahia koe ki te tīmata i tētahi kōrero tata?\".",
        }
    },
    {
        "value": "distance.careOff",
        "order": 10,
        "translations": {
            "es": "CARE sugiere: \"La distancia no importa cuando hay afinidad.\"",
            "en": "CARE suggests: \"Distance doesn't matter when there's affinity.\"",
            "pt": "CARE sugere: \"A distância não importa quando há afinidade.\"",
            "fr": "CARE suggère : \"La distance n'a pas d'importance quand il y a de l'affinité.\"",
            "de": "CARE sagt: \"Distanz spielt keine Rolle, wenn es Affinität gibt.\"",
            "it": "CARE suggerisce: \"La distanza non conta quando c'è affinità.\"",
            "ru": "CARE предлагает: «Расстояние неважно, когда есть сродство.»",
            "sv": "CARE föreslår: \"Avstånd spelar ingen roll när det finns sammanbindning.\"",
            "nl": "CARE stelt voor: \"Afstand telt niet als er affiniteit is.\"",
            "zh": "CARE建议：“当有共鸣时，距离不再重要。”",
            "hi": "CARE सुझाव देता है: \"जब लगाव हो तो दूरी मायने नहीं रखती।\"",
            "bn": "CARE পরামর্শ দেয়: \"সামঞ্জস্যতা থাকলে দূরত্ব মানে রাখে না।\"",
            "ja": "CAREは提案します：「共鳴があるとき、距離は問題になりません。」",
            "ko": "CARE는 제안합니다: \"친밀감이 있으면 거리는 중요하지 않습니다.\"",
            "ar": "CARE يقترح: \"المسافة لا تهم عندما توجد ألفة।\"",
            "sw": "CARE inayopendekeza: \"Umbu hauhimili endapo kuna ufanisi.\"",
            "ha": "CARE yana shawara: \"Nisa ba a da mahimmanci idan akwai fahimta.\"",
            "am": "ርቀት ስለተወደደ አይጠበቅም።",
            "tl": "Kapag may pagkakawanggawa, ang distansya ay hindi na mahalaga.",
            "ms": "Jarak tidak masalah jika ada keselarasan.",
            "mi": "Kāore te wāhi hei take mēnā kei te hononga.",
        }
    },
    {
        "value": "toggle.on",
        "order": 11,
        "translations": {
            "es": "Activado", "en": "On", "pt": "Ativado", "fr": "Activé",
            "de": "Ein", "it": "Attivo", "ru": "Вкл", "sv": "På",
            "nl": "Aan", "zh": "开启", "hi": "चालू", "bn": "চালু",
            "ja": "オン", "ko": "켬", "ar": "مفعل", "sw": "Kuanzishwa",
            "ha": "Gargadi", "am": "ተከፍቷል", "tl": "Naka-On", "ms": "Diaktifkan", "mi": "Kia Oho",
        }
    },
    {
        "value": "toggle.off",
        "order": 12,
        "translations": {
            "es": "Desactivado", "en": "Off", "pt": "Desativado", "fr": "Désactivé",
            "de": "Aus", "it": "Disattivato", "ru": "Выкл", "sv": "Av",
            "nl": "Uit", "zh": "关闭", "hi": "बंद", "bn": "বন্ধ",
            "ja": "オフ", "ko": "끔", "ar": "معطل", "sw": "Kufutwa",
            "ha": "Sake", "am": "ተጣላላች", "tl": "Naka-Off", "ms": "Dinonaktifkan", "mi": "Kia Mutu",
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
            SystemOption.category == "profile_control_section",
            SystemOption.value == value,
        )
        
        # Build document
        doc_data = {
            "category": "profile_control_section",
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
    print(f"seed_profile_control_section: created {created}, skipped {len(TEXTS) - created}")


if __name__ == "__main__":
    asyncio.run(main())