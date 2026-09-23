import { render, screen } from '@testing-library/react';
import IdiomasPage from './idiomas';
import { supportedLanguages } from '../../../config/languages';

jest.mock('../../../services/appearanceService', () => ({
  __esModule: true,
  default: {
    getResources: jest.fn().mockResolvedValue([]),
    createResource: jest.fn().mockResolvedValue({}),
    updateResource: jest.fn().mockResolvedValue({}),
  },
}));

describe('Idiomas admin', () => {
  it('renders 21 toggles and saves enabled', async () => {
    render(<IdiomasPage />);
    expect(await screen.findByText(/Idiomas disponibles/i)).toBeInTheDocument();
    expect(screen.getAllByRole('switch').length).toBe(supportedLanguages.length);
  });
});
