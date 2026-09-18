import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Box, CircularProgress } from '@mui/material';
import { useAdminSessionHydration } from '../../hooks/useAdminSessionHydration';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.adminAuth);

  // Initialize/Hydrate admin session if needed
  useAdminSessionHydration();

  useEffect(() => {
    if (!isInitialized) {
      // Wait for session hydration
      return;
    }

    // Check if we're on an admin route
    const isAdminRoute = router.pathname.startsWith('/portal-redthread');
    const isAdminAuthRoute = router.pathname.startsWith('/portal-redthread/auth');

    if (isAdminRoute && !isAdminAuthRoute && !isAuthenticated) {
      // Redirect to admin login if not authenticated
      router.push('/portal-redthread/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Show loading while checking authentication
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Block admin pages until authenticated
  const isAdminRoute = router.pathname.startsWith('/portal-redthread');
  const isAdminAuthRoute = router.pathname.startsWith('/portal-redthread/auth');
  if (isAdminRoute && !isAdminAuthRoute && !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
