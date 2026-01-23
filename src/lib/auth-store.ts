import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
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
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string, user: User) => {
        localStorage.setItem('auth-token', token);
        set({ token, user, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (user: User) => {
        set({ user });
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
