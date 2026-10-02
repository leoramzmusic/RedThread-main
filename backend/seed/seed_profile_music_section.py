"""
Seed the `profile_music_section` system options catalog for UI texts in the Music ("Mi Himno") section.

The texts in MusicSection / MusicGenreSelector read from
GET /options/section/profile_music_section.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_music_section.py
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


def uni(value: str) -> dict:
    """Same text for every language (brand names, genre proper nouns)."""
    return {lang: value for lang in LANGS}


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
            es="Mi Himno", en="My Anthem", pt="Meu Hino", fr="Mon Hymne",
            de="Meine Hymne", it="Il Mio Inno", ru="Мой Гимн", sv="Min Hymn",
            nl="Mijn Hymne", zh="我的赞歌", hi="मेरा गीत", bn="আমার গান",
            ja="マイ・ハイムノ", ko="마이 하이먼", ar="نشيدي", sw="Wimbo Wangu",
            ha="Wakan Na", am="የእኔ ምስጋና", tl="Aking Himno", ms="Lagu Saya",
            mi="Taku Waiata",
        ),
    },
    {
        "value": "connectIntro",
        "order": 1,
        "translations": L(
            es="Conecta tu cuenta de Spotify para mostrar tu mundo musical.",
            en="Connect your Spotify account to show off your musical world.",
            pt="Conecte sua conta do Spotify para mostrar seu mundo musical.",
            fr="Connectez votre compte Spotify pour montrer votre monde musical.",
            de="Verbinde dein Spotify-Konto, um deine musikalische Welt zu zeigen.",
            it="Collega il tuo account Spotify per mostrare il tuo mondo musicale.",
            ru="Подключите свой аккаунт Spotify, чтобы показать свой музыкальный мир.",
            sv="Anslut ditt Spotify-konto för att visa din musikaliska värld.",
            nl="Verbind je Spotify-account om je muzikale wereld te tonen.",
            zh="连接你的 Spotify 账户，展示你的音乐世界。",
            hi="अपना Spotify खाता कनेक्ट करें और अपनी संगीतमय दुनिया दिखाएं।",
            bn="আপনার Spotify অ্যাকাউন্ট সংযুক্ত করে আপনার সংগীত জগৎ দেখান।",
            ja="Spotify アカウントを連携して、音楽の世界を見せてください。",
            ko="Spotify 계정을 연결해 음악 세계를 보여주세요.",
            ar="اربط حسابك في Spotify لعرض عالمك الموسيقي.",
            sw="Unganisha akaunti yako ya Spotify kuonyesha ulimwengu wako wa music.",
            ha="Haɗa asusunka na Spotify don nuna duniya ka ta ki wasa.",
            am="የSpotify ሂሳብህን አገናኝ የሙዚቃዊውን ዓለምህን አሳያጅ።",
            tl="Ikonekta ang iyong Spotify account para ipakita ang iyong mundo ng musika.",
            ms="Sambungkan akaun Spotify anda untuk mempamerkan dunia muzik anda.",
            mi="Whakapaua tōu pūkā Spotify kia whakaatu ai i tō ao hurihuri.",
        ),
    },
    {
        "value": "connectedIntro",
        "order": 2,
        "translations": L(
            es="Has conectado Spotify. Tu mundo musical está listo para mostrarse en tu perfil.",
            en="You've connected Spotify. Your musical world is ready to be shown on your profile.",
            pt="Você conectou o Spotify. Seu mundo musical está pronto para aparecer no seu perfil.",
            fr="Vous avez connecté Spotify. Votre monde musical est prêt à être affiché sur votre profil.",
            de="Du hast Spotify verbunden. Deine musikalische Welt ist bereit, in deinem Profil gezeigt zu werden.",
            it="Hai collegato Spotify. Il tuo mondo musicale è pronto per essere mostrato sul tuo profilo.",
            ru="Вы подключили Spotify. Ваш музыкальный мир готов к отображению в профиле.",
            sv="Du har anslutit Spotify. Din musikaliska värld är redo att visas på din profil.",
            nl="Je hebt Spotify verbonden. Je muzikale wereld is klaar om op je profiel te verschijnen.",
            zh="你已连接 Spotify。你的音乐世界已准备好显示在个人资料中。",
            hi="आपने Spotify कनेक्ट कर लिया है। आपकी संगीतमय दुनिया आपकी प्रोफ़ाइल में दिखने के लिए तैयार है।",
            bn="আপনি Spotify সংযুক্ত করেছেন। আপনার সংগীত জগৎ আপনার প্রোফাইলে দেখানোর জন্য প্রস্তুত।",
            ja="Spotify を連携しました。音楽の世界をプロフィールに表示できます。",
            ko="Spotify 계정을 연결했습니다. 음악 세계를 프로필에 표시할 수 있습니다.",
            ar="لقد ربطت حسابك في Spotify. عالمك الموسيقي جاهز للظهور في ملفك الشخصي.",
            sw="Umeunganisha Spotify. Ulimwengu wako wa music umeweka tayari kuonyeshwa kwenye wasifu wako.",
            ha="Ka haɗa Spotify. Duniya ka ta ki wasa tana shirya nunawa a kan ka.",
            am="Spotify አገናኝ። የሙዚቃዊ ዓለምህ በመገለጫዎ ለማሳየት ተዘጋጅቷል።",
            tl="Nakonekta na ang Spotify. Handa na ang iyong mundo ng musika na ipakita sa iyong profile.",
            ms="Anda telah menyambungkan Spotify. Dunia muzik anda sedia untuk dipaparkan di profil anda.",
            mi="Kua whakapaua e koe i te Spotify. Kua rite tō ao hurihuri ki te whakaatu i tōua tauwhira.",
        ),
    },
    {
        "value": "connectInfo",
        "order": 3,
        "translations": L(
            es="Al conectar tu cuenta de Spotify, algunas funciones (reproducir canciones, crear listas) dependerán de tu suscripción. Esto no afecta tu experiencia dentro de RETH.",
            en="When you connect your Spotify account, some features (playing songs, creating playlists) will depend on your subscription. This does not affect your experience inside RETH.",
            pt="Ao conectar sua conta do Spotify, alguns recursos (reproduzir músicas, criar playlists) dependerão da sua assinatura. Isso não afeta sua experiência dentro do RETH.",
            fr="Lorsque vous connectez votre compte Spotify, certaines fonctionnalités (lire des morceaux, créer des playlists) dépendront de votre abonnement. Cela n'affecte pas votre expérience au sein de RETH.",
            de="Wenn du dein Spotify-Konto verbindest, hängen einige Funktionen (Songs abspielen, Playlists erstellen) von deinem Abonnement ab. Das beeinflusst dein Erlebnis innerhalb von RETH nicht.",
            it="Quando colleghi il tuo account Spotify, alcune funzioni (riprodire brani, creare playlist) dipenderanno dal tuo abbonamento. Questo non influisce sulla tua esperienza dentro RETH.",
            ru="При подключении аккаунта Spotify некоторые функции (воспроизведение песен, создание плейлистов) будут зависеть от вашей подписки. Это не влияет на ваш опыт в RETH.",
            sv="När du ansluter ditt Spotify-konto kommer vissa funktioner (spela låtar, skapa spellistor) att bero på din prenumeration. Det påverkar inte din upplevelse i RETH.",
            nl="Wanneer je je Spotify-account verbindt, zijn sommige functies (nummers afspelen, afspeellijsten maken) afhankelijk van je abonnement. Dit heeft geen invloed op je ervaring binnen RETH.",
            zh="连接 Spotify 账户后，部分功能（播放歌曲、创建播放列表）将取决于你的订阅。这不会影响你在 RETH 中的体验。",
            hi="Spotify खाता कनेक्ट करने पर कुछ सुविधाएँ (गाने चलाना, प्लेलिस्ट बनाना) आपकी सदस्यता पर निर्भर होंगी। इससे RETH में आपका अनुभव प्रभावित नहीं होता।",
            bn="Spotify অ্যাকাউন্ট সংযুক্ত করলে কিছু বৈশিষ্ট্য (গান চালানো, প্লেলিস্ট তৈরি) আপনার সাবস্ক্রিপশনের উপর নির্ভর করবে। এটি RETH-এ আপনার অভিজ্ঞতাকে প্রভাবিত করে না।",
            ja="Spotify アカウントを連携すると、一部の機能（曲の再生、プレイリストの作成）はサブスクリプションの有無によります。RETH での体験には影響しません。",
            ko="Spotify 계정을 연결하면 일부 기능(노래 재생, 플레이리스트 만들기)은 구독 여부에 따라 달라집니다. RETH에서의 경험에는 영향을 주지 않습니다.",
            ar="عند ربط حسابك في Spotify، تعتمد بعض الميزات (تشغيل الأغاني وإنشاء قوائم التشغيل) على اشتراكك. هذا لا يؤثر على تجربتك داخل RETH.",
            sw="Unapounganisha akaunti yako ya Spotify, baadhi ya vipengele (kucheza nyimbo, kutengeneza mizizi) hutegemea usajili wako. Hii haathorofi uzoefu wako ndani ya RETH.",
            ha="Idan ka haɗa asusunka na Spotify, wasu ayyuka (gide wa waƙaƙi, ƙirƙiri jerƙirai) sune dogara da biyan kuwa. Wannan ba ta saɓawa gaisuwarka a cikin RETH ba.",
            am="የSpotify ሂሳብ ሲገናኝ፣ አንዳንድ ባህሪዎች (ሙዚቃ መጫወት፣ የሙዚቃ ዝርዝር መፍጠር) ከዕቅዳዎ ይወሰናሉ። ይህ በRETH ውስጥ ያለውን ተገልጋዎ አያስተጠብቅም።",
            tl="Kapag ikonekta mo ang iyong Spotify account, may mga feature (pag-play ng awitin, paggawa ng playlist) na nakadepende sa iyong subscription. Hindi nito naaapektuhan ang iyong karanasan sa loob ng RETH.",
            ms="Apabila anda menyambungkan akaun Spotify anda, sesetengah ciri (memutar lagu, mencipta senarai playthrough) bergantung pada langganan anda. Ini tidak mempengaruhi pengalaman anda dalam RETH.",
            mi="Ka whakapaua koe i tōu pūkā Spotify, ka hinga ki tōu tiritiri etahi āhuatanga (waiaro i ngā waiata, hanga i ngā rārangi kōrerototanga) ki tōu whakapuku. Kāore tēnei e pānga ana i tōu wheako i roto i RETH.",
        ),
    },
    {
        "value": "freeAccount",
        "order": 4,
        "translations": L(
            es="Estás usando la cuenta gratuita de Spotify. Algunas funciones (como reproducir canciones) pueden estar limitadas, pero esto no afecta tu experiencia dentro de RETH.",
            en="You're using the free Spotify account. Some features (like playing songs) may be limited, but this does not affect your experience inside RETH.",
            pt="Você está usando a conta gratuita do Spotify. Alguns recursos (como reproduzir músicas) podem estar limitados, mas isso não afeta sua experiência dentro do RETH.",
            fr="Vous utilisez le compte gratuit de Spotify. Certaines fonctionnalités (comme la lecture de morceaux) peuvent être limitées, mais cela n'affecte pas votre expérience au sein de RETH.",
            de="Du nutzt das kostenlose Spotify-Konto. Einige Funktionen (wie das Abspielen von Songs) können eingeschränkt sein, aber das beeinflusst dein Erlebnis innerhalb von RETH nicht.",
            it="Stai usando l'account gratuito di Spotify. Alcune funzioni (come la riproduzione di brani) potrebbero essere limitate, ma questo non influisce sulla tua esperienza dentro RETH.",
            ru="Вы используете бесплатный аккаунт Spotify. Некоторые функции (например, воспроизведение песен) могут быть ограничены, но это не влияет на ваш опыт в RETH.",
            sv="Du använder ett gratis Spotify-konto. Vissa funktioner (som att spela låtar) kan vara begränsade, men det påverkar inte din upplevelse i RETH.",
            nl="Je gebruikt het gratis Spotify-account. Sommige functies (zoals nummers afspelen) kunnen beperkt zijn, maar dit heeft geen invloed op je ervaring binnen RETH.",
            zh="你正在使用 Spotify 免费账户。部分功能（如播放歌曲）可能受限，但这不会影响你在 RETH 中的体验。",
            hi="आप Spotify का निःशुल्क खाता इस्तेमाल कर रहे हैं। कुछ सुविधाएँ (जैसे गाने चलाना) सीमित हो सकती हैं, लेकिन इससे RETH में आपका अनुभव प्रभावित नहीं होता।",
            bn="আপনি Spotify-এর বিনামূল্যের অ্যাকাউন্ট ব্যবহার করছেন। কিছু বৈশিষ্ট্য (গান চালানোর মতো) সীমাবদ্ধ থাকতে পারে, তবে এটি RETH-এ আপনার অভিজ্ঞতাকে প্রভাবিত করে না।",
            ja="Spotify の無料アカウントを使用しています。一部の機能（曲の再生など）は制限される場合がありますが、RETH での体験には影響しません。",
            ko="Spotify 무료 계정을 사용 중입니다. 일부 기능(노래 재생 등)은 제한될 수 있지만 RETH에서의 경험에는 영향을 주지 않습니다.",
            ar="أنت تستخدم حساب Spotify المجاني. قد تكون بعض الميزات (مثل تشغيل الأغاني) محدودة، لكن هذا لا يؤثر على تجربتك داخل RETH.",
            sw="Unatumia akaunti ya bure ya Spotify. Baadhi ya vipengele (kama kucheza nyimbo) vinaweza kufungwa, lakini hii haathorofi uzoefu wako ndani ya RETH.",
            ha="Kana amfani da asusun Spotify na kyauta. Wasu ayyuka (kama gide wa waƙaƙi) suna iya tsayawa, amma wannan ba ta saɓawa gaisuwarka a cikin RETH ba.",
            am="የክፍያ Spotify ሂሳብን ተጠቅመክተሃል። አንዳንድ ባህሪዎች (ሙዚቃ መጫወት ላሉ) የተገደበ ሊሆኑ ይችላሉ፣ ግን ይህ በRETH ውስጥ ያለውን ተገልጋዎ አያስተጠብቅም።",
            tl="Ginagamit mo ang libreng Spotify account. May mga feature (tulad ng pag-play ng awitin) na maaaring limitado, ngunit hindi nito naaapektuhan ang iyong karanasan sa loob ng RETH.",
            ms="Anda menggunakan akaun Spotify percuma. Sesetengah ciri (seperti memutar lagu) mungkin terhad, tetapi ini tidak mempengaruhi pengalaman anda dalam RETH.",
            mi="Kei te whakamahi koe i te pūkā Spotify koreutu. Ka whakawhanatia ētahi āhuatanga (pēnei i te waiaro i ngā waiata), engari kāore tēnei e pānga ana i tōu wheako i roto i RETH.",
        ),
    },
    {
        "value": "connect",
        "order": 5,
        "translations": L(
            es="Conectar Spotify", en="Connect Spotify", pt="Conectar Spotify",
            fr="Connecter Spotify", de="Spotify verbinden", it="Collega Spotify",
            ru="Подключить Spotify", sv="Anslut Spotify", nl="Spotify verbinden",
            zh="连接 Spotify", hi="Spotify कनेक्ट करें", bn="Spotify সংযুক্ত করুন",
            ja="Spotify を連携", ko="Spotify 연결", ar="اربط Spotify",
            sw="Unganisha Spotify", ha="Haɗa Spotify", am="Spotify አገናኝ",
            tl="Ikonekta ang Spotify", ms="Sambungkan Spotify", mi="Whakapaua Spotify",
        ),
    },
    {
        "value": "disconnect",
        "order": 6,
        "translations": L(
            es="Desconectar Spotify", en="Disconnect Spotify", pt="Desconectar Spotify",
            fr="Déconnecter Spotify", de="Spotify trennen", it="Scollega Spotify",
            ru="Отключить Spotify", sv="Koppla bort Spotify", nl="Spotify loskoppelen",
            zh="断开 Spotify", hi="Spotify डिस्कनेक्ट करें", bn="Spotify সংযোগ বিচ্ছিন্ন করুন",
            ja="Spotify の連携を解除", ko="Spotify 연결 해제", ar="إلغاء ربط Spotify",
            sw="Kata Spotify", ha="Soke haɗa Spotify", am="Spotify ንሽክ",
            tl="I-disconnect ang Spotify", ms="Putuskan Spotify", mi="Tapuhia te Spotify",
        ),
    },
    {
        "value": "genresTitle",
        "order": 7,
        "translations": L(
            es="Géneros Musicales", en="Music Genres", pt="Gêneros Musicais",
            fr="Genres Musicaux", de="Musikgenres", it="Generi Musicali",
            ru="Музыкальные жанры", sv="Musikgenrer", nl="Muziekgenres",
            zh="音乐流派", hi="संगीत शैलियाँ", bn="সংগীত ধরন",
            ja="音楽ジャンル", ko="음악 장르", ar="الأنواع الموسيقية",
            sw="Aina za Muziki", ha="Salewa ki Wasa", am="የሙዚቃ ዘር",
            tl="Mga Genre ng Musika", ms="Genre Muzik", mi="Momo Mōhio",
        ),
    },
    {
        "value": "genres.search",
        "order": 8,
        "translations": L(
            es="Buscar géneros...", en="Search genres...", pt="Pesquisar gêneros...",
            fr="Rechercher des genres...", de="Genres suchen...", it="Cerca generi...",
            ru="Поиск жанров...", sv="Sök genrer...", nl="Zoek genres...",
            zh="搜索流派...", hi="शैलियाँ खोजें...", bn="ধরন খুঁজুন...",
            ja="ジャンルを検索...", ko="장르 검색...", ar="ابحث عن الأنواع...",
            sw="Tafuta aina za muziki...", ha="Nemo salewa...", am="ዘር ፈልግ...",
            tl="Maghanap ng genre...", ms="Cari genre...", mi="Rapu mōhio...",
        ),
    },
    {
        "value": "genres.count",
        "order": 9,
        "translations": L(
            es="Géneros Musicales ({{count}}/25 seleccionados)",
            en="Music Genres ({{count}}/25 selected)",
            pt="Gêneros Musicais ({{count}}/25 selecionados)",
            fr="Genres Musicaux ({{count}}/25 sélectionnés)",
            de="Musikgenres ({{count}}/25 ausgewählt)",
            it="Generi Musicali ({{count}}/25 selezionati)",
            ru="Музыкальные жанры (выбрано {{count}}/25)",
            sv="Musikgenrer ({{count}}/25 valda)",
            nl="Muziekgenres ({{count}}/25 geselecteerd)",
            zh="音乐流派（已选 {{count}}/25）",
            hi="संगीत शैलियाँ ({{count}}/25 चयनित)",
            bn="সংগীত ধরন ({{count}}/25 নির্বাচিত)",
            ja="音楽ジャンル（{{count}}/25 選択）",
            ko="음악 장르 ({{count}}/25 선택)",
            ar="الأنواع الموسيقية (تم اختيار {{count}}/25)",
            sw="Aina za Muziki ({{count}}/25 zilizochaguliwa)",
            ha="Salewa ki Wasa ({{count}}/25 da aka zaune)",
            am="የሙዚቃ ዘሮች ({{count}}/25 የተመረጡ)",
            tl="Mga Genre ng Musika ({{count}}/25 napili)",
            ms="Genre Muzik ({{count}}/25 dipilih)",
            mi="Ngā Momo Mōhio ({{count}}/25 i tīmata)",
        ),
    },
    {
        "value": "genres.empty",
        "order": 10,
        "translations": L(
            es="No se encontraron géneros.", en="No genres found.",
            pt="Nenhum gênero encontrado.", fr="Aucun genre trouvé.",
            de="Keine Genres gefunden.", it="Nessun genere trovato.",
            ru="Жанры не найдены.", sv="Inga genrer hittades.",
            nl="Geen genres gevonden.", zh="未找到流派。",
            hi="कोई शैली नहीं मिली।", bn="কোনো ধরন পাওয়া যায়নি।",
            ja="ジャンルが見つかりません。", ko="장르를 찾을 수 없습니다.",
            ar="لم يتم العثور على أنواع.", sw="Hakuna aina za muziki zilizopatikana.",
            ha="Babu salewa da aka same.", am="ምንም ዘር አልተገኘም።",
            tl="Walang nahanap na genre.", ms="Tiada genre dijumpai.",
            mi="Kāore an kitea i tētahi mōhio.",
        ),
    },
    {
        "value": "genres.noneSelected",
        "order": 11,
        "translations": L(
            es="No hay géneros seleccionados", en="No genres selected",
            pt="Nenhum gênero selecionado", fr="Aucun genre sélectionné",
            de="Keine Genres ausgewählt", it="Nessun genere selezionato",
            ru="Жанры не выбраны", sv="Inga genrer valda",
            nl="Geen genres geselecteerd", zh="未选择流派",
            hi="कोई शैली चयनित नहीं", bn="কোনো ধরন নির্বাচিত নয়",
            ja="ジャンルが選択されていません", ko="선택된 장르가 없습니다",
            ar="لم يتم اختيار أي نوع", sw="Hakuna aina za muziki zilizochaguliwa",
            ha="Babu salewa da aka zaune", am="ምንም ዘር አልተመረጠም",
            tl="Walang napiling genre", ms="Tiada genre dipilih",
            mi="Kāore tēnei i tīmata i tētahi mōhio",
        ),
    },
    {
        "value": "genres.categories.pop_rock",
        "order": 12,
        "translations": uni("Pop / Rock"),
    },
    {
        "value": "genres.categories.rock_subgenres",
        "order": 13,
        "translations": L(
            es="Subgéneros de Rock", en="Rock Subgenres", pt="Subgêneros de Rock",
            fr="Sous-genres du Rock", de="Rock-Subgenres", it="Sottogenere del Rock",
            ru="Поджанры рока", sv="Rock-subgenrer", nl="Rock subgenres",
            zh="摇滚子流派", hi="रॉक उपशैलियाँ", bn="রকের উপজাতরি",
            ja="ロックのサブジャンル", ko="록 서브장르", ar="أنواع الروك الفرعية",
            sw="Aina za Rock", ha="Karfan Rock", am="የሮክ ንዑስ ዘሮች",
            tl="Mga Subgenre ng Rock", ms="Subgenre Rock", mi="Ngā Mōhio Rōka",
        ),
    },
    {
        "value": "genres.categories.electronic",
        "order": 14,
        "translations": L(
            es="Electrónica", en="Electronic", pt="Eletrônica", fr="Électronique",
            de="Elektronisch", it="Elettronica", ru="Электроника", sv="Elektroniskt",
            nl="Elektronisch", zh="电子", hi="इलेक्ट्रॉनिक", bn="ইলেকট্রনিক",
            ja="エレクトロ", ko="일렉트로닉", ar="إلكتروني",
            sw="Elektroniki", ha="Kadan", am="ኤሌክትሮኒክስ",
            tl="Elektronika", ms="Elektronik", mi="Hihiko",
        ),
    },
    {
        "value": "genres.categories.hip_hop_urban",
        "order": 15,
        "translations": L(
            es="Hip Hop / Urbano", en="Hip Hop / Urban", pt="Hip Hop / Urbano",
            fr="Hip Hop / Urbain", de="Hip Hop / Urban", it="Hip Hop / Urbano",
            ru="Хип-хоп / Урбан", sv="Hip Hop / Urban", nl="Hip Hop / Urban",
            zh="嘻哈 / 都市", hi="हिप हॉप / अर्बन", bn="হিপ হপ / আরবান",
            ja="ヒップホップ / 都市", ko="힙합 / 어반", ar="هيب هوب / حضري",
            sw="Hip Hop / Vijijini", ha="Hip Hop / Al'ada", am="ሂፕ ሆፕ / ከተማሪ",
            tl="Hip Hop / Urban", ms="Hip Hop / Urban", mi="Hip Hop / Tōtūkū",
        ),
    },
    {
        "value": "genres.categories.latin",
        "order": 16,
        "translations": L(
            es="Latina", en="Latin", pt="Latina", fr="Latine", de="Latin",
            it="Latina", ru="Латинская", sv="Latin", nl="Latijns", zh="拉丁",
            hi="लैटिन", bn="ল্যাটিন", ja="ラテン", ko="라틴", ar="لاتيني",
            sw="Kilatini", ha="Latin", am="ላቲን", tl="Latin", ms="Latin", mi="Latin",
        ),
    },
    {
        "value": "genres.categories.jazz_blues",
        "order": 17,
        "translations": uni("Jazz / Blues"),
    },
    {
        "value": "genres.categories.world",
        "order": 18,
        "translations": L(
            es="Mundial", en="World", pt="Mundial", fr="Mondial", de="Weltmusik",
            it="Musica del mondo", ru="Музыка мира", sv="Världsmusik",
            nl="Wereldmuziek", zh="世界音乐", hi="विश्व संगीत", bn="বিশ্ব সংগীত",
            ja="ワールドミュージック", ko="월드 뮤직", ar="الموسيقى العالمية",
            sw="Muziki wa Duniani", ha="Ki wasa na duniya", am="የዓለም ሙዚቃ",
            tl="Musika ng Mundo", ms="Muzik Dunia", mi="Pāoro o te Ao",
        ),
    },
    {
        "value": "genres.categories.other",
        "order": 19,
        "translations": L(
            es="Otros", en="Other", pt="Outros", fr="Autres", de="Sonstige",
            it="Altro", ru="Другое", sv="Övrigt", nl="Overig", zh="其他",
            hi="अन्य", bn="অন্যান্য", ja="その他", ko="기타", ar="أخرى",
            sw="Nyingine", ha="Sauran", am="ሌሎች", tl="Iba", ms="Lain-lain",
            mi="Ētahi",
        ),
    },
    {
        "value": "addBlocked",
        "order": 20,
        "translations": L(
            es='Las funciones de "Añadir" están bloqueadas por tu cuenta gratuita de Spotify. Esto depende de tu suscripción a Spotify, no de RETH.',
            en='The "Add" features are blocked by your free Spotify account. This depends on your Spotify subscription, not on RETH.',
            pt='As funções de "Adicionar" estão bloqueadas pela sua conta gratuita do Spotify. Isso depende da sua assinatura do Spotify, não do RETH.',
            fr='Les fonctions « Ajouter » sont bloquées par votre compte gratuit Spotify. Cela dépend de votre abonnement Spotify, pas de RETH.',
            de='Die Funktionen zum „Hinzufügen" sind durch dein kostenloses Spotify-Konto gesperrt. Das hängt von deinem Spotify-Abonnement ab, nicht von RETH.',
            it='Le funzioni "Aggiungi" sono bloccate dal tuo account gratuito di Spotify. Questo dipende dal tuo abbonamento a Spotify, non da RETH.',
            ru='Функции «Добавить» заблокированы из-за бесплатного аккаунта Spotify. Это зависит от вашей подписки на Spotify, а не от RETH.',
            sv='Funktionerna för "Lägg till" är blockerade av ditt gratis Spotify-konto. Det beror på din Spotify-prenumeration, inte på RETH.',
            nl='De functies "Toevoegen" zijn geblokkeerd door je gratis Spotify-account. Dit hangt af van je Spotify-abonnement, niet van RETH.',
            zh='由于你使用的是 Spotify 免费账户，"添加"功能被禁用。这取决于你的 Spotify 订阅，而不是 RETH。',
            hi='आपके Spotify निःशुल्क खाते के कारण "जोड़ें" सुविधाएँ अवरुद्ध हैं। यह RETH पर निर्भर नहीं, बल्कि आपकी Spotify सदस्यता पर निर्भर है।',
            bn='"যোগ করা" বৈশিষ্ট্যগুলো আপনার বিনামূল্যের Spotify অ্যাকাউন্টের কারণে বন্ধ। এটি RETH-এর উপর নয়, আপনার Spotify সাবস্ক্রিপশনের উপর নির্ভর করে।',
            ja='無料アカウントのため「追加」機能は利用できません。これはRETHではなくSpotifyのサブスクリプションによります。',
            ko='무료 계정이라 "추가" 기능이 잠겨 있습니다. RETH가 아니라 Spotify 구독 여부에 따른 것입니다.',
            ar='ميزات "الإضافة" معطّلة بسبب حسابك المجاني في Spotify. يعتمد ذلك على اشتراكك في Spotify وليس على RETH.',
            sw='Vitendeleo vya "Ongeza" vimezuiwa na akaunti yako ya bure ya Spotify. Hii inategemea usajili wako wa Spotify, si RETH.',
            ha='Ayyukan "Ƙara" an soke asusunka na kyauta na Spotify. Wannan yana dogara da biyan ka na Spotify, ba da RETH ba.',
            am='የ"አክል" ባህሪዎች በክፍያ Spotify ሂሳብህ ተከልነዋል። ይህ ከSpotify የዕቅዳዎ ይወሰናል፣ ከRETH አይደለም።',
            tl='Naka-block ang mga "Magdagdag" feature dahil sa libreng Spotify account mo. Ito ay nakadepende sa iyong Spotify subscription, hindi sa RETH.',
            ms='Ciri "Tambah" disekat oleh akaun Spotify percuma anda. Ini bergantung pada langganan Spotify anda, bukan pada RETH.',
            mi='Kua rahuitia ngā āhuatanga "Tā" e te pūkā Spotify koreutu. Ka hinga ki tōu tiritiri Spotify, ehara ki te RETH.',
        ),
    },
    {
        "value": "artistsTitle",
        "order": 21,
        "translations": L(
            es="Artistas Favoritos ({{count}}/16)", en="Favorite Artists ({{count}}/16)",
            pt="Artistas Favoritos ({{count}}/16)", fr="Artistes favoris ({{count}}/16)",
            de="Lieblingskünstler ({{count}}/16)", it="Artisti preferiti ({{count}}/16)",
            ru="Любимые исполнители ({{count}}/16)", sv="Favoritartister ({{count}}/16)",
            nl="Favoriete artiesten ({{count}}/16)", zh="喜欢的艺人 ({{count}}/16)",
            hi="पसंदीदा कलाकार ({{count}}/16)", bn="প্রিয় শিল্পী ({{count}}/16)",
            ja="好きなアーティスト ({{count}}/16)", ko="좋아하는 아티스트 ({{count}}/16)",
            ar="الفنانون المفضلون ({{count}}/16)", sw="Wasanii Favoriti ({{count}}/16)",
            ha="Masuutarwa ({{count}}/16)", am="የሚያስወግዱ አርቲስቶች ({{count}}/16)",
            tl="Mga Paboritong Artist ({{count}}/16)", ms="Artis Favorit ({{count}}/16)",
            mi="Ngā Ringa Arawani ({{count}}/16)",
        ),
    },
    {
        "value": "songsTitle",
        "order": 22,
        "translations": L(
            es="Canciones Destacadas ({{count}}/5)", en="Featured Songs ({{count}}/5)",
            pt="Músicas Destacadas ({{count}}/5)", fr="Morceaux en vedette ({{count}}/5)",
            de="Hervorgehobene Songs ({{count}}/5)", it="Brani in evidenza ({{count}}/5)",
            ru="Избранные песни ({{count}}/5)", sv="Utvalda låtar ({{count}}/5)",
            nl="Uitgelichte nummers ({{count}}/5)", zh="精选歌曲 ({{count}}/5)",
            hi="विशेष गाने ({{count}}/5)", bn="বাছাইকৃত গান ({{count}}/5)",
            ja="注目の曲 ({{count}}/5)", ko="추천 곡 ({{count}}/5)",
            ar="الأغاني المميزة ({{count}}/5)", sw="Nyimbo Unzotokea ({{count}}/5)",
            ha="Waƙaƙi Masu Fihira ({{count}}/5)", am="የተመረጡ ሙዚቃዎች ({{count}}/5)",
            tl="Mga Paboritong Awitin ({{count}}/5)", ms="Lagu Pilihan ({{count}}/5)",
            mi="Ngā Waiata Tohua ({{count}}/5)",
        ),
    },
    {
        "value": "add",
        "order": 23,
        "translations": L(
            es="Añadir", en="Add", pt="Adicionar", fr="Ajouter", de="Hinzufügen",
            it="Aggiungi", ru="Добавить", sv="Lägg till", nl="Toevoegen",
            zh="添加", hi="जोड़ें", bn="যোগ করুন", ja="追加", ko="추가",
            ar="إضافة", sw="Ongeza", ha="Ƙara", am="አክል", tl="Magdagdag",
            ms="Tambah", mi="Tā",
        ),
    },
    {
        "value": "noArtists",
        "order": 24,
        "translations": L(
            es="No hay artistas seleccionados", en="No artists selected",
            pt="Nenhum artista selecionado", fr="Aucun artiste sélectionné",
            de="Keine Künstler ausgewählt", it="Nessun artista selezionato",
            ru="Исполнители не выбраны", sv="Inga artister valda",
            nl="Geen artiesten geselecteerd", zh="未选择艺人",
            hi="कोई कलाकार चयनित नहीं", bn="কোনো শিল্পী নির্বাচিত নয়",
            ja="アーティストが選択されていません", ko="선택된 아티스트가 없습니다",
            ar="لم يتم اختيار أي فنان", sw="Hakuna wasanii waliochaguliwa",
            ha="Babu ƙawaye da aka zaune", am="አንድ አርቲስትም አልተመረጠም",
            tl="Walang napiling artist", ms="Tiada artis dipilih",
            mi="Kāore tēnei i tīmata i tētahi ringa",
        ),
    },
    {
        "value": "noSongs",
        "order": 25,
        "translations": L(
            es="No hay canciones seleccionadas", en="No songs selected",
            pt="Nenhuma música selecionada", fr="Aucun morceau sélectionné",
            de="Keine Songs ausgewählt", it="Nessun brano selezionato",
            ru="Песни не выбраны", sv="Inga låtar valda",
            nl="Geen nummers geselecteerd", zh="未选择歌曲",
            hi="कोई गाना चयनित नहीं", bn="কোনো গান নির্বাচিত নয়",
            ja="曲が選択されていません", ko="선택된 곡이 없습니다",
            ar="لم يتم اختيار أي أغنية", sw="Hakuna nyimbo zilizochaguliwa",
            ha="Babu waƙaƙi da aka zaune", am="ሙዚቃም አልተመረጠም",
            tl="Walang napiling awitin", ms="Tiada lagu dipilih",
            mi="Kāore tēnei i tīmata i tētahi waiata",
        ),
    },
    {
        "value": "unknownSong",
        "order": 26,
        "translations": L(
            es="Canción desconocida", en="Unknown song", pt="Música desconhecida",
            fr="Morceau inconnu", de="Unbekannter Song", it="Brano sconosciuto",
            ru="Неизвестная песня", sv="Okänd låt", nl="Onbekend nummer",
            zh="未知歌曲", hi="अज्ञात गाना", bn="অজানা গান",
            ja="不明な曲", ko="알 수 없는 곡", ar="أغنية غير معروفة",
            sw="Wimbo usiyojulikana", ha="Wacci da ba sani", am="ያልታወቀ ሙዚቃ",
            tl="Hindi alam na awitin", ms="Lagu tidak diketahui",
            mi="Waiata ē mōhiwaitia",
        ),
    },
    {
        "value": "unknownArtist",
        "order": 27,
        "translations": L(
            es="Artista desconocido", en="Unknown artist", pt="Artista desconhecido",
            fr="Artiste inconnu", de="Unbekannter Künstler", it="Artista sconosciuto",
            ru="Неизвестный исполнитель", sv="Okänd artist", nl="Onbekende artiest",
            zh="未知艺人", hi="अज्ञात कलाकार", bn="অজানা শিল্পী",
            ja="不明なアーティスト", ko="알 수 없는 아티스트", ar="فنان غير معروف",
            sw="Msanii asiyejulikana", ha="Ƙawaye da ba sani",
            am="ያልታወቀ አርቲስት", tl="Hindi alam na artist",
            ms="Artis tidak diketahui", mi="Ringa ā mōhiwaitia",
        ),
    },
    {
        "value": "noPreview",
        "order": 28,
        "translations": L(
            es="Vista previa no disponible", en="Preview not available",
            pt="Prévia não disponível", fr="Aperçu non disponible",
            de="Vorschau nicht verfügbar", it="Anteprima non disponibile",
            ru="Предпрослушивание недоступно",
            sv="Förhandsvisning är inte tillgänglig",
            nl="Voorbeeld niet beschikbaar", zh="无法预览",
            hi="पूर्वावलोकन उपलब्ध नहीं", bn="প্রিভিউ উপলব্ধ নয়",
            ja="プレビューは利用できません", ko="미리듣기가 제공되지 않습니다",
            ar="المعاينة غير متاحة", sw="Onyesho la awali halipatikani",
            ha="Babu babban kallon", am="ቅድመ እይታ የለም",
            tl="Walang preview", ms="Pratonton tidak tersedia",
            mi="Kāore te tirohanga mua",
        ),
    },
    {
        "value": "deleteTrack",
        "order": 29,
        "translations": L(
            es="Eliminar", en="Delete", pt="Remover", fr="Supprimer", de="Löschen",
            it="Elimina", ru="Удалить", sv="Ta bort", nl="Verwijderen",
            zh="删除", hi="हटाएं", bn="মুছুন", ja="削除", ko="삭제",
            ar="حذف", sw="Ondoa", ha="Soke", am="አጥፋ", tl="Burahin",
            ms="Padam", mi="Muki",
        ),
    },
    {
        "value": "authErrorUrl",
        "order": 30,
        "translations": L(
            es="No se recibió la URL de autorización de Spotify.",
            en="Spotify authorization URL was not received.",
            pt="A URL de autorização do Spotify não foi recebida.",
            fr="L'URL d'autorisation Spotify n'a pas été reçue.",
            de="Die Spotify-Autorisierungs-URL wurde nicht empfangen.",
            it="Non è stato ricevuto l'URL di autorizzazione di Spotify.",
            ru="Не получен URL авторизации Spotify.",
            sv="Spotify-auktoriserings-URL:en kom inte fram.",
            nl="De Spotify-autorisatie-URL is niet ontvangen.",
            zh="未收到 Spotify 授权链接。",
            hi="Spotify प्राधिकरण URL प्राप्त नहीं हुआ।",
            bn="Spotify অনুমোদনের URL পাওয়া যায়নি।",
            ja="Spotify の認証 URL が取得できませんでした。",
            ko="Spotify 인증 URL을 받지 못했습니다.",
            ar="لم يتم تلقي رابط تفويض Spotify.",
            sw="URL ya uthibitisho wa Spotify ha kupokelewa.",
            ha="Babu adireshin tabbatar da Spotify.",
            am="የSpotify ሥልጣን URL አልተቀበለም።",
            tl="Hindi natanggap ang Spotify authorization URL.",
            ms="URL kebenaran Spotify tidak diterima.",
            mi="Kāore i runga te URL whakamanatuhinga o Spotify.",
        ),
    },
    {
        "value": "authErrorGeneric",
        "order": 31,
        "translations": L(
            es="No se pudo conectar con Spotify. Inténtalo de nuevo.",
            en="Could not connect to Spotify. Please try again.",
            pt="Não foi possível conectar ao Spotify. Tente novamente.",
            fr="Impossible de se connecter à Spotify. Veuillez réessayer.",
            de="Verbindung zu Spotify nicht möglich. Bitte versuche es erneut.",
            it="Impossibile connettersi a Spotify. Riprova.",
            ru="Не удалось подключиться к Spotify. Попробуйте ещё раз.",
            sv="Kunde inte ansluta till Spotify. Försök igen.",
            nl="Kan geen verbinding maken met Spotify. Probeer het opnieuw.",
            zh="无法连接 Spotify，请重试。",
            hi="Spotify से कनेक्ट नहीं हो सका। फिर से कोशिश करें।",
            bn="Spotify-এর সাথে সংযুক্ত হওয়া গেল না। আবার চেষ্টা করুন।",
            ja="Spotify に接続できませんでした。もう一度お試しください。",
            ko="Spotify에 연결할 수 없습니다. 다시 시도해 주세요.",
            ar="تعذر الربط مع Spotify. حاول مرة أخرى.",
            sw="Imeshindwa kunganisha Spotify. Tafadhali jaribu tena.",
            ha="Ba a yi nasu haɗa da Spotify. Sake gwada.",
            am="ከSpotify ጋር መስረዝ አልተቻለም። እንደገና ይሞክሩ።",
            tl="Hindi makakonekta sa Spotify. Pakisubukan muli.",
            ms="Tidak dapat menyambungkan ke Spotify. Sila cuba lagi.",
            mi="Kāore i taea te whakapaua ki te Spotify. Tēnā ko whakamatau anō.",
        ),
    },
]

# --- Genre items: proper nouns kept identical across languages ----------------

GENRE_ITEMS = [
    ("pop", "Pop"),
    ("rock", "Rock"),
    ("indie", "Indie"),
    ("alternative", "Alternative"),
    ("punk", "Punk"),
    ("hardcore", "Hardcore"),
    ("emo", "Emo"),
    ("grunge", "Grunge"),
    ("classic_rock", "Classic Rock"),
    ("hard_rock", "Hard Rock"),
    ("heavy_metal", "Heavy Metal"),
    ("death_metal", "Death Metal"),
    ("black_metal", "Black Metal"),
    ("progressive", "Progressive"),
    ("metal", "Metal"),
    ("edm", "EDM"),
    ("techno", "Techno"),
    ("house", "House"),
    ("trance", "Trance"),
    ("dubstep", "Dubstep"),
    ("drum_and_bass", "Drum & Bass"),
    ("ambient", "Ambient"),
    ("hip_hop", "Hip Hop"),
    ("rap", "Rap"),
    ("trap", "Trap"),
    ("r_and_b", "R&B"),
    ("salsa", "Salsa"),
    ("bachata", "Bachata"),
    ("merengue", "Merengue"),
    ("cumbia", "Cumbia"),
    ("ranchera", "Ranchera"),
    ("mariachi", "Mariachi"),
    ("banda", "Banda"),
    ("reggaeton", "Reggaeton"),
    ("corridos", "Corridos"),
    ("jazz", "Jazz"),
    ("blues", "Blues"),
    ("country", "Country"),
    ("folk", "Folk"),
    ("kpop", "K-Pop"),
    ("jpop", "J-Pop"),
    ("afrobeat", "Afrobeat"),
    ("flamenco", "Flamenco"),
    ("bossa_nova", "Bossa Nova"),
    ("samba", "Samba"),
    ("tango", "Tango"),
    ("classical", "Classical"),
    ("opera", "Opera"),
    ("soul", "Soul"),
    ("funk", "Funk"),
    ("disco", "Disco"),
    ("reggae", "Reggae"),
]

_next_order = len(TEXTS)
for _slug, _label in GENRE_ITEMS:
    TEXTS.append(
        {
            "value": f"genres.items.{_slug}",
            "order": _next_order,
            "translations": uni(_label),
        }
    )
    _next_order += 1


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_music_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_music_section",
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
        f"seed_profile_music_section: created {created}, updated {updated}, "
        f"total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
