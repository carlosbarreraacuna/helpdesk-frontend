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
  module_id: number;
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
  permissions: Permission[];
}

const ACTION_COLORS: Record<string, string> = {
  create:  'bg-green-100 text-green-800',
  read:    'bg-blue-100 text-blue-800',
  update:  'bg-yellow-100 text-yellow-800',
  delete:  'bg-red-100 text-red-800',
  special: 'bg-purple-100 text-purple-800',
};

const ACTION_ICONS: Record<string, string> = {
  create:  '➕',
  read:    '👁️',
  update:  '✏️',
  delete:  '🗑️',
  special: '⚡',
};

const PROTECTED_ROLES = ['admin', 'supervisor', 'agente', 'usuario'];

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modales de rol
  const [roleModal, setRoleModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });

  // Modales de permiso
  const [permModal, setPermModal] = useState<{ open: boolean; perm: Permission | null }>({ open: false, perm: null });

  // Confirmación de borrado
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'role' | 'permission'; id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    const { data } = await api.get('/roles');
    setRoles(data);
  };

  const loadRolePermissions = async (roleId: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/permissions/roles/${roleId}`);
      setModules(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    loadRolePermissions(role.id);
  };

  const togglePermission = (moduleId: number, permId: number, current: boolean) => {
    setModules(prev => prev.map(m =>
      m.id !== moduleId ? m : {
        ...m,
        permissions: m.permissions.map(p =>
          p.id !== permId ? p : { ...p, is_granted: !current }
        ),
      }
    ));
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permissions = modules.flatMap(m =>
        m.permissions.map(p => ({ permission_id: p.id, is_granted: p.is_granted ?? false }))
      );
      await api.post(`/permissions/roles/${selectedRole.id}`, { permissions });
      alert('Permisos guardados exitosamente');
    } catch {
      alert('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.type === 'role') {
        await api.delete(`/roles/${confirmDelete.id}`);
        if (selectedRole?.id === confirmDelete.id) {
          setSelectedRole(null);
          setModules([]);
        }
        await loadRoles();
      } else {
        await api.delete(`/permissions/${confirmDelete.id}`);
        if (selectedRole) await loadRolePermissions(selectedRole.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al eliminar');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setPermModal({ open: true, perm: null })}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
        >
          + Nuevo Permiso
        </button>
        <button
          onClick={() => setRoleModal({ open: true, role: null })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Lista de roles ── */}
        <div className="col-span-3 bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-1">Roles</h2>
          <p className="text-xs text-gray-500 mb-4">Selecciona un rol para gestionar permisos</p>

          <div className="space-y-2">
            {roles.map(role => (
              <div
                key={role.id}
                className={`group relative rounded-lg transition ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <button
                  onClick={() => handleRoleSelect(role)}
                  className="w-full text-left p-3"
                >
                  <p className="font-semibold text-sm">{role.display_name || role.name}</p>
                  <p className="text-xs text-gray-500">{role.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                    Nivel {role.level}
                  </span>
                </button>

                {/* Acciones editar / eliminar */}
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRoleModal({ open: true, role }); }}
                    title="Editar rol"
                    className="p-1 rounded hover:bg-blue-100 text-blue-600 text-xs"
                  >
                    ✏️
                  </button>
                  {!PROTECTED_ROLES.includes(role.name) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'role', id: role.id, name: role.display_name }); }}
                      title="Eliminar rol"
                      className="p-1 rounded hover:bg-red-100 text-red-500 text-xs"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Matriz de permisos ── */}
        <div className="col-span-9 bg-white rounded-xl shadow-sm border p-6">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRole.display_name}</h2>
                  {selectedRole.description && (
                    <p className="text-gray-500 text-sm mt-1">{selectedRole.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Nombre técnico: {selectedRole.name} · Nivel {selectedRole.level}</p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="mt-2 text-gray-500 text-sm">Cargando permisos...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {modules.map(module => (
                    <div key={module.id} className="border rounded-xl p-4">
                      {/* Cabecera módulo */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{module.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">{module.display_name}</h3>
                          {module.description && (
                            <p className="text-xs text-gray-500">{module.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {module.permissions.length} permisos
                        </span>
                      </div>

                      {/* Permisos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {module.permissions.map(perm => (
                          <div
                            key={perm.id}
                            className="group/perm relative flex items-start gap-2 p-2.5 rounded-lg border hover:bg-gray-50 transition"
                          >
                            <input
                              type="checkbox"
                              id={`perm-${perm.id}`}
                              checked={perm.is_granted ?? false}
                              onChange={() => togglePermission(module.id, perm.id, perm.is_granted ?? false)}
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor={`perm-${perm.id}`} className="flex-1 cursor-pointer min-w-0">
                              <p className="text-sm font-medium leading-tight">{perm.display_name}</p>
                              <p className="text-xs text-gray-400 truncate">{perm.name}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${ACTION_COLORS[perm.action_type]}`}>
                                {ACTION_ICONS[perm.action_type]} {perm.action_type}
                              </span>
                            </label>

                            {/* Acciones permiso (hover) */}
                            <div className="hidden group-hover/perm:flex flex-col gap-0.5 shrink-0">
                              <button
                                onClick={() => setPermModal({ open: true, perm })}
                                title="Editar permiso"
                                className="p-0.5 rounded hover:bg-blue-100 text-blue-500 text-xs leading-none"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: 'permission', id: perm.id, name: perm.display_name })}
                                title="Eliminar permiso"
                                className="p-0.5 rounded hover:bg-red-100 text-red-400 text-xs leading-none"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-1">Selecciona un rol</h3>
              <p className="text-sm">Haz clic en un rol de la izquierda para gestionar sus permisos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal crear/editar rol ── */}
      <CreateRoleModal
        isOpen={roleModal.open}
        role={roleModal.role}
        onClose={() => setRoleModal({ open: false, role: null })}
        onSuccess={async () => {
          setRoleModal({ open: false, role: null });
          await loadRoles();
          if (selectedRole) {
            const fresh = roles.find(r => r.id === selectedRole.id);
            if (fresh) setSelectedRole(fresh);
          }
        }}
      />

      {/* ── Modal crear/editar permiso ── */}
      <CreatePermissionModal
        isOpen={permModal.open}
        permission={permModal.perm}
        onClose={() => setPermModal({ open: false, perm: null })}
        onSuccess={async () => {
          setPermModal({ open: false, perm: null });
          if (selectedRole) await loadRolePermissions(selectedRole.id);
        }}
      />

      {/* ── Modal de confirmación de borrado ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-red-600">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-5">
              ¿Estás seguro de que deseas eliminar{' '}
              {confirmDelete.type === 'role' ? 'el rol' : 'el permiso'}{' '}
              <strong>"{confirmDelete.name}"</strong>?{' '}
              {confirmDelete.type === 'permission' && 'Se eliminará de todos los roles que lo tengan asignado.'}
              {confirmDelete.type === 'role' && 'Solo se puede eliminar si no tiene usuarios asignados.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
