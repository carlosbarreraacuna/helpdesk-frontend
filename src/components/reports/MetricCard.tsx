'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import * as Icons from 'lucide-react';
import { Report, MetricData } from '@/types/reports';

export default function MetricCard({ metric, filters }: { metric: Report; filters: any }) {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [metric, filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = metric.config.endpoint;
      console.log('Loading metric:', metric.name, 'from endpoint:', endpoint);
      console.log('Filters:', filters);
      
      const { data } = await api.get(endpoint, { params: filters });
      console.log('Metric data received:', data);
      setData(data);
    } catch (error: any) {
      console.error('Error loading metric:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        endpoint: metric.config.endpoint,
        filters: filters
      });
      
      // Set error message for display
      let errorMessage = 'Error al cargar métrica';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error del servidor';
      } else if (error.response?.status === 403) {
        errorMessage = 'Sin permisos';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint no encontrado';
      }
      
      setError(errorMessage);
    }
    setLoading(false);
  };

  const getIcon = () => {
    const IconComponent = Icons[metric.icon as keyof typeof Icons] as any;
    if (typeof IconComponent === 'function') {
      return <IconComponent size={32} />;
    }
    return <Icons.Activity size={32} />;
  };

  const getColorClasses = () => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
    };
    return colors[metric.config.color || 'blue'] || colors.blue;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${getColorClasses()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{metric.name}</p>
          {loading ? (
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-600">
              <p className="text-lg font-semibold">Error</p>
              <p className="text-xs">{error}</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold mb-1">
                {metric.config.format === 'hours' 
                  ? `${data?.value}h` 
                  : data?.value?.toLocaleString()}
              </p>
              {data?.change && (
                <p className={`text-sm ${data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.change > 0 ? '↑' : '↓'} {Math.abs(data.change)}% vs mes anterior
                </p>
              )}
            </>
          )}
        </div>
        <div className="ml-4">
          {getIcon()}
        </div>
      </div>
    </div>
  );
}
