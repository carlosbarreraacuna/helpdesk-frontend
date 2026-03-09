'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assetsApi, AssetType, AssetTypeField, Location } from '@/lib/assets-api';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewAssetPage() {
  const router = useRouter();
  const [types, setTypes] = useState<AssetType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [typeFields, setTypeFields] = useState<AssetTypeField[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    asset_type_id: '',
    name: '',
    internal_code: '',
    serial_number: '',
    inventory_tag: '',
    location_id: '',
    vendor: '',
    purchase_date: '',
    warranty_end_date: '',
    warranty_provider: '',
    notes: '',
    is_shared: false,
  });
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});

  useEffect(() => {
    assetsApi.getTypes().then(({ data }) => setTypes(data));
    assetsApi.getLocations().then(({ data }) => setLocations(data));
  }, []);

  const handleTypeChange = (typeId: string) => {
    setForm(f => ({ ...f, asset_type_id: typeId }));
    const type = types.find(t => t.id === Number(typeId));
    setSelectedType(type ?? null);
    if (type) {
      assetsApi.getTypeFields(type.id).then(({ data }) => {
        setTypeFields(data);
        setFieldValues({});
      });
    } else {
      setTypeFields([]);
      setFieldValues({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_type_id || !form.name) return;
    setSaving(true);
    setError('');
    try {
      const fv = typeFields.map(f => ({ field_id: f.id, value: fieldValues[f.id] ?? '' }));
      await assetsApi.createAsset({
        ...form,
        asset_type_id: Number(form.asset_type_id),
        location_id: form.location_id ? Number(form.location_id) : null,
        field_values: fv,
      });
      router.push('/inventory/assets');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Error al crear el activo.');
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
        <h1 className="text-xl font-semibold text-gray-900">Registrar Nuevo Activo</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo y datos básicos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Activo *</Label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.asset_type_id}
                onChange={e => handleTypeChange(e.target.value)}
                required
              >
                <option value="">Seleccionar tipo...</option>
                {types.filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>{t.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Nombre / Descripción *</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Laptop Dell Inspiron 15"
                required
              />
            </div>
            <div>
              <Label>Código Interno</Label>
              <Input
                className="mt-1"
                value={form.internal_code}
                onChange={e => setForm(f => ({ ...f, internal_code: e.target.value }))}
                placeholder="Ej: TI-001"
              />
            </div>
            <div>
              <Label>Número de Serie</Label>
              <Input
                className="mt-1"
                value={form.serial_number}
                onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
              />
            </div>
            <div>
              <Label>Etiqueta de Inventario</Label>
              <Input
                className="mt-1"
                value={form.inventory_tag}
                onChange={e => setForm(f => ({ ...f, inventory_tag: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.location_id}
                onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
              >
                <option value="">Sin ubicación</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.area?.name} — {l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Proveedor / Fabricante</Label>
              <Input
                className="mt-1"
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fecha de Compra</Label>
              <Input
                type="date" className="mt-1"
                value={form.purchase_date}
                onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fin de Garantía</Label>
              <Input
                type="date" className="mt-1"
                value={form.warranty_end_date}
                onChange={e => setForm(f => ({ ...f, warranty_end_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Proveedor de Garantía</Label>
              <Input
                className="mt-1"
                value={form.warranty_provider}
                onChange={e => setForm(f => ({ ...f, warranty_provider: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_shared"
              checked={form.is_shared}
              onChange={e => setForm(f => ({ ...f, is_shared: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="is_shared">Activo compartido (impresoras, switches, etc.)</Label>
          </div>
        </div>

        {/* Campos personalizados del tipo */}
        {typeFields.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Especificaciones de {selectedType?.display_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typeFields.map(field => (
                <div key={field.id}>
                  <Label>{field.display_name}{field.is_required && ' *'}</Label>
                  {field.field_type === 'select' && field.options ? (
                    <select
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      value={fieldValues[field.id] ?? ''}
                      onChange={e => setFieldValues(fv => ({ ...fv, [field.id]: e.target.value }))}
                      required={field.is_required}
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.field_type === 'boolean' ? (
                    <select
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      value={fieldValues[field.id] ?? ''}
                      onChange={e => setFieldValues(fv => ({ ...fv, [field.id]: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <Input
                      className="mt-1"
                      type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                      value={fieldValues[field.id] ?? ''}
                      onChange={e => setFieldValues(fv => ({ ...fv, [field.id]: e.target.value }))}
                      required={field.is_required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Registrar Activo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
