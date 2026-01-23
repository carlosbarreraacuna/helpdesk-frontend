'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Check if we have a token but no user data
    if (token && !user) {
      // Try to get user data from localStorage
      const storedUser = localStorage.getItem('auth-user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          useAuthStore.getState().updateUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          useAuthStore.getState().clearAuth();
          router.push('/login');
        }
      } else {
        useAuthStore.getState().clearAuth();
        router.push('/login');
      }
    } else if (!token || !isAuthenticated) {
      router.push('/login');
    }
  }, [token, isAuthenticated, user, router]);

  if (!token || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
