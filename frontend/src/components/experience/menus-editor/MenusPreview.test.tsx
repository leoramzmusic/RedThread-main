import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import MenusPreview from './MenusPreview';
import { createLiquidGlassTheme } from '../../../theme/liquidGlass';
import { defaultUserMenus } from './userMenuItems';
import { DEFAULT_MENU_CONFIG, type MenuConfig, type UserMenusMetadata } from './types';
import type { PreviewContext } from './visibility';

const ctx = (over: Partial<PreviewContext> = {}): PreviewContext => ({
  role: 'free',
  country: 'MX',
  language: 'es',
  energy: 3,
  ...over,
});

const meta = (menus: Record<string, MenuConfig>): UserMenusMetadata => ({ menus, snapshots: [] });

const defaults = () => defaultUserMenus();

const renderPreview = (
  metadata: UserMenusMetadata = defaults(),
  context: PreviewContext = ctx(),
  handlers: { onCtxChange?: jest.Mock; onDeviceChange?: jest.Mock } = {}
) => {
  const onCtxChange = handlers.onCtxChange ?? jest.fn();
  const onDeviceChange = handlers.onDeviceChange ?? jest.fn();
  render(
    <MenusPreview
      metadata={metadata}
      ctx={context}
      device="desktop"
      onCtxChange={onCtxChange}
      onDeviceChange={onDeviceChange}
    />
  );
  return { onCtxChange, onDeviceChange };
};

describe('MenusPreview', () => {
  it('renders the visible sidebar sections and items', () => {
    renderPreview();
    expect(screen.getByText('SOCIAL')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Descubrir')).toBeInTheDocument();
    expect(screen.getByText('ENTRETENIMIENTO')).toBeInTheDocument();
  });

  it('hides Golth for free users and shows it for premium (default roles)', () => {
    const { rerender } = render(<MenusPreview metadata={defaults()} ctx={ctx()} device="desktop" onCtxChange={jest.fn()} onDeviceChange={jest.fn()} />);
    expect(screen.queryByText('Golth')).not.toBeInTheDocument();
    rerender(<MenusPreview metadata={defaults()} ctx={ctx({ role: 'premium' })} device="desktop" onCtxChange={jest.fn()} onDeviceChange={jest.fn()} />);
    expect(screen.getByText('Golth')).toBeInTheDocument();
  });

  it('reflects a hidden module immediately through the counter', () => {
    const metadata = defaults();
    metadata.menus.discover = { ...DEFAULT_MENU_CONFIG, visible: false };
    renderPreview(metadata);
    expect(screen.queryByText('Descubrir')).not.toBeInTheDocument();
    expect(screen.getByText(/de 19 visibles/)).toBeInTheDocument();
  });

  it('applies geo rules against the preview country', () => {
    const metadata = defaults();
    metadata.menus.chat = { ...DEFAULT_MENU_CONFIG, rules: [{ kind: 'geo', countries: ['MX'] }] };
    const { rerender } = render(<MenusPreview metadata={metadata} ctx={ctx({ country: 'MX' })} device="desktop" onCtxChange={jest.fn()} onDeviceChange={jest.fn()} />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    rerender(<MenusPreview metadata={metadata} ctx={ctx({ country: 'AR' })} device="desktop" onCtxChange={jest.fn()} onDeviceChange={jest.fn()} />);
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
  });

  it('exposes the role selector and reports changes', () => {
    const { onCtxChange } = renderPreview();
    fireEvent.click(screen.getByRole('tab', { name: 'Premium' }));
    expect(onCtxChange).toHaveBeenCalledWith({ role: 'premium' });
  });

  it('exposes the device selector and marks the preview', () => {
    const { onDeviceChange } = renderPreview();
    expect(screen.getByTestId('menus-preview')).toHaveAttribute('data-device', 'desktop');
    fireEvent.click(screen.getByRole('button', { name: 'Tablet' }));
    expect(onDeviceChange).toHaveBeenCalledWith('tablet');
  });

  it('exposes country, language and energy context controls', () => {
    const { onCtxChange } = renderPreview();
    fireEvent.mouseDown(screen.getByLabelText('País'));
    fireEvent.click(screen.getByRole('option', { name: /Argentina/ }));
    expect(onCtxChange).toHaveBeenCalledWith({ country: 'AR' });

    fireEvent.mouseDown(screen.getByLabelText('Idioma'));
    fireEvent.click(screen.getByRole('option', { name: /English/ }));
    expect(onCtxChange).toHaveBeenCalledWith({ language: 'en' });

    fireEvent.change(screen.getByLabelText('Energía social'), { target: { value: '5' } });
    expect(onCtxChange).toHaveBeenCalledWith({ energy: 5 });
  });

  it('renders settings children inside the system section', () => {
    renderPreview();
    expect(screen.getByText('SISTEMA')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Privacidad')).toBeInTheDocument();
  });

  it('applies the dark theme surface to the sidebar preview', () => {
    render(
      <ThemeProvider theme={createLiquidGlassTheme('dark')}>
        <MenusPreview metadata={defaults()} ctx={ctx()} device="desktop" onCtxChange={jest.fn()} onDeviceChange={jest.fn()} />
      </ThemeProvider>
    );
    const surface = screen.getByTestId('menus-preview-surface');
    expect(surface).toHaveStyle({ backgroundColor: '#1A1B1E' });
  });
});
