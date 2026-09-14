import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
      action: PayloadAction<{ user: AdminUser; access_token?: string; refresh_token?: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access_token ?? null;
      state.refreshToken = action.payload.refresh_token ?? null;
      state.isAuthenticated = true;
    },
    logoutAdmin: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
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