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
  password_expires_at?: string | null;
}

// Special errors thrown by login() to signal 2FA redirects
export class TwoFactorRequired extends Error {
  constructor(public challengeToken: string) {
    super('REQUIRES_2FA');
  }
}
export class TwoFactorSetupRequired extends Error {
  constructor(public setupToken: string) {
    super('REQUIRES_2FA_SETUP');
  }
}
export class PasswordExpired extends Error {
  constructor() {
    super('PASSWORD_EXPIRED');
  }
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
  loading: true,

  setAuth: (token: string, user: AuthUser) => {
    sessionStorage.setItem('access_token', token);
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('2fa_challenge_token');
    sessionStorage.removeItem('2fa_setup_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (user: AuthUser) => set({ user }),

  login: async (login: string, password: string) => {
    const { data } = await api.post('/auth/login', { login, password });

    if (data.requires_2fa) {
      sessionStorage.setItem('2fa_challenge_token', data.challenge_token);
      throw new TwoFactorRequired(data.challenge_token);
    }

    if (data.requires_2fa_setup) {
      sessionStorage.setItem('2fa_setup_token', data.setup_token);
      throw new TwoFactorSetupRequired(data.setup_token);
    }

    sessionStorage.setItem('access_token', data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('2fa_challenge_token');
      sessionStorage.removeItem('2fa_setup_token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    const existingToken = sessionStorage.getItem('access_token') ?? get().token;

    try {
      if (existingToken) {
        const { data } = await api.get('/auth/me');
        set({ user: data, token: existingToken, isAuthenticated: true });
      } else {
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
