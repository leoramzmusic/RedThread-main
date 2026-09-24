import { render, screen } from '@testing-library/react';
import SectionsPreview from './SectionsPreview';
import type { LandingSection } from './types';

const section: LandingSection = {
  id: 's1',
  order: 0,
  contentType: 'image',
  visible: true,
  translations: { en: 'Gallery' },
};

describe('SectionsPreview', () => {
  it('shows the empty placeholder when there are no sections', () => {
    render(<SectionsPreview sections={[]} />);
    expect(screen.getByText('No hay contenido aún')).toBeInTheDocument();
  });

  it('renders visible section titles without the placeholder', () => {
    render(<SectionsPreview sections={[section]} />);
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.queryByText('No hay contenido aún')).not.toBeInTheDocument();
  });

  it('marks hidden sections as Oculta', () => {
    render(<SectionsPreview sections={[{ ...section, visible: false }]} />);
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText('Oculta')).toBeInTheDocument();
  });
});
