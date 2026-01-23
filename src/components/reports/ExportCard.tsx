'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Report } from '@/types/reports';

export default function ExportCard({ exportConfig, filters, canExport }: { exportConfig: Report; filters: any; canExport?: boolean }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: string) => {
    if (!canExport) {
      alert('No tienes permisos para exportar reportes');
      return;
    }

    setExporting(true);
    try {
      const endpoint = exportConfig.config.endpoint;
      const { data } = await api.post(endpoint, { ...filters, format });
      
      // Descargar archivo
      window.open(data.download_url, '_blank');
      
      alert('Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar reporte');
    }
    setExporting(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
      canExport ? 'border-green-500' : 'border-gray-300'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <Download className={canExport ? 'text-green-600' : 'text-gray-400'} size={24} />
        <div className="flex-1">
          <h3 className="font-semibold">{exportConfig.name}</h3>
          <p className="text-sm text-gray-600">{exportConfig.description}</p>
        </div>
      </div>

      {canExport ? (
        <div className="space-y-2">
          {exportConfig.config.formats?.map(format => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={exporting}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {format === 'excel' && <FileSpreadsheet size={18} />}
              {format === 'pdf' && <FileText size={18} />}
              {format === 'csv' && <FileText size={18} />}
              <span className="text-sm">
                {exporting ? 'Exportando...' : `Exportar ${format.toUpperCase()}`}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
          <p className="text-sm text-gray-600">No tienes permisos para exportar</p>
        </div>
      )}
    </div>
  );
}
