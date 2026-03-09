'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assetsApi, Asset, ServiceProvider } from '@/lib/assets-api';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAssetId = searchParams.get('asset_id');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    asset_id: presetAssetId ?? '',
    maintenance_type: 'preventive',
    description: '',
    service_provider_id: '',
    scheduled_date: '',
    notes: '',
  });

  useEffect(() => {
    assetsApi.getAssets({ per_page: 200 }).then(({ data }) => setAssets(data.data));
    assetsApi.getProviders().then(({ data }) => setProviders(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        asset_id: Number(form.asset_id),
        service_provider_id: form.service_provider_id ? Number(form.service_provider_id) : null,
      };
      await assetsApi.createMaintenance(payload);
      router.push('/inventory/maintenances');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Error al registrar el mantenimiento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">Registrar Mantenimiento</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Activo *</Label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.asset_id}
                onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))}
                required
              >
                <option value="">Seleccionar activo...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} {a.internal_code ? `(${a.internal_code})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tipo de Mantenimiento *</Label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.maintenance_type}
                onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))}
              >
                <option value="preventive">Preventivo</option>
                <option value="corrective">Correctivo</option>
              </select>
            </div>
            <div>
              <Label>Proveedor de Servicio</Label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.service_provider_id}
                onChange={e => setForm(f => ({ ...f, service_provider_id: e.target.value }))}
              >
                <option value="">Sin proveedor</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fecha Programada</Label>
              <Input
                type="date" className="mt-1"
                value={form.scheduled_date}
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe el trabajo a realizar..."
            />
          </div>
          <div>
            <Label>Notas internas</Label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Registrar Mantenimiento'}
          </Button>
        </div>
      </form>
    </div>
  );
}
