import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';

jest.mock('next/router', () => ({ useRouter: () => ({ locale: 'en', asPath: '/en/discover', push: jest.fn() }) }));
jest.mock('../../services/languageService', () => ({
  getEnabledLanguages: jest.fn().mockResolvedValue(['en','es','pt','fr','de','it','ru','sv','nl','zh','hi','bn','ja','ko','ar','sw','ha','am','fil','ms','mi']),
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
});
