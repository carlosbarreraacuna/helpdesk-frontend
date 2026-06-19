'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PRIORITY_LABEL, PRIORITY_COLOR } from '@/lib/sla';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Timer, RefreshCw, Download, History, Trash2, Users2 } from 'lucide-react';

interface SlaConfig {
  id: number;
  priority: 'alta' | 'media' | 'baja';
  response_time_hours: number;
  resolution_time_hours: number;
  alert_threshold: number;
  work_start_hour: number;
  work_end_hour: number;
}

interface SlaOverride {
  id: number;
  scope: 'agent' | 'group';
  scope_id: number;
  priority: 'alta' | 'media' | 'baja';
  response_time_hours: number;
  resolution_time_hours: number;
  alert_threshold: number;
  work_start_hour: number;
  work_end_hour: number;
}

interface ScopeOption {
  id: number;
  name: string;
}

interface SlaHistoryEntry {
  id: number;
  old_value: string;
  new_value: string;
  created_at: string;
  ticket: { id: number; ticket_number: string; requester_name: string; priority: string } | null;
  user: { id: number; name: string; email: string } | null;
}

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

function SlaOverridePriorityCard({
  scope,
  scopeId,
  priority,
  override,
  globalDefault,
  onChanged,
}: {
  scope: 'agent' | 'group';
  scopeId: number;
  priority: 'alta' | 'media' | 'baja';
  override: SlaOverride | null;
  globalDefault: SlaConfig | undefined;
  onChanged: () => void;
}) {
  const baseline = override ?? globalDefault;
  const [form, setForm] = useState({
    response_time_hours: baseline?.response_time_hours ?? 0,
    resolution_time_hours: baseline?.resolution_time_hours ?? 0,
    alert_threshold: baseline?.alert_threshold ?? 80,
    work_start_hour: baseline?.work_start_hour ?? 8,
    work_end_hour: baseline?.work_end_hour ?? 18,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const b = override ?? globalDefault;
    setForm({
      response_time_hours: b?.response_time_hours ?? 0,
      resolution_time_hours: b?.resolution_time_hours ?? 0,
      alert_threshold: b?.alert_threshold ?? 80,
      work_start_hour: b?.work_start_hour ?? 8,
      work_end_hour: b?.work_end_hour ?? 18,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override?.id, globalDefault?.id]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value === '' ? 0 : parseInt(value, 10) }));
    setSaved(false);
  };

  const handleSave = async () => {
    setErrors({});
    setSaving(true);
    try {
      await api.post('/sla/overrides', { scope, scope_id: scopeId, priority, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onChanged();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error al guardar el SLA propio');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!override) return;
    if (!confirm('Esto elimina el SLA propio de esta prioridad. Volverá a heredar el SLA del grupo o el general. ¿Continuar?')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/sla/overrides/${override.id}`);
      onChanged();
    } catch {
      alert('Error al eliminar el SLA propio');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLOR[priority]}`}
            >
              Prioridad {PRIORITY_LABEL[priority]}
            </span>
          </CardTitle>
          {!override && (
            <span className="text-xs text-gray-400">Heredado del SLA general</span>
          )}
        </div>
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
          {override && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="h-8 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {deleting ? 'Eliminando...' : 'Quitar'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {saving ? 'Guardando...' : override ? 'Guardar' : 'Crear SLA propio'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SlaOverrideSection({ globalConfigs }: { globalConfigs: SlaConfig[] }) {
  const [scope, setScope] = useState<'agent' | 'group'>('agent');
  const [scopeId, setScopeId] = useState<number | null>(null);
  const [agents, setAgents] = useState<ScopeOption[]>([]);
  const [groups, setGroups] = useState<ScopeOption[]>([]);
  const [overrides, setOverrides] = useState<SlaOverride[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/users/assignable'),
      api.get('/work-groups'),
    ]).then(([agentsRes, groupsRes]) => {
      setAgents((agentsRes.data.data ?? agentsRes.data).map((a: any) => ({ id: a.id, name: a.name })));
      const groupsData = groupsRes.data.data ?? groupsRes.data;
      setGroups(groupsData.map((g: any) => ({ id: g.id, name: g.name })));
    }).catch(error => {
      console.error('Error loading agents/groups:', error);
    }).finally(() => setLoadingOptions(false));
  }, []);

  const loadOverrides = async () => {
    if (!scopeId) {
      setOverrides([]);
      return;
    }
    setLoadingOverrides(true);
    try {
      const res = await api.get('/sla/overrides', { params: { scope, scope_id: scopeId } });
      setOverrides(res.data);
    } catch (error) {
      console.error('Error loading SLA overrides:', error);
    } finally {
      setLoadingOverrides(false);
    }
  };

  useEffect(() => {
    loadOverrides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeId]);

  const options = scope === 'agent' ? agents : groups;
  const priorities: Array<'alta' | 'media' | 'baja'> = ['alta', 'media', 'baja'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          SLA propio por agente / grupo
        </CardTitle>
        <CardDescription>
          Define una matriz de SLA distinta para un agente o grupo de trabajo. Si no se configura, hereda el SLA general por prioridad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div>
            <Label className="text-xs">Aplicar a</Label>
            <Select
              value={scope}
              onValueChange={v => { setScope(v as 'agent' | 'group'); setScopeId(null); }}
            >
              <SelectTrigger className="w-40 h-9 text-sm mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agente</SelectItem>
                <SelectItem value="group">Grupo de trabajo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{scope === 'agent' ? 'Agente' : 'Grupo de trabajo'}</Label>
            <Select
              value={scopeId ? String(scopeId) : ''}
              onValueChange={v => setScopeId(v ? parseInt(v, 10) : null)}
              disabled={loadingOptions || options.length === 0}
            >
              <SelectTrigger className="w-56 h-9 text-sm mt-1">
                <SelectValue placeholder={loadingOptions ? 'Cargando...' : 'Selecciona...'} />
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
                  <SelectItem key={opt.id} value={String(opt.id)}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!scopeId ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            Selecciona un {scope === 'agent' ? 'agente' : 'grupo de trabajo'} para ver o configurar su SLA propio.
          </p>
        ) : loadingOverrides ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {priorities.map(priority => (
              <SlaOverridePriorityCard
                key={priority}
                scope={scope}
                scopeId={scopeId}
                priority={priority}
                override={overrides.find(o => o.priority === priority) ?? null}
                globalDefault={globalConfigs.find(c => c.priority === priority)}
                onChanged={loadOverrides}
              />
            ))}
          </div>
        )}
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
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sla/configs');
      setConfigs(res.data);
    } catch (error) {
      console.error('Error loading SLA configs:', error);
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

      {/* Configuración por prioridad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {configs.map(config => (
          <SlaConfigCard key={config.id} config={config} onSaved={handleSaved} />
        ))}
      </div>

      {/* SLA propio por agente / grupo */}
      <SlaOverrideSection globalConfigs={configs} />

      {/* Historial de cambios de SLA + reporte descargable */}
      <SlaHistorySection key={historyRefreshKey} />
    </div>
  );
}
