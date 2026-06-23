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
import TicketMeetingsPanel from '@/components/meetings/TicketMeetingsPanel';
import TicketTraceabilityDrawer from '@/components/tickets/TicketTraceabilityDrawer';
import RemoteSessionPanel from '@/components/tickets/RemoteSessionPanel';
import {
  ArrowLeft, Send, Clock, Tag, AlertCircle, CheckCircle2,
  UserCheck, XCircle, TrendingUp, Paperclip, MessageSquare,
  BookOpen, Search, ExternalLink, RotateCcw,
  Mail, Users, UserPlus, Trash2, SlidersHorizontal, History,
  Sparkles, FileText, Loader2, ShieldCheck,
} from 'lucide-react';

interface Ticket {
  id: number;
  ticket_number: string;
  requester_name: string;
  requester_email: string;
  requester_area: string;
  description: string;
  attachment_path: string | null;
  attachment_url: string | null;
  verification_code: string;
  priority: string;
  status: { id: number; name: string; color: string };
  assigned_agent?: { id: number; name: string; email: string };
  assigned_to?: number | null;
  work_group_id?: number | null;
  work_group?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
  validation_requested_at?: string | null;
  validation_deadline?: string | null;
  validation_approved_at?: string | null;
  validation_rejected_count?: number;
}

interface AgentUser {
  id: number;
  name: string;
  email: string;
  role?: { name: string };
}

