import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Profile {
  user_id: string;
  display_name: string;
  age: number;
  gender: string;
  bio?: string;
  photos: string[];
  interests: string[];
  intentions: string[];
  mbti?: string;
  languages: string[];
  profile_completion: number;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
      state.error = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<Profile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
});

export const { setProfile, updateProfile, setLoading, setError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
