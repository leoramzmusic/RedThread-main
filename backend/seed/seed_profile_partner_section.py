"""
Seed the `profile_partner_section` system options catalog for UI texts in the
PartnerManager component (Link Partner button + modal + states).

The texts in PartnerManager read from GET /options/section/profile_partner_section.

Idempotent: upserts every value so re-running refreshes translations.
Run inside the backend container:
    docker exec -w /app redthread-backend python seed/seed_profile_partner_section.py
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
        "value": "link",
        "order": 0,
        "translations": L(
            es="Vincular Pareja", en="Link Partner",
            pt="Vincular Parceiro", fr="Lier le partenaire",
            de="Partner verknüpfen", it="Collega partner",
            ru="Привязать партнёра", sv="Länka partner",
            nl="Partner koppelen", zh="关联伴侣",
            hi="पार्टनर जोड़ें", bn="সঙ্গী যুক্ত করুন",
            ja="パートナーをリンク", ko="파트너 연결",
            ar="ربط الشريك", sw="Unganisha mpenzi",
            ha="Haɗa abokin tarayya", am="ባልደረባን አገናኝ",
            tl="I-link ang partner", ms="Pautkan pasangan",
            mi="Tūhono hoa",
        ),
    },
    {
        "value": "linkTitle",
        "order": 1,
        "translations": L(
            es="Vincular Pareja", en="Link Partner",
            pt="Vincular Parceiro", fr="Lier le partenaire",
            de="Partner verknüpfen", it="Collega partner",
            ru="Привязать партнёра", sv="Länka partner",
            nl="Partner koppelen", zh="关联伴侣",
            hi="पार्टनर जोड़ें", bn="সঙ্গী যুক্ত করুন",
            ja="パートナーをリンク", ko="파트너 연결",
            ar="ربط الشريك", sw="Unganisha mpenzi",
            ha="Haɗa abokin tarayya", am="ባልደረባን አገናኝ",
            tl="I-link ang partner", ms="Pautkan pasangan",
            mi="Tūhono hoa",
        ),
    },
    {
        "value": "linkBody",
        "order": 2,
        "translations": L(
            es="Busca a tu pareja por nombre de usuario o nombre visible.",
            en="Search for your partner by username or display name.",
            pt="Busque seu parceiro por nome de usuário ou nome visível.",
            fr="Recherchez votre partenaire par nom d'utilisateur ou nom affiché.",
            de="Suche deinen Partner nach Benutzername oder Anzeigename.",
            it="Cerca il tuo partner per nome utente o nome visualizzato.",
            ru="Найдите партнёра по имени пользователя или отображаемому имени.",
            sv="Sök efter din partner via användarnamn eller visningsnamn.",
            nl="Zoek je partner op gebruikersnaam of weergegeven naam.",
            zh="按用户名或显示名称搜索你的伴侣。",
            hi="उपयोगकर्ता नाम या प्रदर्शित नाम से अपने पार्टनर को खोजें।",
            bn="ব্যবহারকারীর নাম বা প্রদর্শিত নাম দিয়ে আপনার সঙ্গী খুঁজুন।",
            ja="ユーザー名または表示名でパートナーを検索します。",
            ko="사용자 이름 또는 표시 이름으로 파트너 검색.",
            ar="ابحث عن شريكك بالاسم المستخدم أو الاسم المعروض.",
            sw="Tafuta mpenzi wako kwa jina la mtumiaji au jina linaloonyeshwa.",
            ha="Nemi abokin tarayyarka ta sunan mai amfani ko sunan da aka nuna.",
            am="ባልደረባህን በተጠቃሚ ስም ወይም በሚታይ ስም ፈልግ።",
            tl="Hanapin ang iyong partner sa pamamagitan ng username o display name.",
            ms="Cari pasangan anda mengikut nama pengguna atau nama paparan.",
            mi="Rapua tō hoa mā te ingoa kaiwhakamahi, te ingoa whakaatu rānei.",
        ),
    },
    {
        "value": "searchLabel",
        "order": 3,
        "translations": L(
            es="Buscar usuario", en="Search user",
            pt="Buscar usuário", fr="Rechercher un utilisateur",
            de="Nutzer suchen", it="Cerca utente",
            ru="Найти пользователя", sv="Sök användare",
            nl="Gebruiker zoeken", zh="搜索用户",
            hi="उपयोगकर्ता खोजें", bn="ব্যবহারকারী খুঁজুন",
            ja="ユーザーを検索", ko="사용자 검색",
            ar="بحث عن مستخدم", sw="Tafuta mtumiaji",
            ha="Nemi mai amfani", am="ተጠቃሚ ፈልግ",
            tl="Maghanap ng user", ms="Cari pengguna",
            mi="Rapua kaiwhakamahi",
        ),
    },
    {
        "value": "searchPlaceholder",
        "order": 4,
        "translations": L(
            es="Escribe el nombre o usuario...",
            en="Type the name or username...",
            pt="Digite o nome ou usuário...",
            fr="Tapez le nom ou le pseudo...",
            de="Name oder Benutzername eingeben...",
            it="Digita il nome o l'username...",
            ru="Введите имя или ник...",
            sv="Skriv namn eller användarnamn...",
            nl="Typ de naam of gebruikersnaam...",
            zh="输入姓名或用户名…",
            hi="नाम या उपयोगकर्ता नाम लिखें...",
            bn="নাম বা ব্যবহারকারীর নাম লিখুন...",
            ja="名前またはユーザー名を入力…",
            ko="이름 또는 사용자 이름 입력…",
            ar="اكتب الاسم أو اسم المستخدم...",
            sw="Andika jina au jina la mtumiaji...",
            ha="Rubuta suna ko sunan mai amfani...",
            am="ስም ወይም የተጠቃሚ ስም ጻፍ…",
            tl="I-type ang pangalan o username...",
            ms="Taip nama atau nama pengguna...",
            mi="Tāuru ingoa, ingoa kaiwhakamahi rānei…",
        ),
    },
    {
        "value": "cancel",
        "order": 5,
        "translations": L(
            es="Cancelar", en="Cancel",
            pt="Cancelar", fr="Annuler",
            de="Abbrechen", it="Annulla",
            ru="Отмена", sv="Avbryt",
            nl="Annuleren", zh="取消",
            hi="रद्द करें", bn="বাতিল",
            ja="キャンセル", ko="취소",
            ar="إلغاء", sw="Ghairi",
            ha="Soke", am="ሰርዝ",
            tl="Kanselahin", ms="Batal",
            mi="Whakakore",
        ),
    },
    {
        "value": "send",
        "order": 6,
        "translations": L(
            es="Enviar", en="Send",
            pt="Enviar", fr="Envoyer",
            de="Senden", it="Invia",
            ru="Отправить", sv="Skicka",
            nl="Verzenden", zh="发送",
            hi="भेजें", bn="পাঠান",
            ja="送信", ko="보내기",
            ar="إرسال", sw="Tuma",
            ha="Aika", am="ላክ",
            tl="Ipadala", ms="Hantar",
            mi="Tukua",
        ),
    },
    {
        "value": "requestSent",
        "order": 7,
        "translations": L(
            es="Solicitud enviada correctamente",
            en="Request sent successfully",
            pt="Solicitação enviada com sucesso",
            fr="Demande envoyée avec succès",
            de="Anfrage erfolgreich gesendet",
            it="Richiesta inviata con successo",
            ru="Запрос успешно отправлен",
            sv="Förfrågan skickad",
            nl="Verzoek succesvol verzonden",
            zh="请求已成功发送",
            hi="अनुरोध सफलतापूर्वक भेजा गया",
            bn="অনুরোধ সফলভাবে পাঠানো হয়েছে",
            ja="リクエストを送信しました",
            ko="요청이 전송되었습니다",
            ar="تم إرسال الطلب بنجاح",
            sw="Ombi limetumwa kikamilifu",
            ha="An aika buƙata cikin nasara",
            am="ጥያቄ በተሳካ ሁኔታ ተልኳል",
            tl="Matagumpay na naipadala ang kahilingan",
            ms="Permintaan berjaya dihantar",
            mi="Kua tukuna te tono",
        ),
    },
    {
        "value": "sendError",
        "order": 8,
        "translations": L(
            es="Error al enviar solicitud",
            en="Error sending request",
            pt="Erro ao enviar solicitação",
            fr="Erreur d'envoi de la demande",
            de="Fehler beim Senden der Anfrage",
            it="Errore nell'invio della richiesta",
            ru="Ошибка отправки запроса",
            sv="Fel vid sändning",
            nl="Fout bij verzenden",
            zh="发送请求出错",
            hi="अनुरोध भेजने में त्रुटि",
            bn="অনুরোধ পাঠাতে ত্রুটি",
            ja="リクエスト送信エラー",
            ko="요청 전송 오류",
            ar="خطأ في إرسال الطلب",
            sw="Hitilafu kutuma ombi",
            ha="Kuskure wajen aika buƙata",
            am="ጥያቄ በመላክ ላይ ስህተት",
            tl="Error sa pagpapadala",
            ms="Ralat menghantar permintaan",
            mi="Hapa tuku tono",
        ),
    },
    {
        "value": "confirmUnlink",
        "order": 9,
        "translations": L(
            es="¿Estás seguro de que quieres desvincularte de tu pareja?",
            en="Are you sure you want to unlink from your partner?",
            pt="Tem certeza de que deseja se desvincular do seu parceiro?",
            fr="Êtes-vous sûr de vouloir vous dissocier de votre partenaire ?",
            de="Bist du sicher, dass du die Verknüpfung lösen willst?",
            it="Sei sicuro di volerti scollegare dal tuo partner?",
            ru="Вы уверены, что хотите отвязаться от партнёра?",
            sv="Är du säker på att du vill ta bort kopplingen?",
            nl="Weet je zeker dat je de koppeling wilt verbreken?",
            zh="确定要解除与伴侣的关联吗？",
            hi="क्या आप वाकई अपने पार्टनर से अलग होना चाहते हैं?",
            bn="আপনি কি নিশ্চিত যে আপনি আপনার সঙ্গী থেকে বিচ্ছিন্ন হতে চান?",
            ja="パートナーとのリンクを解除しますか？",
            ko="파트너 연결을 해제하시겠습니까?",
            ar="هل أنت متأكد من إلغاء الارتباط بشريكك؟",
            sw="Una uhakika unataka kujiondoa kwa mpenzi wako?",
            ha="Shin kana da tabbacin kana son rabuwa da abokin tarayyarka?",
            am="ከባልደረባህ መለየት እንደምትፈልግ እርግጠኛ ነህ?",
            tl="Sigurado ka bang gusto mong mag-unlink sa iyong partner?",
            ms="Adakah anda pasti mahu menyahpaut daripada pasangan anda?",
            mi="Kei te tino hiahia koe ki te wetewete i tō hoa?",
        ),
    },
    {
        "value": "confirmCancel",
        "order": 10,
        "translations": L(
            es="¿Estás seguro de que quieres cancelar la solicitud enviada?",
            en="Are you sure you want to cancel the sent request?",
            pt="Tem certeza de que deseja cancelar a solicitação enviada?",
            fr="Êtes-vous sûr de vouloir annuler la demande envoyée ?",
            de="Bist du sicher, dass du die gesendete Anfrage abbrechen willst?",
            it="Sei sicuro di voler annullare la richiesta inviata?",
            ru="Вы уверены, что хотите отменить отправленный запрос?",
            sv="Är du säker på att du vill avbryta den skickade förfrågan?",
            nl="Weet je zeker dat je het verzonden verzoek wilt annuleren?",
            zh="确定要取消已发送的请求吗？",
            hi="क्या आप वाकई भेजा गया अनुरोध रद्द करना चाहते हैं?",
            bn="আপনি কি নিশ্চিত যে আপনি পাঠানো অনুরোধ বাতিল করতে চান?",
            ja="送信済みリクエストをキャンセルしますか？",
            ko="보낸 요청을 취소하시겠습니까?",
            ar="هل أنت متأكد من إلغاء الطلب المرسل؟",
            sw="Una uhakika unataka kughairi ombi lililotumwa?",
            ha="Shin kana da tabbacin kana son soke buƙatar da aka aika?",
            am="የተላከውን ጥያቄ መሰረዝ እንደምትፈልግ እርግጠኛ ነህ?",
            tl="Sigurado ka bang gusto mong kanselahin ang naipadalang kahilingan?",
            ms="Adakah anda pasti mahu membatalkan permintaan yang dihantar?",
            mi="Kei te tino hiahia koe ki te whakakore i te tono kua tukuna?",
        ),
    },
    {
        "value": "linkedTitle",
        "order": 11,
        "translations": L(
            es="Vínculo Confirmado", en="Link Confirmed",
            pt="Vínculo Confirmado", fr="Lien confirmé",
            de="Verknüpfung bestätigt", it="Collegamento confermato",
            ru="Связь подтверждена", sv="Länk bekräftad",
            nl="Koppeling bevestigd", zh="已确认关联",
            hi="लिंक की पुष्टि हुई", bn="সংযোগ নিশ্চিত",
            ja="リンク確定", ko="연결 확인됨",
            ar="تم تأكيد الارتباط", sw="Kiungo kimethibitishwa",
            ha="An tabbatar da haɗi", am="ግንኙነት ተ confirmer",
            tl="Kumpirmadong link", ms="Pautan disahkan",
            mi="Kua whakaaetia te tūhononga",
        ),
    },
    {
        "value": "partnerFallback",
        "order": 12,
        "translations": L(
            es="Tu pareja", en="Your partner",
            pt="Seu parceiro", fr="Votre partenaire",
            de="Dein Partner", it="Il tuo partner",
            ru="Ваш партнёр", sv="Din partner",
            nl="Je partner", zh="你的伴侣",
            hi="आपका पार्टनर", bn="আপনার সঙ্গী",
            ja="あなたのパートナー", ko="당신의 파트너",
            ar="شريكك", sw="Mpenzi wako",
            ha="Abokin tarayyarka", am="ባልደረባህ",
            tl="Ang iyong partner", ms="Pasangan anda",
            mi="Tō hoa",
        ),
    },
    {
        "value": "unlink",
        "order": 13,
        "translations": L(
            es="Desvincular", en="Unlink",
            pt="Desvincular", fr="Dissocier",
            de="Verknüpfung lösen", it="Scollega",
            ru="Отвязать", sv="Ta bort länk",
            nl="Ontkoppelen", zh="解除关联",
            hi="अलग करें", bn="বিচ্ছিন্ন করুন",
            ja="リンク解除", ko="연결 해제",
            ar="إلغاء الارتباط", sw="Ondoa kiungo",
            ha="Rabu", am="አለያይ",
            tl="I-unlink", ms="Nyahpaut",
            mi="Wetewete",
        ),
    },
    {
        "value": "pendingTitle",
        "order": 14,
        "translations": L(
            es="Solicitud de pareja pendiente",
            en="Pending partner request",
            pt="Solicitação de parceiro pendente",
            fr="Demande de partenaire en attente",
            de="Ausstehende Partneranfrage",
            it="Richiesta partner in sospeso",
            ru="Ожидающий запрос партнёра",
            sv="Väntande partnerförfrågan",
            nl="Openstaand partnerverzoek",
            zh="待处理的伴侣请求",
            hi="लंबित पार्टनर अनुरोध",
            bn="মুলতুবি সঙ্গীর অনুরোধ",
            ja="保留中のパートナーリクエスト",
            ko="대기 중인 파트너 요청",
            ar="طلب شريك معلق",
            sw="Ombi la mpenzi linasubiri",
            ha="Buƙatar abokin tarayya da ke jiran amsa",
            am="በጥበቃ ላይ ያለ የባልደረባ ጥያቄ",
            tl="Nakabinbing kahilingan ng partner",
            ms="Permintaan pasangan yang belum selesai",
            mi="Tono hoa e tārewa ana",
        ),
    },
    {
        "value": "pendingBody",
        "order": 15,
        "translations": L(
            es="Alguien quiere vincular su perfil contigo.",
            en="Someone wants to link their profile with you.",
            pt="Alguém quer vincular o perfil com você.",
            fr="Quelqu'un veut lier son profil au vôtre.",
            de="Jemand möchte sein Profil mit dir verknüpfen.",
            it="Qualcuno vuole collegare il suo profilo al tuo.",
            ru="Кто-то хочет связать свой профиль с вашим.",
            sv="Någon vill länka sin profil till din.",
            nl="Iemand wil zijn profiel aan jou koppelen.",
            zh="有人想将他们的个人资料与你关联。",
            hi="कोई अपना प्रोफ़ाइल आपसे जोड़ना चाहता है।",
            bn="কেউ আপনার সাথে তাদের প্রোফাইল যুক্ত করতে চায়।",
            ja="誰かがあなたとプロフィールをリンクしたがっています。",
            ko="누군가 당신과 프로필을 연결하려 합니다.",
            ar="يريد شخص ما ربط ملفه الشخصي بك.",
            sw="Mtu anataka kuunganisha wasifu wake na wako.",
            ha="Wani yana son haɗa bayanan martabarsa da naka.",
            am="አguys አንድ ሰው መገለጫውን ከእርስዎ ጋር ማገናኘት ይፈልጋል።",
            tl="May gustong i-link ang kanilang profile sa iyo.",
            ms="Seseorang mahu memautkan profil mereka dengan anda.",
            mi="Kei te hiahia tētahi ki te tūhono i tōna kōtaha ki a koe.",
        ),
    },
    {
        "value": "accept",
        "order": 16,
        "translations": L(
            es="Aceptar", en="Accept",
            pt="Aceitar", fr="Accepter",
            de="Annehmen", it="Accetta",
            ru="Принять", sv="Acceptera",
            nl="Accepteren", zh="接受",
            hi="स्वीकार करें", bn="গ্রহণ করুন",
            ja="承認", ko="수락",
            ar="قبول", sw="Kubali",
            ha="Karɓa", am="ተቀበል",
            tl="Tanggapin", ms="Terima",
            mi="Whakaae",
        ),
    },
    {
        "value": "reject",
        "order": 17,
        "translations": L(
            es="Rechazar", en="Decline",
            pt="Recusar", fr="Refuser",
            de="Ablehnen", it="Rifiuta",
            ru="Отклонить", sv="Avböj",
            nl="Weigeren", zh="拒绝",
            hi="अस्वीकार करें", bn="প্রত্যাখ্যান",
            ja="拒否", ko="거절",
            ar="رفض", sw="Kataa",
            ha="Ƙi", am="ውድቅ አድርግ",
            tl="Tanggihan", ms="Tolak",
            mi="Whakakore",
        ),
    },
    {
        "value": "sentTitle",
        "order": 18,
        "translations": L(
            es="Solicitud enviada", en="Request sent",
            pt="Solicitação enviada", fr="Demande envoyée",
            de="Anfrage gesendet", it="Richiesta inviata",
            ru="Запрос отправлен", sv="Förfrågan skickad",
            nl="Verzoek verzonden", zh="请求已发送",
            hi="अनुरोध भेजा गया", bn="অনুরোধ পাঠানো হয়েছে",
            ja="リクエスト送信済み", ko="요청 전송됨",
            ar="تم إرسال الطلب", sw="Ombi limetumwa",
            ha="An aika buƙata", am="ጥያቄ ተልኳል",
            tl="Naipadala ang kahilingan", ms="Permintaan dihantar",
            mi="Kua tukuna te tono",
        ),
    },
    {
        "value": "sentBody",
        "order": 19,
        "translations": L(
            es="Esperando confirmación...",
            en="Waiting for confirmation...",
            pt="Aguardando confirmação...",
            fr="En attente de confirmation...",
            de="Warte auf Bestätigung...",
            it="In attesa di conferma...",
            ru="Ожидание подтверждения...",
            sv="Väntar på bekräftelse...",
            nl="Wachten op bevestiging...",
            zh="等待确认…",
            hi="पुष्टि की प्रतीक्षा...",
            bn="নিশ্চিতকরণের অপেক্ষায়...",
            ja="確認待ち…",
            ko="확인 대기 중…",
            ar="بانتظار التأكيد...",
            sw="Inasubiri uthibitisho...",
            ha="Ana jiran tabbaci...",
            am="ማረጋገጫ በመጠበቅ ላይ…",
            tl="Naghihintay ng kumpirmasyon...",
            ms="Menunggu pengesahan...",
            mi="E tatari ana kia whakaaetia…",
        ),
    },
    {
        "value": "noResults",
        "order": 20,
        "translations": L(
            es="No se encontraron usuarios.",
            en="No users found.",
            pt="Nenhum usuário encontrado.",
            fr="Aucun utilisateur trouvé.",
            de="Keine Nutzer gefunden.",
            it="Nessun utente trovato.",
            ru="Пользователи не найдены.",
            sv="Inga användare hittades.",
            nl="Geen gebruikers gevonden.",
            zh="未找到用户。",
            hi="कोई उपयोगकर्ता नहीं मिला।",
            bn="কোনো ব্যবহারকারী পাওয়া যায়নি।",
            ja="ユーザーが見つかりません。",
            ko="사용자를 찾을 수 없습니다.",
            ar="لم يتم العثور على مستخدمين.",
            sw="Hakuna watumiaji waliopatikana.",
            ha="Ba a sami masu amfani ba.",
            am="ተጠቃሚዎች አልተገኙም።",
            tl="Walang nahanap na user.",
            ms="Tiada pengguna ditemui.",
            mi="Kāore he kaiwhakamahi i kitea.",
        ),
    },
    {
        "value": "selectedPrefix",
        "order": 21,
        "translations": L(
            es="Seleccionado:", en="Selected:",
            pt="Selecionado:", fr="Sélectionné :",
            de="Ausgewählt:", it="Selezionato:",
            ru="Выбрано:", sv="Vald:",
            nl="Geselecteerd:", zh="已选择：",
            hi="चयनित:", bn="নির্বাচিত:",
            ja="選択中：", ko="선택됨:",
            ar="المحدد:", sw="Imechaguliwa:",
            ha="An zaɓa:", am="የተመረጠው፦",
            tl="Napili:", ms="Dipilih:",
            mi="Kua tīpakohia:",
        ),
    },
]

# Typo guard for accidental non-keyword arguments
for _item in TEXTS:
    assert set(_item["translations"]) == set(LANGS), _item["value"]

_VALUES = [item["value"] for item in TEXTS]
assert len(_VALUES) == len(set(_VALUES)), "duplicate seed values"
assert len(TEXTS) == 22, f"expected 22 texts, got {len(TEXTS)}"


async def main() -> None:
    await init_db()
    created = 0
    updated = 0
    for item in TEXTS:
        value = item["value"]
        order = item["order"]
        translations = item["translations"]

        existing = await SystemOption.find_one(
            SystemOption.category == "profile_partner_section",
            SystemOption.value == value,
        )

        doc_data = {
            "category": "profile_partner_section",
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
        f"seed_profile_partner_section: created {created}, "
        f"updated {updated}, total {len(TEXTS)}"
    )


if __name__ == "__main__":
    asyncio.run(main())
