'use client';

import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed left-64 right-0 top-0 z-10">
      <div className="flex items-center justify-between h-full px-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Bienvenido, {user?.name}
          </h2>
          <p className="text-sm text-gray-600">
            {user?.role?.name} - {user?.area?.name || 'Sin área asignada'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
