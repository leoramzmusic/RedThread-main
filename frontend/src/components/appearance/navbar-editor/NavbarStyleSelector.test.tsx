import { render, screen, fireEvent } from '@testing-library/react';
import NavbarStyleSelector from './NavbarStyleSelector';
import { getDefaultStyleSpec } from './styles';

describe('NavbarStyleSelector', () => {
  const draft = getDefaultStyleSpec('glass');
  const saved = getDefaultStyleSpec('glass');

  it('renders the four style cards', () => {
    render(
      <NavbarStyleSelector
        draft={draft} saved={saved}
        onSelectStyle={() => {}} onChangeAdvanced={() => {}}
        onApply={() => {}} onToggleCompare={() => {}} showCompare={false}
      />
    );
    expect(screen.getByText(/Estilo actual/)).toBeInTheDocument();
    expect(screen.getByText('Minimalista')).toBeInTheDocument();
    expect(screen.getByText('Moderno')).toBeInTheDocument();
    expect(screen.getByText('Compacto')).toBeInTheDocument();
  });

  it('calls onSelectStyle when a card is clicked', () => {
    const onSelectStyle = jest.fn();
    render(
      <NavbarStyleSelector
        draft={draft} saved={saved}
        onSelectStyle={onSelectStyle} onChangeAdvanced={() => {}}
        onApply={() => {}} onToggleCompare={() => {}} showCompare={false}
      />
    );
    fireEvent.click(screen.getByText('Minimalista'));
    expect(onSelectStyle).toHaveBeenCalledWith('minimal');
  });

  it('disables Aplicar when draft equals saved defaults', () => {
    render(
      <NavbarStyleSelector
        draft={draft} saved={saved}
        onSelectStyle={() => {}} onChangeAdvanced={() => {}}
        onApply={() => {}} onToggleCompare={() => {}} showCompare={false}
      />
    );
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled();
  });
});