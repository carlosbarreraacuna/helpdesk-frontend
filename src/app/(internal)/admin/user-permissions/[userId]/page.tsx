'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  action_type: string;
  pivot?: {
    is_granted: boolean;
  };
}

interface Module {
  id: number;
  name: string;
  display_name: string;
  icon: string;
  permissions: Permission[];
}

export default function UserPermissionsPage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserPermissions();
      loadAllPermissions();
    }
  }, [userId]);

  const loadUserPermissions = async () => {
    try {
      const { data } = await api.get(`/permissions/users/${userId}`);
      setUser(data.user);
      setRolePermissions(data.role_permissions);
      setUserPermissions(data.user_permissions);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const { data } = await api.get('/permissions');
      setAllModules(data);
    } catch (error) {
      console.error('Error loading all permissions:', error);
    }
  };

  const toggleUserPermission = async (permissionId: number) => {
    setUpdating(true);
    try {
      await api.post(`/permissions/users/${userId}/toggle`, {
        permission_id: permissionId
      });
      loadUserPermissions();
    } catch (error) {
      console.error('Error toggling permission:', error);
      alert('Error al actualizar permiso');
    } finally {
      setUpdating(false);
    }
  };

  const getPermissionStatus = (permissionId: number) => {
    // Check if user has explicit permission
    const userPermission = userPermissions.find(p => p.id === permissionId);
    if (userPermission) {
      return {
        granted: userPermission.pivot?.is_granted || false,
        isOverride: true
      };
    }
    
    // Check role permission
    const rolePermission = rolePermissions.find(p => p.id === permissionId);
    return {
      granted: rolePermission?.pivot?.is_granted || false,
      isOverride: false
    };
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'special': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return '➕';
      case 'read': return '👁️';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'special': return '⚡';
      default: return '❓';
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Permisos Especiales de Usuario</h1>
        <div className="mt-2">
          <p className="text-gray-600">Usuario: <span className="font-semibold">{user.name}</span></p>
          <p className="text-sm text-gray-500">Email: {user.email}</p>
          <p className="text-sm text-gray-500">Rol base: <span className="font-medium">{user.role.display_name}</span></p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Permisos Especiales</h3>
        <p className="text-sm text-yellow-800">
          Los permisos configurados aquí sobrescriben los permisos del rol. 
          Úsalos solo cuando un usuario específico necesite acceso excepcional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permisos del Rol */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">Permisos del Rol</h2>
          <p className="text-sm text-gray-600 mb-4">
            Permisos heredados del rol: {user.role.display_name}
          </p>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rolePermissions.filter(p => p.pivot?.is_granted).map(permission => (
              <div key={permission.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-green-600">✓</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{permission.display_name}</p>
                  <p className="text-xs text-gray-500">{permission.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getActionTypeColor(permission.action_type)}`}>
                  {getActionTypeIcon(permission.action_type)} {permission.action_type}
                </span>
              </div>
            ))}
            {rolePermissions.filter(p => p.pivot?.is_granted).length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay permisos asignados al rol</p>
            )}
          </div>
        </div>

        {/* Permisos Especiales del Usuario */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">Permisos Especiales</h2>
          <p className="text-sm text-gray-600 mb-4">
            Permisos específicos para este usuario
          </p>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allModules.map(module => (
              <div key={module.id} className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{module.icon}</span>
                  <h3 className="font-semibold text-sm">{module.display_name}</h3>
                </div>
                
                <div className="space-y-2">
                  {module.permissions.map(permission => {
                    const status = getPermissionStatus(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={status.granted}
                          onChange={() => toggleUserPermission(permission.id)}
                          disabled={updating}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium">{permission.display_name}</p>
                          <p className="text-xs text-gray-500">{permission.name}</p>
                        </div>
                        {status.isOverride && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Especial
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${getActionTypeColor(permission.action_type)}`}>
                          {getActionTypeIcon(permission.action_type)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {updating && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Actualizando permisos...
        </div>
      )}
    </div>
  );
}
