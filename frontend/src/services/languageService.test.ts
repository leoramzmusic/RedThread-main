import appearanceService from './appearanceService';
import { supportedLanguages } from '../config/languages';
import { getEnabledLanguages, isLanguageEnabled, defaultLocale } from './languageService';

jest.mock('./appearanceService');

const mockedGetResources = appearanceService.getResources as unknown as jest.Mock;

describe('languageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all when no resource exists', async () => {
    mockedGetResources.mockResolvedValue([]);
    const langs = await getEnabledLanguages();
    expect(langs).toContain('en');
    expect(langs.length).toBe(supportedLanguages.length);
  });

  it('returns all when enabled is empty', async () => {
    mockedGetResources.mockResolvedValue([{ metadata: { enabled: [] } } as any]);
    const langs = await getEnabledLanguages();
    expect(langs.length).toBe(supportedLanguages.length);
  });

  it('returns enabled from resource', async () => {
    mockedGetResources.mockResolvedValue([{ metadata: { enabled: ['en', 'es'] } } as any]);
    const langs = await getEnabledLanguages();
    expect(langs).toEqual(['en', 'es']);
  });

  it('isLanguageEnabled checks inclusion', async () => {
    mockedGetResources.mockResolvedValue([{ metadata: { enabled: ['en', 'es'] } } as any]);
    expect(await isLanguageEnabled('en')).toBe(true);
    expect(await isLanguageEnabled('fr')).toBe(false);
  });

  it('exports defaultLocale as en', () => {
    expect(defaultLocale).toBe('en');
  });

  it('falls back to all on error', async () => {
    mockedGetResources.mockRejectedValue(new Error('network'));
    const langs = await getEnabledLanguages();
    expect(langs).toContain('en');
    expect(langs.length).toBe(supportedLanguages.length);
  });
});
