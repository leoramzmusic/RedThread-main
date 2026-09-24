import {
  normalizeLang,
  resolveInitialLang,
  readStoredLang,
  persistLangLocal,
  LANDING_LANG_STORAGE_KEY,
  PROFILE_LANG_STORAGE_KEY,
} from './landingLanguage';

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
});

describe('normalizeLang', () => {
  it('lowercases and validates against supported codes', () => {
    expect(normalizeLang('JA')).toBe('ja');
    expect(normalizeLang(' es ')).toBe('es');
  });

  it('rejects unsupported or non-string values', () => {
    expect(normalizeLang('xx')).toBeNull();
    expect(normalizeLang(null)).toBeNull();
    expect(normalizeLang(42)).toBeNull();
  });
});

describe('resolveInitialLang', () => {
  it('prefers the profile language over the stored local choice', () => {
    expect(resolveInitialLang({ profileLang: 'ja', storedLang: 'fr' })).toBe('ja');
  });

  it('uses the stored local choice when there is no profile language', () => {
    expect(resolveInitialLang({ storedLang: 'pt' })).toBe('pt');
  });

  it('falls back to English when nothing valid is available', () => {
    expect(resolveInitialLang()).toBe('en');
    expect(resolveInitialLang({ profileLang: 'xx', storedLang: 'nope' })).toBe('en');
  });

  it('normalizes profile language casing', () => {
    expect(resolveInitialLang({ profileLang: 'DE' })).toBe('de');
  });
});

describe('readStoredLang / persistLangLocal', () => {
  it('persists to both storage keys and the NEXT_LOCALE cookie', () => {
    const result = persistLangLocal('ja');
    expect(result).toBe('ja');
    expect(window.localStorage.getItem(LANDING_LANG_STORAGE_KEY)).toBe('ja');
    expect(window.localStorage.getItem(PROFILE_LANG_STORAGE_KEY)).toBe('ja');
    expect(document.cookie).toContain('NEXT_LOCALE=ja');
    expect(readStoredLang()).toBe('ja');
  });

  it('prefers reth-lang over preferred_language on read', () => {
    window.localStorage.setItem(LANDING_LANG_STORAGE_KEY, 'fr');
    window.localStorage.setItem(PROFILE_LANG_STORAGE_KEY, 'de');
    expect(readStoredLang()).toBe('fr');
  });

  it('reads preferred_language when reth-lang is absent or invalid', () => {
    window.localStorage.setItem(PROFILE_LANG_STORAGE_KEY, 'it');
    expect(readStoredLang()).toBe('it');
    window.localStorage.setItem(LANDING_LANG_STORAGE_KEY, 'xx');
    expect(readStoredLang()).toBe('it');
  });

  it('returns null when nothing is stored', () => {
    expect(readStoredLang()).toBeNull();
  });

  it('ignores unsupported languages on persist', () => {
    expect(persistLangLocal('xx')).toBeNull();
    expect(window.localStorage.getItem(LANDING_LANG_STORAGE_KEY)).toBeNull();
  });
});
