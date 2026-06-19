'use client';

import { Fragment, useState, useEffect } from 'react';
import api from '@/lib/api';
import { PRIORITY_LABEL, PRIORITY_COLOR, STATUS_LABEL, STATUS_COLOR } from '@/lib/sla';
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
import {
  CheckCircle2, AlertTriangle, XCircle, BarChart3,
  ChevronDown, ChevronRight, FileSpreadsheet, FileText, Search,
} from 'lucide-react';

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
}

interface SlaReportTicket {
  id: number;
  ticket_number: string;
  priority: string;
  status: string;
  created_at: string;
  due_at: string;
  resolved_at: string | null;
}

interface SlaReportGroup {
  id: number;
  label: string;
  total: number;
  met: number;
  on_track: number;
  at_risk: number;
  breached: number;
  compliance_pct: number;
  tickets: SlaReportTicket[];
}

function BreachedTicketsSection() {
  const [tickets, setTickets] = useState<BreachedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/sla/breached-tickets', {
        params: { search, priority, page, per_page: pagination.per_page },
      });
      setTickets(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        per_page: res.data.per_page,
        total: res.data.total,
      });
    } catch (error) {
      console.error('Error loading breached tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, priority]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tickets con SLA incumplido</CardTitle>
        <CardDescription>Requieren atención inmediata</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por ticket o solicitante..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-xs text-gray-500">
                    No hay tickets con SLA incumplido
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <div className="text-gray-600">{pagination.total} ticket(s) incumplido(s)</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(pagination.current_page - 1)}
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
                onClick={() => load(pagination.current_page + 1)}
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

function SlaReportSection() {
  const [groupBy, setGroupBy] = useState<'agent' | 'group'>('agent');
  const [filters, setFilters] = useState({ date_from: '', date_to: '', priority: 'all' });
  const [groups, setGroups] = useState<SlaReportGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sla/report', {
        params: { ...filters, group_by: groupBy },
      });
      setGroups(res.data);
    } catch (error) {
      console.error('Error loading SLA report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, filters]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const groupLabel = groupBy === 'group' ? 'Grupo de trabajo' : 'Agente';

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const res = await api.get('/sla/report/export', {
        params: { ...filters, group_by: groupBy },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `sla_cumplimiento_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar el reporte CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('Reporte de cumplimiento de SLA', 14, 16);
      doc.setFontSize(9);
      doc.text(`Agrupado por: ${groupLabel} — Generado: ${new Date().toLocaleString('es-ES')}`, 14, 22);

      autoTable(doc, {
        startY: 28,
        head: [[groupLabel, 'Total', 'Cumplidos', 'En curso', 'En riesgo', 'Incumplidos', '% Cumplimiento']],
        body: groups.map(g => [
          g.label, g.total, g.met, g.on_track, g.at_risk, g.breached, `${g.compliance_pct}%`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      const detailRows = groups.flatMap(g =>
        g.tickets.map(t => [
          g.label, `#${t.ticket_number}`, PRIORITY_LABEL[t.priority] ?? t.priority,
          STATUS_LABEL[t.status] ?? t.status, t.created_at, t.due_at, t.resolved_at ?? '—',
        ])
      );

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [[groupLabel, 'Ticket', 'Prioridad', 'Estado', 'Creado', 'Vencimiento', 'Resuelto']],
        body: detailRows,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [71, 85, 105] },
      });

      doc.save(`sla_cumplimiento_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Cumplimiento de SLA por agente / grupo
            </CardTitle>
            <CardDescription>
              Tickets atendidos y su estado de SLA, agrupados por agente o por grupo de trabajo
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || groups.length === 0}
              className="h-8 text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              {downloadingCsv ? 'Descargando...' : 'CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || groups.length === 0}
              className="h-8 text-xs"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {downloadingPdf ? 'Generando...' : 'PDF'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div>
            <Label className="text-xs">Agrupar por</Label>
            <Select value={groupBy} onValueChange={v => setGroupBy(v as 'agent' | 'group')}>
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
            <Label className="text-xs">Prioridad</Label>
            <Select value={filters.priority} onValueChange={v => setFilters(prev => ({ ...prev, priority: v }))}>
              <SelectTrigger className="w-32 h-9 text-sm mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-6"></th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{groupLabel}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Total</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Cumplidos</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">En curso</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">En riesgo</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Incumplidos</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-xs text-gray-500">
                    No hay tickets con SLA en este rango
                  </td>
                </tr>
              ) : (
                groups.map(group => (
                  <Fragment key={group.id}>
                    <tr
                      className="border-t border-gray-100 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => toggleExpand(group.id)}
                    >
                      <td className="py-2 px-3 text-gray-400">
                        {expanded.includes(group.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </td>
                      <td className="py-2 px-3 text-xs font-medium text-gray-900">{group.label}</td>
                      <td className="py-2 px-3 text-xs text-right text-gray-600">{group.total}</td>
                      <td className="py-2 px-3 text-xs text-right text-green-600">{group.met}</td>
                      <td className="py-2 px-3 text-xs text-right text-blue-600">{group.on_track}</td>
                      <td className="py-2 px-3 text-xs text-right text-yellow-600">{group.at_risk}</td>
                      <td className="py-2 px-3 text-xs text-right text-red-600">{group.breached}</td>
                      <td className="py-2 px-3 text-xs text-right font-semibold">
                        <span className={group.compliance_pct >= 90 ? 'text-green-600' : group.compliance_pct >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                          {group.compliance_pct}%
                        </span>
                      </td>
                    </tr>
                    {expanded.includes(group.id) && (
                      <tr>
                        <td colSpan={8} className="bg-gray-50/50 px-3 py-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left py-1 px-2">Ticket</th>
                                <th className="text-left py-1 px-2">Prioridad</th>
                                <th className="text-left py-1 px-2">Estado</th>
                                <th className="text-left py-1 px-2">Creado</th>
                                <th className="text-left py-1 px-2">Vencimiento</th>
                                <th className="text-left py-1 px-2">Resuelto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.tickets.map(t => (
                                <tr key={t.id} className="border-t border-gray-100">
                                  <td className="py-1 px-2 font-medium text-gray-900">#{t.ticket_number}</td>
                                  <td className="py-1 px-2">
                                    <span className={`px-1.5 py-0.5 rounded-full ${PRIORITY_COLOR[t.priority] ?? ''}`}>
                                      {PRIORITY_LABEL[t.priority] ?? t.priority}
                                    </span>
                                  </td>
                                  <td className="py-1 px-2">
                                    <span className={`px-1.5 py-0.5 rounded-full ${STATUS_COLOR[t.status] ?? ''}`}>
                                      {STATUS_LABEL[t.status] ?? t.status}
                                    </span>
                                  </td>
                                  <td className="py-1 px-2 text-gray-600">{t.created_at}</td>
                                  <td className="py-1 px-2 text-gray-600">{t.due_at}</td>
                                  <td className="py-1 px-2 text-gray-600">{t.resolved_at ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SlaReportesPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sla/dashboard')
      .then(res => setDashboard(res.data))
      .catch(error => console.error('Error loading SLA dashboard:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-gray-700" />
        <h1 className="text-lg font-semibold text-gray-900">Reportes de SLA</h1>
      </div>

      {/* Resumen de cumplimiento (tickets abiertos) */}
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

      {/* Tickets incumplidos */}
      <BreachedTicketsSection />

      {/* Cumplimiento de SLA por agente / grupo */}
      <SlaReportSection />
    </div>
  );
}
