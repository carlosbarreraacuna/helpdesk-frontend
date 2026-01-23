'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';

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
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/tickets');
        const tickets = response.data.data;
        
        // Calculate stats
        const byStatus: Record<string, number> = {};
        const byPriority: Record<string, number> = {};
        
        tickets.forEach((ticket: Ticket) => {
          // Count by status
          const statusName = ticket.status.name;
          byStatus[statusName] = (byStatus[statusName] || 0) + 1;
          
          // Count by priority
          const priority = ticket.priority;
          byPriority[priority] = (byPriority[priority] || 0) + 1;
        });

        setStats({
          total: tickets.length,
          byStatus,
          byPriority,
          recent: tickets.slice(0, 5), // Last 5 tickets
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema de tickets</p>
      </div>

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
    </div>
  );
}
