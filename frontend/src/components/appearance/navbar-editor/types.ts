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
  { key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: { es: 'Inicio', en: 'Home', pt: 'Início', fr: 'Accueil' } },
  { key: 'product', route: '#producto', icon: 'Explore', visible: true, locked: false, order: 1, translations: { es: 'Producto', en: 'Product', pt: 'Produto', fr: 'Produit' } },
  { key: 'plans', route: '#planes', icon: 'Settings', visible: true, locked: false, order: 2, translations: { es: 'Planes', en: 'Plans', pt: 'Planos', fr: 'Forfaits' } },
  { key: 'security', route: '#seguridad', icon: 'Security', visible: true, locked: false, order: 3, translations: { es: 'Seguridad', en: 'Safety', pt: 'Segurança', fr: 'Sécurité' } },
  { key: 'support', route: '#soporte', icon: 'SupportAgent', visible: true, locked: false, order: 4, translations: { es: 'Soporte', en: 'Support', pt: 'Suporte', fr: 'Support' } },
  { key: 'download', route: '#descarga', icon: 'Download', visible: true, locked: false, order: 5, translations: { es: 'Descarga', en: 'Download', pt: 'Download', fr: 'Télécharger' } },
];

export const MAX_INPUT_LENGTH = 60;
export const MAX_TRANSLATION_LENGTH = 60;

export function getTranslationFallback(translations: Record<Language, string>, lang: Language): string {
  return translations[lang] || translations.es || translations.en || translations[Object.keys(translations)[0]] || '';
}

export function getPrimaryLabel(translations: Record<Language, string>, lang: Language): { code: string; label: string } {
  const code = [lang, 'es', 'en', ...LANGUAGES].find((l) => (translations[l as Language] || '').trim());
  const resolved = code as Language | undefined;
  return { code: resolved || 'es', label: resolved ? translations[resolved] : '' };
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