import { render, screen } from '@testing-library/react';
import LandingNavbar from './LandingNavbar';
import appearanceService from '../../services/appearanceService';
import { AppearanceType, AppearanceResource } from '../../types/appearance';

jest.mock('../../services/appearanceService', () => ({
  __esModule: true,
  default: {
    getPublicResources: jest.fn(),
    getResources: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), asPath: '/', locale: 'en' }),
}));

const mockedGetPublic = appearanceService.getPublicResources as jest.MockedFunction<
  typeof appearanceService.getPublicResources
>;

const navbarResource = (key: string, translations: Record<string, string>, order: number): AppearanceResource => ({
  _id: `res-${key}`,
  type: AppearanceType.LANDING_NAVBAR,
  platform: 'web' as AppearanceResource['platform'],
  url: '',
  is_active: true,
  metadata: { key, route: `#${key}`, icon: 'Menu', visible: true, locked: false, order, translations },
});

describe('LandingNavbar', () => {
  beforeEach(() => {
    mockedGetPublic.mockReset();
    mockedGetPublic.mockResolvedValue([]);
  });

  it('renders public sections with English fallback when the current language is missing', async () => {
    mockedGetPublic.mockImplementation(async (type) => {
      if (type === AppearanceType.LANDING_NAVBAR) {
        return [
          navbarResource('home', { es: 'Inicio', en: 'Home' }, 0),
          navbarResource('product', { es: 'Producto', en: 'Product' }, 1),
        ];
      }
      return [];
    });

    render(<LandingNavbar currentLang="ja" onLangChange={jest.fn()} />);

    expect((await screen.findAllByText('Home')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Product')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
    expect(screen.queryByText('Producto')).not.toBeInTheDocument();
  });

  it('renders the section translation for the current language when present', async () => {
    mockedGetPublic.mockImplementation(async (type) => {
      if (type === AppearanceType.LANDING_NAVBAR) {
        return [navbarResource('home', { es: 'Inicio', en: 'Home', ja: 'ホーム' }, 0)];
      }
      return [];
    });

    render(<LandingNavbar currentLang="ja" onLangChange={jest.fn()} />);

    expect((await screen.findAllByText('ホーム')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });

  it('keeps the unified DEFAULT_SECTIONS when the public endpoint returns nothing', async () => {
    mockedGetPublic.mockResolvedValue([]);

    render(<LandingNavbar currentLang="es" onLangChange={jest.fn()} />);

    expect((await screen.findAllByText('Inicio')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Producto')).length).toBeGreaterThan(0);
  });
});
