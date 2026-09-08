import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logoutAdmin } from '../../store/slices/adminAuthSlice';
import { useAppTheme } from '../../context/ThemeContext';
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from './AdminSidebar';

interface AdminNavbarProps {
  sidebarCollapsed?: boolean;
}

export default function AdminNavbar({ sidebarCollapsed = false }: AdminNavbarProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.adminAuth);
  const { mode, toggleMode } = useAppTheme();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  // Calculate navbar offset based on sidebar state
  const drawerWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logoutAdmin());
    router.push('/portal-redthread/auth/login'); // Redirect to admin login page
    handleCloseUserMenu();
  };

  // Helper to get full image URL
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };

  const displayAvatar = getImageUrl(user?.avatar);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxSizing: 'border-box',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', gap: 1, minHeight: '72px !important', px: 3 }}>
        {/* Theme Toggle Button */}
        <Tooltip title={mode === 'light' ? 'Modo Oscuro' : 'Modo Claro'}>
          <IconButton onClick={toggleMode} color="inherit">
            {mode === 'light' ? <Brightness4 sx={{ fontSize: '1.4rem' }} /> : <Brightness7 sx={{ fontSize: '1.4rem' }} />}
          </IconButton>
        </Tooltip>

        {/* User Avatar & Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', fontSize: '0.85rem' }}>
            {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email}
          </Typography>
          <Tooltip title="Cuenta">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5 }}>
              <Avatar
                alt={user?.email}
                src={displayAvatar || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.9rem'
                }}
              >
                {!displayAvatar && user?.first_name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          sx={{ mt: '45px' }}
          id="menu-appbar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Admin'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />

          <MenuItem onClick={() => { router.push('/profile'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <Typography textAlign="center">Mi Perfil</Typography>
          </MenuItem>

          <MenuItem onClick={() => { router.push('/portal-redthread/me/settings'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <Typography textAlign="center">Configuración</Typography>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography textAlign="center" color="error">Cerrar Sesión</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
