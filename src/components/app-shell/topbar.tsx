'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
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
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Configuración del breadcrumb
  const breadcrumbConfig: Record<string, { title: string; subtitle: string }> = {
    // Dashboard
    '/dashboard': {
      title: 'Dashboard',
      subtitle: 'Resumen general del sistema de tickets',
    },
    // Tickets
    '/tickets': {
      title: 'Gestión de Tickets',
      subtitle: 'Administra los tickets de soporte',
    },
    // Reportes
    '/reports': {
      title: 'Reportes e Indicadores',
      subtitle: 'Métricas y estadísticas del sistema',
    },
    // Reuniones
    '/meetings': {
      title: 'Reuniones y Videollamadas',
      subtitle: 'Gestiona las reuniones con usuarios',
    },
    // Base de conocimiento
    '/knowledge-base': {
      title: 'Base de Conocimiento',
      subtitle: 'Artículos y documentación del equipo',
    },
    '/knowledge-base/manage': {
      title: 'Gestión de Conocimiento',
      subtitle: 'Administra categorías, etiquetas y artículos',
    },
    '/knowledge-base/new': {
      title: 'Nuevo Artículo',
      subtitle: 'Crea un nuevo artículo en la base de conocimiento',
    },
    // Inventario
    '/inventory/assets': {
      title: 'Inventario de Activos',
      subtitle: 'Gestiona los activos tecnológicos de la organización',
    },
    '/inventory/assets/new': {
      title: 'Nuevo Activo',
      subtitle: 'Registra un nuevo activo en el inventario',
    },
    '/inventory/maintenances': {
      title: 'Mantenimientos',
      subtitle: 'Gestiona los mantenimientos de activos',
    },
    '/inventory/maintenances/new': {
      title: 'Nuevo Mantenimiento',
      subtitle: 'Registra un nuevo mantenimiento',
    },
    '/inventory/manage': {
      title: 'Administración de Inventario',
      subtitle: 'Gestiona tipos de activos, ubicaciones y proveedores',
    },
    // Configuración personal
    '/settings/security': {
      title: 'Seguridad de la cuenta',
      subtitle: 'Gestiona la autenticación y la contraseña de tu cuenta',
    },
    '/settings/integrations': {
      title: 'Integraciones',
      subtitle: 'Configura las integraciones con servicios externos',
    },
    // Administración
    '/admin/users': {
      title: 'Gestión de Usuarios',
      subtitle: 'Administra los usuarios del sistema',
    },
    '/admin/roles-permissions': {
      title: 'Roles y Permisos',
      subtitle: 'Administra los roles y permisos del sistema',
    },
    '/admin/areas': {
      title: 'Gestión de Áreas',
      subtitle: 'Administra las áreas del sistema',
    },
    '/admin/grupos': {
      title: 'Grupos de Trabajo',
      subtitle: 'Administra los grupos y reglas de asignación automática',
    },
    '/admin/menu': {
      title: 'Configuración del Menú',
      subtitle: 'Gestiona los ítems del sidebar y asígnalos por rol',
    },
    '/admin/email-channels': {
      title: 'Canales de Email',
      subtitle: 'Configura las cuentas de correo del sistema',
    },
    '/admin/sla': {
      title: 'Configuración de SLA',
      subtitle: 'Define los tiempos de respuesta y resolución por prioridad',
    },
    '/admin/sla-reportes': {
      title: 'Reportes de SLA',
      subtitle: 'Análisis de cumplimiento de niveles de servicio',
    },
    '/admin/reports-config': {
      title: 'Configuración de Reportes',
      subtitle: 'Gestiona las plantillas de reportes por rol',
    },
    '/admin/audit-log': {
      title: 'Registro de Auditoría',
      subtitle: 'Historial de actividad y cambios del sistema',
    },
    '/admin/backups': {
      title: 'Copias de Seguridad',
      subtitle: 'Gestiona las copias de seguridad del sistema',
    },
    '/admin/security': {
      title: 'Seguridad del sistema',
      subtitle: 'Configuración global de autenticación para todos los usuarios',
    },
  };

  // Obtener la información del breadcrumb actual
  const getCurrentBreadcrumb = () => {
    if (breadcrumbConfig[pathname]) {
      return breadcrumbConfig[pathname];
    }
    if (pathname.startsWith('/tickets/')) {
      return { title: 'Detalle de Ticket', subtitle: 'Información y seguimiento del ticket' };
    }
    if (pathname.startsWith('/knowledge-base/') && pathname.endsWith('/edit')) {
      return { title: 'Editar Artículo', subtitle: 'Modifica el artículo de la base de conocimiento' };
    }
    if (pathname.startsWith('/knowledge-base/')) {
      return { title: 'Artículo', subtitle: 'Contenido de la base de conocimiento' };
    }
    if (pathname.startsWith('/inventory/assets/') && pathname.endsWith('/edit')) {
      return { title: 'Editar Activo', subtitle: 'Modifica la información del activo' };
    }
    if (pathname.startsWith('/inventory/assets/')) {
      return { title: 'Detalle de Activo', subtitle: 'Información y estado del activo' };
    }
    if (pathname.startsWith('/inventory/maintenances/')) {
      return { title: 'Detalle de Mantenimiento', subtitle: 'Información del mantenimiento' };
    }
    if (pathname.startsWith('/inventory/profile/')) {
      return { title: 'Perfil Tecnológico', subtitle: 'Activos y software asignados al usuario' };
    }
    if (pathname.startsWith('/admin/user-permissions/')) {
      return { title: 'Permisos de Usuario', subtitle: 'Gestiona los permisos especiales del usuario' };
    }
    return { title: 'Dashboard', subtitle: 'Resumen general del sistema de tickets' };
  };

  const currentBreadcrumb = getCurrentBreadcrumb();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 shrink-0">
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
          
          {mounted ? (
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
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-100" />
          )}
        </div>
      </div>
    </div>
  );
}
