'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import CreateRoleModal from '@/components/CreateRoleModal';
import CreatePermissionModal from '@/components/CreatePermissionModal';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  level: number;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  action_type: 'create' | 'read' | 'update' | 'delete' | 'special';
  is_active: boolean;
  is_granted?: boolean;
}

interface Module {
  id: number;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  route: string;
  is_active: boolean;
  order_index: number;
  permissions: Permission[];
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showCreatePermissionModal, setShowCreatePermissionModal] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadRolePermissions = async (roleId: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/permissions/roles/${roleId}`);
      setModules(data);
    } catch (error) {
      console.error('Error loading role permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    loadRolePermissions(role.id);
  };

  const togglePermission = (moduleId: number, permissionId: number, currentValue: boolean) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          permissions: module.permissions.map(perm =>
            perm.id === permissionId
              ? { ...perm, is_granted: !currentValue }
              : perm
          )
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    
    setSaving(true);
    try {
      const permissionsToSave: Array<{permission_id: number, is_granted: boolean}> = [];
      modules.forEach(module => {
        module.permissions.forEach(perm => {
          permissionsToSave.push({
            permission_id: perm.id,
            is_granted: perm.is_granted || false
          });
        });
      });

      await api.post(`/permissions/roles/${selectedRole.id}`, {
        permissions: permissionsToSave
      });

      alert('Permisos guardados exitosamente');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="p-8">
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowCreatePermissionModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          + Nuevo Permiso
        </button>
        <button
          onClick={() => setShowCreateRoleModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo Rol
        </button>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Columna izquierda: Lista de roles */}
        <div className="col-span-3 bg-white rounded-lg shadow p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Roles</h2>
            <p className="text-sm text-gray-600">Selecciona un rol para gestionar permisos</p>
          </div>
          
          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left p-3 rounded transition ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-100 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-semibold">{role.display_name || role.name}</p>
                <p className="text-xs text-gray-500 capitalize">{role.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Nivel {role.level}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha: Matriz de permisos */}
        <div className="col-span-9 bg-white rounded-lg shadow p-6">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRole.display_name}</h2>
                  <p className="text-gray-600">{selectedRole.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Rol: {selectedRole.name}</p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? '💾 Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando permisos...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {modules.map(module => (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{module.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{module.display_name}</h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {module.permissions.length} permisos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {module.permissions.map(permission => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 p-3 rounded border hover:bg-gray-50 cursor-pointer transition"
                          >
                            <input
                              type="checkbox"
                              checked={permission.is_granted || false}
                              onChange={() => togglePermission(module.id, permission.id, permission.is_granted || false)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{permission.display_name}</p>
                              <p className="text-xs text-gray-500">{permission.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{getActionTypeIcon(permission.action_type)}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getActionTypeColor(permission.action_type)}`}>
                                {permission.action_type}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2">Selecciona un rol</h3>
              <p>Para gestionar los permisos, selecciona un rol de la lista izquierda</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreateRoleModal && (
        <CreateRoleModal
          isOpen={showCreateRoleModal}
          onClose={() => setShowCreateRoleModal(false)}
          onSuccess={() => {
            setShowCreateRoleModal(false);
            loadRoles();
          }}
        />
      )}

      {showCreatePermissionModal && (
        <CreatePermissionModal
          isOpen={showCreatePermissionModal}
          onClose={() => setShowCreatePermissionModal(false)}
          onSuccess={() => {
            setShowCreatePermissionModal(false);
            if (selectedRole) {
              loadRolePermissions(selectedRole.id);
            }
          }}
        />
      )}
    </div>
  );
}
