import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
    Container, Box, Typography, Paper, Button, TextField, Grid,
    Card, CardContent, Divider, Switch, FormControlLabel,
    InputAdornment, Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Slider, Tabs, Tab, Snackbar, MenuItem, Tooltip,
    ToggleButton, ToggleButtonGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckIcon from '@mui/icons-material/Check';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import AdminLayout from '../../../components/layout/AdminLayout';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType, Platform, AppearanceResource } from '../../../types/appearance';
import Image from 'next/image';
import { getMediaUrl } from '../../../utils/media';
import DeleteIcon from '@mui/icons-material/Delete';
import RedThreadLogo from '../../../components/landing/RedThreadLogo';
import { FOOTER_HEADERS, FOOTER_LINK_LABELS, FOOTER_TAGLINES as FOOTER_TAGLINES_DEFAULT } from '../../../components/landing/LandingFooter';
import { FooterCopyrightText } from '../../../components/landing/LoveTicker';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import RadarIcon from '@mui/icons-material/Radar';
import GroupsIcon from '@mui/icons-material/Groups';

// --- Configuration Types ---

interface FeatureText {
    title: string;
    description: string;
}

interface TranslatedContent {
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    howItWorksTitle: string;
    features: {
        smartMatching: FeatureText;
        realTimeChat: FeatureText;
        proximityRadar: FeatureText;
        multipleIntentions: FeatureText;
    };
    footerText: string;
    footerTagline: string;
}

interface LandingThemeConfig {
    // Global Styles (Shared)
    gradientStart: string;
    gradientEnd: string;
    subtitleFontSize: number; // rem
    descriptionFontSize: number; // rem
    subtitleColor: string;
    titleFont: string;
    bodyFont: string;
    descriptionFont: string;
    savedGradients?: Array<{ id: string; name: string; start: string; end: string }>;

    // Content by Language (dynamic — soporta todos los idiomas de supportedLanguages)
    translations: Record<Language, TranslatedContent>;
}

const DEFAULT_CONTENT: TranslatedContent = {
    subtitle: 'Encuentra tus conexiones significativas',
    description: 'Inspirado en la leyenda del hilo rojo, conéctate con personas que comparten tus intereses, pasiones y valores.',
    ctaPrimary: 'Comenzar',
    ctaSecondary: 'Iniciar sesión',
    howItWorksTitle: 'Cómo Funciona',
    features: {
        smartMatching: {
            title: 'Emparejamiento Inteligente',
            description: 'Nuestro algoritmo de afinidad impulsado por IA te empareja con personas compatibles basándose en intereses, música, personalidad y más.'
        },
        realTimeChat: {
            title: 'Chat en Tiempo Real',
            description: 'Conéctate instantáneamente con tus coincidencias a través de mensajería en tiempo real, notas de voz y compartir multimedia.'
        },
        proximityRadar: {
            title: 'Radar de Proximidad',
            description: 'Descubre personas cercanas que comparten tus intereses. Perfecto para encontrar amigos y conexiones locales.'
        },
        multipleIntentions: {
            title: 'Múltiples Intenciones',
            description: '¿Buscas amistad, romance, socios de proyecto o compañeros de juego? Encuentra conexiones para cualquier propósito.'
        }
    },
    footerText: '© 2026 RETH. Hecho con ❤️ para conexiones significativas.',
    footerTagline: 'Conexiones significativas inspiradas en la leyenda del hilo rojo.'
};

const DEFAULT_THEME: LandingThemeConfig = {
    gradientStart: '#1A1B1E',
    gradientEnd: '#2563EB',
    subtitleFontSize: 5,
    descriptionFontSize: 1.15,
    subtitleColor: '#FFFFFF',
    titleFont: 'Playfair Display',
    bodyFont: 'Inter',
    descriptionFont: 'Inter',
    savedGradients: [],
    translations: supportedLanguages.reduce((acc, lang) => {
        acc[lang.code] = getDefaultTranslations(lang.code);
        return acc;
    }, {} as Record<Language, TranslatedContent>)
};

