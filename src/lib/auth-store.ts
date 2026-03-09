import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Acciones
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  updateUser: (user: AuthUser) => void;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,

      setAuth: (token: string, user: AuthUser) => {
        localStorage.setItem('auth-token', token);
        set({ token, user, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (user: AuthUser) => {
        set({ user });
      },

      login: async (login: string, password: string) => {
        const { data } = await api.post('/auth/login', { login, password });
        localStorage.setItem('auth-token', data.token);
        localStorage.setItem('auth-user', JSON.stringify(data.user));
        set({ token: data.token, user: data.user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignorar error de red al cerrar sesión
        } finally {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        set({ loading: true });
        // Migrar clave antigua si existe
        const oldToken = localStorage.getItem('token');
        if (oldToken && !localStorage.getItem('auth-token')) {
          localStorage.setItem('auth-token', oldToken);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }

        const token = get().token ?? localStorage.getItem('auth-token');
        if (!token) {
          set({ loading: false, isAuthenticated: false });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          set({ user: data, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          set({ token: null, user: null, isAuthenticated: false });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
