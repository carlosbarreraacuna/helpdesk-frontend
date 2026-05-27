import { useAuthStore } from './auth-store';

/**
 * Verifica si el usuario autenticado tiene un permiso específico.
 * Los permisos vienen de /auth/me como effective_permissions (ya resueltos:
 * overrides de usuario tienen prioridad sobre permisos del rol).
 *
 * Uso: const canDelete = usePermission('tickets.delete');
 */
export function usePermission(permission: string): boolean {
  const user = useAuthStore(s => s.user);
  if (!user) return false;
  return user.effective_permissions?.includes(permission) ?? false;
}

/**
 * Verifica si el usuario tiene TODOS los permisos de la lista.
 */
export function usePermissions(permissions: string[]): boolean {
  const user = useAuthStore(s => s.user);
  if (!user) return false;
  const effective = user.effective_permissions ?? [];
  return permissions.every(p => effective.includes(p));
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos de la lista.
 */
export function useAnyPermission(permissions: string[]): boolean {
  const user = useAuthStore(s => s.user);
  if (!user) return false;
  const effective = user.effective_permissions ?? [];
  return permissions.some(p => effective.includes(p));
}
