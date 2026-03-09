'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assetsApi, UserTechProfile, UserSoftwareAssignment } from '@/lib/assets-api';
import {
  ArrowLeft, User, Laptop, Package, Ticket, Monitor,
  Plus, Trash2, Shield, Calendar, CheckCircle2,
} from 'lucide-react';

export default function UserTechProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<UserTechProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'assets' | 'history' | 'software' | 'tickets'>('assets');
  const [showAddSoftware, setShowAddSoftware] = useState(false);

  const [swForm, setSwForm] = useState({
    software_name: '',
    version: '',
    license_key: '',
    assigned_at: new Date().toISOString().split('T')[0],
    expires_at: '',
    notes: '',
  });
  const [swSaving, setSwSaving] = useState(false);
  const [swError, setSwError] = useState('');

  const load = async () => {
    try {
      const { data } = await assetsApi.getUserTechProfile(Number(userId));
      setProfile(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const handleAddSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwSaving(true); setSwError('');
    try {
      await assetsApi.assignSoftware(Number(userId), swForm);
      setShowAddSoftware(false);
      setSwForm({ software_name: '', version: '', license_key: '', assigned_at: new Date().toISOString().split('T')[0], expires_at: '', notes: '' });
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSwError(e.response?.data?.message ?? 'Error al asignar software.');
    } finally {
      setSwSaving(false);
    }
  };

  const handleRevokeSoftware = async (sw: UserSoftwareAssignment) => {
    if (!confirm(`¿Revocar licencia de ${sw.software_name}?`)) return;
    await assetsApi.revokeSoftware(Number(userId), sw.id);
    await load();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (<div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-4 bg-gray-200 rounded flex-1" /></div>))}
        </div>
      </div>
    );
  }
  if (!profile) {
    return <div className="text-center py-12 text-gray-500">Usuario no encontrado.</div>;
  }

  const { user, current_assets, historical_assets, tickets_summary, software } = profile;
  const tabClass = (t: string) =>
    `pb-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Hoja de Vida Tecnológica</h1>
      </div>

      {/* User card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap gap-6 items-center">
        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="h-7 w-7 text-blue-600" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex gap-3 mt-1">
            {user.role && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.role.name}</span>}
            {user.area && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{user.area.name}</span>}
          </div>
        </div>
        {/* Summary cards */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{current_assets.length}</p>
            <p className="text-xs text-gray-500">Activos asignados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{software.length}</p>
            <p className="text-xs text-gray-500">Licencias activas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700">{tickets_summary?.total ?? 0}</p>
            <p className="text-xs text-gray-500">Tickets totales</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button className={tabClass('assets')} onClick={() => setTab('assets')}>
          <Package className="inline h-4 w-4 mr-1.5" />Activos Actuales
        </button>
        <button className={tabClass('history')} onClick={() => setTab('history')}>
          <Calendar className="inline h-4 w-4 mr-1.5" />Historial
        </button>
        <button className={tabClass('software')} onClick={() => setTab('software')}>
          <Monitor className="inline h-4 w-4 mr-1.5" />Software / Licencias
        </button>
        <button className={tabClass('tickets')} onClick={() => setTab('tickets')}>
          <Ticket className="inline h-4 w-4 mr-1.5" />Tickets
        </button>
      </div>

      {/* Current Assets */}
      {tab === 'assets' && (
        <div className="space-y-3">
          {current_assets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-12 text-gray-400 gap-2">
              <Package className="h-6 w-6" />
              <span className="text-sm">Sin activos asignados actualmente.</span>
            </div>
          ) : current_assets.map(asset => (
            <div
              key={asset.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/inventory/assets/${asset.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Laptop className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{asset.name}</p>
                  <p className="text-xs text-gray-500">
                    {asset.asset_type?.display_name}
                    {asset.internal_code && ` · ${asset.internal_code}`}
                    {asset.serial_number && ` · ${asset.serial_number}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {asset.location && <p className="text-xs text-gray-400">{asset.location.name}</p>}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-0.5">
                  Asignado
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Activo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Asignado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Devuelto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historical_assets.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin historial previo.</td></tr>
              ) : historical_assets.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.asset?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.asset?.asset_type?.display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.assigned_at).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3 text-gray-500">{a.returned_at ? new Date(a.returned_at).toLocaleDateString('es-CO') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Software */}
      {tab === 'software' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setShowAddSoftware(s => !s)}>
              <Plus className="h-4 w-4" /> Asignar Software
            </Button>
          </div>

          {showAddSoftware && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Nueva Asignación de Software</h3>
              {swError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-3">{swError}</div>}
              <form onSubmit={handleAddSoftware} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Software *</Label>
                  <Input className="mt-1" placeholder="Ej: Microsoft Office 365" value={swForm.software_name} onChange={e => setSwForm(f => ({ ...f, software_name: e.target.value }))} required />
                </div>
                <div>
                  <Label>Versión</Label>
                  <Input className="mt-1" placeholder="Ej: 2024" value={swForm.version} onChange={e => setSwForm(f => ({ ...f, version: e.target.value }))} />
                </div>
                <div>
                  <Label>Clave de Licencia</Label>
                  <Input className="mt-1" value={swForm.license_key} onChange={e => setSwForm(f => ({ ...f, license_key: e.target.value }))} />
                </div>
                <div>
                  <Label>Fecha de Asignación *</Label>
                  <Input type="date" className="mt-1" value={swForm.assigned_at} onChange={e => setSwForm(f => ({ ...f, assigned_at: e.target.value }))} required />
                </div>
                <div>
                  <Label>Fecha de Expiración</Label>
                  <Input type="date" className="mt-1" value={swForm.expires_at} onChange={e => setSwForm(f => ({ ...f, expires_at: e.target.value }))} />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddSoftware(false)}>Cancelar</Button>
                  <Button type="submit" disabled={swSaving}>
                    {swSaving ? 'Guardando...' : 'Asignar Licencia'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {software.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
                <Shield className="h-6 w-6" /> Sin licencias asignadas.
              </div>
            ) : software.map(sw => (
              <div key={sw.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sw.software_name}{sw.version && <span className="text-sm text-gray-400 ml-1">v{sw.version}</span>}</p>
                    <p className="text-xs text-gray-500">
                      Asignado: {new Date(sw.assigned_at).toLocaleDateString('es-CO')}
                      {sw.expires_at && ` · Expira: ${new Date(sw.expires_at).toLocaleDateString('es-CO')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sw.expires_at && new Date(sw.expires_at) < new Date() ? (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expirado</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Activo
                    </span>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleRevokeSoftware(sw)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tickets summary */}
      {tab === 'tickets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total de Tickets', value: tickets_summary?.total ?? 0, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Tickets Abiertos', value: tickets_summary?.open_count ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Tickets Cerrados', value: tickets_summary?.closed_count ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} rounded-xl border border-gray-200 p-6 text-center`}>
              <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
          <div className="md:col-span-3 flex justify-center mt-2">
            <Button variant="outline" onClick={() => router.push(`/tickets?created_by=${userId}`)}>
              Ver todos los tickets de este usuario
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
