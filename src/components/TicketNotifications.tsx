'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getEcho, disconnectEcho } from '@/lib/echo';
import { X, Ticket, ArrowRight } from 'lucide-react';

interface NewTicket {
  id: number;
  ticket_number: string;
  requester_name: string;
  requester_area: string;
  priority: string;
  status: { name: string; color: string } | null;
  created_at: string;
}

const PRIORITY_DOT: Record<string, string> = {
  alta:  'bg-red-500',
  media: 'bg-yellow-400',
  baja:  'bg-green-500',
};

interface Props {
  token: string;
  userRole: string;
}

export default function TicketNotifications({ token, userRole }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NewTicket[]>([]);

  const canReceive = ['admin', 'supervisor', 'agente'].includes(userRole);

  const dismiss = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (!canReceive || !token) return;

    const echo = getEcho(token);

    // Canal público — todos los admins/agentes reciben la notificación
    echo.channel('tickets.admin').listen('.ticket.created', (data: { ticket: NewTicket }) => {
      const ticket = data.ticket;
      setNotifications(prev => [ticket, ...prev].slice(0, 5)); // máx 5 toasts

      // Auto-dismiss a los 8 segundos
      setTimeout(() => dismiss(ticket.id), 8000);
    });

    return () => {
      echo.leaveChannel('tickets.admin');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canReceive]);

  if (!canReceive || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map(ticket => (
        <div
          key={ticket.id}
          className="pointer-events-auto w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Ticket size={15} />
              Nuevo ticket recibido
            </div>
            <button
              onClick={() => dismiss(ticket.id)}
              className="text-blue-200 hover:text-white transition"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-bold text-gray-900 text-sm">{ticket.ticket_number}</p>
                <p className="text-xs text-gray-500">{ticket.requester_name} · {ticket.requester_area}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${PRIORITY_DOT[ticket.priority] ?? 'bg-gray-400'}`}
                />
                <span className="text-xs text-gray-500 capitalize">{ticket.priority}</span>
              </div>
            </div>

            {ticket.status && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-3"
                style={{ backgroundColor: ticket.status.color + '22', color: ticket.status.color }}
              >
                {ticket.status.name}
              </span>
            )}

            <button
              onClick={() => {
                router.push(`/tickets/${ticket.id}`);
                dismiss(ticket.id);
              }}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
            >
              Ver ticket <ArrowRight size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