function getDefaultTranslations(lang: Language): TranslatedContent {
    const base = DEFAULT_CONTENT;
    const overrides: Record<string, Partial<TranslatedContent>> = {
        en: {
            subtitle: 'Find your meaningful connections',
            description: 'Inspired by the legend of the red thread, connect with people who share your interests, passions, and values.',
            ctaPrimary: 'Get Started',
            ctaSecondary: 'Sign In',
            howItWorksTitle: 'How It Works',
            footerText: '© 2026 RETH. Made with ❤️ for meaningful connections.',
            footerTagline: 'Meaningful connections inspired by the legend of the red thread.',
            features: {
                smartMatching: { title: 'Smart Matching', description: 'Our AI-powered affinity algorithm matches you with compatible people.' },
                realTimeChat: { title: 'Real-Time Chat', description: 'Connect instantly with your matches through real-time messaging.' },
                proximityRadar: { title: 'Proximity Radar', description: 'Discover people nearby who share your interests.' },
                multipleIntentions: { title: 'Multiple Intentions', description: 'Find connections for any purpose.' }
            }
        },
        pt: {
            subtitle: 'Encontre suas conexões significativas',
            description: 'Inspirado na lenda do fio vermelho, conecte-se com pessoas que compartilham seus interesses.',
            ctaPrimary: 'Começar',
            ctaSecondary: 'Entrar',
            howItWorksTitle: 'Como Funciona',
            footerText: '© 2026 RETH. Feito com ❤️ para conexões significativas.',
            footerTagline: 'Conexões significativas inspiradas na lenda do fio vermelho.',
            features: {
                smartMatching: { title: 'Correspondência Inteligente', description: 'Nosso algoritmo de afinidade combina você com pessoas compatíveis.' },
                realTimeChat: { title: 'Chat em Tempo Real', description: 'Conecte-se instantaneamente com suas correspondências.' },
                proximityRadar: { title: 'Radar de Proximidade', description: 'Descubra pessoas próximas que compartilham seus interesses.' },
                multipleIntentions: { title: 'Múltiplas Intenções', description: 'Encontre conexões para qualquer propósito.' }
            }
        },
        fr: {
            subtitle: 'Trouvez vos connexions significatives',
            description: 'Inspiré par la légende du fil rouge, connectez-vous avec des personnes qui partagent vos intérêts.',
            ctaPrimary: 'Commencer',
            ctaSecondary: 'Connexion',
            howItWorksTitle: 'Comment Ça Marche',
            footerText: '© 2026 RETH. Fait avec ❤️ pour des connexions significatives.',
            footerTagline: 'Des connexions significatives inspirées par la légende du fil rouge.',
            features: {
                smartMatching: { title: 'Correspondance Intelligente', description: 'Notre algorithme d\'affinité vous met en relation avec des personnes compatibles.' },
                realTimeChat: { title: 'Chat en Temps Réel', description: 'Connectez-vous instantanément avec vos correspondances.' },
                proximityRadar: { title: 'Radar de Proximité', description: 'Découvrez des personnes à proximité.' },
                multipleIntentions: { title: 'Intentions Multiples', description: 'Trouvez des connexions pour n\'importe quel objectif.' }
            }
        },
        de: {
            subtitle: 'Finde deine bedeutsamen Verbindungen',
            description: 'Inspiriert von der Legende des roten Fadens, verbinde dich mit Menschen, die deine Interessen, Leidenschaften und Werte teilen.',
            ctaPrimary: 'Loslegen',
            ctaSecondary: 'Anmelden',
            howItWorksTitle: 'Wie es funktioniert',
            footerText: '© 2026 RETH. Mit ❤️ für bedeutungsvolle Verbindungen.',
            footerTagline: 'Bedeutungsvolle Verbindungen inspiriert von der Legende des roten Fadens.',
            features: {
                smartMatching: { title: 'Intelligentes Matching', description: 'Unser KI-gestützter Algorithmus verbindet dich mit kompatiblen Menschen.' },
                realTimeChat: { title: 'Echtzeit-Chat', description: 'Verbinde dich sofort mit deinen Matches durch Echtzeit-Nachrichten.' },
                proximityRadar: { title: 'Näherungsradar', description: 'Entdecke Menschen in deiner Nähe, die deine Interessen teilen.' },
                multipleIntentions: { title: 'Verschiedene Absichten', description: 'Finde Verbindungen für jeden Zweck.' }
            }
        },
        it: {
            subtitle: 'Trova le tue connessioni significative',
            description: 'Ispirato alla leggenda del filo rosso, connettiti con persone che condividono i tuoi interessi, passioni e valori.',
            ctaPrimary: 'Inizia',
            ctaSecondary: 'Accedi',
            howItWorksTitle: 'Come Funziona',
            footerText: '© 2026 RETH. Fatto con ❤️ per connessioni significative.',
            footerTagline: 'Connessioni significative ispirate alla leggenda del filo rosso.',
            features: {
                smartMatching: { title: 'Matching Intelligente', description: 'Il nostro algoritmo di affinità basato su IA ti abbina a persone compatibili.' },
                realTimeChat: { title: 'Chat in Tempo Reale', description: 'Connettiti istantaneamente con i tuoi match attraverso la messaggistica in tempo reale.' },
                proximityRadar: { title: 'Radar di Prossimità', description: 'Scopri persone vicino a te che condividono i tuoi interessi.' },
                multipleIntentions: { title: 'Intenzioni Multiple', description: 'Trova connessioni per qualsiasi scopo.' }
            }
        },
        ru: {
            subtitle: 'Найди свои значимые связи',
            description: 'Вдохновлено легенде красной нити, находи общение с людьми, разделяющими твои интересы, страсти и ценности.',
            ctaPrimary: 'Начать',
            ctaSecondary: 'Войти',
            howItWorksTitle: 'Как это работает',
            footerText: '© 2026 RETH. Сделано с ❤️ для значимых связей.',
            footerTagline: 'Значимые связи, вдохновленные легендой красной нити.',
            features: {
                smartMatching: { title: 'Умное совпадение', description: 'Наш ИИ-алгоритм подбирает совместимых людей по интересам.' },
                realTimeChat: { title: 'Чат в реальном времени', description: 'Общайся мгновенно с твоими совпадениями.' },
                proximityRadar: { title: 'Радар близости', description: 'Находи людей рядом, разделяющих твои интересы.' },
                multipleIntentions: { title: 'Разные намерения', description: 'Находи связи для любой цели.' }
            }
        },
        sv: {
            subtitle: 'Hitta dina meningsfulla kopplingar',
            description: 'Inspirerad av legenden om den röda tråden, knyt kontakt med människor som delar dina intressen, passioner och värderingar.',
            ctaPrimary: 'Kom igång',
            ctaSecondary: 'Logga in',
            howItWorksTitle: 'Hur det fungerar',
            footerText: '© 2026 RETH. Skapat med ❤️ för meningsfulla kopplingar.',
            footerTagline: 'Meningsfulla kopplingar inspirerade av legenden om den röda tråden.',
            features: {
                smartMatching: { title: 'Smart Matchning', description: 'Vår AI-drivna algoritm matchar dig med kompatibla människor.' },
                realTimeChat: { title: 'Chat i realtid', description: 'Anslut omedelbart med dina matchar genom realtidsmeddelanden.' },
                proximityRadar: { title: 'Närhetsradar', description: 'Upptäck människor i närheten som delar dina intressen.' },
                multipleIntentions: { title: 'Flera intentioner', description: 'Hitta kopplingar för vilket syfte som helst.' }
            }
        },
        nl: {
            subtitle: 'Ontdek je betekenisvolle connecties',
            description: 'Geïnspireerd op de legende van de rode draad, verbind je met mensen die je interesses, passies en waarden delen.',
            ctaPrimary: 'Aan de slag',
            ctaSecondary: 'Inloggen',
            howItWorksTitle: 'Hoe het werkt',
            footerText: '© 2026 RETH. Gemaakt met ❤️ voor betekenisvolle connecties.',
            footerTagline: 'Betekenisvolle connecties geïnspireerd op de legende van de rode draad.',
            features: {
                smartMatching: { title: 'Slimme Matching', description: 'Onze AI-gedreven algoritme matcht je met compatibele mensen.' },
                realTimeChat: { title: 'Realtime Chat', description: 'Verbind direct met je matches via realtime messaging.' },
                proximityRadar: { title: 'Proximiteitsradar', description: 'Ontdek mensen in de buurt die je interesses delen.' },
                multipleIntentions: { title: 'Meerdere Intenties', description: 'Vind connecties voor elk doel.' }
            }
        },
        zh: {
            subtitle: '寻找你有意义的连接',
            description: '受红线传说启发，与志同道合、激情相投、价值观一致的人建立连接。',
            ctaPrimary: '开始使用',
            ctaSecondary: '登录',
            howItWorksTitle: '如何运作',
            footerText: '© 2026 RETH. 为有意义的连接而创建。',
            footerTagline: '受红线传说启发的有意义的连接。',
            features: {
                smartMatching: { title: '智能匹配', description: '我们的AI亲和力算法根据兴趣为你匹配合适的人。' },
                realTimeChat: { title: '实时聊天', description: '通过实时消息与匹配对象即时连接。' },
                proximityRadar: { title: '附近雷达', description: '发现附近有共同兴趣的人。' },
                multipleIntentions: { title: '多重意图', description: '为任何目的寻找连接。' }
            }
        },
        hi: {
            subtitle: 'अपने सार्थक संबंध खोजें',
            description: 'लाल धागे की किंवदंती से प्रेरित, उन लोगों से जुड़ें जो आपके जुनून, रुचियों और मूल्यों को साझा करते हैं।',
            ctaPrimary: 'शुरू करें',
            ctaSecondary: 'साइन इन',
            howItWorksTitle: 'यह कैसे काम करता है',
            footerText: '© 2026 RETH. सार्थक संबंधों के लिए ❤️ के साथ बनाया गया।',
            footerTagline: 'लाल धागे की किंवदंती से प्रेरित सार्थक संबंध।',
            features: {
                smartMatching: { title: 'स्मार्ट मिलान', description: 'हमारा AI-संचालित एल्गोरिदम आपको अनुकूल लोगों से मिलाता है।' },
                realTimeChat: { title: 'रियल-टाइम चैट', description: 'रियल-टाइम मैसेजिंग के माध्यम से अपने मैचों से तुरंत जुड़ें।' },
                proximityRadar: { title: 'निकटता रडार', description: 'अपने हितों को साझा करने वाले आस-पास के लोगों को खोजें।' },
                multipleIntentions: { title: 'एकाधिक इरादे', description: 'किसी भी उद्देश्य के लिए कनेक्शन खोजें।' }
            }
        },
        bn: {
            subtitle: 'তোমার অর্থবহ সংযোগ খুঁজে বের করো',
            description: 'লাল সুতের লেজেন্ড থেকে অনুপ্রাণিত, তাদের সাথে সংযোগ করো যারা তোমার স্বার্থ, আবেগ এবং মূল্যবোধ ভাগ করে।',
            ctaPrimary: 'শুরু করো',
            ctaSecondary: 'সাইন ইন',
            howItWorksTitle: 'এটি কিভাবে কাজ করে',
            footerText: '© 2026 RETH. অর্থবহ সংযোগের জন্য ❤️ দিয়ে তৈরি।',
            footerTagline: 'লাল সুতের লেজেন্ড থেকে অনুপ্রাণিত অর্থবহ সংযোগ।',
            features: {
                smartMatching: { title: 'স্মার্ট ম্যাচিং', description: 'আমাদের AI-চালিত অ্যালগরিদম তোমাকে সুযোগ্য লোকজন সাথে মিলিয়ে দেয়।' },
                realTimeChat: { title: 'রিয়েল-টাইম চ্যাট', description: 'রিয়েল-টাইম মেসেজিংয়ের মাধ্যমে তোমার ম্যাচের সাথে তাৎক্ষণিকভাবে সংযোগ করো।' },
                proximityRadar: { title: 'নিকটতা রাডার', description: 'তোমার স্বার্থ ভাগ করা নিকটবর্তী মানুষ খুঁজে বের করো।' },
                multipleIntentions: { title: 'বহু উদ্দেশ্য', description: 'যেকোনো লক্ষ্যের জন্য সংযোগ খুঁজে বের করো।' }
            }
        },
        ja: {
            subtitle: '意味のある出会いを見つけよう',
            description: '赤い糸の伝説にインスパイアされ、興味や情熱、価値観を共有する人々とつながりましょう。',
            ctaPrimary: '始める',
            ctaSecondary: 'ログイン',
            howItWorksTitle: '仕組み',
            footerText: '© 2026 RETH. 意味のある出会いのために ❤️ を込めて作られました。',
            footerTagline: '赤い糸の伝説にインスパイアされた意味のある出会い。',
            features: {
                smartMatching: { title: 'スマートマッチング', description: 'AI搭載のアルゴリズムが相性の良い人とマッチングします。' },
                realTimeChat: { title: 'リアルタイムチャット', description: 'マッチした相手とリアルタイムメッセージで即座につながれます。' },
                proximityRadar: { title: '近接レーダー', description: '共通の興味を持つ近くの人を発見できます。' },
                multipleIntentions: { title: '多様な目的', description: 'あらゆる目的での出会いを見つけられます。' }
            }
        },
        ko: {
            subtitle: '의미 있는 인연을 찾아보세요',
            description: '빨간 실의 전설에서 영감을 받아, 관심사와 열정, 가치를 공유하는 사람들과 연결됩니다.',
            ctaPrimary: '시작하기',
            ctaSecondary: '로그인',
            howItWorksTitle: '작동 방식',
            footerText: '© 2026 RETH. 의미 있는 인연을 위해 ❤️ 로 만들었습니다.',
            footerTagline: '빨간 실의 전설에서 영감을 받은 의미 있는 인연.',
            features: {
                smartMatching: { title: '스마트 매칭', description: 'AI 기반 친화도 알고리즘으로 나와 잘 맞는 사람과 연결해 드립니다.' },
                realTimeChat: { title: '실시간 채팅', description: '매칭된 상대와 실시간 메시지로 즉시 대화하세요.' },
                proximityRadar: { title: '근접 레이더', description: '내 주변에서 관심사가 같은 사람을 찾아보세요.' },
                multipleIntentions: { title: '다양한 의도', description: '어떤 목적이든 인연을 찾을 수 있습니다.' }
            }
        },
        ar: {
            subtitle: 'ابحث عن اتصالاتك الهادفة',
            description: 'مستوحى من أسطورة الخيط الأحمر، تواصل مع أشخاص يشاركونك اهتماماتك وشغفك وقيمك.',
            ctaPrimary: 'ابدأ',
            ctaSecondary: 'تسجيل الدخول',
            howItWorksTitle: 'كيف يعمل',
            footerText: '© 2026 RETH. صُنع بـ ❤️ من أجل اتصالات هادفة.',
            footerTagline: 'اتصالات هادفة مستوحاة من أسطورة الخيط الأحمر.',
            features: {
                smartMatching: { title: 'مطابقة ذكية', description: 'خوارزميتنا المدعومة بالذكاء الاصطناعي تطابقك مع أشخاص متوافقين.' },
                realTimeChat: { title: 'دردشة فورية', description: 'تواصل فورًا مع مطابقاتك عبر المراسلة الفورية.' },
                proximityRadar: { title: 'رادار القرب', description: 'اكتشف أشخاصًا قريبين يشاركونك اهتماماتك.' },
                multipleIntentions: { title: 'نيات متعددة', description: 'ابحث عن اتصالات لأي غرض.' }
            }
        },
        sw: {
            subtitle: 'Pata uhusiano wako wenye maana',
            description: 'Kivuliwa na hadithi ya uzi mwekundu, unganisha na watu wanaoshiriki maslahi, shauku na maadili yako.',
            ctaPrimary: 'Anza',
            ctaSecondary: 'Ingia',
            howItWorksTitle: 'Jinsi Inavyofanya Kazi',
            footerText: '© 2026 RETH. Imetengenezwa kwa ❤️ kwa uhusiano wenye maana.',
            footerTagline: 'Uhusiano wenye maana uliovutwa na hadithi ya uzi mwekundu.',
            features: {
                smartMatching: { title: 'Ulinganisho wa Busara', description: 'Algoritimu yetu ya AI ya ulinganisho inakulunganisha na watu wenye ufanisi.' },
                realTimeChat: { title: 'Mazungumzo ya Realtime', description: 'Unganisha papo hapo na waliolingana nawe kupitia ujumbe wa realtime.' },
                proximityRadar: { title: 'Radari ya Ukaribisho', description: 'Gunda watu karibu nawe wanaoshiriki maslahi yako.' },
                multipleIntentions: { title: 'Malengo Mengi', description: 'Pata uhusiano kwa lengo lolote.' }
            }
        },
        ha: {
            subtitle: 'Nemadi abin da ke nufin daidai ga ku',
            description: 'An rage da labarin tsakani na bakin ciki, tura wasu mutane da kuka hada kansu da hoto, jasiri da mulki.',
            ctaPrimary: 'Fara',
            ctaSecondary: 'Shiga',
            howItWorksTitle: 'Yadda ake Yi',
            footerText: '© 2026 RETH. An yi da ❤️ don abubuwan da ke nufin daidai.',
            footerTagline: 'Abin da ke nufin daidai wanda aka rage shi daga labarin tsakani na bakin ciki.',
            features: {
                smartMatching: { title: 'Dabara mai Hikima', description: 'Algoridim na AI na hana da kwato da ke haɗa ku da mutanen da ke dacewa da ku.' },
                realTimeChat: { title: 'Kooƙarin Lokacin da Yake Faruwa', description: 'Shiga cikin hira da wanda kuka hada kanshi a lokaci.' },
                proximityRadar: { title: 'Redan Nesa', description: 'Gano mutanen dake kusa da ku wanda suke hada kansu da hoto.' },
                multipleIntentions: { title: 'Kokarin Yawa', description: 'Nemadi haɗin kai don duk matakin.' }
            }
        },
        am: {
            subtitle: 'የአንተን ተስፋ ያለውን ግንኙነት ያግኙ',
            description: 'የቀይ ስር ታሪክ በመነሻ ያለው፣ እርስተናላችሁን የሚካፈሉ ሰዎች ጋር ይገናኙ።',
            ctaPrimary: 'ጀምር',
            ctaSecondary: 'ግባ',
            howItWorksTitle: 'እንዴት እንደሚሰራ',
            footerText: '© 2026 RETH. ለተስፋ ያለው ግንኙነት ❤️ በተፈጠረ።',
            footerTagline: 'የቀይ ስር ታሪክ በመነሻ የተነሳ ተስፋ ያለው ግንኙነት።',
            features: {
                smartMatching: { title: 'ጥበቃ ማተላለያ', description: 'የAI ደጋፊ አልጎሪዝም የተስፋ ሰዎች ጋር ያተላልያል።' },
                realTimeChat: { title: 'የቦታ ጊዜ ውይይት', description: 'ከተተላለፉት ጋር በቦታ ጊዜ መልእክት ይገናኙ።' },
                proximityRadar: { title: 'የቦታ ራድይ', description: 'የእርስተናላችሁን ያለውን ሰዎች ያግኙ።' },
                multipleIntentions: { title: 'ብዙ ፈተና', description: 'ለሁሉም ዓላማ ግንኙነት ያግኙ።' }
            }
        },
        fil: {
            subtitle: 'Humanap ng iyong makabuluhang koneksyon',
            description: 'Inspired ng alamat ng pula na tali, kumonekta sa mga taong nagbabahagi ng iyong mga interes, passion, at values.',
            ctaPrimary: 'Magsimula',
            ctaSecondary: 'Mag-sign in',
            howItWorksTitle: 'Paano Ito Gumagana',
            footerText: '© 2026 RETH. Ginawa nang may ❤️ para sa makabuluhang koneksyon.',
            footerTagline: 'Makabuluhang koneksyon na inspired sa alamat ng pula na tali.',
            features: {
                smartMatching: { title: 'Smart Matching', description: 'Ang aming AI-powered na algorithm ay nagma-match sa iyo ng kompatibol na tao.' },
                realTimeChat: { title: 'Real-Time Chat', description: 'Kumonekta agad sa iyong matches sa pamamagitan ng real-time messaging.' },
                proximityRadar: { title: 'Proximity Radar', description: 'Diskubre ang mga tao sa malapit na nagbabahagi ng iyong mga interes.' },
                multipleIntentions: { title: 'Multiple Intentions', description: 'Humanap ng koneksyon para sa anumang layunin.' }
            }
        }
    };
    return { ...base, ...(overrides[lang] || {}) };
}

