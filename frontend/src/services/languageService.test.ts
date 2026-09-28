import appearanceService from './appearanceService';
import { supportedLanguages } from '../config/languages';
import { getEnabledLanguages, isLanguageEnabled, defaultLocale } from './languageService';

jest.mock('./appearanceService');

const mockedGetPublicResources = appearanceService.getPublicResources as unknown as jest.Mock;

describe('languageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all when no resource exists', async () => {
    mockedGetPublicResources.mockResolvedValue([]);
    const langs = await getEnabledLanguages();
    expect(langs).toContain('en');
    expect(langs.length).toBe(supportedLanguages.length);
  });

  it('returns all when enabled is empty', async () => {
    mockedGetPublicResources.mockResolvedValue([{ metadata: { enabled: [] } } as any]);
    const langs = await getEnabledLanguages();
    expect(langs.length).toBe(supportedLanguages.length);
  });

  it('returns enabled from resource', async () => {
    mockedGetPublicResources.mockResolvedValue([{ metadata: { enabled: ['en', 'es'] } } as any]);
    const langs = await getEnabledLanguages();
    expect(langs).toEqual(['en', 'es']);
  });

  it('isLanguageEnabled checks inclusion', async () => {
    mockedGetPublicResources.mockResolvedValue([{ metadata: { enabled: ['en', 'es'] } } as any]);
    expect(await isLanguageEnabled('en')).toBe(true);
    expect(await isLanguageEnabled('fr')).toBe(false);
  });

  it('exports defaultLocale as en', () => {
    expect(defaultLocale).toBe('en');
  });

  it('falls back to all on error', async () => {
    mockedGetPublicResources.mockRejectedValue(new Error('network'));
    const langs = await getEnabledLanguages();
    expect(langs).toContain('en');
    expect(langs.length).toBe(supportedLanguages.length);
  });

  it('uses the public endpoint, never the admin one', async () => {
    const spy = jest.spyOn(appearanceService, 'getResources');
    mockedGetPublicResources.mockResolvedValue([]);
    await getEnabledLanguages();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
