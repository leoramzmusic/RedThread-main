import {
  getTranslationFallback,
  getPrimaryLabel,
  DEFAULT_SECTIONS,
  LANGUAGES,
  NavSection,
} from './types';
import { supportedLanguages } from '../../../config/languages';

type T = NavSection['translations'];

describe('getTranslationFallback', () => {
  it('returns the translation for the requested language', () => {
    const t = { en: 'Home', es: 'Inicio', ja: 'ホーム' } as T;
    expect(getTranslationFallback(t, 'ja')).toBe('ホーム');
  });

  it('falls back to English when the requested language is missing', () => {
    const t = { en: 'Home', es: 'Inicio' } as T;
    expect(getTranslationFallback(t, 'de')).toBe('Home');
  });

  it('falls back to es only when English is missing', () => {
    const t = { es: 'Inicio' } as T;
    expect(getTranslationFallback(t, 'de')).toBe('Inicio');
  });

  it('falls back to the first non-empty value when en and es are missing', () => {
    const t = { fr: 'Accueil' } as T;
    expect(getTranslationFallback(t, 'de')).toBe('Accueil');
  });

  it('returns an empty string when there are no translations at all', () => {
    const t = {} as T;
    expect(getTranslationFallback(t, 'de')).toBe('');
  });

  it('treats blank values as missing', () => {
    const t = { de: '   ', en: 'Home' } as T;
    expect(getTranslationFallback(t, 'de')).toBe('Home');
  });
});

describe('getPrimaryLabel', () => {
  it('uses the current language when present', () => {
    const t = { en: 'Home', es: 'Inicio', de: 'Startseite' } as T;
    const { code, label } = getPrimaryLabel(t, 'de');
    expect(code).toBe('de');
    expect(label).toBe('Startseite');
  });

  it('prefers English over es when the current language is missing', () => {
    const t = { en: 'Home', es: 'Inicio' } as T;
    const { code, label } = getPrimaryLabel(t, 'ja');
    expect(code).toBe('en');
    expect(label).toBe('Home');
  });

  it('falls back to es when English is missing', () => {
    const t = { es: 'Inicio' } as T;
    const { code, label } = getPrimaryLabel(t, 'ja');
    expect(code).toBe('es');
    expect(label).toBe('Inicio');
  });
});

describe('DEFAULT_SECTIONS', () => {
  it('has one entry per supported language code', () => {
    expect(LANGUAGES).toHaveLength(supportedLanguages.length);
    expect(LANGUAGES).toEqual(supportedLanguages.map((l) => l.code));
  });

  it('translates every section into every supported language', () => {
    for (const section of DEFAULT_SECTIONS) {
      for (const lang of LANGUAGES) {
        expect(section.translations[lang]?.trim()).toBeTruthy();
      }
    }
  });

  it('has unique keys and sequential orders', () => {
    const keys = DEFAULT_SECTIONS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(DEFAULT_SECTIONS.map((s) => s.order)).toEqual(
      Array.from({ length: DEFAULT_SECTIONS.length }, (_, i) => i)
    );
  });
});
