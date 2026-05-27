'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { meetingsApi, Meeting, MeetingMetrics } from '@/lib/meetings-api';
import { Button } from '@/components/ui/button';
import ScheduleMeetingModal from '@/components/meetings/ScheduleMeetingModal';
import {
  Video, Calendar, Clock, CheckCircle2, XCircle, ExternalLink,
  Plus, RefreshCw, Filter, Loader2, BarChart3, Users,
} from 'lucide-react';

const STATUS_CONFIG = {
  scheduled: { label: 'Programada', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  cls: 'bg-gray-100 text-gray-500' },
};

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [metrics, setMetrics]   = useState<MeetingMetrics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 15 };
      if (filterStatus) params.status = filterStatus;
      const [meetRes, metricsRes] = await Promise.all([
        meetingsApi.list(params),
        meetingsApi.metrics(),
      ]);
      setMeetings(meetRes.data.data ?? []);
      setLastPage(meetRes.data.last_page ?? 1);
      setTotal(meetRes.data.total ?? 0);
      setMetrics(metricsRes.data);
    } catch { setMeetings([]); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleComplete = async (id: number) => {
    const dur = prompt('Duración de la llamada en minutos:');
    const notes = prompt('Notas post-llamada (opcional):') ?? '';
    await meetingsApi.update(id, {
      status: 'completed',
      duration_minutes: dur ? parseInt(dur) : undefined,
      notes,
    });
    fetchMeetings();
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar esta reunión?')) return;
    await meetingsApi.update(id, { status: 'cancelled' });
    fetchMeetings();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta reunión? También se eliminará del calendario de Google.')) return;
    await meetingsApi.delete(id);
    fetchMeetings();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reuniones Google Meet</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} reuniones registradas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Reunión
        </Button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: metrics.total, icon: Video, cls: 'text-blue-600 bg-blue-50' },
            { label: 'Programadas', value: metrics.scheduled, icon: Calendar, cls: 'text-indigo-600 bg-indigo-50' },
            { label: 'Completadas', value: metrics.completed, icon: CheckCircle2, cls: 'text-green-600 bg-green-50' },
            { label: 'Canceladas', value: metrics.cancelled, icon: XCircle, cls: 'text-gray-500 bg-gray-50' },
            { label: 'Esta semana', value: metrics.meetings_this_week, icon: BarChart3, cls: 'text-purple-600 bg-purple-50' },
            { label: 'Duración prom.', value: `${metrics.avg_duration} min`, icon: Clock, cls: 'text-orange-600 bg-orange-50' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cls}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400 shrink-0" />
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          <option value="scheduled">Programadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <Button variant="ghost" size="sm" onClick={fetchMeetings}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Video className="h-10 w-10" />
            <p className="text-sm">No hay reuniones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reunión</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Organizador</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Invitados</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {meetings.map(m => {
                const cfg = STATUS_CONFIG[m.status];
                return (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.title}</p>
                      {m.duration_minutes && (
                        <p className="text-xs text-gray-400 mt-0.5">{m.duration_minutes} min</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(m.start_time).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(m.start_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {m.ticket ? (
                        <button
                          onClick={() => router.push(`/tickets/${m.ticket!.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs font-semibold hover:underline"
                        >
                          {m.ticket.ticket_number}
                        </button>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{m.organizer.name}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">{m.invitees.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {m.meet_link && (
                          <a
                            href={m.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition"
                            title="Unirse al Meet"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {m.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleComplete(m.id)}
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition"
                              title="Marcar completada"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancel(m.id)}
                              className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 transition"
                              title="Cancelar"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 transition"
                          title="Eliminar"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Página {page} de {lastPage}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {showModal && (
        <ScheduleMeetingModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchMeetings(); }}
        />
      )}
    </div>
  );
}
