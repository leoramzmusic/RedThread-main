import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import fs from 'fs';
import path from 'path';
import { store } from '../../store/store';
import Sidebar from './Sidebar';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/home',
    asPath: '/home',
    push: jest.fn(),
    locale: 'en',
    locales: ['en', 'es'],
    defaultLocale: 'en',
  }),
}));

jest.mock('../../context/UIContext', () => ({
  useUI: () => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: jest.fn(),
    drawerWidth: 260,
    DRAWER_WIDTH: 260,
    DRAWER_WIDTH_COLLAPSED: 72,
  }),
}));

jest.mock('../motion/MorphToggleIcon', () => ({
  __esModule: true,
  default: () => null,
}));

const loadCommon = (locale: string): Record<string, unknown> =>
  JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public', 'locales', locale, 'common.json'), 'utf8')
  ) as Record<string, unknown>;

const renderSidebar = (locale: 'en' | 'es') => {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: 'en',
    defaultNS: 'common',
    resources: {
      en: { common: loadCommon('en') },
      es: { common: loadCommon('es') },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return render(
    <I18nextProvider i18n={instance}>
      <Provider store={store}>
        <Sidebar />
      </Provider>
    </I18nextProvider>
  );
};

describe('Sidebar i18n', () => {
  it('renders menu labels in English', () => {
    renderSidebar('en');
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
    expect(screen.getByText('ENTERTAINMENT')).toBeInTheDocument();
  });

  it('expands the settings submenu with translated children', () => {
    renderSidebar('en');
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  it('renders menu labels in Spanish', () => {
    renderSidebar('es');
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Eventos')).toBeInTheDocument();
    expect(screen.getByText('Suscripción')).toBeInTheDocument();
    expect(screen.getByText('ENTRETENIMIENTO')).toBeInTheDocument();
  });
});
