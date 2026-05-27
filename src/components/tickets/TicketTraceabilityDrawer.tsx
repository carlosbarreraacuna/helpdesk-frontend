'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  X, Clock, UserCheck, TrendingUp, Tag, XCircle, MessageSquare,
  Lock, CheckCircle2, Package, Send, Paperclip, RefreshCw, Monitor,
} from 'lucide-react';

interface TimelineEntry {
  id: string;
  type: string;
  category: 'history' | 'comment';
  description: string;
  old_value?: string | null;
  new_value?: string | null;
  user?: { name: string; email: string } | null;
  attachments_count?: number;
  is_internal?: boolean;
  timestamp: string;
}

interface HistoryData {
  ticket: {
    id: number;
    ticket_number: string;
    requester_name: string;
    requester_email: string;
    status: { name: string; color: string };
    assigned_agent: { name: string } | null;
    created_at: string;
    closed_at: string | null;
  };
  timeline: TimelineEntry[];
  summary: {
    total_events: number;
    total_comments: number;
    total_history: number;
  };
}

interface Props {
  ticketId: number;
  ticketNumber: string;
  onClose: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; dot: string }> = {
  creado:          { label: 'Ticket creado',        icon: <Package className="h-3.5 w-3.5" />,      color: 'text-gray-600 bg-gray-50 border-gray-200',    dot: 'bg-gray-400' },
  asignado:        { label: 'Asignado',              icon: <UserCheck className="h-3.5 w-3.5" />,    color: 'text-blue-700 bg-blue-50 border-blue-200',    dot: 'bg-blue-500' },
  escalado:        { label: 'Escalado',              icon: <TrendingUp className="h-3.5 w-3.5" />,   color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  cambio_estado:   { label: 'Cambio de estado',      icon: <Tag className="h-3.5 w-3.5" />,          color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  cerrado:         { label: 'Cerrado',               icon: <XCircle className="h-3.5 w-3.5" />,      color: 'text-red-700 bg-red-50 border-red-200',       dot: 'bg-red-500' },
  respuesta_canal: { label: 'Respuesta por canal',   icon: <Send className="h-3.5 w-3.5" />,         color: 'text-teal-700 bg-teal-50 border-teal-200',    dot: 'bg-teal-500' },
  comentario:      { label: 'Comentario público',    icon: <MessageSquare className="h-3.5 w-3.5" />,color: 'text-violet-700 bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  nota_interna:    { label: 'Nota interna',          icon: <Lock className="h-3.5 w-3.5" />,         color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    label: type,
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  };
}

function fmt(ts: string) {
  return new Date(ts).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TicketTraceabilityDrawer({ ticketId, ticketNumber, onClose }: Props) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'history' | 'comment'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/${ticketId}/history`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  const filtered = data?.timeline.filter(e =>
    filter === 'all' ? true : e.category === filter
  ) ?? [];

  // Group by date
  const grouped: { date: string; entries: TimelineEntry[] }[] = [];
  for (const entry of filtered) {
    const date = fmtDate(entry.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.entries.push(entry);
    } else {
      grouped.push({ date, entries: [entry] });
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-105 bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-violet-100">
              <Clock className="h-4 w-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Trazabilidad</p>
              <p className="text-xs text-gray-400 font-mono">{ticketNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={load}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              title="Recargar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        {data && (
          <div className="grid grid-cols-3 divide-x border-b shrink-0">
            {[
              { label: 'Eventos totales', value: data.summary.total_events },
              { label: 'Comentarios',     value: data.summary.total_comments },
              { label: 'Acciones',        value: data.summary.total_history },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-2.5 text-center">
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2.5 border-b bg-gray-50 shrink-0">
          {([
            { key: 'all',     label: 'Todo' },
            { key: 'history', label: 'Acciones' },
            { key: 'comment', label: 'Comentarios' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filter === key
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Clock className="h-10 w-10 opacity-30" />
              <p className="text-sm">Sin registros en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ date, entries }) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                      {date}
                    </span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>

                  {/* Entries for this date */}
                  <ol className="relative border-l-2 border-gray-100 space-y-5 ml-3">
                    {entries.map(entry => {
                      const cfg = getConfig(entry.type);
                      return (
                        <li key={entry.id} className="ml-5">
                          {/* Dot */}
                          <span className={`absolute -left-2.25 w-4 h-4 rounded-full border-2 border-white ${cfg.dot} shrink-0`} />

                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Badge + user */}
                              <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                  {cfg.icon}
                                  {getConfig(entry.type).label}
                                </span>
                                {entry.user && (
                                  <span className="text-xs text-gray-500 font-medium truncate">
                                    {entry.user.name}
                                  </span>
                                )}
                                {entry.attachments_count ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                    <Paperclip className="h-3 w-3" />
                                    {entry.attachments_count}
                                  </span>
                                ) : null}
                              </div>

                              {/* Description */}
                              {entry.description && (
                                <p className="text-sm text-gray-700 leading-snug">{entry.description}</p>
                              )}

                              {/* Estado change: show from→to */}
                              {entry.type === 'cambio_estado' && entry.old_value && entry.new_value && (
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded">{entry.old_value}</span>
                                  <span>→</span>
                                  <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">{entry.new_value}</span>
                                </div>
                              )}
                            </div>

                            {/* Time */}
                            <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                              {new Date(entry.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}

              {/* Ticket closed marker */}
              {data?.ticket.closed_at && filter !== 'comment' && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t-2 border-gray-200" />
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Ticket cerrado · {fmt(data.ticket.closed_at)}
                  </span>
                  <div className="flex-1 border-t-2 border-gray-200" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ticket info footer */}
        {data && (
          <div className="border-t px-5 py-3 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Creado: <span className="font-medium text-gray-700">{fmt(data.ticket.created_at)}</span></span>
              <span>por <span className="font-medium text-gray-700">{data.ticket.requester_name}</span></span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
