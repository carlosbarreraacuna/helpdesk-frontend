'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertTriangle, XCircle, Save, Timer, RefreshCw, Download, History } from 'lucide-react';

interface SlaConfig {
  id: number;
  priority: 'alta' | 'media' | 'baja';
  response_time_hours: number;
  resolution_time_hours: number;
  alert_threshold: number;
  work_start_hour: number;
  work_end_hour: number;
}

interface BreachedTicket {
  id: number;
  ticket_number: string;
  requester_name: string;
  priority: string;
  due_at: string;
  assigned_to: string | null;
}

interface DashboardSummary {
  summary: { on_track: number; at_risk: number; breached: number };
  breached_tickets: BreachedTicket[];
}

interface SlaHistoryEntry {
  id: number;
  old_value: string;
  new_value: string;
  created_at: string;
  ticket: { id: number; ticket_number: string; requester_name: string; priority: string } | null;
  user: { id: number; name: string; email: string } | null;
}

const PRIORITY_LABEL: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const PRIORITY_COLOR: Record<string, string> = {
  alta: 'text-red-600 bg-red-50 border-red-200',
  media: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  baja: 'text-green-600 bg-green-50 border-green-200',
};

function SlaConfigCard({
  config,
  onSaved,
}: {
  config: SlaConfig;
  onSaved: (updated: SlaConfig) => void;
}) {
  const [form, setForm] = useState({
    response_time_hours: config.response_time_hours,
    resolution_time_hours: config.resolution_time_hours,
    alert_threshold: config.alert_threshold,
    work_start_hour: config.work_start_hour,
    work_end_hour: config.work_end_hour,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = Object.entries(form).some(
    ([key, value]) => value !== config[key as keyof typeof form]
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value === '' ? 0 : parseInt(value, 10) }));
    setSaved(false);
  };

  const handleSave = async () => {
    setErrors({});
    setSaving(true);
    try {
      const res = await api.patch(`/sla/configs/${config.id}`, form);
      onSaved(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error al guardar la configuración de SLA');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLOR[config.priority]}`}
            >
              Prioridad {PRIORITY_LABEL[config.priority] ?? config.priority}
            </span>
          </CardTitle>
        </div>
        <CardDescription>Tiempos de atención y resolución para esta prioridad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Tiempo de respuesta (horas)</Label>
            <Input
              type="number"
              min={1}
              max={720}
              value={form.response_time_hours}
              onChange={e => handleChange('response_time_hours', e.target.value)}
              className="h-9 text-sm mt-1"
            />
            {errors.response_time_hours && (
              <p className="text-red-500 text-xs mt-1">{errors.response_time_hours[0]}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Tiempo de resolución (horas)</Label>
            <Input
              type="number"
              min={1}
              max={720}
              value={form.resolution_time_hours}
              onChange={e => handleChange('resolution_time_hours', e.target.value)}
              className="h-9 text-sm mt-1"
            />
            {errors.resolution_time_hours && (
              <p className="text-red-500 text-xs mt-1">{errors.resolution_time_hours[0]}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Umbral de alerta (%)</Label>
            <Input
              type="number"
              min={10}
              max={99}
              value={form.alert_threshold}
              onChange={e => handleChange('alert_threshold', e.target.value)}
              className="h-9 text-sm mt-1"
            />
            {errors.alert_threshold && (
              <p className="text-red-500 text-xs mt-1">{errors.alert_threshold[0]}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Inicio jornada</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={form.work_start_hour}
                onChange={e => handleChange('work_start_hour', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Fin jornada</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={form.work_end_hour}
                onChange={e => handleChange('work_end_hour', e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
          </div>
          {(errors.work_start_hour || errors.work_end_hour) && (
            <p className="text-red-500 text-xs col-span-2">
              {errors.work_start_hour?.[0] || errors.work_end_hour?.[0]}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          {saved && <span className="text-xs text-green-600">Guardado</span>}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-8 text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SlaHistorySection() {
  const [entries, setEntries] = useState<SlaHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState({ date_from: '', date_to: '' });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const loadHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/sla/history', {
        params: { ...filters, page },
      });
      setEntries(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (error) {
      console.error('Error loading SLA history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/sla/history/export', {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `sla_recalculos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar el reporte de SLA');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial de cambios de SLA
            </CardTitle>
            <CardDescription>
              Tickets cuyo SLA se recalculó manualmente — evidencia de auditoría
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading || pagination.total === 0}
            className="h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {downloading ? 'Descargando...' : 'Descargar reporte (CSV)'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={e => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className="h-9 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={e => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className="h-9 text-sm mt-1"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Ticket</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Prioridad</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">SLA anterior</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">SLA nuevo</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Modificado por</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-xs text-gray-500">
                    No hay cambios de SLA registrados en este rango
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-xs font-medium text-gray-900">
                      {entry.ticket ? `#${entry.ticket.ticket_number}` : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[entry.ticket?.priority ?? ''] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}
                      >
                        {PRIORITY_LABEL[entry.ticket?.priority ?? ''] ?? entry.ticket?.priority ?? 'N/A'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-600">{entry.old_value}</td>
                    <td className="py-2 px-3 text-xs text-gray-600">{entry.new_value}</td>
                    <td className="py-2 px-3 text-xs text-gray-600">{entry.user?.name ?? 'Sistema'}</td>
                    <td className="py-2 px-3 text-xs text-gray-600">
                      {new Date(entry.created_at).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <div className="text-gray-600">{pagination.total} cambios en total</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadHistory(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="h-8 text-xs px-3"
              >
                Anterior
              </Button>
              <span className="text-gray-600">
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadHistory(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="h-8 text-xs px-3"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SlaSettingsPage() {
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [configsRes, dashboardRes] = await Promise.all([
        api.get('/sla/configs'),
        api.get('/sla/dashboard'),
      ]);
      setConfigs(configsRes.data);
      setDashboard(dashboardRes.data);
    } catch (error) {
      console.error('Error loading SLA data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaved = (updated: SlaConfig) => {
    setConfigs(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleRecalculate = async () => {
    if (!confirm('Esto recalculará las fechas límite de SLA de todos los tickets abiertos usando la configuración actual. ¿Continuar?')) {
      return;
    }
    setRecalculating(true);
    try {
      const res = await api.post('/sla/recalculate');
      alert(res.data.message);
      await load();
      setHistoryRefreshKey(k => k + 1);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al recalcular el SLA');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-gray-700" />
          <h1 className="text-lg font-semibold text-gray-900">Parametrización de SLA</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculando...' : 'Recalcular SLA de tickets abiertos'}
        </Button>
      </div>

      {/* Resumen de cumplimiento */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboard.summary.on_track}</p>
                <p className="text-xs text-gray-500">Tickets dentro de SLA</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboard.summary.at_risk}</p>
                <p className="text-xs text-gray-500">En riesgo de incumplimiento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{dashboard.summary.breached}</p>
                <p className="text-xs text-gray-500">SLA incumplido</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuración por prioridad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {configs.map(config => (
          <SlaConfigCard key={config.id} config={config} onSaved={handleSaved} />
        ))}
      </div>

      {/* Tickets incumplidos */}
      {dashboard && dashboard.breached_tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets con SLA incumplido</CardTitle>
            <CardDescription>Requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Ticket</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Solicitante</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Prioridad</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Vencimiento</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Asignado a</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.breached_tickets.map(ticket => (
                    <tr key={ticket.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-xs font-medium text-gray-900">
                        #{ticket.ticket_number}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">{ticket.requester_name}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[ticket.priority] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}
                        >
                          {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">
                        {new Date(ticket.due_at).toLocaleString('es-ES')}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">
                        {ticket.assigned_to ?? 'Sin asignar'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de cambios de SLA + reporte descargable */}
      <SlaHistorySection key={historyRefreshKey} />
    </div>
  );
}
