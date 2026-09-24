import { supportedLanguages } from '../../../config/languages';

export type Language = (typeof supportedLanguages)[number]['code'];

export const LANGUAGES = supportedLanguages.map((l) => l.code);

export const NAV_ITEM_DEFAULT_ICON = 'Menu';

export interface NavSection {
  id: string;
  key: string;
  route: string;
  icon: string;
  visible: boolean;
  locked: boolean;
  order: number;
  translations: Record<Language, string>;
}

export interface NavSectionFormData {
  key: string;
  route: string;
  icon: string;
  visible: boolean;
  locked: boolean;
  translations: Record<Language, string>;
}

export const ICON_OPTIONS = [
  { value: 'Home', label: 'Inicio' },
  { value: 'Event', label: 'Evento' },
  { value: 'Security', label: 'Seguridad' },
  { value: 'SupportAgent', label: 'Soporte' },
  { value: 'Download', label: 'Descarga' },
  { value: 'Person', label: 'Perfil' },
  { value: 'Settings', label: 'Configuración' },
  { value: 'Menu', label: 'Menú' },
  { value: 'Explore', label: 'Explorar' },
  { value: 'Favorite', label: 'Favoritos' },
  { value: 'Chat', label: 'Chat' },
  { value: 'Notifications', label: 'Notificaciones' },
];

export const DEFAULT_SECTIONS: Omit<NavSection, 'id'>[] = [
  {
    key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0,
    translations: { en: 'Home', es: 'Inicio', pt: 'Início', fr: 'Accueil', de: 'Startseite', it: 'Home', ru: 'Главная', sv: 'Hem', nl: 'Start', zh: '首页', hi: 'होम', bn: 'হোম', ja: 'ホーム', ko: '홈', ar: 'الرئيسية', sw: 'Nyumbani', ha: 'Gida', am: 'መጀመሪያ', tl: 'Home', ms: 'Laman Utama', mi: 'Kāinga' },
  },
  {
    key: 'product', route: '#producto', icon: 'Explore', visible: true, locked: false, order: 1,
    translations: { en: 'Product', es: 'Producto', pt: 'Produto', fr: 'Produit', de: 'Produkt', it: 'Prodotto', ru: 'Продукт', sv: 'Produkt', nl: 'Product', zh: '产品', hi: 'उत्पाद', bn: 'পণ্য', ja: '商品', ko: '제품', ar: 'المنتج', sw: 'Bidhaa', ha: 'Kayayyaki', am: 'ምርት', tl: 'Produkto', ms: 'Produk', mi: 'Huaonga' },
  },
  {
    key: 'plans', route: '#planes', icon: 'Settings', visible: true, locked: false, order: 2,
    translations: { en: 'Plans', es: 'Planes', pt: 'Planos', fr: 'Forfaits', de: 'Pläne', it: 'Piani', ru: 'Тарифы', sv: 'Planer', nl: 'Plannen', zh: '套餐', hi: 'प्लान', bn: 'প্ল্যান', ja: 'プラン', ko: '플랜', ar: 'الخطط', sw: 'Mipango', ha: 'Shirye-shirye', am: 'ዕቅድ', tl: 'Mga Plano', ms: 'Pelan', mi: 'Pānenga' },
  },
  {
    key: 'security', route: '#seguridad', icon: 'Security', visible: true, locked: false, order: 3,
    translations: { en: 'Safety', es: 'Seguridad', pt: 'Segurança', fr: 'Sécurité', de: 'Sicherheit', it: 'Sicurezza', ru: 'Безопасность', sv: 'Säkerhet', nl: 'Veiligheid', zh: '安全', hi: 'सुरक्षा', bn: 'নিরাপত্তা', ja: 'セキュリティ', ko: '보안', ar: 'الأمان', sw: 'Usalama', ha: 'Tsaro', am: 'ደህንነት', tl: 'Kaligtasan', ms: 'Keselamatan', mi: 'Haumaru' },
  },
  {
    key: 'support', route: '#soporte', icon: 'SupportAgent', visible: true, locked: false, order: 4,
    translations: { en: 'Support', es: 'Soporte', pt: 'Suporte', fr: 'Support', de: 'Support', it: 'Assistenza', ru: 'Поддержка', sv: 'Support', nl: 'Ondersteuning', zh: '支持', hi: 'सहायतা', bn: 'সহায়তা', ja: 'サポート', ko: '지원', ar: 'الدعم', sw: 'Msaada', ha: 'Tallafi', am: 'ድጋፍ', tl: 'Suporta', ms: 'Sokongan', mi: 'Tautoko' },
  },
  {
    key: 'download', route: '#descarga', icon: 'Download', visible: true, locked: false, order: 5,
    translations: { en: 'Download', es: 'Descarga', pt: 'Download', fr: 'Télécharger', de: 'Herunterladen', it: 'Scarica', ru: 'Скачать', sv: 'Ladda ner', nl: 'Downloaden', zh: '下载', hi: 'डाउनलोड', bn: 'ডাউনলোড', ja: 'ダウンロード', ko: '다운로드', ar: 'تحميل', sw: 'Pakua', ha: 'Sauke', am: 'አውርድ', tl: 'I-download', ms: 'Muat Turun', mi: 'Tāuta' },
  },
];

export const MAX_INPUT_LENGTH = 60;
export const MAX_TRANSLATION_LENGTH = 60;

function firstNonEmpty(translations: Record<Language, string>): string {
  return Object.values(translations).find((v) => (v || '').trim()) || '';
}

export function getTranslationFallback(translations: Record<Language, string>, lang: Language): string {
  const pick = (code: Language): string => {
    const value = translations[code];
    return value && value.trim() ? value : '';
  };
  return pick(lang) || pick('en') || pick('es') || firstNonEmpty(translations);
}

export function getPrimaryLabel(translations: Record<Language, string>, lang: Language): { code: string; label: string } {
  const code = [lang, 'en', 'es', ...LANGUAGES].find((l) => (translations[l as Language] || '').trim());
  const resolved = code as Language | undefined;
  return { code: resolved || 'en', label: resolved ? translations[resolved] : '' };
}

export function completionStatus(translations: Record<Language, string>): { complete: boolean; missing: Language[] } {
  const missing = LANGUAGES.filter((l) => !(translations[l] || '').trim()) as Language[];
  return { complete: missing.length === 0, missing };
}

export function filledTranslations(translations: Record<Language, string>): string {
  return LANGUAGES.filter((l) => (translations[l] || '').trim())
    .map((l) => `${l}: ${translations[l]}`)
    .join(' · ');
}

export const initialNavFormData = (): NavSectionFormData => ({
  key: '',
  route: '',
  icon: NAV_ITEM_DEFAULT_ICON,
  visible: true,
  locked: false,
  translations: LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as Record<Language, string>),
});