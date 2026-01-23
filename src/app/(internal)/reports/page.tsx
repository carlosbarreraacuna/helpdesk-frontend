'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import MetricCard from '@/components/reports/MetricCard';
import ChartCard from '@/components/reports/ChartCard';
import TableCard from '@/components/reports/TableCard';
import ExportCard from '@/components/reports/ExportCard';
import { Filter, Download, RefreshCw } from 'lucide-react';
import { Report } from '@/types/reports';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    area: '',
    priority: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports');
      // Parse config JSON strings
      const parsedReports = data.map((report: any) => ({
        ...report,
        config: typeof report.config === 'string' ? JSON.parse(report.config) : report.config
      }));
      setReports(parsedReports);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    }
    setLoading(false);
  };

  const refresh = () => {
    loadReports();
  };

  const metrics = reports.filter(r => r.type === 'metric');
  const charts = reports.filter(r => r.type === 'chart');
  const tables = reports.filter(r => r.type === 'table');
  const exports = reports.filter(r => r.type === 'export');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes e Indicadores</h1>
          <p className="text-gray-600">
            Dashboard de métricas y estadísticas - {user?.role?.display_name}
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={20} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            className="p-2 border rounded"
            placeholder="Fecha desde"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />
          <input
            type="date"
            className="p-2 border rounded"
            placeholder="Fecha hasta"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />
          <select
            className="p-2 border rounded"
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <button
            onClick={refresh}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      ) : (
        <>
          {/* Métricas */}
          {metrics.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">📊 Métricas Clave</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(metric => (
                  <MetricCard key={metric.id} metric={metric} filters={filters} />
                ))}
              </div>
            </section>
          )}

          {/* Gráficos */}
          {charts.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">📈 Gráficos y Tendencias</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map(chart => (
                  <ChartCard key={chart.id} chart={chart} filters={filters} />
                ))}
              </div>
            </section>
          )}

          {/* Tablas */}
          {tables.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">📋 Reportes Detallados</h2>
              <div className="space-y-6">
                {tables.map(table => (
                  <TableCard key={table.id} table={table} filters={filters} />
                ))}
              </div>
            </section>
          )}

          {/* Exportaciones */}
          {exports.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">💾 Exportar Reportes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exports.map(exp => (
                  <ExportCard key={exp.id} exportConfig={exp} filters={filters} canExport={exp.can_export} />
                ))}
              </div>
            </section>
          )}

          {reports.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">No tienes reportes disponibles</p>
              <p className="text-sm text-gray-500 mt-2">
                Contacta al administrador para obtener acceso
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
