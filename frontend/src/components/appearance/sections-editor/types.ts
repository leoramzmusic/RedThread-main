import { AppearanceType, Platform, type AppearanceResource } from '../../../types/appearance';
import { getTranslationFallback, type Language } from '../navbar-editor/types';

export type SectionContentType = 'image' | 'article' | 'text' | 'video';

export const SECTION_CONTENT_TYPES: ReadonlyArray<{ value: SectionContentType; label: string }> = [
  { value: 'image', label: 'Imagen' },
  { value: 'article', label: 'Artículo' },
  { value: 'text', label: 'Bloque de texto' },
  { value: 'video', label: 'Video' },
];

export const SECTION_MAX_TITLE_LENGTH = 80;

export interface LandingSection {
  id: string;
  order: number;
  contentType: SectionContentType;
  visible: boolean;
  translations: Record<string, string>;
}

export function mapResourceToSection(r: AppearanceResource): LandingSection {
  const m = r.metadata ?? {};
  const known = SECTION_CONTENT_TYPES.some((c) => c.value === m.contentType);
  return {
    id: r._id ?? '',
    order: typeof m.order === 'number' ? m.order : 0,
    contentType: known ? (m.contentType as SectionContentType) : 'text',
    visible: m.visible !== false,
    translations: (m.translations as Record<string, string>) ?? {},
  };
}

export function mapSectionToResource(section: Omit<LandingSection, 'id'>): Omit<AppearanceResource, '_id'> {
  return {
    type: AppearanceType.LANDING_SECTIONS,
    platform: Platform.WEB,
    url: '',
    is_active: true,
    metadata: {
      order: section.order,
      contentType: section.contentType,
      visible: section.visible,
      translations: section.translations,
    },
  };
}

export function getSectionTitle(section: LandingSection, lang: Language): string {
  return getTranslationFallback(section.translations as Record<Language, string>, lang);
}
