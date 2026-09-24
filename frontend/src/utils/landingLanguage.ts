import { supportedLanguages } from '../config/languages';

export const LANDING_LANG_STORAGE_KEY = 'reth-lang';
export const PROFILE_LANG_STORAGE_KEY = 'preferred_language';

const supportedCodes = new Set(supportedLanguages.map((l) => l.code));

export function normalizeLang(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  return supportedCodes.has(code) ? code : null;
}

/**
 * Language for the public landing, in priority order:
 * profile preference (authenticated, cross-device) > local choice > English.
 * There is no browser auto-detection: the global default is English.
 */
export function resolveInitialLang(
  opts: { profileLang?: string | null; storedLang?: string | null } = {}
): string {
  return normalizeLang(opts.profileLang) || normalizeLang(opts.storedLang) || 'en';
}

export function readStoredLang(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      normalizeLang(window.localStorage.getItem(LANDING_LANG_STORAGE_KEY)) ||
      normalizeLang(window.localStorage.getItem(PROFILE_LANG_STORAGE_KEY))
    );
  } catch {
    return null;
  }
}

export function persistLangLocal(lang: string): string | null {
  const normalized = normalizeLang(lang);
  if (!normalized || typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(LANDING_LANG_STORAGE_KEY, normalized);
    window.localStorage.setItem(PROFILE_LANG_STORAGE_KEY, normalized);
    document.cookie = `NEXT_LOCALE=${normalized}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* storage unavailable — language still applies for this session */
  }
  return normalized;
}
