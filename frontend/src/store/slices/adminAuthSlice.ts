import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  area?: string;
  avatar?: string;
}

interface AdminAuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isInitialized: boolean;
}

const initialState: AdminAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  isInitialized: false,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    setAdminCredentials: (
      state,
      action: PayloadAction<{ user: AdminUser; access_token: string; refresh_token: string; skipCookies?: boolean }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.isAuthenticated = true;
      
      // Only save to cookies if not skipped (to avoid redundant saves during hydration)
      if (!action.payload.skipCookies) {
        Cookies.set('admin_access_token', action.payload.access_token, { expires: 7, sameSite: 'lax', path: '/' });
        Cookies.set('admin_refresh_token', action.payload.refresh_token, { expires: 7, sameSite: 'lax', path: '/' });
        Cookies.set('admin_user', JSON.stringify(action.payload.user), { expires: 7, sameSite: 'lax', path: '/' });
      }
    },
    logoutAdmin: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Clear cookies
      Cookies.remove('admin_access_token', { path: '/' });
      Cookies.remove('admin_refresh_token', { path: '/' });
      Cookies.remove('admin_user', { path: '/' });
    },
    setAdminLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAdminInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setAdminCredentials, logoutAdmin, setAdminLoading, setAdminInitialized } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
