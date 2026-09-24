import { render, screen, fireEvent } from '@testing-library/react';
import NavbarSectionDialog from './NavbarSectionDialog';
import { NavSection, NavSectionFormData } from './types';

const baseSection: NavSection = {
  id: 'a',
  key: 'home',
  route: '/',
  icon: 'Home',
  visible: true,
  locked: false,
  order: 0,
  translations: { es: 'Inicio' },
};

function renderDialog(section: NavSection | null, onSave = jest.fn().mockResolvedValue(undefined)) {
  render(
    <NavbarSectionDialog
      open
      instanceKey={1}
      section={section}
      onClose={jest.fn()}
      onSave={onSave}
      saving={false}
    />
  );
  return { onSave };
}

describe('NavbarSectionDialog', () => {
  it('allows saving with partial translations (only one language filled)', async () => {
    const { onSave } = renderDialog(baseSection);
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const formData = onSave.mock.calls[0][0] as NavSectionFormData;
    expect(formData.translations.es).toBe('Inicio');
    expect(formData.translations.en || '').toBe('');
  });

  it('blocks saving when every translation is empty and shows an error', () => {
    const empty: NavSection = { ...baseSection, translations: {} };
    const { onSave } = renderDialog(empty);
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/al menos una traducción/i)).toBeInTheDocument();
  });

  it('blocks saving when key or route is missing', () => {
    const { onSave } = renderDialog({ ...baseSection, key: '', route: '' });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('blocks saving when a translation exceeds the max length', () => {
    const long = { ...baseSection, translations: { es: 'a'.repeat(61) } };
    const { onSave } = renderDialog(long);
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('mentions partial save and English fallback in the hint', () => {
    renderDialog(baseSection);
    expect(screen.getByText(/parciales/i)).toBeInTheDocument();
    expect(screen.getByText(/fallback en inglés/i)).toBeInTheDocument();
  });
});
