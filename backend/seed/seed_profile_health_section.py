"""
Seed the `profile_health_section` system options catalog for UI texts in Health & Wellness section.

The texts in WellnessSection read from GET /options/section/profile_health_section.
Idempotent: skips values that already exist.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_health_section.py
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
            "es": "Salud y Bienestar", "en": "Health & Wellness", "pt": "Saúde e Bem-estar", "fr": "Santé et Bien-être",
            "de": "Gesundheit & Wohlbefinden", "it": "Salute e Benessere", "ru": "Здоровье и Благополучие", "sv": "Hälsa och Välbefinnande",
            "nl": "Gezondheid & Welzijn", "zh": "健康与福祉", "hi": "स्वास्थ्य और कल्याण", "bn": "স্বাস্থ্য ও সুস্থতা",
            "ja": "健康とウェルネス", "ko": "건강 및 웰빙", "ar": "الصحة والعافية", "sw": "Afya na Ustawi",
            "ha": "Lafiya da Albarka", "am": "ጤና እና ደህንነት", "tl": "Kalusugan at Kagalingan", "ms": "Kesihatan & Kesejahteraan", "mi": "Hauora me te Oranga",
        }
    },
    {
        "value": "conditions.label",
        "order": 1,
        "translations": {
            "es": "Condiciones de salud", "en": "Health conditions", "pt": "Condições de saúde", "fr": "Conditions de santé",
            "de": "Gesundheitszustände", "it": "Condizioni di salute", "ru": "Состояния здоровья", "sv": "Hälsotillstånd",
            "nl": "Gezondheidscondities", "zh": "健康状况", "hi": "स्वास्थ्य स्थितियाँ", "bn": "স্বাস্থ্য অবস্থা",
            "ja": "健康状態", "ko": "건강 상태", "ar": "الحالات الصحية", "sw": "Hali za afya",
            "ha": "Hali na lafiya", "am": "የጤና ሁኔታዎች", "tl": "Kondisyon ng kalusugan", "ms": "Keadaan kesihatan", "mi": "Āhua hauora",
        }
    },
    {
        "value": "conditions.good",
        "order": 2,
        "translations": {
            "es": "Mi salud es buena", "en": "My health is good", "pt": "Minha saúde está boa", "fr": "Ma santé est bonne",
            "de": "Meine Gesundheit ist gut", "it": "La mia salute è buona", "ru": "Мое здоровье в порядке", "sv": "Min hälsa är bra",
            "nl": "Mijn gezondheid is goed", "zh": "我的健康状况良好", "hi": "मेरा स्वास्थ्य अच्छा है", "bn": "আমার স্বাস্থ্য ভালো",
            "ja": "私の健康は良好です", "ko": "제 건강은 좋습니다", "ar": "صحتي جيدة", "sw": "Afya yangu ni nzuri",
            "ha": "Lafiyata na daidai", "am": "ጤናዬ ጥሩ ነው", "tl": "Ang aking kalusugan ay mabuti", "ms": "Kesihatan saya baik", "mi": "He pai taku hauora",
        }
    },
    {
        "value": "conditions.prefer_not",
        "order": 3,
        "translations": {
            "es": "Prefiero no responder", "en": "Prefer not to answer", "pt": "Prefiro não responder", "fr": "Je préfère ne pas répondre",
            "de": "Ich möchte nicht antworten", "it": "Preferisco non rispondere", "ru": "Предпочитаю не отвечать", "sv": "För att inte svara",
            "nl": "Ik wil niet antwoorden", "zh": "不想回答", "hi": "उत्तर देना पसंद नहीं", "bn": "উত্তর দিতে চাই না",
            "ja": "回答したくありません", "ko": "답변하고 싶지 않음", "ar": "أفضل عدم الإجابة", "sw": "Sipendi kujibu",
            "ha": "Ba ni yi ce", "am": "መልስ ማስጠን አልፈልግም", "tl": "Ayaw kong sumagot", "ms": "Saya memilih untuk tidak menjawab", "mi": "Kāore au e hiahia ki te whakautu",
        }
    },
    {
        "value": "conditions.add",
        "order": 4,
        "translations": {
            "es": "Agregar condición", "en": "Add condition", "pt": "Adicionar condição", "fr": "Ajouter une condition",
            "de": "Bedingung hinzufügen", "it": "Aggiungi condizione", "ru": "Добавить состояние", "sv": "Lägg till tillstånd",
            "nl": "Conditie toevoegen", "zh": "添加状况", "hi": "स्थिति जोड़ें", "bn": "অবস্থা যোগ করুন",
            "ja": "状態を追加", "ko": "상태 추가", "ar": "إضافة حالة", "sw": "Ongeza hali",
            "ha": "Raba hali", "am": "ሁኔታ ያስጨምር", "tl": "Magdagdag ng kondisyon", "ms": "Tambah keadaan", "mi": "Tāpiri te āhua",
        }
    },
    {
        "value": "conditions.info",
        "order": 5,
        "translations": {
            "es": "Puedes compartir esta información si lo deseas. Nos ayuda a adaptar tu experiencia, pero nunca se mostrará sin tu consentimiento.",
            "en": "You can share this information if you wish. It helps us tailor your experience, but it will never be shown without your consent.",
            "pt": "Você pode compartilhar esta informação se desejar. Isso nos ajuda a personalizar sua experiência, mas nunca será mostrado sem seu consentimento.",
            "fr": "Vous pouvez partager cette information si vous le souhaitez. Cela nous aide à adapter votre expérience, mais elle ne sera jamais affichée sans votre consentement.",
            "de": "Sie können diese Information teilen, wenn Sie möchten. Es hilft uns, Ihre Erfahrung anzupassen, aber sie wird nie ohne Ihre Zustimmung angezeigt.",
            "it": "Puoi condividere queste informazioni se lo desideri. Ci aiuta a personalizzare la tua esperienza, ma non verranno mai mostrate senza il tuo consenso.",
            "ru": "Вы можете поделиться этой информацией, если хотите. Это поможет нам адаптировать ваш опыт, но она никогда не будет показана без вашего согласия.",
            "sv": "Du kan dela den här informationen om du vill. Det hjälper oss att anpassa din upplevelse, men den visas aldrig utan ditt samtycke.",
            "nl": "Je kunt deze informatie delen als je wilt. Het helpt ons je ervaring aan te passen, maar het wordt nooit getoond zonder je toestemming.",
            "zh": "如果您愿意，可以分享此信息。这有助于我们个性化您的体验，但未经您同意绝不会显示。",
            "hi": "यदि आप चाहें तो यह जानकारी साझा कर सकते हैं। यह आपके अनुभव को अनुकूलित करने में हमारी मदद करता है, लेकिन यह आपकी सहमति के बिना कभी नहीं दिखाया जाएगा।",
            "bn": "আপনি চাইলে এই তথ্য শেয়ার করতে পারেন। এটি আপনার অভিজ্ঞতা কাস্টমাইজ করার সাহায্য করে, কিন্তু আপনার সম্মতির ছাড়া এটি কখনো দেখানো হবে না।",
            "ja": "ご希望の場合、この情報を共有できます。これによりあなたの体験を最適化できますが、あなたの同意なしには決して表示されません。",
            "ko": "원하시면 이 정보를 공유할 수 있습니다. 귀하의 경험을 맞춤화하는 데 도움이 되지만, 동의 없이 절대 표시되지 않습니다.",
            "ar": "يمكنك مشاركة هذه المعلومات إذا رغبت في ذلك. يساعدنا ذلك في تخصيص تجربتك، ولكن لن يتم عرضها أبدًا دون موافقتك.",
            "sw": "Unaweza kuchangia habari hii ukipenda. Inatusaidia kukulenga uzoefu wako, lakini haitaonyeshwa bila ridhaa yako.",
            "ha": "Za ka iya raba wannan bayani idan ka so. Tana taimaka mana mu saushe rayuwarku, amma ba za a nuna ba ba da gaskiyarku ba.",
            "am": "ይህን መረጃን ማካፈል የሚፈልጉ ከሆነ ይችላሉ። ይህ ስህተትዎን ለማቀነት ያስችላል፣ ነገር ግን ያንተ ፈቃድ ወደደ ያለበት አይታይም።",
            "tl": "Maari mong ibahagi ang impormasyong ito kung guston mo. Nakatutulong ito sa pagpang-angkop ng iyong karanasan, ngunit hindi ito ipapakita nang walang iyong pahintulot.",
            "ms": "Anda boleh berkongsi maklumat ini jika anda ingin. Ia membantu kami menyesuaikan pengalaman anda, tetapi ia tidak akan dipaparkan tanpa keizinan anda.",
            "mi": "Ka taea e koe te tuhi i tēnei mōhiohio mēnā kei te hiahia. Ka āwhina tēnei ki te whakatikatika i tō wheako, engari kāore e whakakitea ki te kore hāngai.",
        }
    },
    {
        "value": "disability.label",
        "order": 6,
        "translations": {
            "es": "Discapacidad", "en": "Disability", "pt": "Deficiência", "fr": "Handicap",
            "de": "Behinderung", "it": "Disabilità", "ru": "Инвалидность", "sv": "Funktionsnedsättning",
            "nl": "Beperking", "zh": "残疾", "hi": "विकलांगता", "bn": "অক্ষমতা",
            "ja": "障害", "ko": "장애", "ar": "إعاقة", "sw": "Ulemavu",
            "ha": "Matsalar jiki", "am": "ድርጊት", "tl": "Kapansanan", "ms": "Kecacatan", "mi": "Hauā",
        }
    },
    {
        "value": "disability.search",
        "order": 7,
        "translations": {
            "es": "Buscar discapacidad...", "en": "Search disability...", "pt": "Buscar deficiência...", "fr": "Rechercher handicap...",
            "de": "Behinderung suchen...", "it": "Cerca disabilità...", "ru": "Поиск инвалидности...", "sv": "Sök funktionsnedsättning...",
            "nl": "Zoek beperking...", "zh": "搜索残疾...", "hi": "विकलांगता खोजें...", "bn": "অক্ষমতা খুঁজুন...",
            "ja": "障害を検索...", "ko": "장애 검색...", "ar": "البحث عن إعاقة...", "sw": "Tafuta ulemavu...",
            "ha": "Bincika matsalar jiki...", "am": "ድርጊት ፈልግ...", "tl": "Maghanap ng kapansanan...", "ms": "Cari kecacatan...", "mi": "Rapua te hauā...",
        }
    },
    {
        "value": "disability.none",
        "order": 8,
        "translations": {
            "es": "Ninguna", "en": "None", "pt": "Nenhuma", "fr": "Aucune",
            "de": "Keine", "it": "Nessuna", "ru": "Нет", "sv": "Ingen",
            "nl": "Geen", "zh": "无", "hi": "कोई नहीं", "bn": "কোনো নেই",
            "ja": "なし", "ko": "없음", "ar": "لا شيء", "sw": "Hakuna",
            "ha": "Babu", "am": "ምንም የለም", "tl": "Wala", "ms": "Tiada", "mi": "Kāore",
        }
    },
    {
        "value": "disability.show_public",
        "order": 9,
        "translations": {
            "es": "Mostrar en perfil público", "en": "Show on public profile", "pt": "Mostrar no perfil público", "fr": "Afficher sur le profil public",
            "de": "Im öffentlichen Profil anzeigen", "it": "Mostra sul profilo pubblico", "ru": "Показать в публичном профиле", "sv": "Visa på publika profilen",
            "nl": "Tonen op publiek profiel", "zh": "在公开资料上显示", "hi": "सार्वजनिक प्रोफ़ाइल पर दिखाएं", "bn": "সার্বজনীন প্রোফাইলে দেখান",
            "ja": "公開プロフィールに表示", "ko": "공개 프로필에 표시", "ar": "عرض في الملف الشخصي العام", "sw": "Onyesha kwenye profaili ya umma",
            "ha": "Nuna a shafin yayan jama'a", "am": "በውጭ ፕሮፋይል ላይ አሳይ", "tl": "Ipakita sa pampublikong profile", "ms": "Tunjukkan di profil awam", "mi": "Whakakite ki te poropiti tūmatanui",
        }
    },
    {
        "value": "energy.label",
        "order": 10,
        "translations": {
            "es": "Nivel de energía", "en": "Energy level", "pt": "Nível de energia", "fr": "Niveau d'énergie",
            "de": "Energielevel", "it": "Livello di energia", "ru": "Уровень энергии", "sv": "Energinivå",
            "nl": "Energieniveau", "zh": "能量水平", "hi": "ऊर्जा स्तर", "bn": "শক্তি স্তর",
            "ja": "エネルギーレベル", "ko": "에너지 레벨", "ar": "مستوى الطاقة", "sw": "Kipimo cha nguvu",
            "ha": "Matakin rayuwa", "am": "የኃይል ደረጃ", "tl": "Antas ng enerhiya", "ms": "Tahap tenaga", "mi": "Tauranga hihiri",
        }
    },
    {
        "value": "energy.description",
        "order": 11,
        "translations": {
            "es": "El nivel de energía ayuda a enviar notificaciones y sugerir actividades según tu ritmo.",
            "en": "Energy level helps send notifications and suggest activities according to your rhythm.",
            "pt": "O nível de energia ajuda a enviar notificações e sugerir atividades de acordo com seu ritmo.",
            "fr": "Le niveau d'énergie aide à envoyer des notifications et suggérer des activités selon votre rythme.",
            "de": "Das Energieniveau hilft, Benachrichtigungen zu senden und Aktivitäten nach Ihrem Rhythmus vorzuschlagen.",
            "it": "Il livello di energia aiuta a inviare notifiche e suggerire attività secondo il tuo ritmo.",
            "ru": "Уровень энергии помогает отправлять уведомления и предлагать активности согласно вашему ритму.",
            "sv": "Energinivån hjälper till att skicka notifieringar och föreslå aktiviteter efter din rytm.",
            "nl": "Het energieniveau helpt notificaties te sturen en activiteiten voor te stellen volgens je ritme.",
            "zh": "能量水平有助于根据您的节奏发送通知和建议活动。",
            "hi": "ऊर्जा स्तर आपकी लय के अनुसार सूचनाएं भेजने और गतिविधियों का सुझाव देने में मदद करता है।",
            "bn": "শক্তির মাত্রা আপনার লয় অনুযায়ী বিজ্ঞপ্তি পাঠাতে এবং কার্যক্রমের সুপারিশ দিতে সাহায্য করে।",
            "ja": "エネルギーレベルは、あなたのリズムに合わせて通知を送信し、アクティビティを提案するのに役立ちます。",
            "ko": "에너지 레벨은 당신의 리듬에 맞춰 알림을 보내고 활동을 제안하는 데 도움이 됩니다.",
            "ar": "مستوى الطاقة يساعد في إرسال الإشعارات واقتراح الأنشطة وفقًا لإيقاعك.",
            "sw": "Kipimo cha nguvu kinasaidia kutuma arifa na kutoa mapendekezo ya shughuli kulingana na mtiririko wako.",
            "ha": "Matakin rayuwa tana taimaka a aika lamba da faɗa aiki da ido da ido da tuntuƙanku.",
            "am": "የኃይል ደረጃ እንደ ምትጠበበት መድረክ ለማድረግ እና ተግባሮችን ለማስተላለፍ ያስችላል።",
            "tl": "Ang antas ng enerhiya ay tumutulong sa pagpadala ng mga abiso at mungkahi ng mga aktibidad ayon sa iyong ritmo.",
            "ms": "Tahap tenaga membantu menghantar notifikasi dan mencadangkan aktiviti mengikut ritma anda.",
            "mi": "Āwhinatia e te tauranga hihiri te tuku pānui me te whakapuakina ngā mahi e hāngai ana ki tō reo.",
        }
    },
    {
        "value": "energy.morning.label",
        "order": 12,
        "translations": {
            "es": "Matutino", "en": "Morning", "pt": "Matutino", "fr": "Matin",
            "de": "Morgens", "it": "Mattutino", "ru": "Утренний", "sv": "Morgon",
            "nl": "Ochtend", "zh": "晨型", "hi": "सुबह", "bn": "সকাল",
            "ja": "朝型", "ko": "아침형", "ar": "صباحي", "sw": "Asubuhi",
            "ha": "Safiya", "am": "ጠዋት", "tl": "Umaga", "ms": "Pagi", "mi": "Ata",
        }
    },
    {
        "value": "energy.morning.description",
        "order": 13,
        "translations": {
            "es": "Activo desde temprano, prefiere actividades matutinas.",
            "en": "Active from early on, prefers morning activities.",
            "pt": "Ativo desde cedo, prefere atividades matutinas.",
            "fr": "Actif dès le matin, préfère les activités matinales.",
            "de": "Früh aktiv, bevorzugt morgendliche Aktivitäten.",
            "it": "Attivo fin dal mattino, preferisce attività mattutine.",
            "ru": "Активен с раннего утра, предпочитает утреннюю активность.",
            "sv": "Aktiv tidigt, föredrar morgonaktiviteter.",
            "nl": "Vroeg actief, Prefereert ochtendactiviteiten.",
            "zh": "清晨活跃，偏好早晨活动。",
            "hi": "सुबह से सक्रिय, सुबह की गतिविधियों को प्राथमिकता देता है।",
            "bn": "সকাল থেকে সক্রিয়, সকালের কার্যক্রমগুলোকে প্রাধান্য দেয়।",
            "ja": "朝から活動的、朝の活動を好む。",
            "ko": "아침부터 활동적, 아침 활동을 선호함.",
            "ar": "نشط منذ الصباح الباكر، يفضل الأنشطة الصباحية.",
            "sw": "Mjasiriamali asubuhi, vipendi vitendo vya asubuhi.",
            "ha": "Yana aiki daga safe, yake so aiki na safe.",
            "am": "ከጠዋት ጀምሮ ንቁ ነው፣ የጠዋት ንቁ ንቁ ንቁን ይፈልጋል።",
            "tl": "Aktibo mula sa umaga, gusto ang mga aktibidad sa umaga.",
            "ms": "Aktif sejak pagi, mengutamakan aktiviti pagi.",
            "mi": "Hihiko i te ata, kia kitea ngā mahi o te ata.",
        }
    },
    {
        "value": "energy.night.label",
        "order": 14,
        "translations": {
            "es": "Nocturno", "en": "Night", "pt": "Noturno", "fr": "Nocturne",
            "de": "Nachteule", "it": "Notturno", "ru": "Ночной", "sv": "Natt",
            "nl": "Nacht", "zh": "夜型", "hi": "रात्री", "bn": "রাত",
            "ja": "夜型", "ko": "밤형", "ar": "ليلي", "sw": "Usiku",
            "ha": "Dare", "am": "ማታ", "tl": "Gabi", "ms": "Malam", "mi": "Pō",
        }
    },
    {
        "value": "energy.night.description",
        "order": 15,
        "translations": {
            "es": "Se activa por la tarde y noche, prefiere planes nocturnos.",
            "en": "Activates in the afternoon and night, prefers nighttime plans.",
            "pt": "Ativa à tarde e à noite, prefere planos noturnos.",
            "fr": "S'active l'après-midi et le soir, préfère les plans nocturnes.",
            "de": "Wird nachmittags und nachts aktiv, bevorzugt nächtliche Pläne.",
            "it": "Si attiva nel pomeriggio e la sera, preferisce piani notturni.",
            "ru": "Активируется днем и ночью, предпочитает ночные планы.",
            "sv": "Aktiveras på eftermiddagen och natten, föredrar nattliga planer.",
            "nl": "Wordt 's middags en 's nachts actief, kiest voor nachtelijke plannen.",
            "zh": "下午和晚上活跃，偏好夜间计划。",
            "hi": "दोपहर और रात में सक्रिय, रात की योजनाओं को प्राथमिकता देता है।",
            "bn": "দুপুর এবং রাতের সময় সক্রিয়, রাতের পরিকল্পনাকে প্রাধান্য দেয়।",
            "ja": "午後と夜に活動的、夜の予定を好む。",
            "ko": "오후와 밤에 활동적, 야간 계획을 선호함.",
            "ar": "ينشط في فترة ما بعد الظهر والليل، يفضل الخطط الليلية.",
            "sw": "Huwa mjasiriamali jioni na usiku, avipendi mpango wa usiku.",
            "ha": "Yana aiki da rana da dare, yake so shirye-shiryen dare.",
            "am": "ከማታ ጀምሮ ንቁ ይሆናል፣ የሌላ ንቁ ንቁን ይፈልጋል።",
            "tl": "Gumagana sa hapon at gabi, gusto ang mga plano sa gabi.",
            "ms": "Aktif pada petang dan malam, mengutamakan pelan malam.",
            "mi": "Hihiko i te ahiahi me te pō, kia kitea ngā mahere o te pō.",
        }
    },
    {
        "value": "energy.adaptable.label",
        "order": 16,
        "translations": {
            "es": "Adaptable", "en": "Adaptable", "pt": "Adaptável", "fr": "Adaptable",
            "de": "Anpassungsfähig", "it": "Adattabile", "ru": "Адаптивный", "sv": "Anpassningsbar",
            "nl": "Aanpasbaar", "zh": "适应型", "hi": "अनुकूलनीय", "bn": "অনূরূপ",
            "ja": "適応型", "ko": "적응형", "ar": "قابل للتكيف", "sw": "Yenye uwezo wa kubadilika",
            "ha": "Yin amfani da yadda yake", "am": "ተገቢ", "tl": "Maadapt", "ms": "Boleh disesuaikan", "mi": "Kore kore",
        }
    },
    {
        "value": "energy.adaptable.description",
        "order": 17,
        "translations": {
            "es": "Se ajusta según el día, flexible con cualquier horario.",
            "en": "Adjusts according to the day, flexible with any schedule.",
            "pt": "Ajusta-se conforme o dia, flexível com qualquer horário.",
            "fr": "S'adapte selon le jour, flexible avec n'importe quel horaire.",
            "de": "Passt sich dem Tag an, flexibel bei jedem Zeitplan.",
            "it": "Si adatta in base al giorno, flessibile con qualsiasi orario.",
            "ru": "Приспосабливается в зависимости от дня, гибкий к любому расписанию.",
            "sv": "Anpassar sig efter dagen, flexibelt med vilket schema som helst.",
            "nl": "Past zich aan aan de dag, flexibel met elk schema.",
            "zh": "根据一天调整，适应任何日程。",
            "hi": "दिन के अनुसार ढलता है, किसी भी शेड्यूल के साथ लचीला।",
            "bn": "দিন অনুযায়ী স Điều chỉnh করে, যেকোনো সময়সূচীর সাথে লഘু।",
            "ja": "その日に合わせて調整、どんなスケジュールにも柔軟。",
            "ko": "그날에 따라 조정, 어떤 일정에도 유연함.",
            "ar": "يتكيف حسب اليوم، مرن مع أي جدول زمني.",
            "sw": "Inabadilika kulingana na siku, rahisi na ratiba yeyote.",
            "ha": "Yin canza kamar yadda ranan take, rahisi da kowane jerin lokaci.",
            "am": "በቀን የተገለጠ ፣ ከማይችል ጊዜ ጋር አለባቀል።",
            "tl": "Naaayon sa araw, flexible sa anumang iskedyul.",
            "ms": "Menyesuaikan mengikut hari, fleksibel dengan mana-mana jadual.",
            "mi": "Whakaritea e ai ki te rā, ngāwari ki ia wāhanga.",
        }
    },
    {
        "value": "energy.note",
        "order": 18,
        "translations": {
            "es": "Esto también ayuda a encontrar personas con ritmos de vida similares o complementarios.",
            "en": "This also helps find people with similar or complementary life rhythms.",
            "pt": "Isso também ajuda a encontrar pessoas com ritmos de vida semelhantes ou complementares.",
            "fr": "Cela aide aussi à trouver des personnes avec des rythmes de vie similaires ou complémentaires.",
            "de": "Dies hilft auch, Menschen mit ähnlichen oder ergänzenden Lebensrhythmen zu finden.",
            "it": "Questo aiuta anche a trovare persone con ritmi di vita simili o complementari.",
            "ru": "Это также помогает находить людей с похожими или дополняющими жизненными ритмами.",
            "sv": "Detta hjälper också att hitta människor med liknande eller kompletterande livsrytm.",
            "nl": "Dit helpt ook mensen te vinden met vergelijkbare of complementaire levensritmes.",
            "zh": "这也有助于找到生活节奏相似或互补的人。",
            "hi": "यह समान या पूरक जीवन लय वाले लोगों को खोजने में भी मदद करता है।",
            "bn": "এটি অনুরূপ বা পূরক জীবন ধারার লোকদের খুঁজে বের করতে সাহায্য করে।",
            "ja": "これはまた、似たようなまたは補完的な生活リズムを持つ人々を見つけるのにも役立ちます。",
            "ko": "이것은 또한 비슷하거나 보완적인 생활 리듬을 가진 사람들을 찾는 데 도움이 됩니다.",
            "ar": "وهذا يساعد أيضًا في العثور على أشخاص ذوي إيقاعات حياة مماثلة أو تكميلية.",
            "sw": "Hii pia inasaidia kupata watu na mtiririko maisha sawa au kamilifu.",
            "ha": "Wannan kuma tana taimaka a neman mutane da tuntuƙan rayuwa da yawa da kuma da sauransu.",
            "am": "ይህ ደግሞ የህይወት ርዝመት ተመሳሳይ ወይም የሚጨምሩን ሰዎችን ለማግኘት ያስችላል።",
            "tl": "Ito rin ay tumutulong sa paghahanap ng mga tao na may magkatulad o kabilang sa buhay na ritmo.",
            "ms": "Ini juga membantu mencari orang dengan irama kehidupan yang serupa atau pelengkap.",
            "mi": "Āwhinatia anō tēnei te rapu i ngā tāngata e ōrite ana te tauranga oranga, kīhai rānei i te tauranga tāpiri.",
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
            SystemOption.category == "profile_health_section",
            SystemOption.value == value,
        )
        
        # Build document
        doc_data = {
            "category": "profile_health_section",
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
    print(f"seed_profile_health_section: created {created}, skipped {len(TEXTS) - created}")


if __name__ == "__main__":
    asyncio.run(main())