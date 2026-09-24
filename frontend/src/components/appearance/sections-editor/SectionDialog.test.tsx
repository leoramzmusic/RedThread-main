import { render, screen, fireEvent } from '@testing-library/react';
import SectionDialog from './SectionDialog';
import type { LandingSection } from './types';

const onClose = jest.fn();
const onSave = jest.fn();

beforeEach(() => jest.clearAllMocks());

const renderDialog = (initial: LandingSection | null = null) =>
  render(
    <SectionDialog open saving={false} initial={initial} onClose={onClose} onSave={onSave} />
  );

describe('SectionDialog', () => {
  it('requires at least one title before saving', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(screen.getByText(/al menos un título/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the typed title with the chosen content type', () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText('Título en EN'), {
      target: { value: 'Artículos' },
    });
    fireEvent.change(screen.getByLabelText('Tipo de contenido'), {
      target: { value: 'video' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledWith({
      translations: { en: 'Artículos' },
      contentType: 'video',
    });
  });

  it('prefills title and content type when editing', () => {
    renderDialog({
      id: 's1',
      order: 0,
      contentType: 'article',
      visible: true,
      translations: { en: 'News' },
    });
    expect(screen.getByLabelText('Título en EN')).toHaveValue('News');
    expect(screen.getByLabelText('Tipo de contenido')).toHaveValue('article');
  });

  it('collects titles across language tabs', () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText('Título en EN'), {
      target: { value: 'News' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /^es$/i }));
    fireEvent.change(screen.getByLabelText('Título en ES'), {
      target: { value: 'Noticias' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(onSave).toHaveBeenCalledWith({
      translations: { en: 'News', es: 'Noticias' },
      contentType: 'text',
    });
  });

  it('does not save while saving', () => {
    render(
      <SectionDialog open saving initial={null} onClose={onClose} onSave={onSave} />
    );
    fireEvent.change(screen.getByLabelText('Título en EN'), {
      target: { value: 'X' },
    });
    const btn = screen.getByRole('button', { name: /guardando/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onSave).not.toHaveBeenCalled();
  });
});
