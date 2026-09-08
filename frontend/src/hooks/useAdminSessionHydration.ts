import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { setAdminCredentials, setAdminInitialized } from '../store/slices/adminAuthSlice';

export const useAdminSessionHydration = () => {
  const dispatch = useDispatch();

  const { isInitialized } = useSelector((state: any) => state.adminAuth);

  useEffect(() => {
    if (isInitialized) return;

    const hydrateAdminSession = () => {
      try {
        console.log('[DEBUG] useAdminSessionHydration running...');
        const adminAccessToken = Cookies.get('admin_access_token');
        const adminRefreshToken = Cookies.get('admin_refresh_token');
        const adminUserStr = Cookies.get('admin_user');
        console.log('[DEBUG] Cookies found:', { 
          access: !!adminAccessToken, 
          refresh: !!adminRefreshToken, 
          user: !!adminUserStr 
        });

        if (adminAccessToken && adminRefreshToken && adminUserStr) {
          const adminUser = JSON.parse(adminUserStr);
          
          dispatch(setAdminCredentials({
            user: adminUser,
            access_token: adminAccessToken,
            refresh_token: adminRefreshToken,
            skipCookies: true, // Don't re-save cookies during hydration
          }));
        }
      } catch (error) {
        console.error('Failed to hydrate admin session:', error);
        // Clear corrupted data
        Cookies.remove('admin_access_token');
        Cookies.remove('admin_refresh_token');
        Cookies.remove('admin_user');
      } finally {
        dispatch(setAdminInitialized(true));
      }
    };

    hydrateAdminSession();
  }, [dispatch, isInitialized]);
};
