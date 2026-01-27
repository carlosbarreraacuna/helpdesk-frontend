'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Download } from 'lucide-react';
import { Report } from '@/types/reports';

export default function TableCard({ table, filters }: { table: Report; filters: any }) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [table, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = table.config.endpoint;
      const { data } = await api.get(endpoint, { params: filters });
      setData(data);
    } catch (error) {
      console.error('Error loading table:', error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{table.name}</h3>
            <p className="text-sm text-gray-600">{table.description}</p>
          </div>
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <Download size={18} />
            <span className="text-sm">Exportar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {table.config.columns?.map(col => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {col.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {table.config.columns?.map(col => (
                    <td key={col} className="px-6 py-4 text-sm text-gray-900">
                      {(() => {
                        const value = row[col];
                        if (typeof value === 'number') {
                          return value.toLocaleString();
                        }
                        if (value === null || value === undefined) {
                          return '-';
                        }
                        return String(value);
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
}
