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

interface AuthLog {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  login_input: string | null;
  event: 'login_success' | 'login_failed' | 'login_inactive' | 'logout' | 'access_denied';
  ip_address: string | null;
  user_agent: string | null;
  required_permission: string | null;
  created_at: string;
}

interface AuthLogsSummary {
  last_30_days: {
    login_success: number;
    login_failed: number;
    login_inactive: number;
    logout: number;
    access_denied: number;
  };
}

interface PermissionFilters {
  change_type: string;
  date_from: string;
  date_to: string;
}

interface AuthFilters {
  event: string;
  date_from: string;
  date_to: string;
  ip_address: string;
}

const AUTH_EVENT_LABELS: Record<AuthLog['event'], string> = {
  login_success: 'Login exitoso',
  login_failed: 'Login fallido',
  login_inactive: 'Usuario inactivo',
  logout: 'Logout',
  access_denied: 'Acceso denegado',
};

const AUTH_EVENT_STYLES: Record<AuthLog['event'], string> = {
  login_success: 'bg-green-100 text-green-800',
  login_failed: 'bg-red-100 text-red-800',
  login_inactive: 'bg-yellow-100 text-yellow-800',
  logout: 'bg-gray-100 text-gray-700',
  access_denied: 'bg-orange-100 text-orange-800',
};

export default function AuditLogPage() {
  const [tab, setTab] = useState<'permissions' | 'access'>('permissions');

  // --- Permisos ---
  const [logs, setLogs] = useState<PermissionChangeLog[]>([]);
  const [filters, setFilters] = useState<PermissionFilters>({
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

  // --- Accesos (login/logout/access_denied) ---
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [authFilters, setAuthFilters] = useState<AuthFilters>({
    event: 'all',
    date_from: '',
    date_to: '',
    ip_address: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authPagination, setAuthPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [authSummary, setAuthSummary] = useState<AuthLogsSummary | null>(null);

  useEffect(() => {
    if (tab === 'permissions') loadLogs();
  }, [filters, tab]);

  useEffect(() => {
    if (tab === 'access') {
      loadAuthLogs();
      loadAuthSummary();
    }
  }, [authFilters, tab]);

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

  const loadAuthLogs = async (page = 1) => {
    setAuthLoading(true);
    try {
      const params = { ...authFilters, page };
      const { data } = await api.get('/audit/auth', { params });
      setAuthLogs(data.data);
      setAuthPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (error) {
      console.error('Error loading auth logs:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadAuthSummary = async () => {
    try {
      const { data } = await api.get('/audit/auth/summary');
      setAuthSummary(data);
    } catch (error) {
      console.error('Error loading auth logs summary:', error);
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
      <h1 className="text-3xl font-bold mb-6">Auditoría</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        <button
          onClick={() => setTab('permissions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'permissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Permisos
        </button>
        <button
          onClick={() => setTab('access')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'access'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Accesos (Login / Logout)
        </button>
      </div>

      {tab === 'permissions' ? (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Cambio</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.change_type}
                  onChange={(e) => setFilters({ ...filters, change_type: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hasta</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
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
        </>
      ) : (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Evento</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={authFilters.event}
                  onChange={(e) => setAuthFilters({ ...authFilters, event: e.target.value })}
                >
                  <option value="all">Todos los eventos</option>
                  <option value="login_success">Login exitoso</option>
                  <option value="login_failed">Login fallido</option>
                  <option value="login_inactive">Usuario inactivo</option>
                  <option value="logout">Logout</option>
                  <option value="access_denied">Acceso denegado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Desde</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={authFilters.date_from}
                  onChange={(e) => setAuthFilters({ ...authFilters, date_from: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hasta</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={authFilters.date_to}
                  onChange={(e) => setAuthFilters({ ...authFilters, date_to: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IP</label>
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={authFilters.ip_address}
                  onChange={(e) => setAuthFilters({ ...authFilters, ip_address: e.target.value })}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setAuthFilters({ event: 'all', date_from: '', date_to: '', ip_address: '' })}
                  className="w-full px-4 py-2 border rounded hover:bg-gray-100 transition"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Resumen últimos 30 días */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-green-600">Logins Exitosos</h3>
              <p className="text-2xl font-bold text-green-700">
                {authSummary?.last_30_days.login_success ?? '-'}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-red-600">Logins Fallidos</h3>
              <p className="text-2xl font-bold text-red-700">
                {authSummary?.last_30_days.login_failed ?? '-'}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-yellow-600">Usuarios Inactivos</h3>
              <p className="text-2xl font-bold text-yellow-700">
                {authSummary?.last_30_days.login_inactive ?? '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-600">Logouts</h3>
              <p className="text-2xl font-bold text-gray-700">
                {authSummary?.last_30_days.logout ?? '-'}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-orange-600">Accesos Denegados</h3>
              <p className="text-2xl font-bold text-orange-700">
                {authSummary?.last_30_days.access_denied ?? '-'}
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
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {authLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Cargando logs...</p>
                      </td>
                    </tr>
                  ) : authLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No se encontraron registros de acceso
                      </td>
                    </tr>
                  ) : (
                    authLogs.map(log => (
                      <tr key={log.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          <div className="font-medium">{formatDate(log.created_at)}</div>
                          <div className="text-xs text-gray-500">{getRelativeTime(log.created_at)}</div>
                        </td>
                        <td className="p-3">
                          {log.user ? (
                            <>
                              <div className="font-medium text-sm">{log.user.name}</div>
                              <div className="text-xs text-gray-500">{log.user.email}</div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">{log.login_input || '—'}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${AUTH_EVENT_STYLES[log.event]}`}>
                            {AUTH_EVENT_LABELS[log.event]}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{log.ip_address || '-'}</td>
                        <td className="p-3 text-sm text-gray-600 max-w-xs truncate" title={log.user_agent || ''}>
                          {log.event === 'access_denied' && log.required_permission
                            ? `Requiere: ${log.required_permission}`
                            : log.user_agent || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {authPagination.last_page > 1 && (
              <div className="flex justify-between items-center p-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {authLogs.length} de {authPagination.total} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadAuthLogs(authPagination.current_page - 1)}
                    disabled={authPagination.current_page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1">
                    Página {authPagination.current_page} de {authPagination.last_page}
                  </span>
                  <button
                    onClick={() => loadAuthLogs(authPagination.current_page + 1)}
                    disabled={authPagination.current_page === authPagination.last_page}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
