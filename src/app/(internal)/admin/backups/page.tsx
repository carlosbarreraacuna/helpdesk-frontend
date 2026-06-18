'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface BackupLogItem {
  id: number;
  type: 'backup' | 'restore';
  status: 'pending' | 'running' | 'success' | 'failed';
  timestamp_key: string;
  db_dump_path: string | null;
  manifest_path: string | null;
  db_dump_size_bytes: number | null;
  attachments_object_count: number | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface RestoreLogItem extends BackupLogItem {
  triggered_by: { id: number; name: string; email: string } | null;
  source_backup: { id: number; timestamp_key: string } | null;
}

const STATUS_LABELS: Record<BackupLogItem['status'], string> = {
  pending: 'Pendiente',
  running: 'En progreso',
  success: 'Exitoso',
  failed: 'Fallido',
};

const STATUS_STYLES: Record<BackupLogItem['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function BackupsPage() {
  const [tab, setTab] = useState<'backups' | 'restores'>('backups');

  const [backups, setBackups] = useState<BackupLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [restores, setRestores] = useState<RestoreLogItem[]>([]);
  const [restoresLoading, setRestoresLoading] = useState(false);
  const [restoresPagination, setRestoresPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<BackupLogItem | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [activeRestoreId, setActiveRestoreId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flash = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 6000);
  };

  useEffect(() => {
    if (tab === 'backups') loadBackups();
  }, [tab]);

  useEffect(() => {
    if (tab === 'restores') loadRestoreHistory();
  }, [tab]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const loadBackups = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/backups', { params: { page } });
      setBackups(data.data);
      setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestoreHistory = async (page = 1) => {
    setRestoresLoading(true);
    try {
      const { data } = await api.get('/backups/restores/history', { params: { page } });
      setRestores(data.data);
      setRestoresPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    } catch (error) {
      console.error('Error loading restore history:', error);
    } finally {
      setRestoresLoading(false);
    }
  };

  const pollRestoreStatus = (restoreId: number) => {
    setActiveRestoreId(restoreId);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/backups/restores/${restoreId}/status`);
        if (data.status === 'success' || data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setActiveRestoreId(null);
          setRestoringId(null);
          flash(
            data.status === 'success' ? 'Restauración completada exitosamente.' : `Restauración falló: ${data.error_message}`,
            data.status === 'success' ? 'ok' : 'err'
          );
          loadRestoreHistory();
        }
      } catch (error) {
        console.error('Error polling restore status:', error);
      }
    }, 5000);
  };

  const openConfirmModal = (backup: BackupLogItem) => {
    setConfirmModal(backup);
    setConfirmText('');
  };

  const handleRestore = async () => {
    if (!confirmModal) return;
    setRestoringId(confirmModal.id);
    try {
      const { data } = await api.post(`/backups/${confirmModal.id}/restore`, { confirmation: 'RESTAURAR' }, { timeout: 60000 });
      setConfirmModal(null);
      flash('Restauración encolada — el sistema entrará en mantenimiento momentáneamente.', 'ok');
      pollRestoreStatus(data.restore_id);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al disparar la restauración';
      flash(message, 'err');
      setRestoringId(null);
    }
  };

  const handleDownload = async (backup: BackupLogItem) => {
    setDownloadingId(backup.id);
    try {
      const { data } = await api.get(`/backups/${backup.id}/download`);
      window.open(data.url, '_blank');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al generar el enlace de descarga';
      flash(message, 'err');
    } finally {
      setDownloadingId(null);
    }
  };

  const successfulCount = backups.filter(b => b.status === 'success').length;
  const totalSize = backups.filter(b => b.status === 'success').reduce((sum, b) => sum + (b.db_dump_size_bytes || 0), 0);
  const lastBackup = backups.find(b => b.status === 'success');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Respaldos</h1>

      {activeRestoreId && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm font-medium">
          Restauración en progreso — el sistema puede no estar disponible momentáneamente.
        </div>
      )}

      {msg && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${msg.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        <button
          onClick={() => setTab('backups')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'backups' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Backups disponibles
        </button>
        <button
          onClick={() => setTab('restores')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'restores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial de restauraciones
        </button>
      </div>

      {tab === 'backups' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-600">Backups exitosos</h3>
              <p className="text-2xl font-bold">{successfulCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-600">Tamaño total (esta página)</h3>
              <p className="text-2xl font-bold">{formatBytes(totalSize)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-600">Último backup</h3>
              <p className="text-lg font-bold">{lastBackup ? formatDate(lastBackup.created_at) : '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Programado diario a las 02:30 AM</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño dump</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Objetos adjuntos</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Cargando backups...</p>
                      </td>
                    </tr>
                  ) : backups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron backups</td>
                    </tr>
                  ) : (
                    backups.map(backup => (
                      <tr key={backup.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">{formatDate(backup.created_at)}</td>
                        <td className="p-3 text-sm text-gray-600">{formatBytes(backup.db_dump_size_bytes)}</td>
                        <td className="p-3 text-sm text-gray-600">{backup.attachments_object_count ?? '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[backup.status]}`}>
                            {STATUS_LABELS[backup.status]}
                          </span>
                        </td>
                        <td className="p-3">
                          {backup.status === 'success' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDownload(backup)}
                                disabled={downloadingId !== null}
                                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {downloadingId === backup.id && <Loader2 size={14} className="animate-spin" />}
                                Descargar
                              </button>
                              <button
                                onClick={() => openConfirmModal(backup)}
                                disabled={restoringId !== null}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {restoringId === backup.id && <Loader2 size={14} className="animate-spin" />}
                                Restaurar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.last_page > 1 && (
              <div className="flex justify-between items-center p-4 border-t">
                <div className="text-sm text-gray-600">Mostrando {backups.length} de {pagination.total} resultados</div>
                <div className="flex gap-2">
                  <button onClick={() => loadBackups(pagination.current_page - 1)} disabled={pagination.current_page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                  <span className="px-3 py-1">Página {pagination.current_page} de {pagination.last_page}</span>
                  <button onClick={() => loadBackups(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Ejecutado por</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Backup origen</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                </tr>
              </thead>
              <tbody>
                {restoresLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Cargando historial...</p>
                    </td>
                  </tr>
                ) : restores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No se han realizado restauraciones</td>
                  </tr>
                ) : (
                  restores.map(restore => {
                    const durationSec = restore.started_at && restore.finished_at
                      ? Math.round((new Date(restore.finished_at).getTime() - new Date(restore.started_at).getTime()) / 1000)
                      : null;
                    return (
                      <tr key={restore.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium">{formatDate(restore.created_at)}</td>
                        <td className="p-3 text-sm text-gray-600">{restore.triggered_by?.name ?? '-'}</td>
                        <td className="p-3 text-sm text-gray-600">{restore.source_backup?.timestamp_key ?? '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[restore.status]}`}>
                            {STATUS_LABELS[restore.status]}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{durationSec !== null ? `${durationSec}s` : '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {restoresPagination.last_page > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-gray-600">Mostrando {restores.length} de {restoresPagination.total} resultados</div>
              <div className="flex gap-2">
                <button onClick={() => loadRestoreHistory(restoresPagination.current_page - 1)} disabled={restoresPagination.current_page === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                <span className="px-3 py-1">Página {restoresPagination.current_page} de {restoresPagination.last_page}</span>
                <button onClick={() => loadRestoreHistory(restoresPagination.current_page + 1)} disabled={restoresPagination.current_page === restoresPagination.last_page}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de restauración */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-700 mb-2">Restaurar backup</h3>
            <p className="text-sm text-gray-700 mb-2">
              ¿Estás seguro de que deseas restaurar el backup del <strong>{formatDate(confirmModal.created_at)}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-4">
              Esto sobrescribirá toda la base de datos actual con el estado de esa fecha. Se perderá todo lo creado/modificado después. El sistema entrará en mantenimiento mientras se ejecuta.
            </p>
            <label className="block text-sm font-medium mb-1">
              Escribe <strong>RESTAURAR</strong> para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                disabled={confirmText !== 'RESTAURAR' || restoringId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {restoringId !== null && <Loader2 size={14} className="animate-spin" />}
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
