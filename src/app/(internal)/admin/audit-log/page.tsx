'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PermissionChangeLog {
  id: number;
  changed_by: {
    id: number;
    name: string;
    email: string;
  };
  change_type: 'role_permission' | 'user_permission';
  entity_id: number;
  permission: {
    id: number;
    name: string;
    display_name: string;
  };
  old_value: boolean | null;
  new_value: boolean | null;
  reason: string | null;
  created_at: string;
}

interface Filters {
  change_type: string;
  date_from: string;
  date_to: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<PermissionChangeLog[]>([]);
  const [filters, setFilters] = useState<Filters>({
    change_type: 'all',
    date_from: '',
    date_to: '',
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page };
      const { data } = await api.get('/audit/permissions', { params });
      setLogs(data.data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'justo ahora';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return formatDate(dateString);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Auditoría de Permisos</h1>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Cambio</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.change_type}
              onChange={(e) => setFilters({...filters, change_type: e.target.value})}
            >
              <option value="all">Todos los cambios</option>
              <option value="role_permission">Permisos de Roles</option>
              <option value="user_permission">Permisos de Usuarios</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Desde</label>
            <input
              type="date"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hasta</label>
            <input
              type="date"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ change_type: 'all', date_from: '', date_to: '' })}
              className="w-full px-4 py-2 border rounded hover:bg-gray-100 transition"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Cambios</h3>
          <p className="text-2xl font-bold">{pagination.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-green-600">Permisos Otorgados</h3>
          <p className="text-2xl font-bold text-green-700">
            {logs.filter(log => log.new_value === true).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-red-600">Permisos Revocados</h3>
          <p className="text-2xl font-bold text-red-700">
            {logs.filter(log => log.new_value === false).length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-blue-600">Cambios de Roles</h3>
          <p className="text-2xl font-bold text-blue-700">
            {logs.filter(log => log.change_type === 'role_permission').length}
          </p>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Permiso</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Cambio</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Cargando logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No se encontraron cambios de permisos
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm">
                      <div className="font-medium">{formatDate(log.created_at)}</div>
                      <div className="text-xs text-gray-500">{getRelativeTime(log.created_at)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-sm">{log.changed_by.name}</div>
                      <div className="text-xs text-gray-500">{log.changed_by.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.change_type === 'role_permission' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {log.change_type === 'role_permission' ? 'Rol' : 'Usuario'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="font-medium">{log.permission.display_name}</div>
                      <div className="text-xs text-gray-500">{log.permission.name}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {log.old_value !== null && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.old_value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.old_value ? '✓' : '✗'}
                          </span>
                        )}
                        <span className="text-gray-400">→</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.new_value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.new_value ? '✓ Otorgado' : '✗ Revocado'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Mostrando {logs.length} de {pagination.total} resultados
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadLogs(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1">
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <button
                onClick={() => loadLogs(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
