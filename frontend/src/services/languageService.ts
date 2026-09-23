import appearanceService from './appearanceService';
import { AppearanceType } from '../types/appearance';
import { supportedLanguages } from '../config/languages';

const ALL = supportedLanguages.map((l) => l.code);

export const defaultLocale = 'en';

export async function getEnabledLanguages(): Promise<string[]> {
  try {
    const res = await appearanceService.getResources((AppearanceType as any).LANDING_LANGUAGES);
    const enabled = (res?.[0] as any)?.metadata?.enabled;
    if (Array.isArray(enabled) && enabled.length) return enabled;
  } catch {}
  return ALL;
}

export async function isLanguageEnabled(code: string): Promise<boolean> {
  const enabled = await getEnabledLanguages();
  return enabled.includes(code);
}
