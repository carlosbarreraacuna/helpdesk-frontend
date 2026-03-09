'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assetsApi, AssetType, Location, ServiceProvider } from '@/lib/assets-api';
import { Plus, Pencil, Trash2, Package, MapPin, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface Area { id: number; name: string; }

type Tab = 'types' | 'locations' | 'providers';

export default function InventoryManagePage() {
  const [tab, setTab] = useState<Tab>('types');

  // Types
  const [types, setTypes] = useState<AssetType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDisplay, setNewTypeDisplay] = useState('');

  // Locations
  const [locations, setLocations] = useState<Location[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [newLocArea, setNewLocArea] = useState('');
  const [newLocName, setNewLocName] = useState('');

  // Providers
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [providerForm, setProviderForm] = useState({ name: '', phone: '', email: '', service_type: '' });
  const [editingProvider, setEditingProvider] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    assetsApi.getTypes().then(({ data }) => setTypes(data));
    assetsApi.getLocations().then(({ data }) => setLocations(data));
    assetsApi.getProviders().then(({ data }) => setProviders(data));
    api.get<Area[]>('/areas').then(({ data }) => setAreas(data));
  }, []);

  // ── Types ──────────────────────────────────────────────────────────────────
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName || !newTypeDisplay) return;
    setSaving(true); setError('');
    try {
      const { data } = await assetsApi.createType({ name: newTypeName, display_name: newTypeDisplay });
      setTypes(prev => [...prev, data]);
      setNewTypeName(''); setNewTypeDisplay('');
    } catch { setError('Error al crear tipo.'); }
    finally { setSaving(false); }
  };

  const handleToggleType = async (t: AssetType) => {
    const { data } = await assetsApi.updateType(t.id, { is_active: !t.is_active });
    setTypes(prev => prev.map(x => x.id === t.id ? data : x));
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('¿Eliminar este tipo?')) return;
    try {
      await assetsApi.deleteType(id);
      setTypes(prev => prev.filter(t => t.id !== id));
    } catch { setError('No se puede eliminar este tipo.'); }
  };

  // ── Locations ──────────────────────────────────────────────────────────────
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocArea || !newLocName) return;
    setSaving(true); setError('');
    try {
      const { data } = await assetsApi.createLocation(Number(newLocArea), { name: newLocName });
      setLocations(prev => [...prev, data]);
      setNewLocName('');
    } catch { setError('Error al crear ubicación.'); }
    finally { setSaving(false); }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('¿Desactivar esta ubicación?')) return;
    await assetsApi.deleteLocation(id);
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  // ── Providers ──────────────────────────────────────────────────────────────
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.name) return;
    setSaving(true); setError('');
    try {
      if (editingProvider) {
        const { data } = await assetsApi.updateProvider(editingProvider, providerForm);
        setProviders(prev => prev.map(p => p.id === editingProvider ? data : p));
        setEditingProvider(null);
      } else {
        const { data } = await assetsApi.createProvider(providerForm);
        setProviders(prev => [...prev, data]);
      }
      setProviderForm({ name: '', phone: '', email: '', service_type: '' });
    } catch { setError('Error al guardar proveedor.'); }
    finally { setSaving(false); }
  };

  const handleEditProvider = (p: ServiceProvider) => {
    setEditingProvider(p.id);
    setProviderForm({ name: p.name, phone: p.phone ?? '', email: p.email ?? '', service_type: p.service_type ?? '' });
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    await assetsApi.deleteProvider(id);
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  const tabClass = (t: Tab) =>
    `pb-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Inventario</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tipos de activos, ubicaciones y proveedores de servicio</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">{error}</div>}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button className={tabClass('types')} onClick={() => setTab('types')}>
          <Package className="inline h-4 w-4 mr-1.5" />Tipos de Activos
        </button>
        <button className={tabClass('locations')} onClick={() => setTab('locations')}>
          <MapPin className="inline h-4 w-4 mr-1.5" />Ubicaciones
        </button>
        <button className={tabClass('providers')} onClick={() => setTab('providers')}>
          <Building2 className="inline h-4 w-4 mr-1.5" />Proveedores
        </button>
      </div>

      {/* ── Types Tab ── */}
      {tab === 'types' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateType} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Nuevo Tipo de Activo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nombre (clave)</Label>
                <Input className="mt-1" placeholder="Ej: tablet" value={newTypeName} onChange={e => setNewTypeName(e.target.value.toLowerCase().replace(/\s/g,'_'))} required />
              </div>
              <div>
                <Label>Nombre para mostrar</Label>
                <Input className="mt-1" placeholder="Ej: Tablet" value={newTypeDisplay} onChange={e => setNewTypeDisplay(e.target.value)} required />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2"><Plus className="h-4 w-4" />Agregar Tipo</Button>
            </div>
          </form>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Clave</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Activos</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {types.map(t => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${!t.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{t.display_name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.name}</td>
                    <td className="px-4 py-3 text-gray-500">{t.assets_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1.5 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleType(t)}>
                        {t.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      {!t.is_system && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteType(t.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Locations Tab ── */}
      {tab === 'locations' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateLocation} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Nueva Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Área</Label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  value={newLocArea}
                  onChange={e => setNewLocArea(e.target.value)}
                  required
                >
                  <option value="">Seleccionar área...</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Nombre de la ubicación</Label>
                <Input className="mt-1" placeholder="Ej: Sala de servidores piso 3" value={newLocName} onChange={e => setNewLocName(e.target.value)} required />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2"><Plus className="h-4 w-4" />Agregar Ubicación</Button>
            </div>
          </form>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Área</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">Sin ubicaciones registradas.</td></tr>
                ) : locations.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3 text-gray-500">{l.area?.name ?? '—'}</td>
                    <td className="px-4 py-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(l.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Providers Tab ── */}
      {tab === 'providers' && (
        <div className="space-y-4">
          <form onSubmit={handleSaveProvider} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nombre *</Label>
                <Input className="mt-1" value={providerForm.name} onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input className="mt-1" value={providerForm.phone} onChange={e => setProviderForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="mt-1" value={providerForm.email} onChange={e => setProviderForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Tipo de Servicio</Label>
                <Input className="mt-1" placeholder="Ej: Soporte técnico, Garantía..." value={providerForm.service_type} onChange={e => setProviderForm(f => ({ ...f, service_type: e.target.value }))} />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              {editingProvider && (
                <Button type="button" variant="outline" onClick={() => { setEditingProvider(null); setProviderForm({ name:'', phone:'', email:'', service_type:'' }); }}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={saving} className="gap-2">
                <Plus className="h-4 w-4" />{editingProvider ? 'Guardar Cambios' : 'Agregar Proveedor'}
              </Button>
            </div>
          </form>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin proveedores registrados.</td></tr>
                ) : providers.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.service_type ?? '—'}</td>
                    <td className="px-4 py-3 flex items-center gap-1.5 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProvider(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProvider(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
