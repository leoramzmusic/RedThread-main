import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setCredentials, updateUserAvatar, setInitialized } from '../../store/slices/authSlice';
import apiClient from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import { RootState } from '../../store/store';
import { Box } from '@mui/material';
import YukiLoader from '../common/YukiLoader';

// Wrapper that rejects after ms to prevent infinite suspension
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loadPreferences } = useAppTheme();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Guard: only run once per mount-cycle; prevents loops from unstable deps
    if (hasStartedRef.current && isInitialized) return;
    const isAdminRoute = router.pathname.startsWith('/portal-redthread');
    if (isAdminRoute) {
      console.log('AuthInitializer: Admin route detected, skipping user auth hydration.');
      dispatch(setInitialized(true));
      return;
    }
    if (isInitialized && user) {
      console.log('AuthInitializer: Already initialized with user:', user.email);
      return;
    }
    // Ensure we only start hydration once; subsequent dep changes are ignored until init completes
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Safety net: force unblock after 10s even if requests hang forever
    const safetyTimer = setTimeout(() => {
      console.warn('AuthInitializer: Safety timeout — forcing initialized');
      dispatch(setInitialized(true));
    }, 10000);

    const initAuth = async () => {
      try {
        console.log('AuthInitializer: Verifying session with backend...');
        const userResponse = await withTimeout(apiClient.get('/auth/me'), 8000, 'GET /auth/me');

        if (userResponse.data) {
          console.log('AuthInitializer: Session verified for:', userResponse.data.email);
          const userData = {
            user_id: userResponse.data.user_id,
            email: userResponse.data.email,
            subscription_tier: userResponse.data.subscription_tier,
            display_name: userResponse.data.display_name,
            name: userResponse.data.real_name,
            nickname: userResponse.data.nickname,
            avatar: userResponse.data.profile?.photos?.[0],
            photos: userResponse.data.profile?.photos,
          };

          dispatch(setCredentials({ user: userData }));

          // Fetch user preferences (Theme) — isolated, never blocks init
          try {
            const settingsResponse = await withTimeout(apiClient.get('/settings/me'), 5000, 'GET /settings/me');
            if (settingsResponse.data) {
              loadPreferences({
                theme_mode: settingsResponse.data.theme_mode,
                visual_theme: settingsResponse.data.visual_theme,
                font_size: settingsResponse.data.font_size,
              });

              if (settingsResponse.data.preferred_language) {
                const currentLocale = router.locale || router.defaultLocale || 'es';
                const defaultLocale = router.defaultLocale || 'en';
                const configuredLocales = (router.locales as string[] | undefined) ?? [];

                const prefixRe = configuredLocales.length
                  ? new RegExp(`^/(?:${configuredLocales.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})+(?=/|$)`)
                  : new RegExp(`^/${currentLocale}(?=/|$)`);
                const pathWithoutLocale = window.location.pathname.replace(prefixRe, '') || '/';

                const targetPrefix =
                  settingsResponse.data.preferred_language === defaultLocale
                    ? ''
                    : `/${settingsResponse.data.preferred_language}`;
                const targetPath = `${targetPrefix}${pathWithoutLocale}${window.location.search}${window.location.hash}`;

                if (
                  settingsResponse.data.preferred_language !== currentLocale ||
                  targetPath !== window.location.pathname + window.location.search + window.location.hash
                ) {
                  document.cookie = `NEXT_LOCALE=${settingsResponse.data.preferred_language}; path=/; max-age=31536000; SameSite=Lax`;
                  window.location.href = targetPath;
                  return;
                }
              }
            }
          } catch (err) {
            console.warn('AuthInitializer: Could not load user settings', err);
          }

          // Sync Avatar with Media service — isolated, never blocks init
          try {
            const mediaResponse = await withTimeout(
              apiClient.get(`/media/${userData.user_id}`),
              5000,
              'GET /media',
            );
            const photoItems = (mediaResponse.data || []).filter(
              (item: any) => item.type?.toLowerCase() === 'photo',
            );
            if (photoItems.length > 0) {
              dispatch(updateUserAvatar(photoItems[0].url));
            }
          } catch (error) {
            console.warn('AuthInitializer: Failed to sync avatar from media:', error);
          }
        }
      } catch (e: any) {
        if (e.response?.status === 401) {
          console.log('AuthInitializer: No active session (401).');
        } else if (e.message?.includes('timeout')) {
          console.warn('AuthInitializer: Hydration timeout:', e.message);
        } else {
          console.error('AuthInitializer: Error during hydration:', e);
        }
      } finally {
        clearTimeout(safetyTimer);
        dispatch(setInitialized(true));
      }
    };

    initAuth();
    return () => clearTimeout(safetyTimer);
    // loadPreferences is memoized via useCallback in ThemeContext, router deps are stable primitives
  }, [dispatch, loadPreferences, router.pathname, router.locale, router.locales, router.defaultLocale, isInitialized, user]);

  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#000000',
        }}
      >
        <YukiLoader message="Preparando tu experiencia..." size={140} />
      </Box>
    );
  }

  return <>{children}</>;
}
