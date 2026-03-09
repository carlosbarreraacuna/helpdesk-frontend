'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assetsApi, Asset, AssetType, AssetStatus } from '@/lib/assets-api';
import {
  Plus, Search, Filter, Package, Laptop, Monitor, Printer,
  HardDrive, RefreshCw, MapPin, User, ChevronRight,
} from 'lucide-react';

const STATUS_LABELS: Record<AssetStatus, string> = {
  available:      'Disponible',
  assigned:       'Asignado',
  pending_return: 'Pendiente devolución',
  in_repair:      'En reparación',
  damaged:        'Dañado',
  retired:        'Dado de baja',
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  available:      'bg-green-100 text-green-700',
  assigned:       'bg-blue-100 text-blue-700',
  pending_return: 'bg-yellow-100 text-yellow-700',
  in_repair:      'bg-orange-100 text-orange-700',
  damaged:        'bg-red-100 text-red-700',
  retired:        'bg-gray-100 text-gray-500',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  laptop:  <Laptop className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
  monitor: <Monitor className="h-4 w-4" />,
  printer: <Printer className="h-4 w-4" />,
};

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search)       params.search = search;
      if (filterType)   params.type_id = filterType;
      if (filterStatus) params.status = filterStatus;
      const { data } = await assetsApi.getAssets(params);
      setAssets(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  useEffect(() => {
    assetsApi.getTypes().then(({ data }) => setTypes(data));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssets();
  };

  const typeIcon = (typeName: string) =>
    TYPE_ICONS[typeName] ?? <Package className="h-4 w-4" />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Activos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} activos registrados</p>
        </div>
        <Link href="/inventory/assets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Activo
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, código, serial..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
          >
            <option value="">Todos los tipos</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.display_name}</option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as AssetStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
          <Button type="button" variant="ghost" onClick={fetchAssets}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Package className="h-10 w-10" />
            <p className="text-sm">No se encontraron activos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Activo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código / Serial</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ubicación</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Asignado a</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      {typeIcon(asset.asset_type?.name ?? '')}
                      {asset.asset_type?.display_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <div>{asset.internal_code && <span className="block">{asset.internal_code}</span>}</div>
                    <div>{asset.serial_number && <span className="text-xs text-gray-400">{asset.serial_number}</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {asset.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {asset.location.name}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {asset.current_user ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {asset.current_user.name}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status]}`}>
                      {STATUS_LABELS[asset.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/inventory/assets/${asset.id}`)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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
