'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Report, ChartData } from '@/types/reports';

export default function ChartCard({ chart, filters }: { chart: Report; filters: any }) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [chart, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = chart.config.endpoint;
      const { data } = await api.get(endpoint, { params: filters });
      setData(data);
    } catch (error) {
      console.error('Error loading chart:', error);
    }
    setLoading(false);
  };

  const renderChart = () => {
    if (!data) return null;

    switch (chart.chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.labels?.map((label, i) => ({
              name: label,
              value: data.datasets[0].data[i]
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={Array.isArray(data.datasets[0].backgroundColor) ? '#3B82F6' : data.datasets[0].backgroundColor as string} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.labels?.map((label, i) => {
              const point: any = { name: label };
              data.datasets.forEach((dataset, idx) => {
                point[`dataset${idx}`] = dataset.data[i];
              });
              return point;
            })}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, idx) => (
                <Area
                  key={idx}
                  type="monotone"
                  dataKey={`dataset${idx}`}
                  name={dataset.label}
                  stroke={dataset.borderColor}
                  fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : (dataset.backgroundColor || undefined)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'doughnut':
        const pieData = data.labels?.map((label, i) => ({
          name: label,
          value: data.datasets[0].data[i],
          color: (data.datasets[0].backgroundColor as string[])?.[i]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                innerRadius={chart.chart_type === 'doughnut' ? 40 : 0}
              >
                {pieData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <p>Tipo de gráfico no soportado</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">{chart.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{chart.description}</p>
      
      {loading ? (
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      ) : (
        <div className="mt-4">
          {renderChart()}
        </div>
      )}
    </div>
  );
}
