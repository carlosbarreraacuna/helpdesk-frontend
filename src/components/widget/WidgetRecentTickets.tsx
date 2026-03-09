'use client';

import { useState, useEffect } from 'react';
import { useWidget } from './WidgetContext';
import { widgetApi, RecentTicket } from '@/lib/widget-api';
import { ArrowLeft, ExternalLink, Loader2, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
};

export default function WidgetRecentTickets() {
  const { setView } = useWidget();
  const router = useRouter();
  const [tickets, setTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    widgetApi.getRecentTickets()
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 px-4 py-3 text-white rounded-t-2xl flex items-center gap-2">
        <button onClick={() => setView('home')} className="text-blue-200 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold text-sm">Mis solicitudes recientes</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
            <Ticket className="h-8 w-8" />
            <p className="text-sm">No tienes solicitudes aún.</p>
            <button onClick={() => setView('chat')} className="text-sm text-blue-600 hover:underline">
              Crear una solicitud
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-left transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-gray-500">
                      #{ticket.ticket_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ticket.status === 'open' ? 'Abierto' :
                       ticket.status === 'in_progress' ? 'En progreso' :
                       ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{ticket.summary}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(ticket.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-500 shrink-0 ml-2 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