const PRESET_GRADIENTS: Array<{ id: string; name: string; start: string; end: string; subtitleColor: string }> = [
    { id: 'preset-cold', name: 'Frío (Azul/Violeta)', start: '#1A237E', end: '#7B1FA2', subtitleColor: '#FFFFFF' },
    { id: 'preset-graphite', name: 'Neutro (Grafito/Negro)', start: '#212121', end: '#000000', subtitleColor: '#FFFFFF' },
    { id: 'preset-warm', name: 'Cálido (Naranja/Dorado)', start: '#FF8E53', end: '#FFD54F', subtitleColor: '#3E2723' },
    { id: 'preset-light', name: 'Claro (Blanco/Gris)', start: '#FFFFFF', end: '#F5F5F5', subtitleColor: '#212121' },
    { id: 'preset-love-romantic', name: 'Amor romántico', start: '#FF6B8B', end: '#FFB7C5', subtitleColor: '#212121' },
    { id: 'preset-love-passion', name: 'Pasión y deseo', start: '#D32F2F', end: '#880E4F', subtitleColor: '#FFFFFF' },
    { id: 'preset-love-tenderness', name: 'Ternura y pureza', start: '#FFE0E0', end: '#FFFFFF', subtitleColor: '#212121' },
    { id: 'preset-love-spiritual', name: 'Conexión espiritual', start: '#7B1FA2', end: '#D32F2F', subtitleColor: '#FFFFFF' },
    { id: 'preset-love-eternal', name: 'Amor eterno', start: '#FF8E53', end: '#FFD54F', subtitleColor: '#3E2723' },
    { id: 'preset-love-juvenile', name: 'Amor juvenil', start: '#FF4081', end: '#F50057', subtitleColor: '#FFFFFF' },
];

import { supportedLanguages } from '../../../config/languages';

type Language = (typeof supportedLanguages)[number]['code'];

const TITLE_FONT_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Lobster', label: 'Lobster' },
    { value: 'Pacifico', label: 'Pacifico' },
    { value: 'Caveat', label: 'Caveat' },
    { value: 'Great Vibes', label: 'Great Vibes' },
];

const BODY_FONT_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Nunito Sans', label: 'Nunito Sans' },
    { value: 'Lato', label: 'Lato' },
];

type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

const BANNER_RESOLUTIONS: Array<{
    value: string; label: string; hint: string; dims: string;
    maxBytes: number; targetW: number; targetH: number; device: PreviewDevice;
}> = [
        { value: 'all', label: 'Todas (fallback)', hint: '1920×1080, se recorta con cover', dims: '1920×1080', maxBytes: 500 * 1024, targetW: 1920, targetH: 1080, device: 'desktop' },
        { value: 'mobile', label: 'Móvil (≤767px)', hint: '750×1334 vertical, ≤300KB', dims: '750×1334', maxBytes: 300 * 1024, targetW: 750, targetH: 1334, device: 'mobile' },
        { value: 'tablet', label: 'Tablet (768-1023)', hint: '1536×2048', dims: '1536×2048', maxBytes: 500 * 1024, targetW: 1536, targetH: 2048, device: 'tablet' },
        { value: 'desktop', label: 'Desktop (1024-1439)', hint: '1920×1080', dims: '1920×1080', maxBytes: 500 * 1024, targetW: 1920, targetH: 1080, device: 'desktop' },
        { value: 'xl', label: 'Large (1440-1919)', hint: '2560×1440', dims: '2560×1440', maxBytes: 800 * 1024, targetW: 2560, targetH: 1440, device: 'desktop' },
        { value: 'smart', label: 'Smart Display (≥1920)', hint: '3840×2160 4K', dims: '3840×2160', maxBytes: 1536 * 1024, targetW: 3840, targetH: 2160, device: 'desktop' },
    ];

const DEVICE_FRAME: Record<PreviewDevice, { width: string; height: number; radius: number; label: string }> = {
    mobile: { width: 'min(260px, 100%)', height: 480, radius: 18, label: 'Móvil ≤767px' },
    tablet: { width: 'min(400px, 100%)', height: 480, radius: 12, label: 'Tablet 768–1023px' },
    desktop: { width: '100%', height: 480, radius: 8, label: 'Desktop ≥1024px' },
};

const resolutionToDevice = (res: string): PreviewDevice =>
    BANNER_RESOLUTIONS.find(r => r.value === res)?.device || 'desktop';

const readImageDims = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer la imagen'));
        };
        img.src = url;
    });

const formatBytes = (n: number) =>
    n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

/** Soft validation: confirm si excede peso o dimensiones. true = continuar. */
const validateBannerFile = async (file: File, resolution: string): Promise<boolean> => {
    const meta = BANNER_RESOLUTIONS.find(r => r.value === resolution);
    if (!meta) return true;
    const issues: string[] = [];
    if (file.size > meta.maxBytes) {
        issues.push(`pesa ${formatBytes(file.size)} (máx. recomendado ${formatBytes(meta.maxBytes)})`);
    }
    try {
        const { width, height } = await readImageDims(file);
        if (width > meta.targetW * 1.25 || height > meta.targetH * 1.25) {
            issues.push(`mide ${width}×${height} (objetivo ${meta.dims})`);
        }
    } catch { /* solo peso si falla la lectura */ }
    if (issues.length === 0) return true;
    return window.confirm(`El banner ${issues.join(' y ')}.\n¿Subirlo de todos modos?`);
};

const getBannerResolution = (b: AppearanceResource): string =>
    (b.metadata?.resolution || (b.metadata?.isMobile ? 'mobile' : 'all')) as string;

// Mismo algoritmo que el landing: resolución exacta → fallback 'all' → -1 si no hay nada adecuado
const findPreviewIndexForResolution = (banners: AppearanceResource[], resolution: string): number => {
    if (banners.length === 0) return -1;
    const exact = banners.findIndex(b => getBannerResolution(b) === resolution);
    if (exact >= 0) return exact;
    return banners.findIndex(b => getBannerResolution(b) === 'all');
};

const getTitleFontFamily = (font: string) => `${font}, Poppins, Inter, cursive`;
const getBodyFontFamily = (font: string) => `${font}, Inter, sans-serif`;

// Etiquetas cortas de la barra minimalista del footer (mockup)
const FOOTER_MINI_LEGAL: Record<Language, { privacy: string; terms: string; contact: string }> = {
    es: { privacy: 'Privacidad', terms: 'Términos', contact: 'Contacto' },
    en: { privacy: 'Privacy', terms: 'Terms', contact: 'Contact' },
    pt: { privacy: 'Privacidade', terms: 'Termos', contact: 'Contato' },
    fr: { privacy: 'Confidentialité', terms: 'CGU', contact: 'Contact' },
};

// Helper: Convert HEX to RGB for display
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
};

