import { render, screen } from '@testing-library/react';
import NavbarSectionList from './NavbarSectionList';
import { NavSection, LANGUAGES } from './types';

const noop = jest.fn();

const section: NavSection = {
  id: 'a',
  key: 'home',
  route: '/',
  icon: 'Home',
  visible: true,
  locked: false,
  order: 0,
  translations: { en: 'Home', es: 'Inicio' },
};

function renderList(currentLang: string) {
  render(
    <NavbarSectionList
      sections={[section]}
      currentLang={currentLang}
      onEdit={noop}
      onDelete={noop}
      onToggle={noop}
      onToggleLock={noop}
      onReorder={noop}
    />
  );
}

describe('NavbarSectionList', () => {
  it('shows a warning badge when the combo language translation is missing', () => {
    renderList('ja');
    expect(screen.getByLabelText('Sin traducción en JA')).toBeInTheDocument();
  });

  it('does not show the warning badge when the combo language has a translation', () => {
    renderList('en');
    expect(screen.queryByLabelText('Sin traducción en EN')).not.toBeInTheDocument();
  });

  it('uses LANGUAGES.length in the completion aria-label', () => {
    renderList('es');
    expect(
      screen.getByLabelText(`Faltan ${LANGUAGES.length - 2} de ${LANGUAGES.length} idiomas`)
    ).toBeInTheDocument();
  });
});
