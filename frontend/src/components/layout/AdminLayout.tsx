import { ReactNode, useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import AdminSidebar from './AdminSidebar';;

interface AdminLayoutProps {
  children: ReactNode;
}

import AdminNavbar from './AdminNavbar';

import { useAdminSessionHydration } from '../../hooks/useAdminSessionHydration';

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.adminAuth);

  // Show loading while checking authentication
  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      boxSizing: 'border-box',
      '*': { boxSizing: 'border-box' }
    }}>

      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <AdminNavbar sidebarCollapsed={sidebarCollapsed} />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
