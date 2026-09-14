import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import adminApiClient from '../services/adminApi';
import { setAdminCredentials, setAdminInitialized } from '../store/slices/adminAuthSlice';

export const useAdminSessionHydration = () => {
  const dispatch = useDispatch();

  const { isInitialized } = useSelector((state: any) => state.adminAuth);

  useEffect(() => {
    if (isInitialized) return;

    const hydrateAdminSession = async () => {
      try {
        const response = await adminApiClient.get('/portal-redthread/auth/me');
        const employee = response.data;

        dispatch(setAdminCredentials({
          user: {
            id: employee.id,
            email: employee.email,
            first_name: employee.first_name,
            last_name: employee.last_name,
            role: employee.roles?.[0] ?? '',
            area: employee.department_id,
            avatar: employee.avatar,
          },
        }));
      } catch (error) {
        // No valid session (401) - stays unauthenticated
      } finally {
        dispatch(setAdminInitialized(true));
      }
    };

    hydrateAdminSession();
  }, [dispatch, isInitialized]);
};