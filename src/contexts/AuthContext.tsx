'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: any;
  area: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar autenticación al montar
  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar autenticación al cambiar de ruta
  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/portal')) {
      router.push('/login');
    }
  }, [pathname, user, loading]);

  const checkAuth = async () => {
    // Migrar clave antigua 'token' → 'auth-token' si existe
    const oldToken = localStorage.getItem('token');
    if (oldToken && !localStorage.getItem('auth-token')) {
      localStorage.setItem('auth-token', oldToken);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (login: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { login, password });
      
      // Guardar token y usuario
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('auth-user', JSON.stringify(data.user));
      
      setUser(data.user);
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
