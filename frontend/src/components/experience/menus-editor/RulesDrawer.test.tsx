import { render, screen, fireEvent } from '@testing-library/react';
import RulesDrawer from './RulesDrawer';
import { DEFAULT_MENU_CONFIG, MENU_ROLES, type MenuConfig } from './types';

const cfg = (over: Partial<MenuConfig> = {}): MenuConfig => ({ ...DEFAULT_MENU_CONFIG, ...over });

const openDrawer = (initial: MenuConfig | null = cfg(), onSave = jest.fn()) => {
  const onClose = jest.fn();
  render(
    <RulesDrawer open itemLabel="Descubrir" initial={initial} onClose={onClose} onSave={onSave} />
  );
  return { onSave, onClose };
};

describe('RulesDrawer', () => {
  it('pre-selects the roles from the incoming config', () => {
    openDrawer(cfg({ roles: ['premium', 'vip'] }));
    expect(screen.getByLabelText('Free')).not.toBeChecked();
    expect(screen.getByLabelText('Premium')).toBeChecked();
    expect(screen.getByLabelText('VIP')).toBeChecked();
  });

  it('saves role changes as a replacement list', () => {
    const { onSave } = openDrawer(cfg({ roles: [] }));
    fireEvent.click(screen.getByLabelText('Free'));
    fireEvent.click(screen.getByLabelText('VIP'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].roles.sort()).toEqual(['free', 'premium', 'vip']);
  });

  it('checks Premium automatically when VIP is selected', () => {
    openDrawer(cfg({ roles: [] }));
    fireEvent.click(screen.getByLabelText('VIP'));
    expect(screen.getByLabelText('VIP')).toBeChecked();
    expect(screen.getByLabelText('Premium')).toBeChecked();
  });

  it('keeps VIP checked when Premium is unchecked, still saving only VIP', () => {
    const { onSave } = openDrawer(cfg({ roles: ['premium', 'vip'] }));
    fireEvent.click(screen.getByLabelText('Premium'));
    expect(screen.getByLabelText('VIP')).toBeChecked();
    expect(screen.getByLabelText('Premium')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(onSave.mock.calls[0][0].roles).toEqual(['vip']);
  });

  it('shows a dynamic access label under the role checkboxes', () => {
    openDrawer(cfg({ roles: [] }));
    expect(screen.getByText('Visible para todos los usuarios')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Premium'));
    expect(screen.getByText('Visible solo para usuarios Premium')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('VIP'));
    expect(screen.getByText('Visible para usuarios Premium y VIP')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Premium'));
    expect(screen.getByText('Visible solo para usuarios VIP (incluye Premium)')).toBeInTheDocument();
  });

  it('edits status and version together with the rules', () => {
    const { onSave } = openDrawer(cfg({ status: 'active', version: '1.0.0' }));
    fireEvent.mouseDown(screen.getByLabelText('Estado'));
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }));
    fireEvent.change(screen.getByLabelText('Versión'), { target: { value: '2.0.0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(onSave.mock.calls[0][0].status).toBe('beta');
    expect(onSave.mock.calls[0][0].version).toBe('2.0.0');
  });

  it('builds a geo rule from the comma-separated country field', () => {
    const { onSave } = openDrawer(cfg());
    fireEvent.click(screen.getByLabelText('Regla de geografía'));
    fireEvent.change(screen.getByLabelText('Países (ISO, separados por coma)'), {
      target: { value: 'mx, AR' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    const rules = onSave.mock.calls[0][0].rules;
    expect(rules).toContainEqual({ kind: 'geo', countries: ['MX', 'AR'] });
  });

  it('builds language and energy rules', () => {
    const { onSave } = openDrawer(cfg());
    fireEvent.click(screen.getByLabelText('Regla de idioma'));
    fireEvent.change(screen.getByLabelText('Idiomas (códigos, separados por coma)'), {
      target: { value: 'es, en' },
    });
    fireEvent.click(screen.getByLabelText('Regla de energía'));
    fireEvent.change(screen.getByLabelText('Energía mínima'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Energía máxima'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    const rules = onSave.mock.calls[0][0].rules;
    expect(rules).toContainEqual({ kind: 'language', languages: ['es', 'en'] });
    expect(rules).toContainEqual({ kind: 'energy', min: 2, max: 4 });
  });

  it('drops a rule when its toggle is switched off', () => {
    const { onSave } = openDrawer(
      cfg({ rules: [{ kind: 'geo', countries: ['MX'] }] })
    );
    expect(screen.getByLabelText('Regla de geografía')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Regla de geografía'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(onSave.mock.calls[0][0].rules).toEqual([]);
  });

  it('rejects malformed JSON in the raw rules editor', () => {
    const { onSave } = openDrawer(cfg());
    fireEvent.click(screen.getByRole('button', { name: 'Abrir editor avanzado' }));
    fireEvent.change(screen.getByLabelText('Reglas (JSON)'), { target: { value: '{nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar JSON' }));
    expect(screen.getByText('JSON inválido')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(onSave.mock.calls[0][0].rules).toEqual([]);
  });

  it('applies a valid JSON array to the rules', () => {
    const { onSave } = openDrawer(cfg());
    fireEvent.click(screen.getByRole('button', { name: 'Abrir editor avanzado' }));
    fireEvent.change(screen.getByLabelText('Reglas (JSON)'), {
      target: { value: '[{"kind":"language","languages":["es"]}]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar JSON' }));
    expect(screen.queryByText('JSON inválido')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(onSave.mock.calls[0][0].rules).toEqual([{ kind: 'language', languages: ['es'] }]);
  });

  it('hides the advanced JSON editor until requested', () => {
    openDrawer();
    expect(screen.queryByLabelText('Reglas (JSON)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir editor avanzado' }));
    expect(screen.getByLabelText('Reglas (JSON)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar editor avanzado' }));
    expect(screen.queryByLabelText('Reglas (JSON)')).not.toBeInTheDocument();
  });

  it('announces an enabled rule with a contextual badge', () => {
    openDrawer();
    expect(screen.queryByText(/Regla aplicada:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Regla de geografía'));
    expect(screen.getByText('Regla aplicada: Solo en países específicos')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Regla de geografía'));
    expect(screen.queryByText(/Regla aplicada:/)).not.toBeInTheDocument();
  });

  it('disables the save button while saving', () => {
    render(
      <RulesDrawer open saving itemLabel="Descubrir" initial={cfg()} onClose={jest.fn()} onSave={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });

  it('covers the three member roles in the catalog', () => {
    openDrawer();
    MENU_ROLES.forEach((role) => expect(screen.getByLabelText(role.label)).toBeInTheDocument());
  });

  it('drops the admin checkbox and the subscription rule', () => {
    openDrawer();
    expect(screen.queryByLabelText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Regla de suscripción')).not.toBeInTheDocument();
    expect(screen.queryByText(/Solo con suscripción/)).not.toBeInTheDocument();
  });

  it('offsets the drawer below the admin navbar instead of under it', () => {
    openDrawer();
    const paper = document.querySelector('.MuiDrawer-paper') as HTMLElement;
    expect(paper.style.top).toBe('73px');
    expect(paper.style.height).toContain('calc(100vh - 73px)');
  });

  it('keeps the title and save actions outside the internal scroll area', () => {
    openDrawer();
    const scroll = screen.getByTestId('rules-scroll');
    expect(scroll).not.toContainElement(screen.getByText(/^Reglas — Descubrir$/));
    expect(scroll).not.toContainElement(screen.getByRole('button', { name: 'Guardar reglas' }));
    expect(scroll).not.toContainElement(screen.getByRole('button', { name: 'Cancelar' }));
  });
});
