import { create } from 'zustand';
import api from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  username?: string;
  role_id: number;
  role?: {
    id: number;
    name: string;
    description: string;
    level: number;
  };
  area?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  effective_permissions?: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;

  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  updateUser: (user: AuthUser) => void;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,

  setAuth: (token: string, user: AuthUser) => {
    // Access token lives in sessionStorage (cleared on tab/browser close)
    // and in Zustand memory for synchronous reads within the same session.
    sessionStorage.setItem('access_token', token);
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    sessionStorage.removeItem('access_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (user: AuthUser) => set({ user }),

  login: async (login: string, password: string) => {
    // Response sets httpOnly refresh cookie automatically
    const { data } = await api.post('/auth/login', { login, password });
    sessionStorage.setItem('access_token', data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      // Sends httpOnly cookie to server for revocation
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      sessionStorage.removeItem('access_token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    set({ loading: true });

    // On page load: try to use existing access token or refresh silently
    const existingToken = sessionStorage.getItem('access_token') ?? get().token;

    try {
      if (existingToken) {
        // Validate existing token
        const { data } = await api.get('/auth/me');
        set({ user: data, token: existingToken, isAuthenticated: true });
      } else {
        // No access token — try silent refresh via httpOnly cookie
        const { data } = await api.post('/auth/refresh');
        sessionStorage.setItem('access_token', data.token);
        set({ token: data.token, user: data.user, isAuthenticated: true });
      }
    } catch {
      sessionStorage.removeItem('access_token');
      set({ token: null, user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },
}));
