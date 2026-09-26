import { render, screen, fireEvent } from '@testing-library/react';
import MenuCard from './MenuCard';
import { DEFAULT_MENU_CONFIG, type MenuConfig } from './types';

const cfg = (over: Partial<MenuConfig> = {}): MenuConfig => ({ ...DEFAULT_MENU_CONFIG, ...over });

const setup = (config: MenuConfig = cfg(), handlers: Partial<Parameters<typeof MenuCard>[0]> = {}) => {
  const onToggleVisible = jest.fn();
  const onOpenRules = jest.fn();
  render(
    <MenuCard
      id="discover"
      label="Descubrir"
      config={config}
      onToggleVisible={onToggleVisible}
      onOpenRules={onOpenRules}
      {...handlers}
    />
  );
  return { onToggleVisible, onOpenRules };
};

describe('MenuCard', () => {
  it('shows the module name, version and status chip', () => {
    setup(cfg({ version: '1.2.0', status: 'beta' }));
    expect(screen.getByText('Descubrir')).toBeInTheDocument();
    expect(screen.getByText('v1.2.0')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('maps every status to its label and chip color', () => {
    const { rerender } = render(
      <MenuCard id="x" label="X" config={cfg({ status: 'development' })} onToggleVisible={jest.fn()} onOpenRules={jest.fn()} />
    );
    expect(screen.getByText('En desarrollo')).toBeInTheDocument();
    rerender(
      <MenuCard id="x" label="X" config={cfg({ status: 'active' })} onToggleVisible={jest.fn()} onOpenRules={jest.fn()} />
    );
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('shows Desactivado in red on the status chip when the module is hidden', () => {
    const { rerender } = render(
      <MenuCard id="x" label="X" config={cfg({ status: 'beta', visible: false })} onToggleVisible={jest.fn()} onOpenRules={jest.fn()} />
    );
    const chip = screen.getByText('Desactivado').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorError');
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    rerender(
      <MenuCard id="x" label="X" config={cfg({ status: 'beta', visible: true })} onToggleVisible={jest.fn()} onOpenRules={jest.fn()} />
    );
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Desactivado')).not.toBeInTheDocument();
  });

  it('binds the switch to the visible flag and reports toggles', () => {
    const { onToggleVisible } = setup(cfg({ visible: false }));
    const toggle = screen.getByLabelText('Visibilidad de Descubrir');
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(onToggleVisible).toHaveBeenCalledWith(true);
  });

  it('opens the rules drawer from the card button', () => {
    const { onOpenRules } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Configurar reglas de Descubrir' }));
    expect(onOpenRules).toHaveBeenCalledTimes(1);
  });

  it('summarizes role and rule restrictions with the dynamic access label', () => {
    setup(cfg({ roles: ['premium', 'vip'], rules: [{ kind: 'geo', countries: ['MX'] }, { kind: 'energy', min: 2, max: 4 }] }));
    expect(screen.getByText('Visible para usuarios Premium y VIP')).toBeInTheDocument();
    expect(screen.getByText('2 reglas')).toBeInTheDocument();
  });

  it('flags the VIP inclusion on the card label', () => {
    setup(cfg({ roles: ['vip'] }));
    expect(screen.getByText('Visible solo para usuarios VIP (incluye Premium)')).toBeInTheDocument();
  });

  it('shows no restriction badges when unrestricted', () => {
    setup();
    expect(screen.queryByText(/Visible para/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+ reglas$/)).not.toBeInTheDocument();
  });
});
