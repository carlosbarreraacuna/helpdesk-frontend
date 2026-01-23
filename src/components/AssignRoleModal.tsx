'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: {
    id: number;
    name: string;
    display_name: string;
  };
  permissions?: Array<{
    id: number;
    display_name: string;
  }>;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  level: number;
}

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  roles: Role[];
}

export default function AssignRoleModal({ isOpen, onClose, onSuccess, user, roles }: AssignRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [clearPermissions, setClearPermissions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedRoleId(user.role_id.toString());
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoleId) {
      loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const loadRolePermissions = async (roleId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/permissions/roles/${roleId}`);
      const allPermissions: any[] = [];
      data.forEach((module: any) => {
        module.permissions.forEach((perm: any) => {
          if (perm.is_granted) {
            allPermissions.push(perm);
          }
        });
      });
      setRolePermissions(allPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post(`/users/${user!.id}/assign-role`, {
        role_id: parseInt(selectedRoleId),
        clear_special_permissions: clearPermissions,
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert('Error al asignar rol');
    }
  };

  if (!isOpen || !user) return null;

  const selectedRole = roles.find(r => r.id.toString() === selectedRoleId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">Asignar Rol</h2>
        <p className="text-gray-600 mb-6">Usuario: <strong>{user.name}</strong></p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Rol */}
          <div>
            <label className="block text-sm font-medium mb-2">Seleccionar Rol</label>
            <select
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.display_name} (Nivel {role.level})
                </option>
              ))}
            </select>
          </div>

          {/* Vista previa de permisos del rol */}
          {selectedRoleId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">
                📋 Permisos que obtendrá con este rol:
              </h3>
              
              {loading ? (
                <p className="text-blue-700">Cargando permisos...</p>
              ) : rolePermissions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {rolePermissions.map(perm => (
                    <div key={perm.id} className="flex items-center gap-2 bg-white rounded p-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">{perm.display_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-700">Este rol no tiene permisos asignados</p>
              )}

              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Total de permisos: <span className="font-bold">{rolePermissions.length}</span>
                </p>
              </div>
            </div>
          )}

          {/* Opciones adicionales */}
          {user.permissions && user.permissions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="clearPermissions"
                  checked={clearPermissions}
                  onChange={(e) => setClearPermissions(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="clearPermissions" className="text-sm">
                  <span className="font-medium text-yellow-900">
                    Limpiar permisos especiales del usuario
                  </span>
                  <p className="text-yellow-700 mt-1">
                    Este usuario tiene {user.permissions.length} permiso(s) especial(es) asignado(s). 
                    Marca esta opción para eliminarlos y usar solo los permisos del rol.
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Asignar Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
