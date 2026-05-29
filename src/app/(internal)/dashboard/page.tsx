'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

interface Ticket {
  id: number;
  ticket_number: string;
  requester_name: string;
  requester_email: string;
  description: string;
  priority: string;
  status: {
    id: number;
    name: string;
    color: string;
  };
  created_at: string;
}

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recent: Ticket[];
}

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slaRisk, setSlaRisk] = useState<{ ticket_number: string; risk_level: string; reason: string }[]>([]);
  const [slaLoading, setSlaLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/tickets');
        const tickets = response.data.data;

        const byStatus: Record<string, number> = {};
        const byPriority: Record<string, number> = {};

        tickets.forEach((ticket: Ticket) => {
          const statusName = ticket.status.name;
          byStatus[statusName] = (byStatus[statusName] || 0) + 1;
          const priority = ticket.priority;
          byPriority[priority] = (byPriority[priority] || 0) + 1;
        });

        setStats({
          total: tickets.length,
          byStatus,
          byPriority,
          recent: tickets.slice(0, 5),
        });

      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          clearAuth();
          router.replace('/login');
          return;
        }
        setError('No se pudieron cargar los datos del dashboard. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <span className="text-red-500 mt-0.5">⚠</span>
        <div>
          <p className="text-sm font-medium text-red-800">Error al cargar el dashboard</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <span className="text-2xl">🎫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <span className="text-2xl">🆕</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus['nuevo'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tickets nuevos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus['en_progreso'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              En proceso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus['resuelto'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tickets resueltos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.byPriority || {}).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className="capitalize">{priority}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Recientes</CardTitle>
            <CardDescription>Últimos 5 tickets creados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recent.map((ticket) => (
                <div key={ticket.id} className="border-l-4 pl-4" style={{ borderColor: ticket.status.color }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{ticket.ticket_number}</p>
                      <p className="text-sm text-gray-600">{ticket.requester_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      <p className="text-xs font-medium" style={{ color: ticket.status.color }}>
                        {ticket.status.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Risk Prediction */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium">Predicción de Riesgo SLA</CardTitle>
          </div>
          {slaLoading
            ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            : slaRisk.length === 0 && (
              <button
                onClick={() => {
                  setSlaLoading(true);
                  api.get('/ai/sla-risk')
                    .then(r => setSlaRisk(r.data.at_risk ?? []))
                    .catch(() => {})
                    .finally(() => setSlaLoading(false));
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> Analizar
              </button>
            )
          }
        </CardHeader>
        <CardContent>
          {slaLoading ? (
            <p className="text-xs text-gray-400 text-center py-4">Analizando tickets con IA...</p>
          ) : slaRisk.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Haz clic en "Analizar" para detectar tickets en riesgo</p>
          ) : (
            <div className="space-y-2">
              {slaRisk.map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.risk_level === 'alto' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${item.risk_level === 'alto' ? 'text-red-500' : 'text-orange-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{item.ticket_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.risk_level === 'alto' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        Riesgo {item.risk_level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
