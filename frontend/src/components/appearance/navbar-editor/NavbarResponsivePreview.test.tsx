import { render, screen, fireEvent, act } from '@testing-library/react';
import NavbarResponsivePreview, { RESUMEN_RESOLUTIONS } from './NavbarResponsivePreview';
import { getDefaultStyleSpec } from './styles';
import { NavSection, LANGUAGES } from './types';

const emptyT = () => LANGUAGES.reduce((a, l) => ({ ...a, [l]: '' }), {} as Record<string, string>);

const sections: NavSection[] = [
  { id: 'a', key: 'home', route: '/', icon: 'Home', visible: true, locked: true, order: 0, translations: { ...emptyT(), es: 'Inicio' } },
  { id: 'b', key: 'product', route: '#producto', icon: 'Explore', visible: true, locked: false, order: 1, translations: { ...emptyT(), es: 'Producto' } },
];

describe('NavbarResponsivePreview', () => {
  it('renders resolution kontroller and current width badge', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('1280px')).toBeInTheDocument();
  });

  it('switches resolution on tab click and updates badge', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    fireEvent.click(screen.getByText('Móvil'));
    expect(screen.getByText('375px')).toBeInTheDocument();
  });

  it('rotates resolutions while playing', () => {
    jest.useFakeTimers();
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    act(() => { jest.advanceTimersByTime(4500); });
    expect(RESUMEN_RESOLUTIONS.length).toBe(3);
    jest.useRealTimers();
  });

  it('renders the mockup navbar in desktop mode by default', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    expect(document.querySelector('[data-navbar-mode="desktop"]')).toBeInTheDocument();
  });

  it('switches the mockup navbar layout mode with the selected resolution', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    fireEvent.click(screen.getByText('Tablet'));
    expect(document.querySelector('[data-navbar-mode="tablet"]')).toBeInTheDocument();
    expect(document.querySelector('[data-navbar-mode="desktop"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Móvil'));
    expect(document.querySelector('[data-navbar-mode="mobile"]')).toBeInTheDocument();
    expect(document.querySelector('[data-navbar-mode="tablet"]')).not.toBeInTheDocument();
  });

  it('gives the mobile mockup stage extra height for the stacked bar', () => {
    render(
      <NavbarResponsivePreview
        sections={sections} currentLang="es"
        draft={getDefaultStyleSpec('glass')} saved={getDefaultStyleSpec('glass')} showCompare={false}
      />
    );
    const stage = () => document.querySelector('[data-mockup-stage]') as HTMLElement;
    expect(stage().style.height).toBe('64px');
    fireEvent.click(screen.getByText('Móvil'));
    expect(stage().style.height).toBe('110px');
  });
});