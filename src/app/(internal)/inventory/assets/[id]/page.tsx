'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { assetsApi, Asset, AssetAssignment, AssetEvent, AssetMaintenance, AssetStatus } from '@/lib/assets-api';
import {
  ArrowLeft, User, MapPin, Calendar, Shield, Wrench,
  Clock, Package, ChevronDown, ChevronUp, UserPlus, RotateCcw,
  AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import AssignModal from '@/components/inventory/AssignModal';
import ReturnModal from '@/components/inventory/ReturnModal';

const STATUS_LABELS: Record<AssetStatus, string> = {
  available:      'Disponible',
  assigned:       'Asignado',
  pending_return: 'Pendiente devolución',
  in_repair:      'En reparación',
  damaged:        'Dañado',
  retired:        'Dado de baja',
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  available:      'bg-green-100 text-green-700 border-green-200',
  assigned:       'bg-blue-100 text-blue-700 border-blue-200',
  pending_return: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_repair:      'bg-orange-100 text-orange-700 border-orange-200',
  damaged:        'bg-red-100 text-red-700 border-red-200',
  retired:        'bg-gray-100 text-gray-500 border-gray-200',
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  assignment:     <UserPlus className="h-4 w-4 text-blue-500" />,
  user_change:    <RotateCcw className="h-4 w-4 text-yellow-500" />,
  location_change:<MapPin className="h-4 w-4 text-purple-500" />,
  maintenance:    <Wrench className="h-4 w-4 text-orange-500" />,
  recovery:       <CheckCircle2 className="h-4 w-4 text-green-500" />,
  retirement:     <XCircle className="h-4 w-4 text-red-500" />,
  status_change:  <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  created:        <Package className="h-4 w-4 text-gray-400" />,
  updated:        <Package className="h-4 w-4 text-gray-400" />,
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [events, setEvents] = useState<AssetEvent[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [maintenances, setMaintenances] = useState<AssetMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'events' | 'assignments' | 'maintenances'>('info');
  const [showAssign, setShowAssign] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const loadAsset = async () => {
    try {
      const { data } = await assetsApi.getAsset(Number(id));
      setAsset(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAsset(); }, [id]);

  useEffect(() => {
    if (tab === 'events') assetsApi.getAssetEvents(Number(id)).then(({ data }) => setEvents(data));
    if (tab === 'assignments') assetsApi.getAssetAssignments(Number(id)).then(({ data }) => setAssignments(data));
    if (tab === 'maintenances') assetsApi.getAssetMaintenances(Number(id)).then(({ data }) => setMaintenances(data));
  }, [tab, id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!asset) return <div className="text-center py-12 text-gray-500">Activo no encontrado.</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-sm text-gray-500">{asset.asset_type?.display_name} · {asset.internal_code ?? asset.serial_number ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[asset.status]}`}>
            {STATUS_LABELS[asset.status]}
          </span>
          {(asset.status === 'available') && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowAssign(true)}>
              <UserPlus className="h-4 w-4" /> Asignar
            </Button>
          )}
          {(asset.status === 'assigned') && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowReturn(true)}>
              <RotateCcw className="h-4 w-4" /> Devolver
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push(`/inventory/assets/${id}/edit`)}>
            Editar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        {(['info', 'events', 'assignments', 'maintenances'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'info' ? 'Información' : t === 'events' ? 'Historial' : t === 'assignments' ? 'Asignaciones' : 'Mantenimientos'}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Datos generales */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Datos Generales</h3>
            <dl className="space-y-3 text-sm">
              {[
                ['Código Interno',   asset.internal_code],
                ['Número de Serie',  asset.serial_number],
                ['Etiqueta Invent.', asset.inventory_tag],
                ['Proveedor',        asset.vendor],
              ].map(([label, val]) => val && (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800">{val}</dd>
                </div>
              ))}
              {asset.purchase_date && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Fecha Compra</dt>
                  <dd className="font-medium">{new Date(asset.purchase_date).toLocaleDateString('es-CO')}</dd>
                </div>
              )}
              {asset.warranty_end_date && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 flex items-center gap-1"><Shield className="h-3.5 w-3.5" />Fin Garantía</dt>
                  <dd className={`font-medium ${new Date(asset.warranty_end_date) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                    {new Date(asset.warranty_end_date).toLocaleDateString('es-CO')}
                  </dd>
                </div>
              )}
              {asset.location && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Ubicación</dt>
                  <dd className="font-medium">{asset.location.name}</dd>
                </div>
              )}
              {asset.current_user && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 flex items-center gap-1"><User className="h-3.5 w-3.5" />Asignado a</dt>
                  <dd className="font-medium">{asset.current_user.name}</dd>
                </div>
              )}
            </dl>
            {asset.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notas</p>
                <p className="text-sm text-gray-700">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Campos personalizados */}
          {asset.field_values && asset.field_values.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Especificaciones</h3>
              <dl className="space-y-3 text-sm">
                {asset.field_values.map(fv => fv.value && (
                  <div key={fv.id} className="flex justify-between">
                    <dt className="text-gray-500">{fv.field?.display_name}</dt>
                    <dd className="font-medium text-gray-800">{fv.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Historial de Eventos</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin eventos registrados.</p>
          ) : (
            <ol className="relative border-l border-gray-200 space-y-5 ml-3">
              {events.map(evt => (
                <li key={evt.id} className="ml-5">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full">
                    {EVENT_ICONS[evt.event_type] ?? <Clock className="h-3.5 w-3.5 text-gray-400" />}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{evt.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(evt.occurred_at).toLocaleString('es-CO')}
                    {evt.performed_by_user && ` · por ${evt.performed_by_user.name}`}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Asignado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Devuelto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Motivo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin asignaciones.</td></tr>
              ) : assignments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.user?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.assigned_at).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3 text-gray-500">{a.returned_at ? new Date(a.returned_at).toLocaleDateString('es-CO') : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.is_active ? 'Activa' : 'Finalizada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Maintenances Tab */}
      {tab === 'maintenances' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => router.push(`/inventory/maintenances/new?asset_id=${id}`)}>
              <Wrench className="h-4 w-4" /> Registrar Mantenimiento
            </Button>
          </div>
          {maintenances.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-12 text-gray-400 text-sm">
              Sin mantenimientos registrados.
            </div>
          ) : maintenances.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {m.maintenance_type === 'preventive' ? 'Preventivo' : 'Correctivo'} — {m.description ?? 'Sin descripción'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {m.scheduled_date && `Programado: ${new Date(m.scheduled_date).toLocaleDateString('es-CO')}`}
                  {m.service_provider && ` · ${m.service_provider.name}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                m.status === 'completed' ? 'bg-green-100 text-green-700' :
                m.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                m.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {m.status === 'completed' ? 'Completado' : m.status === 'in_progress' ? 'En progreso' : m.status === 'scheduled' ? 'Programado' : 'Cancelado'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAssign && (
        <AssignModal
          assetId={Number(id)}
          onClose={() => setShowAssign(false)}
          onSuccess={() => { setShowAssign(false); loadAsset(); setTab('events'); }}
        />
      )}
      {showReturn && (
        <ReturnModal
          assetId={Number(id)}
          onClose={() => setShowReturn(false)}
          onSuccess={() => { setShowReturn(false); loadAsset(); setTab('events'); }}
        />
      )}
    </div>
  );
}
