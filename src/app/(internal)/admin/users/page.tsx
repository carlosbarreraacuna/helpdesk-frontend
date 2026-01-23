'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import CreateUserModal from '@/components/CreateUserModal';
import EditUserModal from '@/components/EditUserModal';
import AssignRoleModal from '@/components/AssignRoleModal';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
  area?: {
    id: number;
    name: string;
  };
}

interface PaginatedResponse {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  level: number;
}

interface Area {
  id: number;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role_id: '',
    area_id: '',
    is_active: '',
    page: 1,
  });
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadAreas();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', { params: { ...filters, per_page: 10 } });
      setUsers(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadAreas = async () => {
    try {
      const { data } = await api.get('/areas');
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    if (confirm('¿Estás seguro de cambiar el estado de este usuario?')) {
      try {
        await api.patch(`/users/${userId}/toggle-status`);
        loadUsers();
      } catch (error) {
        alert('Error al cambiar estado del usuario');
      }
    }
  };

  const handleDelete = async (userId: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/users/${userId}`);
        loadUsers();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar usuario');
      }
    }
  };

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to page 1 when filtering
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <span>➕</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros - Más compactos */}
      <div className="bg-white rounded-lg shadow p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar usuario..."
              className="w-full pl-7 pr-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={filters.role_id}
            onChange={(e) => handleFilterChange({ ...filters, role_id: e.target.value })}
          >
            <option value="">Todos los roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.display_name}</option>
            ))}
          </select>

          <select
            className="px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={filters.area_id}
            onChange={(e) => handleFilterChange({ ...filters, area_id: e.target.value })}
          >
            <option value="">Todas las áreas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>

          <select
            className="px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={filters.is_active}
            onChange={(e) => handleFilterChange({ ...filters, is_active: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>

          <div className="text-sm text-gray-600 py-1.5">
            {pagination.total} usuarios
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios - Más compacta */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando...</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Último acceso</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleAssignRole(user)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer transition"
                      >
                        {user.role?.display_name || 'Sin rol'}
                        <span className="text-xs">✏️</span>
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-600">
                        {user.area?.name || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? '✓ Activo' : '✗ Inactivo'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {pagination.last_page > 1 && (
              <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  de <span className="font-medium">{pagination.total}</span> resultados
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.current_page >= pagination.last_page - 2) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 py-1 text-xs border rounded ${
                          pagination.current_page === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUsers}
        roles={roles}
        areas={areas}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
        roles={roles}
        areas={areas}
      />

      <AssignRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
        roles={roles}
      />
    </div>
  );
}
