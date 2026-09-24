import { render, screen, fireEvent } from '@testing-library/react';
import SectionsList from './SectionsList';
import type { LandingSection } from './types';

const sections: LandingSection[] = [
  { id: 's1', order: 0, contentType: 'image', visible: true, translations: { en: 'Gallery' } },
  { id: 's2', order: 1, contentType: 'video', visible: false, translations: { en: 'Clips' } },
];

const onReorder = jest.fn();
const onToggleVisible = jest.fn();
const onEdit = jest.fn();
const onDelete = jest.fn();

beforeEach(() => jest.clearAllMocks());

const renderList = (items: LandingSection[] = sections) =>
  render(
    <SectionsList
      sections={items}
      onReorder={onReorder}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

describe('SectionsList', () => {
  it('renders rows with EN-fallback titles and content type chips', () => {
    renderList();
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText('Clips')).toBeInTheDocument();
    expect(screen.getByText('Imagen')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('emits visibility toggle with the section id and new value', () => {
    renderList();
    fireEvent.click(screen.getByLabelText('Visibilidad de Gallery'));
    expect(onToggleVisible).toHaveBeenCalledWith('s1', false);
  });

  it('emits edit and delete with the section id', () => {
    renderList();
    fireEvent.click(screen.getByLabelText('Editar Clips'));
    fireEvent.click(screen.getByLabelText('Eliminar Clips'));
    expect(onEdit).toHaveBeenCalledWith('s2');
    expect(onDelete).toHaveBeenCalledWith('s2');
  });

  it('renders nothing meaningful when the list is empty', () => {
    renderList([]);
    expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
    expect(screen.getByTestId('sections-list')).toBeInTheDocument();
  });
});