interface Participant {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface CommentAttachment {
  url: string;
  name: string;
  mime: string | null;
}

interface Comment {
  id: number;
  comment: string;
  user: { id: number; name: string; email: string } | null;
  created_at: string;
  updated_at?: string;
  is_internal?: boolean;
  ticket_id?: number;
  attachments?: CommentAttachment[];
}

type EventType = 'comment' | 'bot_context' | 'status_change' | 'assign' | 'escalate' | 'close' | 'open';

interface WidgetMessage {
  id: number;
  body: string;
  sender_type: 'user' | 'agent' | 'system';
  sender: { id: number; name: string } | null;
  attachment_path: string | null;
  attachment_url: string | null;
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
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: CommentAttachment[];
  meta?: string;
  meta_url?: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  alta:  { label: 'Alta',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    dot: 'bg-red-500' },
  media: { label: 'Media', color: 'text-yellow-700',  bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  baja:  { label: 'Baja',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
};

const API_STORAGE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function renderText(text: string, dark = false) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) {
      return (
        <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer"
          className={`underline font-medium ${dark ? 'text-violet-200 hover:text-white' : 'text-violet-700 hover:text-violet-900'}`}>
          {m[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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

  // agentUsers: only agente + supervisor roles (for assignment dropdown)
  const [agentUsers, setAgentUsers] = useState<AgentUser[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [widgetMessages, setWidgetMessages] = useState<WidgetMessage[]>([]);
  const [widgetSessionId, setWidgetSessionId] = useState<number | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantResults, setParticipantResults] = useState<AgentUser[]>([]);
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignPriority, setAssignPriority] = useState('media');
  const [statusId, setStatusId] = useState('');

const [imageModal, setImageModal] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTraceability, setShowTraceability] = useState(false);
  const replyChannel = 'email' as const;

  // IA features
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSentiment, setAiSentiment] = useState<{ overall: string; score: number; alert: boolean } | null>(null);

  // KB search in reply box
  const [showKbSearch, setShowKbSearch] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [kbResults, setKbResults] = useState<{ id: number; title: string; slug: string; category?: { name: string } }[]>([]);
  const [kbSearching, setKbSearching] = useState(false);
  const [kbSelectedArticle, setKbSelectedArticle] = useState<{
    id: number; title: string; slug: string;
    category?: { name: string }; author?: { name: string };
    published_version?: { content: string }; views_count: number; useful_count: number;
    tags?: { id: number; name: string }[];
  } | null>(null);
  const [kbLoadingArticle, setKbLoadingArticle] = useState(false);
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
      setAssignUserId(tRes.data.assigned_to ? String(tRes.data.assigned_to) : '');

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

      api.get(`/tickets/${ticketId}/participants`)
        .then(r => setParticipants(r.data))
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
      // Load only agente + supervisor for assignment dropdown (no special permission needed)
      api.get('/users/assignable')
        .then(r => setAgentUsers(r.data.data || []))
        .catch(() => {});
      // Portal users are loaded on-demand in searchParticipants
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
        attachment_url: data.attachment_url,
        attachment_name: data.attachment_name,
        created_at: data.created_at,
      });
    });

    return () => {
      echo.leaveChannel(`widget.session.${widgetSessionId}`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetSessionId, canAct]);

  // Única función para agregar comentarios a la lista (deduplicada por id)
  const pushComment = useCallback((c: Comment) => {
    setComments(prev => prev.some(x => x.id === c.id) ? prev : [...prev, c]);
  }, []);

  // Real-time: WebSocket — única fuente de verdad para comentarios nuevos
  useEffect(() => {
    if (!ticketId) return;
    const token = useAuthStore.getState().token;
    if (!token) return;

    const echo = getEcho(token);
    echo.channel(`ticket.${ticketId}`).listen('.comment.added', (data: {
      comment: Comment
    }) => {
      pushComment(data.comment);
    });

    return () => {
      echo.leaveChannel(`ticket.${ticketId}`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, pushComment]);

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

  const openKbArticle = async (article: { id: number; title: string; slug: string; category?: { name: string } }) => {
    setKbLoadingArticle(true);
    setKbSelectedArticle(null);
    try {
      const res = await api.get(`/kb/articles/${article.id}`);
      setKbSelectedArticle(res.data);
    } catch {
      setKbSelectedArticle({ ...article, views_count: 0, useful_count: 0 });
    } finally {
      setKbLoadingArticle(false);
    }
  };

  const insertKbArticle = (article: { id: number; title: string; published_version?: { content: string } }) => {
    const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${BASE}/knowledge-base/${article.id}`;
    const content = article.published_version?.content?.trim();
    const block = content
      ? `📖 **${article.title}**\n\n${content}\n\n🔗 Ver artículo completo: ${link}`
      : `📖 **${article.title}**\n\n🔗 Ver artículo completo: ${link}`;
    setNewComment(prev => prev ? `${prev}\n\n${block}` : block);
    setShowKbSearch(false);
    setKbQuery('');
    setKbResults([]);
    setKbSelectedArticle(null);
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() && attachedFiles.length === 0) return;
    setActionLoading('comment');
    const text  = newComment;
    const files = attachedFiles;
    setNewComment('');
    setAttachedFiles([]);
    try {
      const form = new FormData();
      if (text.trim()) form.append('comment', text);
      files.forEach(f => form.append('files[]', f));

      form.append('channel', replyChannel);
      form.append('message', text);
      await api.post(`/tickets/${ticketId}/reply-channel`, form);
      flash('Respuesta enviada por Email');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al enviar');
      setNewComment(text);
      setAttachedFiles(files);
    } finally {
      setActionLoading('');
    }
  };

  const handleAiSuggestReply = async () => {
    setAiSuggestLoading(true);
    try {
      const res = await api.post(`/ai/tickets/${ticketId}/suggest-reply`);
      setNewComment(res.data.reply);
    } catch { /* silent */ } finally {
      setAiSuggestLoading(false);
    }
  };

  const handleAiSummarize = async () => {
    setAiSummaryLoading(true);
    setAiSummary(null);
    try {
      const res = await api.post(`/ai/tickets/${ticketId}/summarize`);
      setAiSummary(res.data.summary);
    } catch { /* silent */ } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleAiSentiment = async () => {
    const timeline = buildTimeline();
    const messages = timeline
      .filter(e => e.type === 'comment' || e.type === 'open')
      .map(e => ({ from: e.author, text: e.content }));
    if (messages.length === 0) return;
    try {
      const res = await api.post('/ai/sentiment', { messages });
      setAiSentiment(res.data);
    } catch { /* silent */ }
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

  const handleReturnToGroup = async () => {
    if (!confirm('¿Devolver este ticket a la cola del grupo?')) return;
    setActionLoading('return');
    try {
      await api.post(`/tickets/${ticketId}/return-to-group`, { reason: 'Devuelto por el agente asignado.' });
      await loadAll();
      flash('Ticket devuelto al grupo');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al devolver el ticket');
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
    if (!confirm('¿Cerrar este ticket definitivamente?')) return;
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

  const handleRequestValidation = async () => {
    if (!confirm('¿Enviar solicitud de validación al usuario que creó el ticket?')) return;
    setActionLoading('request-validation');
    try {
      await api.post(`/tickets/${ticketId}/request-validation`);
      await loadAll();
      flash('Solicitud de validación enviada al usuario');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al solicitar validación');
    } finally {
      setActionLoading('');
    }
  };

  const searchParticipants = (q: string) => {
    setParticipantSearch(q);
    if (q.trim().length < 2) { setParticipantResults([]); return; }
    api.get('/users/portal-users', { params: { search: q } })
      .then(r => {
        const results: AgentUser[] = r.data.data || [];
        setParticipantResults(results.filter(u => !participants.some(p => p.id === u.id)).slice(0, 6));
      })
      .catch(() => {});
  };

  const handleAddParticipant = async (u: AgentUser) => {
    setAddingParticipant(true);
    try {
      await api.post(`/tickets/${ticketId}/participants`, { user_id: u.id });
      setParticipants(prev => [...prev, { id: u.id, name: u.name, email: u.email, role: u.role?.name }]);
      setParticipantSearch('');
      setParticipantResults([]);
    } catch { /* ignore */ }
    finally { setAddingParticipant(false); }
  };

  const handleRemoveParticipant = async (userId: number) => {
    try {
      await api.delete(`/tickets/${ticketId}/participants/${userId}`);
      setParticipants(prev => prev.filter(p => p.id !== userId));
    } catch { /* ignore */ }
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
      meta_url: ticket.attachment_url ?? undefined,
    });

    comments.forEach(c => {
      const isBotContext = c.user === null && c.comment.startsWith('🤖');
      events.push({
        id: `c-${c.id}`,
        type: isBotContext ? 'bot_context' : 'comment',
        author: isBotContext ? 'Asistente Virtual' : (c.user?.name ?? ticket.requester_name),
        content: c.comment,
        timestamp: c.created_at,
        attachments: c.attachments ?? [],
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
        attachment_url: m.attachment_url,
        attachment_name: m.attachment_name,
      });
    });

    return events.sort((a, b) => {
      if (a.type === 'bot_context') return -1;
      if (b.type === 'bot_context') return 1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  };

  const isImage = (p: string, mime?: string | null) =>
    (mime?.startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)$/i.test(p);

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
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0 gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Ticket number + channel */}
          <div className="shrink-0">
            <span className="font-bold text-gray-900 text-lg">{ticket.ticket_number}</span>
            <span className="ml-2 text-sm text-gray-400">·</span>
            <span className="ml-2 text-sm text-gray-500">{ticket.requester_area}</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 shrink-0" />

          {/* Solicitante */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
              {ticket.requester_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 hidden md:block">
              <p className="text-xs font-semibold text-gray-800 leading-none truncate">{ticket.requester_name}</p>
              <p className="text-xs text-gray-400 truncate">{ticket.requester_email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 shrink-0 hidden md:block" />

          {/* Agente */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {ticket.assigned_agent ? (
              <>
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                  {ticket.assigned_agent.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-700 truncate max-w-24">{ticket.assigned_agent.name}</span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Sin asignar</span>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 shrink-0 hidden md:block" />

          {/* Creado */}
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Clock size={12} className="text-gray-400 shrink-0" />
            {new Date(ticket.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Estado badge */}
          <span
            className="hidden sm:inline px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: ticket.status.color + '22', color: ticket.status.color, borderColor: ticket.status.color + '55' }}
          >
            {ticket.status.name}
          </span>
          {/* Prioridad badge */}
          <span className={`hidden sm:inline px-3 py-1 rounded-full text-xs font-semibold border ${prioConf.bg} ${prioConf.color}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${prioConf.dot}`} />
            {prioConf.label}
          </span>
          {/* Sentimiento IA badge */}
          {canAct && aiSentiment && (
            <span
              title={`Sentimiento: ${aiSentiment.overall}`}
              className={`hidden sm:inline px-2.5 py-1 rounded-full text-xs font-semibold border ${
                aiSentiment.overall === 'frustrado' || aiSentiment.overall === 'negativo'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : aiSentiment.overall === 'positivo'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {aiSentiment.overall === 'frustrado' ? '😤' : aiSentiment.overall === 'negativo' ? '😟' : aiSentiment.overall === 'positivo' ? '😊' : '😐'} {aiSentiment.overall}
            </span>
          )}

          {/* Resumen IA button */}
          {canAct && (
            <button
              onClick={handleAiSummarize}
              disabled={aiSummaryLoading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50"
              title="Resumir ticket con IA"
            >
              {aiSummaryLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Resumir
            </button>
          )}

          {/* Trazabilidad button */}
          <button
            onClick={() => setShowTraceability(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition"
            title="Ver trazabilidad"
          >
            <History size={14} />
            Trazabilidad
          </button>
          {/* Trazabilidad — mobile icon only */}
          <button
            onClick={() => setShowTraceability(true)}
            className="sm:hidden p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition"
            title="Trazabilidad"
          >
            <History size={18} />
          </button>

          {/* Sidebar toggle — visible only on mobile when canAct */}
          {canAct && (
            <button
              onClick={() => setShowSidebar(v => !v)}
              className={`lg:hidden p-1.5 rounded-lg transition ${showSidebar ? 'bg-violet-100 text-violet-600' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Panel de gestión"
            >
              <SlidersHorizontal size={18} />
            </button>
          )}
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
      {aiSummary && (
        <div className="mx-6 mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm shrink-0">
          <Sparkles size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-xs text-blue-600 mb-1">Resumen IA</p>
            <p className="leading-relaxed">{aiSummary}</p>
          </div>
          <button onClick={() => setAiSummary(null)} className="text-blue-400 hover:text-blue-600 shrink-0">✕</button>
        </div>
      )}
      {canAct && aiSentiment?.alert && (
        <div className="mx-6 mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm shrink-0">
          <AlertCircle size={16} className="shrink-0" />
          <span>El usuario muestra signos de frustración. Se recomienda atención prioritaria.</span>
          <button onClick={() => setAiSentiment(s => s ? { ...s, alert: false } : null)} className="ml-auto text-orange-400 hover:text-orange-600">✕</button>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chat / Timeline ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">


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

              if (event.type === 'bot_context') {
                return (
                  <div key={event.id} className="mx-2">
                    <div className="border border-blue-200 bg-blue-50 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 border-b border-blue-200">
                        <BookOpen size={14} className="text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-blue-700">Conversación con el Asistente Virtual</span>
                        <span className="ml-auto text-xs text-blue-400">
                          {new Date(event.timestamp).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <pre className="px-4 py-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto">
                        {event.content}
                      </pre>
                    </div>
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
                  <div className={`max-w-[85%] sm:max-w-[70%]`}>
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
                      {renderText(event.content, !isRequester)}
                    </div>

                    {/* Attachments — múltiples archivos por comentario */}
                    {(event.attachments ?? []).length > 0 && (() => {
                      const atts = event.attachments ?? [];
                      const imgs = atts.filter(a => isImage(a.url, a.mime));
                      const files = atts.filter(a => !isImage(a.url, a.mime));
                      return (
                        <div className="mt-2 space-y-1.5">
                          {/* Image grid */}
                          {imgs.length > 0 && (
                            <div className={`grid gap-1 ${imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`} style={{ maxWidth: imgs.length === 1 ? 240 : 300 }}>
                              {imgs.map((att, i) => (
                                <img
                                  key={i}
                                  src={att.url}
                                  alt={att.name}
                                  className={`w-full object-cover cursor-pointer hover:opacity-90 transition shadow-sm border border-white/30 ${
                                    imgs.length === 1 ? 'rounded-xl max-h-48' :
                                    imgs.length === 2 ? 'h-28 rounded-lg' :
                                    imgs.length === 3 && i === 0 ? 'col-span-2 h-32 rounded-lg' : 'h-28 rounded-lg'
                                  }`}
                                  onClick={() => setImageModal(att.url)}
                                />
                              ))}
                            </div>
                          )}
                          {/* File attachments */}
                          {files.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              download={att.name}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition w-fit"
                            >
                              <Paperclip size={14} />
                              <span className="truncate max-w-48">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Attachment — ticket original */}
                    {event.meta && (
                      <div className="mt-2">
                        {isImage(event.meta) ? (
                          <img
                            src={event.meta_url || `${API_STORAGE}/storage/${event.meta}`}
                            alt="adjunto"
                            className="max-w-xs rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition shadow-sm"
                            onClick={() => setImageModal(event.meta_url || `${API_STORAGE}/storage/${event.meta}`)}
                          />
                        ) : (
                          <a
                            href={event.meta_url || `${API_STORAGE}/storage/${event.meta}`}
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
                            src={event.attachment_url || `${API_STORAGE}/storage/${event.attachment_path}`}
                            alt={event.attachment_name ?? 'adjunto'}
                            className="max-w-xs rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition shadow-sm"
                            onClick={() => setImageModal(event.attachment_url || `${API_STORAGE}/storage/${event.attachment_path!}`)}
                          />
                        ) : (
                          <a
                            href={event.attachment_url || `${API_STORAGE}/storage/${event.attachment_path}`}
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


            {/* KB drawer overlay trigger — panel is rendered outside this column */}

            {/* Preview archivos adjuntos */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1 mb-1">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    {f.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-16 h-16 object-cover rounded-xl border border-blue-200 shadow-sm"
                        />
                        <button
                          onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl">
                        <Paperclip size={14} className="text-blue-600 shrink-0" />
                        <span className="text-xs text-blue-700 font-medium truncate max-w-28">{f.name}</span>
                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-red-500 shrink-0">
                          <XCircle size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
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
              {/* Input oculto para archivos */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="*/*"
                multiple
                onChange={e => {
                  const newFiles = Array.from(e.target.files ?? []);
                  setAttachedFiles(prev => [...prev, ...newFiles]);
                  e.target.value = '';
                }}
              />
              {/* Botón adjuntar archivo */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo"
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"
              >
                <Paperclip size={16} />
              </button>
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
              {/* Botón Sugerir respuesta IA */}
              {canAct && (
                <button
                  onClick={handleAiSuggestReply}
                  disabled={aiSuggestLoading}
                  title="Sugerir respuesta con IA"
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {aiSuggestLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              )}
              <Button
                size="sm"
                onClick={handleSendComment}
                disabled={(!newComment.trim() && attachedFiles.length === 0) || actionLoading === 'comment'}
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

        {/* ── Right sidebar ──────────────────────────────────────────── */}
        {canAct && showSidebar && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        {canAct && (
          <div className={`
            w-72 shrink-0 bg-white border-l overflow-y-auto flex flex-col z-50
            fixed inset-y-0 right-0 transition-transform duration-200
            lg:static lg:translate-x-0
            ${showSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>

            {/* Close button — mobile only */}
            <div className="flex items-center justify-between px-4 py-2 border-b lg:hidden">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Panel de gestión</span>
              <button onClick={() => setShowSidebar(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <XCircle size={16} />
              </button>
            </div>

            {/* ── Metadata strip ─────────────────────── */}
            <div className="px-4 py-3 bg-gray-50 border-b grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Código</p>
                <p className="text-xs font-mono font-semibold text-gray-700">{ticket.verification_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Comentarios</p>
                <p className="text-xs font-semibold text-gray-700">{comments.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Creado</p>
                <p className="text-xs text-gray-600">{new Date(ticket.created_at).toLocaleDateString('es')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Actualizado</p>
                <p className="text-xs text-gray-600">{new Date(ticket.updated_at).toLocaleDateString('es')}</p>
              </div>
            </div>

            <div className="p-4 space-y-5 flex-1">

              {/* ── Asignación ─────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-2.5">
                  <UserCheck size={14} className="text-blue-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asignación</span>
                </div>
                <div className="space-y-2">
                  <Select value={assignUserId} onValueChange={setAssignUserId}>
                    <SelectTrigger className="text-sm h-8">
                      <SelectValue placeholder="Selecciona agente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agentUsers.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            {u.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Select value={assignPriority} onValueChange={setAssignPriority}>
                      <SelectTrigger className="text-sm h-8 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta"><span className="text-red-500 font-medium">● Alta</span></SelectItem>
                        <SelectItem value="media"><span className="text-yellow-500 font-medium">● Media</span></SelectItem>
                        <SelectItem value="baja"><span className="text-green-500 font-medium">● Baja</span></SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 px-3" onClick={handleAssign} disabled={!assignUserId || actionLoading === 'assign'}>
                      {actionLoading === 'assign' ? '...' : 'Asignar'}
                    </Button>
                  </div>
                </div>
              </section>

              <div className="border-t" />

              {/* ── Estado ─────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-2.5">
                  <Tag size={14} className="text-purple-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</span>
                </div>
                <div className="flex gap-2">
                  <Select value={statusId} onValueChange={setStatusId}>
                    <SelectTrigger className="text-sm h-8 flex-1">
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
                  <Button size="sm" variant="outline" className="h-8 px-3" onClick={handleUpdateStatus} disabled={!statusId || actionLoading === 'status'}>
                    {actionLoading === 'status' ? '...' : 'Aplicar'}
                  </Button>
                </div>
              </section>

              <div className="border-t" />

              {/* ── Participantes ──────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-2.5">
                  <Users size={14} className="text-teal-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Participantes</span>
                </div>
                {participants.length > 0 && (
                  <ul className="mb-2 space-y-1.5">
                    {participants.map(p => (
                      <li key={p.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-xs">{p.name}</p>
                          <p className="text-gray-400 truncate text-xs">{p.email}</p>
                        </div>
                        <button onClick={() => handleRemoveParticipant(p.id)} className="shrink-0 text-gray-300 hover:text-red-400 transition" title="Quitar">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {participants.length === 0 && (
                  <p className="text-xs text-gray-400 mb-2">Sin participantes adicionales.</p>
                )}
                <div className="relative">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-teal-400 transition">
                    <UserPlus size={13} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={participantSearch}
                      onChange={e => searchParticipants(e.target.value)}
                      placeholder="Buscar funcionario..."
                      className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                    />
                    {addingParticipant && <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                  </div>
                  {participantResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {participantResults.map(u => (
                        <button key={u.id} onClick={() => handleAddParticipant(u)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-teal-50 transition">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="border-t" />

              {/* ── Reuniones ──────────────────────────── */}
              {ticket && (
                <TicketMeetingsPanel
                  ticketId={ticket.id}
                  requesterEmail={ticket.requester_email}
                  requesterName={ticket.requester_name}
                />
              )}

              <div className="border-t" />

              {/* ── Escritorio Remoto ──────────────────── */}
              <RemoteSessionPanel ticketId={ticket.id} />

              <div className="border-t" />

              {/* ── Acciones ───────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertCircle size={14} className="text-orange-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</span>
                </div>

                {/* Validation status banner */}
                {ticket?.validation_requested_at && !ticket?.validation_approved_at && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    <div className="flex items-center gap-1.5 font-semibold mb-0.5">
                      <ShieldCheck size={13} />
                      Esperando validación del usuario
                    </div>
                    <p className="text-amber-700">
                      El usuario debe confirmar que la solución fue satisfactoria antes de poder cerrar el ticket.
                    </p>
                    {ticket.validation_deadline && (
                      <p className="mt-1 text-amber-600">
                        Plazo: {new Date(ticket.validation_deadline).toLocaleString('es-CO')}
                      </p>
                    )}
                    {(ticket.validation_rejected_count ?? 0) > 0 && (
                      <p className="mt-1 font-medium text-red-700">
                        Rechazos: {ticket.validation_rejected_count}
                      </p>
                    )}
                  </div>
                )}

                {ticket?.validation_approved_at && (
                  <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 size={13} />
                      Usuario confirmó la solución — puedes cerrar el ticket
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 text-xs" onClick={handleEscalate} disabled={actionLoading === 'escalate'}>
                    <TrendingUp size={13} className="mr-1.5" />
                    {actionLoading === 'escalate' ? '...' : 'Escalar'}
                  </Button>

                  {/* Show "Solicitar validación" when no pending validation and not already approved */}
                  {!ticket?.validation_requested_at && !ticket?.validation_approved_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                      onClick={handleRequestValidation}
                      disabled={actionLoading === 'request-validation'}
                    >
                      <ShieldCheck size={13} className="mr-1.5" />
                      {actionLoading === 'request-validation' ? '...' : 'Pedir validación'}
                    </Button>
                  )}

                  {/* Re-send validation if rejected */}
                  {ticket?.validation_requested_at === null && (ticket?.validation_rejected_count ?? 0) > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                      onClick={handleRequestValidation}
                      disabled={actionLoading === 'request-validation'}
                    >
                      <ShieldCheck size={13} className="mr-1.5" />
                      {actionLoading === 'request-validation' ? '...' : 'Reenviar validación'}
                    </Button>
                  )}

                  {/* Close only enabled when approved or no validation ever requested */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    onClick={handleClose}
                    disabled={
                      actionLoading === 'close' ||
                      (!!ticket?.validation_requested_at && !ticket?.validation_approved_at)
                    }
                    title={
                      ticket?.validation_requested_at && !ticket?.validation_approved_at
                        ? 'Esperando validación del usuario'
                        : undefined
                    }
                  >
                    <XCircle size={13} className="mr-1.5" />
                    {actionLoading === 'close' ? '...' : 'Cerrar'}
                  </Button>

                  {currentUser?.role?.name === 'agente' && ticket?.work_group_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="col-span-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                      onClick={handleReturnToGroup}
                      disabled={actionLoading === 'return'}
                    >
                      <RotateCcw size={13} className="mr-1.5" />
                      {actionLoading === 'return' ? '...' : 'Devolver al grupo'}
                    </Button>
                  )}
                </div>
              </section>

            </div>
          </div>
        )}
      </div>

      {/* ── Traceability Drawer ───────────────────────────────────── */}
      {showTraceability && ticket && (
        <TicketTraceabilityDrawer
          ticketId={ticket.id}
          ticketNumber={ticket.ticket_number}
          onClose={() => setShowTraceability(false)}
        />
      )}

      {/* ── KB Side Drawer ────────────────────────────────────────── */}
      {showKbSearch && (
        <>
          {/* Backdrop — mobile */}
          <div
            className="fixed inset-0 bg-black/30 z-[55] lg:hidden"
            onClick={() => { setShowKbSearch(false); setKbSelectedArticle(null); setKbQuery(''); setKbResults([]); }}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white border-l shadow-2xl z-[60] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2">
                {kbSelectedArticle && (
                  <button
                    onClick={() => setKbSelectedArticle(null)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition mr-1"
                    title="Volver"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <BookOpen size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {kbSelectedArticle ? 'Artículo' : 'Base de Conocimiento'}
                </span>
              </div>
              <button
                onClick={() => { setShowKbSearch(false); setKbSelectedArticle(null); setKbQuery(''); setKbResults([]); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition"
              >
                <XCircle size={16} />
              </button>
            </div>

            {/* Loading state */}
            {kbLoadingArticle && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* ── DETAIL VIEW ─────────────────────────── */}
            {!kbLoadingArticle && kbSelectedArticle && (
              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-4 flex-1 space-y-3">
                  {/* Category */}
                  {kbSelectedArticle.category && (
                    <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      {kbSelectedArticle.category.name}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-base font-bold text-gray-900 leading-snug">
                    {kbSelectedArticle.title}
                  </h2>

                  {/* Tags */}
                  {kbSelectedArticle.tags && kbSelectedArticle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {kbSelectedArticle.tags.map(tag => (
                        <span key={tag.id} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t pt-3 mt-1">
                    {kbSelectedArticle.published_version?.content ?? 'Sin contenido disponible.'}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t bg-gray-50 flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => insertKbArticle(kbSelectedArticle)}
                  >
                    <Send size={13} className="mr-1.5" />
                    Enviar al chat
                  </Button>
                  <a
                    href={`/knowledge-base/${kbSelectedArticle.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-100 transition"
                  >
                    <ExternalLink size={12} />
                    Abrir
                  </a>
                </div>
              </div>
            )}

            {/* ── SEARCH VIEW ─────────────────────────── */}
            {!kbLoadingArticle && !kbSelectedArticle && (
              <>
                {/* Search input */}
                <div className="px-4 py-3 border-b shrink-0">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-400 transition">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={kbQuery}
                      onChange={e => searchKb(e.target.value)}
                      placeholder="Buscar artículos..."
                      className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                    />
                    {kbSearching && (
                      <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {kbQuery && !kbSearching && (
                      <button onClick={() => { setKbQuery(''); setKbResults([]); }} className="text-gray-300 hover:text-gray-500">
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                  {kbResults.length === 0 && kbQuery.trim().length >= 2 && !kbSearching && (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      No se encontraron artículos para &ldquo;{kbQuery}&rdquo;
                    </div>
                  )}
                  {kbResults.length === 0 && kbQuery.trim().length < 2 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      Escribe al menos 2 caracteres para buscar
                    </div>
                  )}
                  {kbResults.map(article => (
                    <button
                      key={article.id}
                      onClick={() => openKbArticle(article)}
                      className="w-full text-left px-4 py-3 border-b hover:bg-blue-50 transition flex items-start gap-3 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-200 transition">
                        <BookOpen size={13} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition leading-snug line-clamp-2">
                          {article.title}
                        </p>
                        {article.category && (
                          <span className="text-xs text-gray-400 mt-0.5 block">{article.category.name}</span>
                        )}
                      </div>
                      <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-400 shrink-0 mt-1 transition" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

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
