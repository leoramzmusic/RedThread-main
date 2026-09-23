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
});