'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import { TICKET_STATUS_LABEL } from '@/lib/ticket-status';
import { Button } from '@/components/ui/button';
import {
  Plus, Search, Ticket, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Filter, Loader2, RefreshCw, Package, XCircle, MessageSquare,
} from 'lucide-react';

const hasUnread = (ticket: TicketItem): boolean => {
  if (!ticket.latest_agent_comment_at) return false;
  if (typeof window === 'undefined') return false;
  const lastRead = localStorage.getItem(`ticket_read_${ticket.id}`);
  if (!lastRead) return true;
  return new Date(ticket.latest_agent_comment_at) > new Date(lastRead);
};
import PortalCreateTicketModal from '@/components/portal/PortalCreateTicketModal';

interface TicketItem {
  id: number;
  ticket_number: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  status: { id: number; name: string; color: string };
  created_at: string;
  updated_at: string;
  assigned_agent?: { id: number; name: string } | null;
  latest_agent_comment_at?: string | null;
}

interface TicketStatus {
  id: number;
  name: string;
  color: string;
}

const STATUS_LABEL = TICKET_STATUS_LABEL;

const PRIORITY_LABEL: Record<string, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const PRIORITY_COLOR: Record<string, string> = {
  alta: 'text-red-700 bg-red-50 border-red-200',
  media: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  baja: 'text-green-700 bg-green-50 border-green-200',
};

export default function MisTicketsPage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ total: 0, abiertos: 0, resueltos: 0, pendiente_validacion: 0 });
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role?.name !== 'usuario') {
      router.replace('/login');
      return;
    }
    api.get('/ticket-statuses').then(r => setStatuses(r.data)).catch(() => {});
  }, [isAuthenticated, user, router]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/portal/my-tickets-stats');
      setStats(res.data);
    } catch {
      // keep previous stats on failure
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { per_page: '50' };
      if (search) params.search = search;
      if (filterStatus) params.status_id = filterStatus;
      const res = await api.get('/tickets', { params });
      const data: TicketItem[] = res.data.data ?? res.data;
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchTickets(); }, [search, filterStatus]);

  const getStatusIcon = (name: string) => {
    if (['cerrado', 'resuelto'].includes(name)) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (name === 'escalado') return <AlertCircle className="w-3.5 h-3.5" />;
    return <Clock className="w-3.5 h-3.5" />;
  };

  if (!isAuthenticated || user?.role?.name !== 'usuario') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h1>
              <p className="text-sm text-gray-500 mt-1">Bienvenido, <span className="font-medium text-primary">{user?.name}</span></p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Solicitud
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4 border">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">En proceso</p>
              <p className="text-2xl font-bold text-blue-700">{stats.abiertos}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Por validar</p>
              <p className="text-2xl font-bold text-amber-700">{stats.pendiente_validacion}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Resueltos</p>
              <p className="text-2xl font-bold text-green-700">{stats.resueltos}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número o descripción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="">Todos los estados</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id.toString()}>
                  {STATUS_LABEL[s.name] ?? s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => { fetchTickets(); fetchStats(); }}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tienes solicitudes aún</p>
            <p className="text-gray-400 text-sm mt-1">Crea tu primera solicitud de soporte</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Crear Solicitud
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map(ticket => (
              <Link
                key={ticket.id}
                href={`/portal/mis-tickets/${ticket.id}`}
                className={`block bg-white border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all group ${hasUnread(ticket) ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded">
                        {ticket.ticket_number}
                      </span>
                      {hasUnread(ticket) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                          <MessageSquare size={10} />
                          Nuevo mensaje
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{ backgroundColor: ticket.status.color + '22', color: ticket.status.color, borderColor: ticket.status.color + '55' }}
                      >
                        {getStatusIcon(ticket.status.name)}
                        {ticket.status.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLOR[ticket.priority]}`}>
                        {PRIORITY_LABEL[ticket.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {ticket.assigned_agent && (
                        <span>Agente: <span className="text-gray-600 font-medium">{ticket.assigned_agent.name}</span></span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <PortalCreateTicketModal
          user={user!}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTickets(); fetchStats(); }}
        />
      )}
    </div>
  );
}
