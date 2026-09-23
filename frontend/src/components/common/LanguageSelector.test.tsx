import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';

jest.mock('next/router', () => ({ useRouter: () => ({ locale: 'en', asPath: '/en/discover', push: jest.fn() }) }));
jest.mock('../../services/languageService', () => ({
  getEnabledLanguages: jest.fn().mockResolvedValue(['en','es','pt','fr','de','it','ru','sv','nl','zh','hi','bn','ja','ko','ar','sw','ha','am','tl','ms','mi']),
}));
const mockPatch = jest.fn(() => Promise.resolve({ data: { preferred_language: 'fr' } }));
const mockGet = jest.fn(() => Promise.resolve({ data: { preferred_language: 'en' } }));
jest.mock('../../services/api', () => ({
  __esModule: true,
  // @ts-ignore mock
  default: { patch: jest.fn(function (a: any, b: any) { return mockPatch(a, b); }), get: jest.fn(function (a: any) { return mockGet(a); }) },
  // @ts-ignore mock
  adminApiClient: { patch: jest.fn(function (a: any, b: any) { return mockPatch(a, b); }), get: jest.fn(function (a: any) { return mockGet(a); }) },
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
    // reset href
    delete (window as any).location;
    (window as any).location = { href: '' } as any;
  });

  it('persists to localStorage and cookie on change', async () => {
    const { getByLabelText, getByText } = render(<LanguageSelector />);
    fireEvent.click(getByLabelText(/Seleccionar idioma/i));
    // MUI Menu renders in portal, wait for item
    const item = await screen.findByText('Español');
    fireEvent.click(item);
    await waitFor(() => expect(localStorage.getItem('preferred_language')).toBe('es'));
    expect(document.cookie).toContain('NEXT_LOCALE=es');
  });

  it('shows continuity hint', () => {
    const { getByText } = render(<LanguageSelector showContinuityHint />);
    expect(getByText(/Este idioma se aplicará también dentro de la aplicación/i)).toBeInTheDocument();
  });

  it('calls PATCH when authenticated (via apiClient)', async () => {
    mockPatch.mockClear();
    const { getByLabelText } = render(<LanguageSelector />);
    fireEvent.click(getByLabelText(/Seleccionar idioma/i));
    const item = await screen.findByText('Français');
    fireEvent.click(item);
    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith('/auth/me', expect.objectContaining({ preferred_language: 'fr' })));
  });

  it('delegates to onLanguageChange when provided', async () => {
    const onChange = jest.fn(() => Promise.resolve());
    const { getByLabelText } = render(<LanguageSelector onLanguageChange={onChange} />);
    fireEvent.click(getByLabelText(/Seleccionar idioma/i));
    const item = await screen.findByText('Deutsch');
    fireEvent.click(item);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('de'));
  });
});
