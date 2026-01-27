'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TopbarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({ sidebarOpen = true, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Configuración del breadcrumb
  const breadcrumbConfig = {
    '/dashboard': {
      title: 'Dashboard',
      subtitle: 'Resumen general del sistema de tickets'
    },
    '/tickets': {
      title: 'Gestión de Tickets',
      subtitle: 'Administra los tickets de soporte'
    },
    '/reports': {
      title: 'Reportes e Indicadores',
      subtitle: 'Dashboard de métricas y estadísticas - Administrador'
    },
    '/admin/users': {
      title: 'Gestión de Usuarios',
      subtitle: 'Administra los usuarios del sistema'
    },
    '/admin/roles-permissions': {
      title: 'Gestión de Roles y Permisos',
      subtitle: 'Administra los roles y permisos del sistema'
    },
    '/admin/areas': {
      title: 'Gestión de Áreas',
      subtitle: 'Administra las áreas del sistema'
    },
    '/admin/menu': {
      title: 'Configuración del Menú',
      subtitle: 'Gestiona los items del sidebar y asigna por rol'
    }
  };

  // Obtener la información del breadcrumb actual
  const getCurrentBreadcrumb = () => {
    // Buscar coincidencia exacta primero
    if (breadcrumbConfig[pathname as keyof typeof breadcrumbConfig]) {
      return breadcrumbConfig[pathname as keyof typeof breadcrumbConfig];
    }
    
    // Buscar coincidencias parciales para rutas dinámicas
    if (pathname.startsWith('/tickets/')) {
      return breadcrumbConfig['/tickets'];
    }
    
    // Valor por defecto
    return {
      title: 'Dashboard',
      subtitle: 'Resumen general del sistema de tickets'
    };
  };

  const currentBreadcrumb = getCurrentBreadcrumb();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Botón de hamburguesa y breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Botón de hamburguesa - visible en móvil, opcional en desktop */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
          </button>
          
          {/* Breadcrumb */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {currentBreadcrumb.title}
            </h2>
            {currentBreadcrumb.subtitle && (
              <p className="text-sm text-gray-600">
                {currentBreadcrumb.subtitle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Icons.Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Icons.Mail className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-green-500 rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Icons.User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icons.Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icons.Bell className="mr-2 h-4 w-4" />
                <span>Notificaciones</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <Icons.LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
