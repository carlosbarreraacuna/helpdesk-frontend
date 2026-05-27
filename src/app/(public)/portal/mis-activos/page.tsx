'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import {
  Monitor, Printer, Package, MapPin, Calendar, Wrench,
  ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock,
} from 'lucide-react';

interface Asset {
  id: number;
  name: string;
  internal_code: string | null;
  serial_number: string | null;
  inventory_tag: string | null;
  status: string;
  vendor: string | null;
  purchase_date: string | null;
  warranty_end_date: string | null;
  notes: string | null;
  asset_type: { id: number; name: string } | null;
  location: { id: number; name: string } | null;
}

interface Maintenance {
  id: number;
  title: string;
  type: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  notes: string | null;
}

interface AssetDetail extends Asset {
  maintenances?: Maintenance[];
  expanded?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  activo:      { label: 'Activo',      icon: CheckCircle, color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  inactivo:    { label: 'Inactivo',    icon: XCircle,     color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  mantenimiento:{ label: 'En Mantenimiento', icon: Wrench, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  dado_de_baja:{ label: 'Dado de Baja', icon: XCircle,    color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};

const TYPE_ICON: Record<string, React.ElementType> = {
  computador: Monitor,
  impresora: Printer,
};

export default function MisActivosPage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const [assets, setAssets] = useState<AssetDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role?.name !== 'usuario') {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAssets = async () => {
      try {
        const res = await api.get(`/users/${user.id}/assets`);
        const data: Asset[] = res.data ?? [];
        setAssets(data.map(a => ({ ...a, expanded: false })));
      } catch {
        setError('No se pudieron cargar los activos');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [user]);

  const toggleExpand = async (idx: number) => {
    const asset = assets[idx];
    const updated = [...assets];
    updated[idx] = { ...asset, expanded: !asset.expanded };

    if (!asset.expanded && !asset.maintenances) {
      try {
        const res = await api.get(`/assets/${asset.id}/maintenances`);
        updated[idx].maintenances = res.data.data ?? res.data ?? [];
      } catch {
        updated[idx].maintenances = [];
      }
    }

    setAssets(updated);
  };

  if (!isAuthenticated || user?.role?.name !== 'usuario') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Activos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Equipos y dispositivos asignados a tu usuario
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-500">{error}</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tienes activos asignados</p>
            <p className="text-gray-400 text-sm mt-1">
              Contacta al área de TI si crees que es un error
            </p>
            <Link href="/portal/mis-tickets" className="inline-flex mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition">
              Crear solicitud
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset, idx) => {
              const statusConf = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.activo;
              const StatusIcon = statusConf.icon;
              const typeName = asset.asset_type?.name?.toLowerCase() ?? '';
              const AssetIcon = TYPE_ICON[typeName] ?? Package;

              return (
                <div key={asset.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div
                    className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleExpand(idx)}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                      <AssetIcon className="w-6 h-6 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                          {asset.asset_type && (
                            <p className="text-xs text-gray-500 mt-0.5">{asset.asset_type.name}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.bg} ${statusConf.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConf.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                        {asset.serial_number && (
                          <div>
                            <span className="text-gray-400">Serial:</span>
                            <span className="ml-1 font-mono text-gray-700">{asset.serial_number}</span>
                          </div>
                        )}
                        {asset.internal_code && (
                          <div>
                            <span className="text-gray-400">Código:</span>
                            <span className="ml-1 font-mono text-gray-700">{asset.internal_code}</span>
                          </div>
                        )}
                        {asset.vendor && (
                          <div>
                            <span className="text-gray-400">Marca:</span>
                            <span className="ml-1 text-gray-700">{asset.vendor}</span>
                          </div>
                        )}
                        {asset.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">{asset.location.name}</span>
                          </div>
                        )}
                        {asset.warranty_end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700">
                              Garantía hasta {new Date(asset.warranty_end_date).toLocaleDateString('es', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <div className="text-gray-400 shrink-0 mt-1">
                      {asset.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded: maintenances */}
                  {asset.expanded && (
                    <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                        <Wrench className="w-3.5 h-3.5" /> Historial de Mantenimientos
                      </h4>

                      {!asset.maintenances ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                        </div>
                      ) : asset.maintenances.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Sin mantenimientos registrados</p>
                      ) : (
                        <div className="space-y-2">
                          {asset.maintenances.map(m => (
                            <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                                <Wrench className="w-3.5 h-3.5 text-yellow-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{m.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="capitalize">{m.type}</span>
                                  {m.scheduled_date && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(m.scheduled_date).toLocaleDateString('es')}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    m.status === 'completado' ? 'bg-green-100 text-green-700' :
                                    m.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {m.status}
                                  </span>
                                </div>
                                {m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {asset.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs font-medium text-blue-700 mb-1">Notas del equipo</p>
                          <p className="text-xs text-blue-600">{asset.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
