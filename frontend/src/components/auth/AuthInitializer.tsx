import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setCredentials, updateUserAvatar, setInitialized } from '../../store/slices/authSlice';
import { setAdminCredentials, setAdminInitialized } from '../../store/slices/adminAuthSlice';
import apiClient from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import { RootState } from '../../store/store';
import { Box } from '@mui/material';
import YukiLoader from '../common/YukiLoader';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loadPreferences } = useAppTheme();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Skip user auth initialization on admin routes
    const isAdminRoute = router.pathname.startsWith('/portal-redthread');

    if (isAdminRoute) {
      console.log('AuthInitializer: Admin route detected, skipping user auth hydration.');
      dispatch(setInitialized(true));
      return;
    }

    // Hydrate user session from HttpOnly cookies via /auth/me
    const initAuth = async () => {
      // If already initialized and has user, no need to re-verify
      if (isInitialized && user) {
        console.log('AuthInitializer: Already initialized with user:', user.email);
        return;
      }

      try {
        console.log('AuthInitializer: Verifying session with backend...');
        const userResponse = await apiClient.get('/auth/me');

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

          // Fetch user preferences (Theme)
          try {
            const settingsResponse = await apiClient.get('/settings/me');
            if (settingsResponse.data) {
              loadPreferences({
                theme_mode: settingsResponse.data.theme_mode,
                visual_theme: settingsResponse.data.visual_theme,
                font_size: settingsResponse.data.font_size
              });

              if (settingsResponse.data.preferred_language) {
                const currentLocale = router.locale || router.defaultLocale || 'es';
                const defaultLocale = router.defaultLocale || 'es';
                const configuredLocales = (router.locales as string[] | undefined) ?? [];

                const prefixRe = configuredLocales.length
                  ? new RegExp(`^/(?:${configuredLocales.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})+(?=/|$)`)
                  : new RegExp(`^/${currentLocale}(?=/|$)`);
                const pathWithoutLocale = window.location.pathname.replace(prefixRe, '') || '/';

                const targetPrefix = settingsResponse.data.preferred_language === defaultLocale
                  ? ''
                  : `/${settingsResponse.data.preferred_language}`;
                const targetPath = `${targetPrefix}${pathWithoutLocale}${window.location.search}${window.location.hash}`;

                if (settingsResponse.data.preferred_language !== currentLocale
                    || targetPath !== window.location.pathname + window.location.search + window.location.hash) {
                  document.cookie = `NEXT_LOCALE=${settingsResponse.data.preferred_language}; path=/; max-age=31536000`;
                  window.location.href = targetPath;
                }
              }
            }
          } catch (err) {
            console.warn('AuthInitializer: Could not load user settings', err);
          }

          // Sync Avatar with Media service
          try {
            const mediaResponse = await apiClient.get(`/media/${userData.user_id}`);
            const photoItems = mediaResponse.data.filter((item: any) => item.type?.toLowerCase() === 'photo');
            if (photoItems.length > 0) {
              dispatch(updateUserAvatar(photoItems[0].url));
            }
          } catch (error) {
            console.error('AuthInitializer: Failed to sync avatar from media:', error);
          }
        }
      } catch (e: any) {
        if (e.response?.status === 401) {
          console.log('AuthInitializer: No active session (401).');
        } else {
          console.error('AuthInitializer: Error during hydration:', e);
        }
      } finally {
        dispatch(setInitialized(true));
      }
    };

    initAuth();
  }, [dispatch, loadPreferences, router, isInitialized, user]);

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

