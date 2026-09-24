import { render, screen } from '@testing-library/react';
import NavbarRenderer from './NavbarRenderer';
import { getDefaultStyleSpec } from './styles';
import { NavSection, LANGUAGES } from './types';

const emptyT = () => LANGUAGES.reduce((a, l) => ({ ...a, [l]: '' }), {} as Record<string, string>);

const sections: NavSection[] = [
  { id: 'a', key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: { ...emptyT(), es: 'Inicio' } },
  { id: 'b', key: 'product', route: '#producto', icon: 'Explore', visible: true, locked: false, order: 1, translations: { ...emptyT(), es: 'Producto' } },
  { id: 'c', key: 'hidden', route: '/x', icon: 'Menu', visible: false, locked: false, order: 2, translations: emptyT() },
];

describe('NavbarRenderer', () => {
  it('renders only visible items for the current language', () => {
    render(<NavbarRenderer sections={sections} currentLang="es" styleSpec={getDefaultStyleSpec('glass')} />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.queryByText('(vacío)')).not.toBeInTheDocument();
  });

  it('does not render hidden sections', () => {
    render(<NavbarRenderer sections={sections} currentLang="es" styleSpec={getDefaultStyleSpec('glass')} />);
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('renders the language badge and CTA', () => {
    render(<NavbarRenderer sections={sections} currentLang="en" styleSpec={getDefaultStyleSpec('modern')} ctaLabel="Sign up" />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('falls back to es label when current lang missing and en is empty', () => {
    render(<NavbarRenderer sections={sections} currentLang="de" styleSpec={getDefaultStyleSpec('minimal')} />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('falls back to English before es when both are present', () => {
    const withEn: NavSection[] = [
      { id: 'a', key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: { ...emptyT(), es: 'Inicio', en: 'Home' } },
    ];
    render(<NavbarRenderer sections={withEn} currentLang="ja" styleSpec={getDefaultStyleSpec('minimal')} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });
});

describe('NavbarRenderer layout modes', () => {
  const renderMode = (layoutMode: 'desktop' | 'tablet' | 'mobile') =>
    render(
      <NavbarRenderer sections={sections} currentLang="es" styleSpec={getDefaultStyleSpec('glass')} layoutMode={layoutMode} />
    );

  const root = () => document.querySelector('[data-navbar-mode]') as HTMLElement;
  const menubar = () => document.querySelector('[data-nav-menubar]') as HTMLElement;
  const menuButton = () => document.querySelector('[data-nav-menu]') as HTMLElement;

  it('exposes the requested layout mode on the root element', () => {
    renderMode('tablet');
    expect(root().getAttribute('data-navbar-mode')).toBe('tablet');
  });

  it('shows the menubar and hides the hamburger on desktop', () => {
    renderMode('desktop');
    expect(root().getAttribute('data-navbar-mode')).toBe('desktop');
    expect(menubar().style.display).not.toBe('none');
    expect(menuButton().style.display).toBe('none');
  });

  it('hides the menubar and shows the hamburger on tablet', () => {
    renderMode('tablet');
    expect(menubar().style.display).toBe('none');
    expect(menuButton().style.display).not.toBe('none');
  });

  it('hides the menubar and shows the hamburger on mobile', () => {
    renderMode('mobile');
    expect(menubar().style.display).toBe('none');
    expect(menuButton().style.display).not.toBe('none');
  });

  it('keeps a single horizontal row on mobile so the fixed bar never covers the hero logo', () => {
    renderMode('mobile');
    expect(root().style.flexDirection).not.toBe('column');
  });

  it('keeps a horizontal bar on tablet', () => {
    renderMode('tablet');
    expect(root().style.flexDirection).not.toBe('column');
  });

  it('derives desktop mode when no layoutMode is provided (jsdom default)', () => {
    render(<NavbarRenderer sections={sections} currentLang="es" styleSpec={getDefaultStyleSpec('glass')} />);
    expect(root().getAttribute('data-navbar-mode')).toBe('desktop');
  });
});
