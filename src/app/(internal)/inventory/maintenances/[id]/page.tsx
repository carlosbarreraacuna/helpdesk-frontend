'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assetsApi, AssetMaintenance, MaintenanceStatus } from '@/lib/assets-api';
import { ArrowLeft, Save, Wrench } from 'lucide-react';

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  scheduled:   'Programado',
  in_progress: 'En progreso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};

export default function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [maintenance, setMaintenance] = useState<AssetMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: '',
    executed_date: '',
    cost: '',
    invoice_number: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await assetsApi.getMaintenance(Number(id));
      setMaintenance(data);
      setStatusForm(f => ({ ...f, status: data.status, notes: data.notes ?? '' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { status: statusForm.status };
      if (statusForm.executed_date) payload.executed_date = statusForm.executed_date;
      if (statusForm.cost) payload.cost = Number(statusForm.cost);
      if (statusForm.invoice_number) payload.invoice_number = statusForm.invoice_number;
      if (statusForm.notes) payload.notes = statusForm.notes;
      await assetsApi.updateMaintenanceStatus(Number(id), payload);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Error al actualizar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {[...Array(4)].map((_, i) => (<div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-4 bg-gray-200 rounded flex-1" /></div>))}
      </div>
    </div>
  );
  if (!maintenance) return <div className="text-center py-12 text-gray-500">Mantenimiento no encontrado.</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Mantenimiento #{maintenance.id} — {maintenance.maintenance_type === 'preventive' ? 'Preventivo' : 'Correctivo'}
          </h1>
          <p className="text-sm text-gray-500">{maintenance.asset?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Datos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Wrench className="h-4 w-4" /> Información</h3>
          <dl className="space-y-2">
            {[
              ['Activo', maintenance.asset?.name],
              ['Tipo', maintenance.maintenance_type === 'preventive' ? 'Preventivo' : 'Correctivo'],
              ['Proveedor', maintenance.service_provider?.name],
              ['Fecha programada', maintenance.scheduled_date ? new Date(maintenance.scheduled_date).toLocaleDateString('es-CO') : null],
              ['Fecha ejecutada', maintenance.executed_date ? new Date(maintenance.executed_date).toLocaleDateString('es-CO') : null],
              ['Costo', maintenance.cost ? `$${Number(maintenance.cost).toLocaleString('es-CO')}` : null],
              ['N° Factura', maintenance.invoice_number],
              ['Registrado por', maintenance.creator?.name],
            ].map(([label, val]) => val && (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800">{val}</dd>
              </div>
            ))}
          </dl>
          {maintenance.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Descripción</p>
              <p className="text-gray-700">{maintenance.description}</p>
            </div>
          )}
        </div>

        {/* Actualizar estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Actualizar Estado</h3>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleUpdateStatus} className="space-y-3">
            <div>
              <Label>Estado</Label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={statusForm.status}
                onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
              >
                {(Object.entries(STATUS_LABELS) as [MaintenanceStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {(statusForm.status === 'completed') && (
              <>
                <div>
                  <Label>Fecha de Ejecución</Label>
                  <Input type="date" className="mt-1" value={statusForm.executed_date} onChange={e => setStatusForm(f => ({ ...f, executed_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Costo ($)</Label>
                  <Input type="number" className="mt-1" placeholder="0.00" value={statusForm.cost} onChange={e => setStatusForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
                <div>
                  <Label>N° Factura</Label>
                  <Input className="mt-1" value={statusForm.invoice_number} onChange={e => setStatusForm(f => ({ ...f, invoice_number: e.target.value }))} />
                </div>
              </>
            )}
            <div>
              <Label>Notas</Label>
              <textarea
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                rows={3}
                value={statusForm.notes}
                onChange={e => setStatusForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={updatingStatus} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {updatingStatus ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
