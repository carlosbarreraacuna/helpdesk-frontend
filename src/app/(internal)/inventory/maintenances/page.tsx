'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { assetsApi, AssetMaintenance, MaintenanceStatus, MaintenanceType } from '@/lib/assets-api';
import { Plus, Wrench, RefreshCw, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  scheduled:   'Programado',
  in_progress: 'En progreso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};
const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  scheduled:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
};
const TYPE_LABELS: Record<MaintenanceType, string> = {
  preventive: 'Preventivo',
  corrective:  'Correctivo',
};

export default function MaintenancesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssetMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (filterStatus) params.status = filterStatus;
      if (filterType)   params.type   = filterType;
      const { data } = await assetsApi.getMaintenances(params);
      setItems(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimientos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registros</p>
        </div>
        <Link href="/inventory/maintenances/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Mantenimiento</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          {(Object.entries(STATUS_LABELS) as [MaintenanceStatus, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">Todos los tipos</option>
          <option value="preventive">Preventivo</option>
          <option value="corrective">Correctivo</option>
        </select>
        <Button variant="ghost" onClick={fetch}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Wrench className="h-10 w-10" />
            <p className="text-sm">No se encontraron mantenimientos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Activo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.asset?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[m.maintenance_type]}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.description ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.service_provider?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/inventory/maintenances/${m.id}`)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Página {page} de {lastPage}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}
