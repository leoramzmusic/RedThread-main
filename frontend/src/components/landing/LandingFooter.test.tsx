import { render, screen, fireEvent } from '@testing-library/react';
import LandingFooter from './LandingFooter';

const setViewport = (desktop: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.startsWith('(min-width: 1025px)') ? desktop : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

const renderFooter = (props: Partial<Parameters<typeof LandingFooter>[0]> = {}) =>
  render(<LandingFooter currentLang="es" footerText="© RedThread App" {...props} />);

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: undefined });
});

describe('LandingFooter desktop (>=1025)', () => {
  it('renders the 4-column grid layout with links visible without interaction', () => {
    renderFooter();
    expect(document.querySelector('[data-footer-layout="grid"]')).toBeInTheDocument();
    expect(document.querySelector('[data-footer-layout="accordion"]')).not.toBeInTheDocument();
    expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
    expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument();
    expect(screen.getByText('Acerca de')).toBeInTheDocument();
    expect(screen.getByText('LEGAL').closest('button')).toBeNull();
  });

  it('renders the default Spanish tagline', () => {
    renderFooter();
    expect(screen.getByText('Conexiones significativas inspiradas en la leyenda del hilo rojo.')).toBeInTheDocument();
  });

  it('prefers the CMS tagline over the default', () => {
    renderFooter({ footerTagline: 'Tagline del portal' });
    expect(screen.getByText('Tagline del portal')).toBeInTheDocument();
    expect(screen.queryByText('Conexiones significativas inspiradas en la leyenda del hilo rojo.')).not.toBeInTheDocument();
  });
});

describe('LandingFooter accordion (<1025)', () => {
  it('renders the accordion layout with all sections collapsed by default', () => {
    setViewport(false);
    renderFooter();
    expect(document.querySelector('[data-footer-layout="accordion"]')).toBeInTheDocument();
    expect(document.querySelector('[data-footer-layout="grid"]')).not.toBeInTheDocument();
    const collapsed = document.querySelectorAll('button[aria-expanded="false"]');
    expect(collapsed).toHaveLength(4);
    expect(document.querySelector('button[aria-expanded="true"]')).toBeNull();
  });

  it('expands a section when its header is clicked', () => {
    setViewport(false);
    renderFooter();
    fireEvent.click(screen.getByText('LEGAL'));
    expect(screen.getByText('LEGAL').closest('button')?.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
  });

  it('keeps the other sections collapsed after expanding one', () => {
    setViewport(false);
    renderFooter();
    fireEvent.click(screen.getByText('LEGAL'));
    expect(screen.getByText('AYUDA').closest('button')?.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('EMPRESA').closest('button')?.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('LandingFooter socials', () => {
  it('renders a single set of real RedThread social links in both layouts', () => {
    renderFooter();
    expect(document.querySelector('a[href="https://twitter.com/redthread"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="https://instagram.com/redthread_app"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="https://facebook.com/redthreadapp"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="mailto:support@redthread.app"]')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('removes the placeholder top-bar social pills', () => {
    renderFooter();
    expect(document.querySelector('a[href="https://x.com"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="https://instagram.com"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="https://tiktok.com"]')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('IG')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('TT')).not.toBeInTheDocument();
  });
});

describe('LandingFooter i18n', () => {
  it('renders English section headers for currentLang=en', () => {
    renderFooter({ currentLang: 'en' });
    expect(screen.getByText('HELP')).toBeInTheDocument();
    expect(screen.getByText('COMPANY')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});