export default function BannersPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Resources
    const [themeResource, setThemeResource] = useState<AppearanceResource | null>(null);
    const [bannerResources, setBannerResources] = useState<AppearanceResource[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [pendingResolution, setPendingResolution] = useState<string>('all');
    // Rotación controlada: isRotating=false → pausa; true → rotación activa (reanuda al clic en miniatura)
    const [isRotating, setIsRotating] = useState(false);
    const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Alert breve al cambiar resolución en el combolist (autohide ~2.5s)
    const [resolutionAlert, setResolutionAlert] = useState<string | null>(null);
    // Marco de dispositivo del mockup (se sincroniza con el combolist; se puede forzar a mano)
    const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
    // Carga progresiva del banner en preview (spinner)
    const [previewImgLoading, setPreviewImgLoading] = useState(false);
    // Miniaturas aún cargando (id → true mientras no onLoad)
    const [thumbLoading, setThumbLoading] = useState<Record<string, boolean>>({});

    const adminUser = useSelector((state: any) => state.adminAuth?.user);

    // Form State
    const [config, setConfig] = useState<LandingThemeConfig>(DEFAULT_THEME);
    // Selector de idioma para editar textos (reemplaza pestañas)
    const [currentLang, setCurrentLang] = useState<Language>('es');
    const languageOptions: Array<{ value: Language; label: string }> = supportedLanguages.map(lang => ({
        value: lang.code,
        label: `${lang.label} (${lang.code.toUpperCase()})`
    }));

    // Preview URLs
    const [previewBanner, setPreviewBanner] = useState<string | null>(null);
    const [previewIcon, setPreviewIcon] = useState<string | null>(null);
    const [previewNavLogo, setPreviewNavLogo] = useState<string | null>(null);

    // Live preview auto-fit (mini-pantalla: escala el mockup para que entre sin scroll)
    const previewBoxRef = useRef<HTMLDivElement | null>(null);
    const previewContentRef = useRef<HTMLDivElement | null>(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [scaledPreviewHeight, setScaledPreviewHeight] = useState(480);

    useEffect(() => {
        const measure = () => {
            const content = previewContentRef.current;
            const box = previewBoxRef.current;
            if (!content || !box) return;
            const contentHeight = content.scrollHeight;
            const containerHeight = box.clientHeight;
            const scale = contentHeight > containerHeight && containerHeight > 0
                ? containerHeight / contentHeight
                : 1;
            setPreviewScale(scale);
            setScaledPreviewHeight(Math.round(contentHeight * scale));
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (previewBoxRef.current) ro.observe(previewBoxRef.current);
        if (previewContentRef.current) ro.observe(previewContentRef.current);
        return () => ro.disconnect();
    }, [currentLang, config.subtitleFontSize, config.descriptionFontSize, config.descriptionFont, config.subtitleColor, previewBanner, previewIcon, previewNavLogo, previewDevice]);

    useEffect(() => {
        fetchSettings();
    }, []);

    // Rotación explícita: clearInterval/setInterval controlados por isRotating.
    // Depende de [isRotating, bannerResources] para recrear el intervalo cuando
    // cambia el número de banners (evita %0 y mantiene sincronización).
    useEffect(() => {
        if (rotationRef.current) {
            clearInterval(rotationRef.current);
            rotationRef.current = null;
        }
        if (isRotating && bannerResources.length > 1) {
            rotationRef.current = setInterval(() => {
                setPreviewIndex(prev => {
                    const len = bannerResources.length;
                    return len > 1 ? (prev + 1) % len : prev;
                });
            }, 3000);
        }
        return () => {
            if (rotationRef.current) {
                clearInterval(rotationRef.current);
                rotationRef.current = null;
            }
        };
    }, [isRotating, bannerResources]);

    // Sincroniza previewIndex SOLO si el banner actual no coincide con la resolución
    // o si previewIndex queda fuera de rango tras cambios de recursos.
    useEffect(() => {
        if (!isRotating && pendingResolution && bannerResources.length > 0) {
            const currentBanner = bannerResources[previewIndex];
            const currentRes = currentBanner ? getBannerResolution(currentBanner) : null;
            if (currentRes === pendingResolution) return; // ya coincide, no tocar
            const idx = findPreviewIndexForResolution(bannerResources, pendingResolution);
            if (idx >= 0 && idx !== previewIndex) {
                setPreviewIndex(idx);
            } else if (idx < 0) {
                setPreviewIndex(0);
            }
        }
    }, [pendingResolution, bannerResources, isRotating, previewIndex]);

    useEffect(() => {
        const banner = bannerResources[previewIndex];
        setPreviewBanner(banner ? getMediaUrl(banner.url) : null);
    }, [previewIndex, bannerResources]);

    useEffect(() => {
        if (!resolutionAlert) return;
        const t = setTimeout(() => setResolutionAlert(null), 2500);
        return () => clearTimeout(t);
    }, [resolutionAlert]);

    // Spinner mientras el banner de preview termina de cargar
    useEffect(() => {
        if (!previewBanner) {
            setPreviewImgLoading(false);
            return;
        }
        setPreviewImgLoading(true);
        let cancelled = false;
        const img = new window.Image();
        img.onload = () => { if (!cancelled) setPreviewImgLoading(false); };
        img.onerror = () => { if (!cancelled) setPreviewImgLoading(false); };
        img.src = previewBanner;
        return () => { cancelled = true; };
    }, [previewBanner]);

    // Tras recargar recursos, marcar miniaturas como "cargando" hasta onLoad
    useEffect(() => {
        const next: Record<string, boolean> = {};
        bannerResources.forEach(b => {
            if (b._id) next[b._id] = thumbLoading[b._id] !== false;
        });
        setThumbLoading(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bannerResources]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // 1. Fetch Theme Config — manejo 403 sin romper el portal
            let themes: AppearanceResource[] = [];
            try {
                themes = await appearanceService.getResources(AppearanceType.LANDING_THEME);
            } catch (e: any) {
                if (e?.response?.status === 403) {
                    setSnackbar({ open: true, message: 'Acceso denegado (403): tu rol no tiene permiso MANAGE_BRANDING / EDIT_CONFIG para Apariencia', severity: 'error' });
                    console.warn('Apariencia: permisos insuficientes para LANDING_THEME', e);
                    themes = [];
                } else throw e;
            }
            const activeTheme = themes.find(r => r.is_active);
            if (activeTheme && activeTheme.metadata) {
                setThemeResource(activeTheme);

                // DATA MIGRATION CHECK:
                // If the fetched metadata is flattened (old version), migrate it to 'es' translation
                const fetchedData = activeTheme.metadata as any;
                if (!fetchedData.translations && fetchedData.subtitle) {
                    // Old structure
                    console.log("Migrating old Landing Theme config...");
                    setConfig({
                        ...DEFAULT_THEME,
                        gradientStart: fetchedData.gradientStart || DEFAULT_THEME.gradientStart,
                        gradientEnd: fetchedData.gradientEnd || DEFAULT_THEME.gradientEnd,
                        subtitleFontSize: Math.max(fetchedData.subtitleFontSize || DEFAULT_THEME.subtitleFontSize, 4.6),
                        descriptionFontSize: fetchedData.descriptionFontSize || DEFAULT_THEME.descriptionFontSize,
                        subtitleColor: fetchedData.subtitleColor || DEFAULT_THEME.subtitleColor,
                        titleFont: fetchedData.titleFont || DEFAULT_THEME.titleFont,
                        bodyFont: fetchedData.bodyFont || DEFAULT_THEME.bodyFont,
                        descriptionFont: fetchedData.descriptionFont || DEFAULT_THEME.descriptionFont,
                        translations: {
                            ...DEFAULT_THEME.translations,
                            es: {
                                subtitle: fetchedData.subtitle,
                                description: fetchedData.description,
                                ctaPrimary: fetchedData.ctaPrimary,
                                ctaSecondary: fetchedData.ctaSecondary,
                                howItWorksTitle: fetchedData.howItWorksTitle || DEFAULT_CONTENT.howItWorksTitle,
                                features: fetchedData.features || DEFAULT_CONTENT.features,
                                footerText: fetchedData.footerText || DEFAULT_CONTENT.footerText,
                                footerTagline: fetchedData.footerTagline || DEFAULT_CONTENT.footerTagline
                            }
                        }
                    });
                } else {
                    // New structure, merge safely — asegura que TODOS los idiomas de supportedLanguages existan
                    // Migración automática: si la BD tiene los valores antiguos en inglés para ES/PT/FR,
                    // los reemplazamos por los nuevos defaults traducidos.
                    const OLD_CTA_PRIMARY = 'Get Started';
                    const OLD_CTA_SECONDARY = 'Sign In';

                    setConfig(prev => {
                        const fetchedTranslations = (fetchedData.translations || {}) as Record<string, Partial<TranslatedContent>>;
                        const mergedTranslations: Record<Language, TranslatedContent> = {} as Record<Language, TranslatedContent>;

                        // Itera sobre TODOS los idiomas del sistema para garantizar que estén presentes
                        for (const lang of supportedLanguages.map(l => l.code)) {
                            const langCode = lang as Language;
                            const defaultLang = DEFAULT_THEME.translations[langCode] || DEFAULT_CONTENT;
                            const prevLang = prev.translations[langCode] || defaultLang;
                            const fetchedLang = fetchedTranslations[langCode] || {};

                            // Migración: si el valor guardado coincide con el antiguo default en inglés,
                            // usar el nuevo default traducido para este idioma
                            const migratedCtaPrimary =
                                fetchedLang.ctaPrimary === OLD_CTA_PRIMARY ? defaultLang.ctaPrimary : fetchedLang.ctaPrimary;
                            const migratedCtaSecondary =
                                fetchedLang.ctaSecondary === OLD_CTA_SECONDARY ? defaultLang.ctaSecondary : fetchedLang.ctaSecondary;

                            mergedTranslations[langCode] = {
                                ...defaultLang,
                                ...fetchedLang,
                                ctaPrimary: migratedCtaPrimary ?? defaultLang.ctaPrimary,
                                ctaSecondary: migratedCtaSecondary ?? defaultLang.ctaSecondary,
                                footerTagline:
                                    fetchedLang.footerTagline
                                    || prevLang.footerTagline
                                    || defaultLang.footerTagline
                                    || DEFAULT_CONTENT.footerTagline
                            } as TranslatedContent;
                        }

                        return {
                            ...prev,
                            ...fetchedData,
                            subtitleFontSize: Math.max(fetchedData.subtitleFontSize || prev.subtitleFontSize || DEFAULT_THEME.subtitleFontSize, 4.6),
                            descriptionFontSize: fetchedData.descriptionFontSize || prev.descriptionFontSize || DEFAULT_THEME.descriptionFontSize,
                            titleFont: fetchedData.titleFont || prev.titleFont || DEFAULT_THEME.titleFont,
                            bodyFont: fetchedData.bodyFont || prev.bodyFont || DEFAULT_THEME.bodyFont,
                            descriptionFont: fetchedData.descriptionFont || prev.descriptionFont || DEFAULT_THEME.descriptionFont,
                            savedGradients: fetchedData.savedGradients || [],
                            translations: mergedTranslations
                        };
                    });
                }
            }

            // 2. Fetch Hero Banner Backgrounds (All active) — con manejo 403
            let banners: AppearanceResource[] = [];
            try {
                banners = await appearanceService.getResources(AppearanceType.LANDING_BANNER);
            } catch (e: any) {
                if (e?.response?.status === 403) {
                    setSnackbar({ open: true, message: 'Acceso denegado (403) para fondos de portada: falta permiso MANAGE_BRANDING', severity: 'error' });
                    banners = [];
                } else throw e;
            }
            const activeBanners = banners.filter(r => r.is_active && !r.metadata?.isHeroIcon);
            setBannerResources(activeBanners);

            if (activeBanners.length > 0) {
                setPreviewBanner(getMediaUrl(activeBanners[0].url));
            } else {
                setPreviewBanner(null);
            }

            // 3. Fetch Hero Icon
            const activeIcon = banners.find(r => r.is_active && r.metadata?.isHeroIcon);
            if (activeIcon) {
                setPreviewIcon(getMediaUrl(activeIcon.url));
            } else {
                setPreviewIcon('/imagotipo.png');
            }

            // 4. Fetch Navbar Imagotipo (horizontal)
            const activeNavLogo = banners.find(r => r.is_active && r.metadata?.isNavLogo);
            if (activeNavLogo) {
                setPreviewNavLogo(getMediaUrl(activeNavLogo.url));
            } else {
                setPreviewNavLogo('/img/assets/isotipo.png');
            }

        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTheme = async () => {
        setSaving(true);
        try {
            if (themeResource) {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: config,
                    is_active: true
                });
            } else {
                await appearanceService.createResource({
                    type: AppearanceType.LANDING_THEME,
                    platform: Platform.WEB,
                    url: 'config',
                    metadata: config,
                    is_active: true,
                    description: 'Landing Page Configuration V3 (Multi-lang)'
                });
            }
            fetchSettings();
            setSnackbar({ open: true, message: 'Configuración guardada correctamente', severity: 'success' });
        } catch (error) {
            console.error("Error saving theme:", error);
            setSnackbar({ open: true, message: 'Error al guardar la configuración', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGradient = async () => {
        const newGradient = {
            id: Date.now().toString(),
            name: `Gradiente ${config.savedGradients?.length ? config.savedGradients.length + 1 : 1}`,
            start: config.gradientStart,
            end: config.gradientEnd
        };
        const updatedGradients = [...(config.savedGradients || []), newGradient];
        const newConfig = { ...config, savedGradients: updatedGradients };

        setConfig(newConfig); // Update UI immediately

        // Persist immediately
        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig,
                    is_active: true
                });
            } catch (error) {
                console.error("Error saving gradient:", error);
                setSnackbar({ open: true, message: 'Error al guardar el gradiente en el servidor', severity: 'error' });
            }
        }
    };

    const handleApplyGradient = async (gradient: { start: string, end: string }) => {
        const newConfig = { ...config, gradientStart: gradient.start, gradientEnd: gradient.end };
        setConfig(newConfig);

        // Persist immediately so the user portal reflects the change
        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig,
                    is_active: true
                });
            } catch (error) {
                console.error("Error applying gradient:", error);
                setSnackbar({ open: true, message: 'Error al aplicar el gradiente', severity: 'error' });
            }
        }
    };

    const handleApplyPreset = async (preset: { id: string; name: string; start: string; end: string; subtitleColor: string }) => {
        const alreadySaved = config.savedGradients?.some(g => g.start === preset.start && g.end === preset.end);
        const updatedGradients = alreadySaved
            ? (config.savedGradients || [])
            : [...(config.savedGradients || []), {
                id: preset.id,
                name: preset.name,
                start: preset.start,
                end: preset.end
            }];
        const newConfig: LandingThemeConfig = {
            ...config,
            gradientStart: preset.start,
            gradientEnd: preset.end,
            subtitleColor: preset.subtitleColor,
            savedGradients: updatedGradients
        };

        setConfig(newConfig);

        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig,
                    is_active: true
                });
            } catch (error) {
                console.error("Error applying preset:", error);
                setSnackbar({ open: true, message: 'Error al aplicar el fondo predefinido', severity: 'error' });
            }
        }
    };

    const handleDeleteGradient = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedGradients = config.savedGradients?.filter(g => g.id !== id) || [];
        const newConfig = { ...config, savedGradients: updatedGradients };

        setConfig(newConfig);

        // Persist immediately
        if (themeResource) {
            try {
                await appearanceService.updateResource(themeResource._id!, {
                    metadata: newConfig, // Update savedGradients list in DB
                    is_active: true
                });
            } catch (error) {
                console.error("Error deleting gradient:", error);
            }
        }
    };

    const isForbidden = (e: any) => e?.response?.status === 403;

    const uploadImage = async (file: File, isIcon: boolean, resolution: string = 'all') => {
        try {
            setLoading(true);

            // Validación blanda de peso/dimensiones antes de tocar el backend
            if (!isIcon) {
                const ok = await validateBannerFile(file, resolution);
                if (!ok) {
                    setLoading(false);
                    return;
                }
            }

            // 1. Fetch current active banners to check limits if needed
            // For icons, we still only want ONE active. For banners, we allow multiple.
            let existingBanners: AppearanceResource[] = [];
            try {
                existingBanners = await appearanceService.getResources(AppearanceType.LANDING_BANNER);
            } catch (e: any) {
                if (isForbidden(e)) {
                    // No bloqueamos la subida por 403 en la lectura; seguimos y dejamos que upload/create informe el 403 real
                    console.warn('getResources 403 — se omite verificación de límite', e);
                    existingBanners = [];
                } else throw e;
            }

            if (isIcon) {
                const activeToDeactivate = existingBanners.filter(r =>
                    r.is_active && r.metadata?.isHeroIcon === true
                );
                // Deactivate old icons
                await Promise.all(activeToDeactivate.map(r =>
                    appearanceService.updateResource(r._id!, { is_active: false })
                ));
            } else {
                // For Banners, check limit (10)
                const activeBackgrounds = existingBanners.filter(r => r.is_active && !r.metadata?.isHeroIcon);
                if (activeBackgrounds.length >= 10) {
                    setSnackbar({ open: true, message: 'Has alcanzado el límite de 10 banners. Elimina uno para agregar otro.', severity: 'error' });
                    setLoading(false);
                    return;
                }
            }

            // 3. Upload and Create New
            const url = await appearanceService.uploadFile(file, AppearanceType.LANDING_BANNER);
            const resMeta: Record<string, any> = {
                originalName: file.name,
                isHeroIcon: isIcon,
                // Auditoría visual: quién subió y cuándo
                uploadedBy: adminUser
                    ? `${adminUser.first_name || ''} ${adminUser.last_name || ''}`.trim() || adminUser.email || adminUser.id
                    : 'desconocido',
                uploadedAt: new Date().toISOString(),
                fileSizeBytes: file.size,
            };
            if (!isIcon) {
                resMeta.resolution = resolution;
                // legado para compatibilidad
                if (resolution === 'mobile') resMeta.isMobile = true;
                try {
                    const dims = await readImageDims(file);
                    resMeta.width = dims.width;
                    resMeta.height = dims.height;
                } catch { /* best-effort */ }
            }
            await appearanceService.createResource({
                type: AppearanceType.LANDING_BANNER,
                platform: Platform.WEB,
                url: url,
                is_active: true,
                description: isIcon ? 'Hero Icon' : `Hero Banner [${resolution}]`,
                metadata: resMeta
            });

            fetchSettings();
            setSnackbar({ open: true, message: 'Imagen subida correctamente', severity: 'success' });
        } catch (error: any) {
            console.error("Error uploading image:", error);
            if (isForbidden(error)) {
                setSnackbar({ open: true, message: 'Acceso denegado (403): tu rol no tiene permiso MANAGE_BRANDING. Ve a /portal-redthread/empleados/roles o pide a un Super Admin que te asigne el permiso.', severity: 'error' });
            } else {
                setSnackbar({ open: true, message: `Error al subir la imagen: ${error?.response?.data?.detail || error.message}`, severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteBanner = async (resourceId: string) => {
        if (!confirm('¿Estás seguro de eliminar este banner?')) return;
        try {
            setLoading(true);
            await appearanceService.updateResource(resourceId, { is_active: false });
            fetchSettings();
            setSnackbar({ open: true, message: 'Banner eliminado correctamente', severity: 'success' });
        } catch (error) {
            console.error("Error removing banner:", error);
            setSnackbar({ open: true, message: 'Error al eliminar el banner', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file, false, pendingResolution);
        // reset input to allow re-upload del mismo archivo
        e.target.value = '';
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file, true);
    };

    const uploadNavLogo = async (file: File) => {
        try {
            setLoading(true);
            let existing: AppearanceResource[] = [];
            try {
                existing = await appearanceService.getResources(AppearanceType.LANDING_BANNER);
            } catch (e: any) {
                if (isForbidden(e)) console.warn('getResources 403 en navLogo — se omite desactivación previa', e);
                else throw e;
            }
            const toDeactivate = existing.filter(r => r.is_active && r.metadata?.isNavLogo === true);
            if (toDeactivate.length) {
                try {
                    await Promise.all(toDeactivate.map(r => appearanceService.updateResource(r._id!, { is_active: false })));
                } catch (e: any) { if (!isForbidden(e)) throw e; }
            }
            const url = await appearanceService.uploadFile(file, AppearanceType.LANDING_BANNER);
            await appearanceService.createResource({
                type: AppearanceType.LANDING_BANNER,
                platform: Platform.WEB,
                url,
                is_active: true,
                description: 'Navbar Imagotipo Horizontal',
                metadata: { originalName: file.name, isNavLogo: true }
            });
            fetchSettings();
            setSnackbar({ open: true, message: 'Imagotipo del navbar actualizado', severity: 'success' });
        } catch (e: any) {
            console.error('Error uploading nav logo', e);
            if (isForbidden(e)) {
                setSnackbar({ open: true, message: 'Acceso denegado (403): tu rol no tiene permiso MANAGE_BRANDING para cambiar el imagotipo. Asigna el permiso en /portal-redthread/empleados/roles.', severity: 'error' });
            } else {
                setSnackbar({ open: true, message: `Error al subir imagotipo: ${e?.response?.data?.detail || e.message}`, severity: 'error' });
            }
        } finally { setLoading(false); }
    };

    const handleNavLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadNavLogo(file);
        e.target.value = '';
    };

    const handleDeleteNavLogo = async () => {
        try {
            setLoading(true);
            const existing = await appearanceService.getResources(AppearanceType.LANDING_BANNER);
            const active = existing.find(r => r.is_active && r.metadata?.isNavLogo);
            if (active?._id) {
                await appearanceService.updateResource(active._id, { is_active: false });
                fetchSettings();
                setSnackbar({ open: true, message: 'Imagotipo restablecido al por defecto', severity: 'success' });
            }
        } catch (e: any) {
            console.error(e);
            if (isForbidden(e)) setSnackbar({ open: true, message: 'Acceso denegado (403): falta permiso MANAGE_BRANDING', severity: 'error' });
        }
        finally { setLoading(false); }
    };

    // Helper to update translations for current language
    const updateTranslation = (field: keyof TranslatedContent, value: any) => {
        setConfig(prev => ({
            ...prev,
            translations: {
                ...prev.translations,
                [currentLang]: {
                    ...prev.translations[currentLang],
                    [field]: value
                }
            }
        }));
    };

    // Helper for nested features features
    const updateFeature = (key: keyof TranslatedContent['features'], field: keyof FeatureText, value: string) => {
        setConfig(prev => {
            const currentFeatures = prev.translations[currentLang].features;
            return {
                ...prev,
                translations: {
                    ...prev.translations,
                    [currentLang]: {
                        ...prev.translations[currentLang],
                        features: {
                            ...currentFeatures,
                            [key]: {
                                ...currentFeatures[key],
                                [field]: value
                            }
                        }
                    }
                }
            };
        });
    };

    if (loading && !config) {
        return <AdminLayout><Box p={4}><CircularProgress /></Box></AdminLayout>;
    }

    const t = config.translations[currentLang];

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    return (
        <AdminLayout>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Gestión de Portada y Contenido
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Personaliza la experiencia de la página de inicio para cada idioma.
                </Typography>

                <Grid container spacing={4}>
                    {/* Columna 2: Idioma de edición, Textos, Cómo Funciona, Botones de Acción */}
                    <Grid item xs={12} md={4} sx={{ order: 2 }}>

                        {/* Language Selector */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Idioma de edición</Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                value={currentLang}
                                onChange={(e) => setCurrentLang(e.target.value as Language)}
                                label="Seleccionar idioma"
                                sx={{ minWidth: 220 }}
                            >
                                {languageOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                Selecciona el idioma para editar los textos del Héroe, Cómo Funciona y los botones de acción.
                            </Typography>
                        </Box>

                        {/* 1. Hero Text */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Textos [{currentLang.toUpperCase()}]</Typography>
                            <Divider sx={{ mb: 2 }} />

                            {/* Configuración Visual del Héroe (global — aplica a todos los idiomas) */}
                            <Box sx={{ mb: 3, p: 2, borderRadius: 1, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                                <Typography variant="caption" fontWeight="bold" display="block" mb={2} color="primary.main">Configuración Visual del Héroe (Global)</Typography>

                                {/* Typography Control */}
                                <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="caption" fontWeight="bold">Tamaño Título (rem)</Typography>
                                        <Slider
                                            value={config.subtitleFontSize}
                                            min={4} max={10} step={0.1}
                                            onChange={(e, v) => setConfig({ ...config, subtitleFontSize: v as number })}
                                            valueLabelDisplay="auto"
                                            sx={{ color: '#FF6B6B' }}
                                        />
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Igual que en la landing: usa este rem y el texto nunca se corta (ocupa las líneas que necesite).
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Color Título</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <input
                                                type="color"
                                                value={config.subtitleColor}
                                                onChange={(e) => setConfig({ ...config, subtitleColor: e.target.value })}
                                                style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                            />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{config.subtitleColor}</Typography>
                                                <Typography variant="caption" color="text.secondary">{hexToRgb(config.subtitleColor)}</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Typography Fonts */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Tipografía Título</Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            value={config.titleFont || DEFAULT_THEME.titleFont}
                                            onChange={(e) => setConfig({ ...config, titleFont: e.target.value })}
                                            sx={{ '& .MuiSelect-select': { fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont) } }}
                                        >
                                            {TITLE_FONT_OPTIONS.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: getTitleFontFamily(opt.value) }}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Tipografía de Texto</Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            value={config.bodyFont || DEFAULT_THEME.bodyFont}
                                            onChange={(e) => setConfig({ ...config, bodyFont: e.target.value })}
                                            sx={{ '& .MuiSelect-select': { fontFamily: getBodyFontFamily(config.bodyFont || DEFAULT_THEME.bodyFont) } }}
                                        >
                                            {BODY_FONT_OPTIONS.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: getBodyFontFamily(opt.value) }}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>

                                {/* Subtítulo Principal — por idioma */}
                                <TextField
                                    fullWidth
                                    label={`Subtítulo Principal [${currentLang.toUpperCase()}]`}
                                    value={t.subtitle}
                                    onChange={(e) => updateTranslation('subtitle', e.target.value)}
                                    margin="normal"
                                    helperText="Texto del héroe del landing (varía por idioma)."
                                />
                            </Box>

                            {/* Tamaño de la descripción — global (mismo valor en todos los idiomas y tipografías) */}
                            <Box sx={{ mb: 2, p: 2, borderRadius: 1, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                    <Typography variant="caption" fontWeight="bold">Tamaño de la descripción (rem)</Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 700 }}>
                                        {Number(config.descriptionFontSize || 1.15).toFixed(2)}rem
                                    </Typography>
                                </Box>
                                <Slider
                                    value={config.descriptionFontSize || 1.15}
                                    min={0.9}
                                    max={2.5}
                                    step={0.05}
                                    onChange={(_, v) => setConfig({ ...config, descriptionFontSize: v as number })}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) => `${Number(v).toFixed(2)}rem`}
                                    sx={{ color: '#FF6B6B', ml: 1, mr: 1, width: 'calc(100% - 16px)' }}
                                />
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Cambia el texto "Descripción". Global para todos los idiomas. Por defecto 1.15rem.
                                </Typography>
                            </Box>

                            {/* Tipografía de la descripción — global */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" fontWeight="bold" display="block" mb={1}>Tipografía de la descripción</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={config.descriptionFont || config.bodyFont || DEFAULT_THEME.descriptionFont}
                                    onChange={(e) => setConfig({ ...config, descriptionFont: e.target.value })}
                                    sx={{ '& .MuiSelect-select': { fontFamily: getBodyFontFamily(config.descriptionFont || config.bodyFont || DEFAULT_THEME.descriptionFont) } }}
                                >
                                    {BODY_FONT_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: getBodyFontFamily(opt.value) }}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Descripción"
                                value={t.description}
                                onChange={(e) => updateTranslation('description', e.target.value)}
                                margin="normal"
                            />

                            <Box display="flex" gap={2} mt={1}>
                                <TextField
                                    fullWidth
                                    label="Botón Primario"
                                    value={t.ctaPrimary}
                                    onChange={(e) => updateTranslation('ctaPrimary', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Botón Secundario"
                                    value={t.ctaSecondary}
                                    onChange={(e) => updateTranslation('ctaSecondary', e.target.value)}
                                />
                            </Box>
                        </Paper>

                        {/* 2. Section: "How It Works" Text */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Cómo Funciona [{currentLang.toUpperCase()}]</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <TextField
                                fullWidth
                                label="Título de la Sección"
                                value={t.howItWorksTitle}
                                onChange={(e) => updateTranslation('howItWorksTitle', e.target.value)}
                                margin="normal"
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>Tarjetas de Características</Typography>

                            {/* Feature Editors */}
                            {[
                                { key: 'smartMatching', label: '1. Matching' },
                                { key: 'realTimeChat', label: '2. Chat' },
                                { key: 'proximityRadar', label: '3. Radar' },
                                { key: 'multipleIntentions', label: '4. Intentions' }
                            ].map((feature) => (
                                <Accordion key={feature.key} variant="outlined">
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>{feature.label}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField
                                            fullWidth
                                            label="Título"
                                            value={(t.features as any)[feature.key].title}
                                            onChange={(e) => updateFeature(feature.key as any, 'title', e.target.value)}
                                            margin="dense"
                                        />
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Descripción"
                                            value={(t.features as any)[feature.key].description}
                                            onChange={(e) => updateFeature(feature.key as any, 'description', e.target.value)}
                                            margin="dense"
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Paper>

                        {/* Botones de acción en Cómo Funciona (por idioma) */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Botones de Acción — Cómo Funciona [{currentLang.toUpperCase()}]</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box display="flex" gap={2} flexWrap="wrap">
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Botón Primario"
                                    value={t.ctaPrimary}
                                    onChange={(e) => updateTranslation('ctaPrimary', e.target.value)}
                                    helperText="Texto del botón principal en la sección Cómo Funciona"
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Botón Secundario"
                                    value={t.ctaSecondary}
                                    onChange={(e) => updateTranslation('ctaSecondary', e.target.value)}
                                    helperText="Texto del botón secundario en la sección Cómo Funciona"
                                />
                            </Box>
                        </Paper>

                        <Box mt={3} mb={10}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                size="large"
                                onClick={handleSaveTheme}
                                disabled={saving}
                                fullWidth
                            >
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Columna 3: Icono Principal y Logo del Navbar */}
                    <Grid item xs={12} md={4} sx={{ order: 3 }}>
                        {/* Hero Icon Upload */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Icono Principal</Typography>
                                <Button component="label" size="small" startIcon={<CloudUploadIcon />}>
                                    Cambiar
                                    <input type="file" hidden accept="image/*" onChange={handleIconUpload} />
                                </Button>
                            </Box>
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: '#333',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                {previewIcon && previewIcon !== '/imagotipo.png' ? (
                                    <img
                                        src={previewIcon}
                                        alt="Hero Icon"
                                        style={{ height: '80px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <RedThreadLogo
                                        className="rt-hero-logo"
                                        variant="mark"
                                        aria-label="Red Thread (RETH)"
                                        style={{ height: 80, width: 'auto', maxWidth: '100%' }}
                                    />
                                )}
                            </Box>
                        </Paper>

                        {/* Imagotipo Navbar (Horizontal) — similar a Icono Principal pero debajo */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Logo del Navbar (isotipo por defecto)</Typography>
                                <Box display="flex" gap={1}>
                                    {previewNavLogo && previewNavLogo !== '/img/assets/isotipo.png' && (
                                        <Button size="small" color="inherit" onClick={handleDeleteNavLogo} disabled={loading}>
                                            Restablecer
                                        </Button>
                                    )}
                                    <Button component="label" size="small" startIcon={<CloudUploadIcon />}>
                                        Cambiar
                                        <input type="file" hidden accept="image/*" onChange={handleNavLogoUpload} />
                                    </Button>
                                </Box>
                            </Box>
                            <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
                                Por defecto se usa el isotipo <strong>/img/assets/isotipo.png</strong> (cuadrado). Si subes uno propio, horizontal recomendado: <strong>~600×160px, PNG/WebP transparente</strong>, se muestra a <strong>28px de alto</strong> en el navbar.
                            </Alert>
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '1px solid #e0e0e0',
                                    minHeight: 72,
                                }}
                            >
                                <img
                                    src={previewNavLogo || '/img/assets/isotipo.png'}
                                    alt="Navbar imagotipo"
                                    style={{ height: '28px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/img/assets/isotipo.png'; }}
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                URL actual: <Box component="span" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{previewNavLogo || '/img/assets/isotipo.png'}</Box>
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Columna 1: Fondo de Portada */}
                    <Grid item xs={12} md={4} sx={{ order: 1 }}>

                        {/* Hero Banner Upload — con resolución por pantalla */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                                <Typography variant="h6">Fondo de Portada ({bannerResources.length}/10)</Typography>
                                <Button component="label" size="small" startIcon={<CloudUploadIcon />} disabled={bannerResources.length >= 10}>
                                    Agregar
                                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                                </Button>
                            </Box>
                            <Tooltip
                                title="La vista previa se adapta al ancho real del dispositivo de esta resolución (breakpoints del landing). La próxima subida usará este tamaño."
                                arrow
                                placement="top"
                            >
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Resolución destino / Vista previa"
                                    value={pendingResolution}
                                    onChange={(e) => {
                                        const res = e.target.value;
                                        setPendingResolution(res);
                                        const idx = findPreviewIndexForResolution(bannerResources, res);
                                        if (idx >= 0) {
                                            setPreviewIndex(idx);
                                            setIsRotating(false); // pausa rotación al cambiar combolist
                                        } else {
                                            setPreviewIndex(0);
                                            setIsRotating(false);
                                        }
                                        setPreviewDevice(resolutionToDevice(res));
                                        const meta = BANNER_RESOLUTIONS.find(r => r.value === res);
                                        if (meta) setResolutionAlert(`Vista previa actualizada a ${meta.label} (${meta.hint})`);
                                    }}
                                    helperText={BANNER_RESOLUTIONS.find(r => r.value === pendingResolution)?.hint}
                                    sx={{ mb: 2 }}
                                >
                                    {BANNER_RESOLUTIONS.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label} — {r.hint}</MenuItem>
                                    ))}
                                </TextField>
                            </Tooltip>
                            {resolutionAlert && (
                                <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setResolutionAlert(null)}>
                                    {resolutionAlert}
                                </Alert>
                            )}
                            <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
                                Sube una imagen por resolución: el landing elegirá automáticamente la más adecuada según el ancho del dispositivo (mobile/tablet/desktop/xl/smart). Usa <strong>Todas</strong> como fallback único si solo quieres una imagen. Cambiar la resolución actualiza la vista previa (pausa la rotación); haz clic en una miniatura para reanudarla.
                            </Alert>

                            {/* Gallery of Active Banners — con badge resolución */}
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                {bannerResources.map((banner, index) => {
                                    const res = (banner.metadata?.resolution || (banner.metadata?.isMobile ? 'mobile' : 'all')) as string;
                                    const label = BANNER_RESOLUTIONS.find(r => r.value === res)?.label || res;
                                    const audit = [
                                        banner.metadata?.originalName || banner.url,
                                        banner.metadata?.uploadedBy ? `por ${banner.metadata.uploadedBy}` : null,
                                        banner.metadata?.uploadedAt
                                            ? new Date(banner.metadata.uploadedAt).toLocaleString()
                                            : (banner.created_at ? new Date(banner.created_at).toLocaleString() : null),
                                    ].filter(Boolean).join(' · ');
                                    return (
                                        <Box
                                            key={banner._id}
                                            sx={{
                                                position: 'relative',
                                                width: 92,
                                                height: 64,
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                                border: index === previewIndex ? '2px solid #FF6B6B' : '1px solid #ddd',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                                '&:hover': {
                                                    border: index === previewIndex ? '2px solid #FF6B6B' : '2px solid #E63946',
                                                    boxShadow: '0 0 0 2px rgba(230,57,70,0.3)'
                                                }
                                            }}
                                            onClick={() => {
                                                setPreviewIndex(index);
                                                setIsRotating(true); // clic en miniatura reanuda rotación cada 3s
                                            }}
                                            title={audit}
                                        >
                                            <img
                                                src={getMediaUrl(banner.url)}
                                                alt={`banner ${label}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: thumbLoading[banner._id!] ? 0 : 1, transition: 'opacity 0.25s ease' }}
                                                onLoad={() => setThumbLoading(prev => ({ ...prev, [banner._id!]: false }))}
                                            />
                                            {thumbLoading[banner._id!] && (
                                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.12)' }}>
                                                    <CircularProgress size={18} sx={{ color: '#E63946' }} />
                                                </Box>
                                            )}
                                            {index === previewIndex && (
                                                <Box
                                                    aria-label="Vista previa activa"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        bgcolor: '#E63946',
                                                        borderRadius: '0 0 4px 0',
                                                        display: 'flex',
                                                        p: 0.35
                                                    }}
                                                >
                                                    <CheckIcon sx={{ fontSize: 12, color: 'white' }} />
                                                </Box>
                                            )}
                                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '0.6rem', textAlign: 'center', py: 0.2, lineHeight: 1 }}>{label}</Box>
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    bgcolor: 'rgba(0,0,0,0.6)',
                                                    borderRadius: '0 0 0 4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    p: 0.5
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBanner(banner._id!);
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 14, color: 'white' }} />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>

                            <Box
                                sx={{
                                    height: '150px',
                                    bgcolor: '#eee',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {previewBanner ? (
                                    <>
                                        <Box
                                            key={previewBanner}
                                            aria-hidden
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                backgroundImage: `url(${previewBanner})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                animation: 'rethBannerFade 0.4s ease',
                                                '@keyframes rethBannerFade': {
                                                    from: { opacity: 0 },
                                                    to: { opacity: 1 }
                                                }
                                            }}
                                        />
                                        {previewImgLoading && (
                                            <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.35)' }}>
                                                <CircularProgress size={28} sx={{ color: '#E63946' }} />
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    <Typography color="text.secondary" sx={{ position: 'relative', zIndex: 1 }}>
                                        {bannerResources.length === 0 ? 'Usando Gradiente' : 'Sin banner para esta resolución'}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        {/* Gradientes del Tema */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Gradientes del Tema</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="caption" fontWeight="bold">Gradientes del Tema</Typography>
                                <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveGradient}>
                                    Guardar Gradiente
                                </Button>
                            </Box>

                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={6}>
                                    <Typography variant="caption">Inicio (Start)</Typography>
                                    <input
                                        type="color"
                                        value={config.gradientStart}
                                        onChange={(e) => setConfig({ ...config, gradientStart: e.target.value })}
                                        style={{ display: 'block', width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', padding: '2px' }}
                                    />
                                    <Box mt={0.5}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>{config.gradientStart}</Typography>
                                        <Typography variant="caption" color="text.secondary">{hexToRgb(config.gradientStart)}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption">Fin (End)</Typography>
                                    <input
                                        type="color"
                                        value={config.gradientEnd}
                                        onChange={(e) => setConfig({ ...config, gradientEnd: e.target.value })}
                                        style={{ display: 'block', width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', padding: '2px' }}
                                    />
                                    <Box mt={0.5}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>{config.gradientEnd}</Typography>
                                        <Typography variant="caption" color="text.secondary">{hexToRgb(config.gradientEnd)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Preset Backgrounds */}
                            <Box mt={3}>
                                <Typography variant="caption" color="text.secondary" mb={1} display="block">Fondos predefinidos:</Typography>
                                <Grid container spacing={1}>
                                    {PRESET_GRADIENTS.map((preset) => {
                                        const isActive = config.gradientStart === preset.start && config.gradientEnd === preset.end;
                                        return (
                                            <Grid item xs={6} key={preset.id}>
                                                <Paper
                                                    onClick={() => handleApplyPreset(preset)}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        border: isActive ? '2px solid #2563EB' : '1px solid #ddd',
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 1,
                                                            flexShrink: 0,
                                                            background: `linear-gradient(135deg, ${preset.start} 0%, ${preset.end} 100%)`,
                                                            border: '1px solid #ddd'
                                                        }}
                                                    />
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" fontWeight="bold" display="block" noWrap>
                                                            {preset.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }} noWrap>
                                                            {preset.start} → {preset.end}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>

                            {/* Saved Gradients List */}
                            {config.savedGradients && config.savedGradients.length > 0 && (
                                <Box mt={3}>
                                    <Typography variant="caption" color="text.secondary" mb={1} display="block">Guardados:</Typography>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {config.savedGradients.map((g) => (
                                            <Box
                                                key={g.id}
                                                onClick={() => handleApplyGradient(g)}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${g.start} 0%, ${g.end} 100%)`,
                                                    cursor: 'pointer',
                                                    border: config.gradientStart === g.start && config.gradientEnd === g.end ? '2px solid black' : '1px solid #ddd',
                                                    position: 'relative',
                                                    '&:hover .delete-btn': { display: 'flex' }
                                                }}
                                                title={`${g.name}: ${g.start} -> ${g.end}`}
                                            >
                                                <Box
                                                    className="delete-btn"
                                                    component="div"
                                                    onClick={(e) => handleDeleteGradient(g.id, e)}
                                                    sx={{
                                                        display: 'none',
                                                        position: 'absolute',
                                                        top: -5,
                                                        right: -5,
                                                        width: 16,
                                                        height: 16,
                                                        bgcolor: 'red',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        fontSize: '10px',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    x
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Vista Previa en vivo — ancho completo, arriba */}
                    <Grid item xs={12} sx={{ order: 0 }}>
                        {/* Live Preview Mockup */}
                        <Paper sx={{ p: 0, overflow: 'hidden' }}>
                            <Box sx={{ p: 1.5, bgcolor: '#222', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <PreviewIcon fontSize="small" /> Vista Previa: {currentLang.toUpperCase()}
                                    {(() => {
                                        const activeRes = bannerResources[previewIndex]
                                            ? getBannerResolution(bannerResources[previewIndex])
                                            : pendingResolution;
                                        const meta = BANNER_RESOLUTIONS.find(r => r.value === activeRes);
                                        const resLabel = meta?.label.replace(/\s*\(.*\)/, '') || activeRes.toUpperCase();
                                        const dims = meta?.dims || '';
                                        return (
                                            <Box component="span" sx={{ ml: 1, fontSize: '0.65rem', fontWeight: 700, px: 0.8, py: 0.2, borderRadius: 999, bgcolor: 'rgba(230,57,70,0.22)', border: '1px solid rgba(230,57,70,0.4)', color: '#FF6B6B', whiteSpace: 'nowrap' }}>
                                                {resLabel}{dims ? ` · ${dims}` : ''}
                                            </Box>
                                        );
                                    })()}
                                    {isRotating ? (
                                        <Button
                                            size="small"
                                            onClick={() => setIsRotating(false)}
                                            aria-label="Pausar rotación"
                                            sx={{ ml: 1, fontSize: '0.6rem', fontWeight: 700, px: 0.7, py: 0.2, borderRadius: 999, bgcolor: 'rgba(46,139,87,0.25)', border: '1px solid rgba(46,139,87,0.45)', color: '#4ade80', whiteSpace: 'nowrap', '&:hover': { bgcolor: 'rgba(46,139,87,0.4)' } }}
                                        >
                                            ⏸ Pausar rotación
                                        </Button>
                                    ) : (
                                        <Button
                                            size="small"
                                            onClick={() => { setIsRotating(true); }}
                                            disabled={bannerResources.length === 0}
                                            aria-label="Reanudar rotación"
                                            sx={{ ml: 1, fontSize: '0.6rem', fontWeight: 700, px: 0.7, py: 0.2, borderRadius: 999, bgcolor: 'rgba(230,57,70,0.22)', border: '1px solid rgba(230,57,70,0.4)', color: '#FF6B6B', whiteSpace: 'nowrap', '&:hover': { bgcolor: 'rgba(230,57,70,0.4)' } }}
                                        >
                                            ▶ Reanudar rotación
                                        </Button>
                                    )}
                                    {!isRotating && pendingResolution && bannerResources.length > 0 && findPreviewIndexForResolution(bannerResources, pendingResolution) < 0 && (
                                        <Box component="span" sx={{ ml: 1, fontSize: '0.6rem', fontWeight: 700, px: 0.6, py: 0.2, borderRadius: 999, bgcolor: 'rgba(230,57,70,0.25)', border: '1px solid rgba(230,57,70,0.45)', color: '#FF6B6B', whiteSpace: 'nowrap' }}>
                                            ⏸ Sin banner para esta resolución
                                        </Box>
                                    )}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <ToggleButtonGroup
                                        exclusive
                                        size="small"
                                        value={previewDevice}
                                        onChange={(_, v) => { if (v) setPreviewDevice(v as PreviewDevice); }}
                                        aria-label="Mockup de dispositivo"
                                        sx={{
                                            '& .MuiToggleButton-root': {
                                                color: 'rgba(255,255,255,0.7)',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                py: 0.25,
                                                px: 0.8,
                                                fontSize: '0.65rem',
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(230,57,70,0.35)',
                                                    color: 'white',
                                                    border: '1px solid rgba(230,57,70,0.55)'
                                                }
                                            }
                                        }}
                                    >
                                        <ToggleButton value="mobile" title={DEVICE_FRAME.mobile.label}><PhoneIphoneIcon sx={{ fontSize: 14 }} /></ToggleButton>
                                        <ToggleButton value="tablet" title={DEVICE_FRAME.tablet.label}><TabletMacIcon sx={{ fontSize: 14 }} /></ToggleButton>
                                        <ToggleButton value="desktop" title={DEVICE_FRAME.desktop.label}><DesktopWindowsIcon sx={{ fontSize: 14 }} /></ToggleButton>
                                    </ToggleButtonGroup>
                                    <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>{bannerResources.length} fondos · por resolución</Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ display: 'block', px: 1.5, pt: 0.5, pb: 0.75, color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
                                Marco: {DEVICE_FRAME[previewDevice].label} — se sincroniza con el combolist de resolución
                            </Typography>

                            {/* Mockup Container — ancho proporcional al breakpoint + replica fiel del landing */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    px: 1.5,
                                    pb: 1.5,
                                    bgcolor: '#111'
                                }}
                            >
                                <Box
                                    ref={previewBoxRef}
                                    sx={{
                                        width: DEVICE_FRAME[previewDevice].width,
                                        maxWidth: '100%',
                                        height: `${DEVICE_FRAME[previewDevice].height}px`,
                                        borderRadius: `${DEVICE_FRAME[previewDevice].radius}px`,
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        textAlign: 'center',
                                        color: 'white',
                                        background: `linear-gradient(135deg, ${config.gradientStart} 0%, ${config.gradientEnd} 100%)`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        transition: 'width 0.25s ease, border-radius 0.25s ease'
                                    }}
                                >
                                    {previewBanner && (
                                        <Box
                                            key={previewBanner}
                                            aria-hidden
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: `linear-gradient(rgba(35, 8, 20, 0.55), rgba(35, 8, 20, 0.68)), url(${previewBanner})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                animation: 'rethBannerFade 0.45s ease',
                                                '@keyframes rethBannerFade': {
                                                    from: { opacity: 0 },
                                                    to: { opacity: 1 }
                                                },
                                                zIndex: 0
                                            }}
                                        />
                                    )}
                                    {previewBanner && previewImgLoading && (
                                        <Box sx={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)' }}>
                                            <CircularProgress size={32} sx={{ color: '#FF6B6B' }} />
                                        </Box>
                                    )}
                                    {/* Scalable wrapper: mide el alto natural y lo reduce para que entre sin scroll */}
                                    <Box
                                        sx={{
                                            height: `${scaledPreviewHeight}px`,
                                            transform: `scale(${previewScale})`,
                                            transformOrigin: 'top center',
                                            position: 'relative',
                                            zIndex: 1,
                                            willChange: 'transform'
                                        }}
                                    >
                                        <Box ref={previewContentRef}>
                                            {/* Mock Navbar — replica LandingNavbar actual con imagotipo horizontal */}
                                            <Box sx={{ position: 'relative', zIndex: 3, mx: 1.2, mt: 1, display: 'flex', alignItems: 'center', gap: 0.75, p: 0.6, px: 1, borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
                                                <Box component="img" src={previewNavLogo || '/img/assets/isotipo.png'} alt="RETH" sx={{ height: 14, width: 'auto', maxWidth: 72, objectFit: 'contain', display: 'block' }} />
                                                <Box sx={{ display: 'flex', gap: 0.4, flex: 1, justifyContent: 'center', opacity: 0.85 }}>
                                                    <Box sx={{ width: 18, height: 6, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.75)' }} />
                                                    <Box sx={{ width: 18, height: 6, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.45)' }} />
                                                    <Box sx={{ width: 18, height: 6, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.45)', display: { xs: 'none', sm: 'block' } }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Box sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'white', bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, px: 0.7, py: 0.3 }}>{currentLang.toUpperCase()}</Box>
                                                    <Box sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'white', bgcolor: '#E63946', borderRadius: 999, px: 0.8, py: 0.3, display: { xs: 'none', sm: 'block' } }}>Crear</Box>
                                                </Box>
                                            </Box>
                                            {/* Glow blobs decorativos */}
                                            <Box
                                                aria-hidden
                                                sx={{
                                                    position: 'absolute',
                                                    top: -120,
                                                    right: -80,
                                                    width: { xs: 220, md: 340 },
                                                    height: { xs: 220, md: 340 },
                                                    borderRadius: '50%',
                                                    background: 'radial-gradient(circle, rgba(251,113,133,0.5) 0%, rgba(213,63,140,0) 70%)',
                                                    filter: 'blur(70px)',
                                                    pointerEvents: 'none',
                                                    zIndex: 0
                                                }}
                                            />
                                            <Box
                                                aria-hidden
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: -100,
                                                    left: -90,
                                                    width: { xs: 200, md: 300 },
                                                    height: { xs: 200, md: 300 },
                                                    borderRadius: '50%',
                                                    background: 'radial-gradient(circle, rgba(255,177,153,0.4) 0%, rgba(255,177,153,0) 70%)',
                                                    filter: 'blur(80px)',
                                                    pointerEvents: 'none',
                                                    zIndex: 0
                                                }}
                                            />

                                            {/* Mockup Hero */}
                                            <Box sx={{ position: 'relative', zIndex: 1, pt: { xs: 5, md: 7 }, pb: { xs: 4, md: 5 }, px: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, minHeight: 100 }}>
                                                    {previewIcon && previewIcon !== '/imagotipo.png' ? (
                                                        <img
                                                            alt="Hero Icon"
                                                            src={previewIcon}
                                                            style={{ height: '90px', width: 'auto', objectFit: 'contain', maxWidth: '100%' }}
                                                        />
                                                    ) : (
                                                        <RedThreadLogo
                                                            className="rt-hero-logo"
                                                            variant="mark"
                                                            aria-label="Red Thread (RETH)"
                                                            style={{ height: 90, width: 'auto', maxWidth: '100%' }}
                                                        />
                                                    )}
                                                </Box>
                                                <Box
                                                    sx={{
                                                        fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont),
                                                        fontWeight: 600,
                                                        letterSpacing: '0.02em',
                                                        lineHeight: 1.35,
                                                        mb: 2,
                                                        fontSize: `${Math.max(Number(config.subtitleFontSize) || 5, 4.6)}rem`,
                                                        color: config.subtitleColor,
                                                        opacity: 0.98,
                                                        textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                                                        textAlign: 'center',
                                                        overflowWrap: 'break-word',
                                                        textWrap: 'balance',
                                                    }}
                                                >
                                                    {t.subtitle}
                                                </Box>
                                                <Box
                                                    sx={{
                                                        fontFamily: getBodyFontFamily(config.descriptionFont || config.bodyFont || DEFAULT_THEME.descriptionFont),
                                                        fontSize: `${Number(config.descriptionFontSize) || 1.15}rem`,
                                                        lineHeight: 1.7,
                                                        mb: 3,
                                                        maxWidth: '360px',
                                                        mx: 'auto',
                                                        opacity: 0.95,
                                                        textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                                                        overflowWrap: 'break-word',
                                                        textWrap: 'balance',
                                                    }}
                                                >
                                                    {t.description}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            bgcolor: 'rgba(255,255,255,0.16)',
                                                            backdropFilter: 'blur(18px)',
                                                            WebkitBackdropFilter: 'blur(18px)',
                                                            color: 'white',
                                                            border: '1px solid rgba(255,255,255,0.55)',
                                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 14px 34px rgba(88, 8, 34, 0.38), 0 4px 10px rgba(0,0,0,0.22)',
                                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.26)' },
                                                            px: 3,
                                                            py: 1,
                                                            fontSize: '0.7rem'
                                                        }}
                                                    >
                                                        {t.ctaPrimary}
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            borderColor: 'rgba(255,255,255,0.6)',
                                                            color: 'white',
                                                            bgcolor: 'rgba(255,255,255,0.10)',
                                                            backdropFilter: 'blur(18px)',
                                                            WebkitBackdropFilter: 'blur(18px)',
                                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px rgba(0,0,0,0.16)',
                                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.95)' },
                                                            px: 3,
                                                            py: 1,
                                                            fontSize: '0.7rem'
                                                        }}
                                                    >
                                                        {t.ctaSecondary}
                                                    </Button>
                                                </Box>
                                            </Box>

                                            {/* Mockup Features */}
                                            <Box sx={{ position: 'relative', zIndex: 1, pb: { xs: 4, md: 5 }, px: 3 }}>
                                                <Box
                                                    sx={{
                                                        fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont),
                                                        fontSize: '1.4rem',
                                                        textAlign: 'center',
                                                        color: 'white',
                                                        letterSpacing: '0.01em',
                                                        mb: 2.5,
                                                        fontWeight: 700,
                                                        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                    }}
                                                >
                                                    {t.howItWorksTitle}
                                                </Box>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                            <FavoriteIcon sx={{ fontSize: 32, color: '#3B82F6', mb: 0.5 }} />
                                                            <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                                {t.features.smartMatching.title}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                            <ChatIcon sx={{ fontSize: 32, color: '#8B5CF6', mb: 0.5 }} />
                                                            <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                                {t.features.realTimeChat.title}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                            <RadarIcon sx={{ fontSize: 32, color: '#F59E0B', mb: 0.5 }} />
                                                            <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                                {t.features.proximityRadar.title}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', boxShadow: '0 18px 40px rgba(88, 8, 34, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                                                            <GroupsIcon sx={{ fontSize: 32, color: '#E63946', mb: 0.5 }} />
                                                            <Box sx={{ fontFamily: getTitleFontFamily(config.titleFont || DEFAULT_THEME.titleFont), fontWeight: 600, fontSize: '0.85rem', color: '#3B1C2A' }}>
                                                                {t.features.multipleIntentions.title}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                            </Box>

                                            {/* Mockup Footer — replica LandingFooter (barra + 4 columnas + copyright) */}
                                            <Box
                                                component="footer"
                                                sx={{
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    mt: 2,
                                                    borderTop: '1px solid rgba(255,255,255,0.12)',
                                                    bgcolor: 'rgba(10,10,12,0.72)',
                                                    backdropFilter: 'blur(14px)',
                                                    WebkitBackdropFilter: 'blur(14px)',
                                                    color: 'rgba(255,255,255,0.85)',
                                                    textAlign: 'left',
                                                    overflow: 'hidden',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '38%',
                                                        height: 2,
                                                        background: 'linear-gradient(90deg, transparent, #E63946, transparent)',
                                                        boxShadow: '0 0 12px rgba(230,57,70,0.8)',
                                                    },
                                                }}
                                            >
                                                {/* 1) Barra minimalista */}
                                                <Box sx={{ py: 1.5, px: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <Box component="img" src="/img/assets/isotipo.png" alt="RETH" sx={{ height: 12, width: 12, objectFit: 'contain', opacity: 0.9 }} />
                                                        <Box sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.9)' }}>RETH © 2026</Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1.5, fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)' }}>
                                                        <Box component="span">{FOOTER_MINI_LEGAL[currentLang as Language]?.privacy ?? FOOTER_MINI_LEGAL.en.privacy}</Box>
                                                        <Box component="span">{FOOTER_MINI_LEGAL[currentLang as Language]?.terms ?? FOOTER_MINI_LEGAL.en.terms}</Box>
                                                        <Box component="span">{FOOTER_MINI_LEGAL[currentLang as Language]?.contact ?? FOOTER_MINI_LEGAL.en.contact}</Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {['X', 'IG', 'TT', '@'].map((s) => (
                                                            <Box key={s} sx={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{s}</Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                                {/* 2) Cuatro columnas */}
                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, px: 2, py: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <Box>
                                                        <Box sx={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.92)', mb: 0.5 }}>RETH</Box>
                                                        <Box sx={{ width: 24, height: 1.5, mb: 0.75, background: 'linear-gradient(90deg, #E63946, transparent)' }} />
                                                        <Box sx={{ fontSize: '0.55rem', fontStyle: 'italic', lineHeight: 1.5, color: 'rgba(255,255,255,0.65)' }}>
                                                            {(t.footerTagline || '').trim() || FOOTER_TAGLINES_DEFAULT[currentLang as Language] || FOOTER_TAGLINES_DEFAULT.en}
                                                        </Box>
                                                    </Box>
                                                    {([
                                                        { header: FOOTER_HEADERS[currentLang]?.legal ?? 'LEGAL', links: [FOOTER_LINK_LABELS[currentLang]?.privacy, FOOTER_LINK_LABELS[currentLang]?.terms, FOOTER_LINK_LABELS[currentLang]?.security] },
                                                        { header: FOOTER_HEADERS[currentLang]?.help ?? 'HELP', links: [FOOTER_LINK_LABELS[currentLang]?.community, FOOTER_LINK_LABELS[currentLang]?.faq, FOOTER_LINK_LABELS[currentLang]?.contact, FOOTER_LINK_LABELS[currentLang]?.support] },
                                                        { header: FOOTER_HEADERS[currentLang]?.company ?? 'COMPANY', links: [FOOTER_LINK_LABELS[currentLang]?.about, FOOTER_LINK_LABELS[currentLang]?.careers, FOOTER_LINK_LABELS[currentLang]?.press] },
                                                    ] as Array<{ header: string; links: Array<string | undefined> }>).map((col) => (
                                                        <Box key={col.header}>
                                                            <Box sx={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.92)', mb: 0.5 }}>{col.header}</Box>
                                                            <Box sx={{ width: 24, height: 1.5, mb: 0.75, background: 'linear-gradient(90deg, #E63946, transparent)' }} />
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                                                {col.links.filter(Boolean).map((label) => (
                                                                    <Box key={label} sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.72)', textDecoration: 'none' }}>{label}</Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                                {/* 3) Copyright */}
                                                <Box sx={{ py: 1.5, px: 2, textAlign: 'center', fontFamily: getBodyFontFamily(config.bodyFont || DEFAULT_THEME.bodyFont), fontSize: '0.6rem', letterSpacing: '0.04em', color: 'white', opacity: 0.85 }}>
                                                    <FooterCopyrightText text={t.footerText} fontSize="1.15em" />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </AdminLayout>
    );
}
