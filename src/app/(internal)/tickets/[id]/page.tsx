'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { getEcho } from '@/lib/echo';
import {
  ArrowLeft, Send, Clock, Tag, AlertCircle, CheckCircle2,
  UserCheck, XCircle, TrendingUp, Paperclip, MessageSquare,
  ChevronDown, ChevronUp, BookOpen, Search, ExternalLink,
} from 'lucide-react';

interface Ticket {
  id: number;
  ticket_number: string;
  requester_name: string;
  requester_email: string;
  requester_area: string;
  description: string;
  attachment_path: string | null;
  verification_code: string;
  priority: string;
  status: { id: number; name: string; color: string };
  assigned_agent?: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

interface AgentUser {
  id: number;
  name: string;
  email: string;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface Comment {
  id: number;
  comment: string;
  user: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

type EventType = 'comment' | 'status_change' | 'assign' | 'escalate' | 'close' | 'open';

interface WidgetMessage {
  id: number;
  body: string;
  sender_type: 'user' | 'agent' | 'system';
  sender: { id: number; name: string } | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  type: EventType;
  author: string;
  content: string;
  timestamp: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  meta?: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  alta:  { label: 'Alta',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    dot: 'bg-red-500' },
  media: { label: 'Media', color: 'text-yellow-700',  bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  baja:  { label: 'Baja',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
};

const API_STORAGE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const currentUser = useAuthStore(s => s.user);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [agentUsers, setAgentUsers] = useState<AgentUser[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [widgetMessages, setWidgetMessages] = useState<WidgetMessage[]>([]);
  const [widgetSessionId, setWidgetSessionId] = useState<number | null>(null);

  const [newComment, setNewComment] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPriority, setAssignPriority] = useState('media');
  const [statusId, setStatusId] = useState('');

  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [imageModal, setImageModal] = useState<string | null>(null);

  // KB search in reply box
  const [showKbSearch, setShowKbSearch] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [kbResults, setKbResults] = useState<{ id: number; title: string; slug: string }[]>([]);
  const [kbSearching, setKbSearching] = useState(false);
  const kbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAct = currentUser?.role?.name !== 'usuario' && currentUser?.role?.name !== 'user';

  const addWidgetMessageToTimeline = useCallback((msg: WidgetMessage) => {
    setWidgetMessages(prev =>
      prev.find(m => m.id === msg.id) ? prev : [...prev, msg]
    );
  }, []);

  const loadAll = async () => {
    try {
      const tRes = await api.get(`/tickets/${ticketId}`);
      setTicket(tRes.data);
      setStatusId(tRes.data.status.id.toString());

      // Requests secundarios no bloquean la carga del ticket
      api.get(`/tickets/${ticketId}/comments`)
        .then(r => setComments(r.data))
        .catch(() => {});

      api.get(`/widget/tickets/${ticketId}/messages`)
        .then(r => {
          setWidgetSessionId(r.data.session_id ?? null);
          setWidgetMessages(r.data.messages ?? []);
        })
        .catch(() => {});
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    if (canAct) {
      api.get('/users').then(r => setAgentUsers(r.data.data || [])).catch(() => {});
      api.get('/ticket-statuses').then(r => setStatuses(r.data)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, widgetMessages]);

  // Real-time: suscribirse al canal del widget para recibir mensajes nuevos
  useEffect(() => {
    if (!widgetSessionId) return;
    const token = useAuthStore.getState().token;
    if (!token) return;

    const echo = getEcho(token);
    const channel = echo.private(`widget.session.${widgetSessionId}`);

    channel.listen('.message.sent', (data: WidgetMessage & { sender_name?: string }) => {
      addWidgetMessageToTimeline({
        id: data.id,
        body: data.body,
        sender_type: data.sender_type,
        sender: data.sender ?? (data.sender_name ? { id: 0, name: data.sender_name } : null),
        attachment_path: data.attachment_path,
        attachment_name: data.attachment_name,
        created_at: data.created_at,
      });
    });

    return () => {
      echo.leaveChannel(`widget.session.${widgetSessionId}`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetSessionId, canAct]);

  const searchKb = (q: string) => {
    setKbQuery(q);
    if (kbDebounceRef.current) clearTimeout(kbDebounceRef.current);
    if (q.trim().length < 2) { setKbResults([]); return; }
    kbDebounceRef.current = setTimeout(async () => {
      setKbSearching(true);
      try {
        const res = await api.get('/kb/articles', { params: { search: q, status: 'published', per_page: 6 } });
        setKbResults(res.data.data ?? []);
      } catch {
        setKbResults([]);
      } finally {
        setKbSearching(false);
      }
    }, 350);
  };

  const insertKbArticle = (article: { id: number; title: string }) => {
    const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const link = `[📖 ${article.title}](${BASE}/knowledge-base/${article.id})`;
    setNewComment(prev => prev ? `${prev}\n\n${link}` : link);
    setShowKbSearch(false);
    setKbQuery('');
    setKbResults([]);
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setActionLoading('comment');
    try {
      await api.post(`/tickets/${ticketId}/comments`, { comment: newComment });
      setNewComment('');
      const r = await api.get(`/tickets/${ticketId}/comments`);
      setComments(r.data);
      flash('Comentario enviado');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al enviar comentario');
    } finally {
      setActionLoading('');
    }
  };

  const handleAssign = async () => {
    if (!assignUserId) return;
    setActionLoading('assign');
    try {
      await api.post(`/tickets/${ticketId}/assign`, { agent_id: parseInt(assignUserId), priority: assignPriority });
      await loadAll();
      flash('Ticket asignado correctamente');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al asignar');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateStatus = async () => {
    const selected = statuses.find(s => s.id.toString() === statusId);
    if (!selected) return;
    setActionLoading('status');
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: selected.name });
      await loadAll();
      flash(`Estado cambiado a "${selected.name}"`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setActionLoading('');
    }
  };

  const handleEscalate = async () => {
    setActionLoading('escalate');
    try {
      await api.post(`/tickets/${ticketId}/escalate`);
      await loadAll();
      flash('Ticket escalado');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al escalar');
    } finally {
      setActionLoading('');
    }
  };

  const handleClose = async () => {
    setActionLoading('close');
    try {
      await api.post(`/tickets/${ticketId}/close`);
      router.push('/tickets');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al cerrar ticket');
    } finally {
      setActionLoading('');
    }
  };

  const buildTimeline = (): TimelineEvent[] => {
    if (!ticket) return [];
    const events: TimelineEvent[] = [];

    events.push({
      id: 'open',
      type: 'open',
      author: ticket.requester_name,
      content: ticket.description,
      timestamp: ticket.created_at,
      meta: ticket.attachment_path ?? undefined,
    });

    comments.forEach(c => {
      events.push({
        id: `c-${c.id}`,
        type: 'comment',
        author: c.user.name,
        content: c.comment,
        timestamp: c.created_at,
      });
    });

    widgetMessages.forEach(m => {
      if (m.sender_type === 'system') return;
      events.push({
        id: `w-${m.id}`,
        type: 'comment',
        author: m.sender?.name ?? (m.sender_type === 'user' ? ticket.requester_name : 'Agente'),
        content: m.body,
        timestamp: m.created_at,
        attachment_path: m.attachment_path,
        attachment_name: m.attachment_name,
      });
    });

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const isImage = (p: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(p);

  const EventIcon = ({ type }: { type: EventType }) => {
    const cls = 'w-4 h-4';
    if (type === 'open') return <MessageSquare className={`${cls} text-blue-500`} />;
    if (type === 'comment') return <MessageSquare className={`${cls} text-gray-500`} />;
    if (type === 'status_change') return <Tag className={`${cls} text-purple-500`} />;
    if (type === 'assign') return <UserCheck className={`${cls} text-green-500`} />;
    if (type === 'escalate') return <TrendingUp className={`${cls} text-orange-500`} />;
    if (type === 'close') return <XCircle className={`${cls} text-red-500`} />;
    return <CheckCircle2 className={cls} />;
  };

  if (loading) {
    return (
      <div className="flex gap-6 animate-pulse">
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {error || 'Ticket no encontrado'}
      </div>
    );
  }

  const prioConf = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.media;
  const timeline = buildTimeline();

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="font-bold text-gray-900 text-lg">{ticket.ticket_number}</span>
            <span className="ml-2 text-sm text-gray-400">·</span>
            <span className="ml-2 text-sm text-gray-500 truncate max-w-xs">{ticket.requester_area}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Estado badge */}
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: ticket.status.color + '22', color: ticket.status.color, borderColor: ticket.status.color + '55' }}
          >
            {ticket.status.name}
          </span>
          {/* Prioridad badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${prioConf.bg} ${prioConf.color}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${prioConf.dot}`} />
            {prioConf.label}
          </span>
          {/* Toggle info panel */}
          <button
            onClick={() => setShowInfoPanel(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            title="Información del ticket"
          >
            {showInfoPanel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* ── Notifications ─────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm shrink-0">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm shrink-0">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chat / Timeline ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Collapsible info panel */}
          {showInfoPanel && (
            <div className="bg-white border-b px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Solicitante</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                    {ticket.requester_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 leading-none">{ticket.requester_name}</p>
                    <p className="text-xs text-gray-400">{ticket.requester_email}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Área</p>
                <p className="text-sm font-medium text-gray-900">{ticket.requester_area}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Agente</p>
                <div className="flex items-center gap-1.5">
                  {ticket.assigned_agent ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                        {ticket.assigned_agent.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{ticket.assigned_agent.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Sin asignar</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Creado</p>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock size={13} className="text-gray-400" />
                  {new Date(ticket.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {timeline.map((event, idx) => {
              const isRequester = event.type === 'open' || event.author === ticket.requester_name;
              const isSystem = event.type === 'status_change' || event.type === 'assign' || event.type === 'escalate' || event.type === 'close';

              if (isSystem) {
                return (
                  <div key={event.id} className="flex items-center gap-3 my-2">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      <EventIcon type={event.type} />
                      {event.content}
                      <span className="text-gray-300">·</span>
                      {new Date(event.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>
                );
              }

              return (
                <div key={event.id} className={`flex gap-3 ${isRequester ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isRequester ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {event.author.charAt(0).toUpperCase()}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[70%] ${isRequester ? '' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{event.author}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(event.timestamp).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {idx === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Apertura</span>
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isRequester
                        ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                        : 'bg-violet-600 text-white rounded-tr-sm'
                    }`}>
                      {event.content}
                    </div>

                    {/* Attachment — ticket original */}
                    {event.meta && (
                      <div className="mt-2">
                        {isImage(event.meta) ? (
                          <img
                            src={`${API_STORAGE}/storage/${event.meta}`}
                            alt="adjunto"
                            className="max-w-xs rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition shadow-sm"
                            onClick={() => setImageModal(`${API_STORAGE}/storage/${event.meta}`)}
                          />
                        ) : (
                          <a
                            href={`${API_STORAGE}/storage/${event.meta}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
                          >
                            <Paperclip size={14} /> Archivo adjunto
                          </a>
                        )}
                      </div>
                    )}
                    {/* Attachment — mensajes del widget */}
                    {event.attachment_path && (
                      <div className="mt-2">
                        {isImage(event.attachment_path) ? (
                          <img
                            src={`${API_STORAGE}/storage/${event.attachment_path}`}
                            alt={event.attachment_name ?? 'adjunto'}
                            className="max-w-xs rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition shadow-sm"
                            onClick={() => setImageModal(`${API_STORAGE}/storage/${event.attachment_path!}`)}
                          />
                        ) : (
                          <a
                            href={`${API_STORAGE}/storage/${event.attachment_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
                          >
                            <Paperclip size={14} /> {event.attachment_name ?? 'Archivo adjunto'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Reply box ──────────────────────────────────────────── */}
          <div className="border-t bg-white px-4 py-3 shrink-0">

            {/* KB search panel */}
            {showKbSearch && canAct && (
              <div className="mb-3 bg-white border border-blue-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-100 bg-blue-50">
                  <BookOpen size={14} className="text-blue-500 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700">Buscar en Base de Conocimiento</span>
                  <button
                    onClick={() => { setShowKbSearch(false); setKbQuery(''); setKbResults([]); }}
                    className="ml-auto text-blue-400 hover:text-blue-700 transition"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={kbQuery}
                      onChange={e => searchKb(e.target.value)}
                      placeholder="Buscar artículo..."
                      className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    />
                    {kbSearching && (
                      <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </div>

                  {kbResults.length > 0 && (
                    <ul className="mt-2 max-h-52 overflow-y-auto divide-y divide-gray-100">
                      {kbResults.map(article => (
                        <li key={article.id}>
                          <button
                            onClick={() => insertKbArticle(article)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition rounded-lg group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen size={13} className="text-blue-400 shrink-0" />
                              <span className="text-sm text-gray-800 truncate">{article.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={`/knowledge-base/${article.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-gray-300 hover:text-blue-500 transition"
                                title="Abrir artículo"
                              >
                                <ExternalLink size={12} />
                              </a>
                              <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
                                Insertar
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {kbQuery.length >= 2 && !kbSearching && kbResults.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">Sin resultados para "{kbQuery}"</p>
                  )}

                  {kbQuery.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">Escribe para buscar artículos publicados</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                placeholder="Escribe un comentario... (Enter para enviar, Shift+Enter nueva línea)"
                className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-0 min-h-[40px] max-h-32"
                rows={1}
              />
              {/* Botón KB — solo para admins/agentes */}
              {canAct && (
                <button
                  onClick={() => setShowKbSearch(v => !v)}
                  title="Adjuntar artículo de KB"
                  className={`shrink-0 p-1.5 rounded-lg transition ${
                    showKbSearch
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <BookOpen size={16} />
                </button>
              )}
              <Button
                size="sm"
                onClick={handleSendComment}
                disabled={!newComment.trim() || actionLoading === 'comment'}
                className="shrink-0 rounded-xl"
              >
                {actionLoading === 'comment' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar — Actions ────────────────────────────────── */}
        {canAct && (
          <div className="w-72 shrink-0 bg-white border-l overflow-y-auto flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800 text-sm">Acciones del Ticket</h3>
            </div>

            <div className="p-4 space-y-6 flex-1">

              {/* Asignar ──────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck size={15} className="text-blue-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asignar agente</span>
                </div>
                <div className="space-y-2">
                  <Select value={assignUserId} onValueChange={setAssignUserId}>
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="Selecciona agente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agentUsers.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            {u.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Prioridad</Label>
                    <Select value={assignPriority} onValueChange={setAssignPriority}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta"><span className="text-red-500 font-medium">● Alta</span></SelectItem>
                        <SelectItem value="media"><span className="text-yellow-500 font-medium">● Media</span></SelectItem>
                        <SelectItem value="baja"><span className="text-green-500 font-medium">● Baja</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleAssign}
                    disabled={!assignUserId || actionLoading === 'assign'}
                  >
                    {actionLoading === 'assign' ? 'Asignando...' : 'Asignar'}
                  </Button>
                </div>
              </section>

              <div className="border-t" />

              {/* Cambiar estado ───────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={15} className="text-purple-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cambiar estado</span>
                </div>
                <div className="space-y-2">
                  <Select value={statusId} onValueChange={setStatusId}>
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue placeholder="Estado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleUpdateStatus}
                    disabled={!statusId || actionLoading === 'status'}
                  >
                    {actionLoading === 'status' ? 'Actualizando...' : 'Actualizar estado'}
                  </Button>
                </div>
              </section>

              <div className="border-t" />

              {/* Acciones rápidas ─────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={15} className="text-orange-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones rápidas</span>
                </div>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={handleEscalate}
                    disabled={actionLoading === 'escalate'}
                  >
                    <TrendingUp size={14} className="mr-2" />
                    {actionLoading === 'escalate' ? 'Escalando...' : 'Escalar ticket'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={handleClose}
                    disabled={actionLoading === 'close'}
                  >
                    <XCircle size={14} className="mr-2" />
                    {actionLoading === 'close' ? 'Cerrando...' : 'Cerrar ticket'}
                  </Button>
                </div>
              </section>

              <div className="border-t" />

              {/* Info extra ───────────────────────────── */}
              <section className="text-xs text-gray-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Código:</span>
                  <span className="font-mono font-semibold text-gray-600">{ticket.verification_code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Creado:</span>
                  <span className="text-gray-500">{new Date(ticket.created_at).toLocaleDateString('es')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actualizado:</span>
                  <span className="text-gray-500">{new Date(ticket.updated_at).toLocaleDateString('es')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comentarios:</span>
                  <span className="text-gray-500">{comments.length}</span>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* ── Image Modal ───────────────────────────────────────────── */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-gray-800">Vista de imagen</span>
              <button onClick={() => setImageModal(null)} className="text-gray-400 hover:text-gray-700 transition">✕</button>
            </div>
            <img src={imageModal} alt="adjunto" className="w-full max-h-[75vh] object-contain" />
            <div className="px-4 py-3 border-t flex justify-end">
              <a
                href={imageModal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
              >
                <Paperclip size={14} /> Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
