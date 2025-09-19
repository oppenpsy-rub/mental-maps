import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../../types';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem('token');
    },
    setParticipantSession: (state, action: PayloadAction<{ sessionToken: string }>) => {
      state.token = action.payload.sessionToken;
      state.isAuthenticated = true;
      state.user = {
        id: 'participant',
        email: '',
        name: 'Participant',
        role: 'participant',
      };
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setParticipantSession } = authSlice.actions;
export default authSlice.reducer;