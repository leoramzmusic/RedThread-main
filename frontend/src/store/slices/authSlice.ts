import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  user_id: string;
  email: string;
  subscription_tier: string;
  display_name?: string;
  name?: string;
  nickname?: string;
  avatar?: string;
  photos?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User }>
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    updateUserAvatar: (state, action: PayloadAction<string | undefined>) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      
      // LocalStorage is no longer for auth, but still clear it for a fresh state
      localStorage.clear();
      sessionStorage.clear();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setCredentials, updateUserAvatar, logout, setLoading, setInitialized } = authSlice.actions;
export default authSlice.reducer;
