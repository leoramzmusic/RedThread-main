import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { CssBaseline } from '@mui/material';
import { store } from '../store/store';
import AuthInitializer from '../components/auth/AuthInitializer';
import AdminRouteGuard from '../components/auth/AdminRouteGuard';
import { appWithTranslation } from 'next-i18next';
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AppThemeProvider } from '../context/ThemeContext';
import { UIProvider } from '../context/UIContext';
import { SnackbarProvider } from 'notistack';
import DynamicFavicon from '../components/layout/DynamicFavicon';

function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <UIProvider>
          <AuthInitializer>
            <AdminRouteGuard>
              <DynamicFavicon />
              <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <CssBaseline />
                <Component {...pageProps} />
              </SnackbarProvider>
            </AdminRouteGuard>
          </AuthInitializer>
        </UIProvider>
      </AppThemeProvider>
    </Provider>
  );
}

export default appWithTranslation(App);


