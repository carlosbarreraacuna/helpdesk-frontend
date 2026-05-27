'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import { getEcho } from '@/lib/echo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Send, Clock, AlertCircle, CheckCircle2, MessageSquare,
  Paperclip, UserCheck, TrendingUp, Tag, XCircle, Loader2,
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
  priority: 'alta' | 'media' | 'baja';
  status: { id: number; name: string; color: string };
  assigned_agent?: { id: number; name: string; email: string } | null;
  created_at: string;
  updated_at: string;
}

interface CommentAttachment {
  url: string;
  name: string;
  mime: string | null;
}

interface Comment {
  id: number;
  comment: string;
  is_internal: boolean;
  user: { id: number; name: string; email?: string };
  created_at: string;
  attachments?: CommentAttachment[];
}

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
  author: string;
  content: string;
  timestamp: string;
  isAgent: boolean;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachments?: CommentAttachment[];
}

const PRIORITY_COLOR: Record<string, string> = {
  alta: 'text-red-700 bg-red-50 border-red-200',
  media: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  baja: 'text-green-700 bg-green-50 border-green-200',
};
const PRIORITY_LABEL: Record<string, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };
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

export default function PortalTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [widgetMessages, setWidgetMessages] = useState<WidgetMessage[]>([]);
  const [widgetSessionId, setWidgetSessionId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageModal, setImageModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role?.name !== 'usuario') {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  const loadTicket = async () => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      setTicket(res.data);

      api.get(`/tickets/${ticketId}/comments`)
        .then(r => setComments(r.data.filter((c: Comment) => !c.is_internal)))
        .catch(() => {});

      api.get(`/widget/tickets/${ticketId}/messages`)
        .then(r => {
          setWidgetSessionId(r.data.session_id ?? null);
          setWidgetMessages(r.data.messages ?? []);
        })
        .catch(() => {});
    } catch {
      setError('No se pudo cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTicket(); }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, widgetMessages]);

  const addWidgetMessage = useCallback((msg: WidgetMessage) => {
    setWidgetMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  const pushComment = useCallback((c: Comment) => {
    setComments(prev => prev.some(x => x.id === c.id) ? prev : [...prev, c]);
  }, []);

  useEffect(() => {
    if (!widgetSessionId) return;
    const token = useAuthStore.getState().token;
    if (!token) return;
    const echo = getEcho(token);
    const channel = echo.private(`widget.session.${widgetSessionId}`);
    channel.listen('.message.sent', (data: WidgetMessage & { sender_name?: string }) => {
      addWidgetMessage({
        id: data.id, body: data.body, sender_type: data.sender_type,
        sender: data.sender ?? (data.sender_name ? { id: 0, name: data.sender_name } : null),
        attachment_path: data.attachment_path, attachment_name: data.attachment_name,
        created_at: data.created_at,
      });
    });
    return () => { echo.leaveChannel(`widget.session.${widgetSessionId}`); };
  }, [widgetSessionId, addWidgetMessage]);

  useEffect(() => {
    if (!ticketId) return;
    const token = useAuthStore.getState().token;
    if (!token) return;
    const echo = getEcho(token);
    echo.channel(`ticket.${ticketId}`).listen('.comment.added', (data: { comment: Comment }) => {
      if (!data.comment.is_internal) {
        pushComment(data.comment);
      }
    });
    return () => { echo.leaveChannel(`ticket.${ticketId}`); };
  }, [ticketId, pushComment]);

  const buildTimeline = (): TimelineEvent[] => {
    if (!ticket) return [];
    const events: TimelineEvent[] = [];

    events.push({
      id: 'open', author: ticket.requester_name, content: ticket.description,
      timestamp: ticket.created_at, isAgent: false,
      attachment_path: ticket.attachment_path,
    });

    comments.forEach(c => {
      events.push({
        id: `c-${c.id}`, author: c.user.name, content: c.comment,
        timestamp: c.created_at, isAgent: c.user.id !== user?.id,
        attachments: c.attachments,
      });
    });

    widgetMessages.forEach(m => {
      if (m.sender_type === 'system') return;
      events.push({
        id: `w-${m.id}`, author: m.sender?.name ?? (m.sender_type === 'user' ? ticket.requester_name : 'Agente'),
        content: m.body, timestamp: m.created_at,
        isAgent: m.sender_type === 'agent',
        attachment_path: m.attachment_path, attachment_name: m.attachment_name,
      });
    });

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const handleSend = async () => {
    if (!newComment.trim() && attachedFiles.length === 0) return;
    const text = newComment;
    const files = attachedFiles;
    setNewComment('');
    setAttachedFiles([]);
    setSending(true);
    try {
      const form = new FormData();
      form.append('comment', text);
      files.forEach(f => form.append('files[]', f));
      await api.post(`/tickets/${ticketId}/comments`, form);
      setSuccess('Comentario enviado');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setNewComment(text);
      setAttachedFiles(files);
      setError('Error al enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  const isImage = (p: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(p);

  if (!isAuthenticated || user?.role?.name !== 'usuario') return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600">{error || 'Solicitud no encontrada'}</p>
        <Link href="/portal/mis-tickets">
          <Button className="mt-4" variant="outline">Volver a mis tickets</Button>
        </Link>
      </div>
    );
  }

  const timeline = buildTimeline();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/portal/mis-tickets" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <span className="font-bold text-gray-900">{ticket.ticket_number}</span>
            <span className="ml-2 text-sm text-gray-400 hidden xs:inline">· {ticket.requester_area}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: ticket.status.color + '22', color: ticket.status.color, borderColor: ticket.status.color + '55' }}
          >
            {ticket.status.name}
          </span>
          <span className={`hidden sm:inline px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLOR[ticket.priority]}`}>
            {PRIORITY_LABEL[ticket.priority]}
          </span>
        </div>
      </div>

      {/* Ticket info */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 shrink-0 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Agente asignado</p>
          {ticket.assigned_agent ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                {ticket.assigned_agent.name.charAt(0)}
              </div>
              <span className="text-gray-800 font-medium">{ticket.assigned_agent.name}</span>
            </div>
          ) : (
            <span className="text-gray-400 italic text-xs">Sin asignar aún</span>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Creado</p>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {new Date(ticket.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Última actualización</p>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {new Date(ticket.updated_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><XCircle className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2 shrink-0">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Chat / Timeline */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {timeline.map((event, idx) => {
          const isMe = !event.isAgent;
          return (
            <div key={event.id} className={`flex gap-3 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isMe ? 'bg-primary/10 text-primary' : 'bg-violet-100 text-violet-700'
              }`}>
                {event.author.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[90%] sm:max-w-[75%]`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? '' : 'flex-row-reverse'}`}>
                  <span className="text-xs font-semibold text-gray-700">{event.author}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {idx === 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Apertura</span>
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  isMe
                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    : 'bg-violet-600 text-white rounded-tr-sm'
                }`}>
                  {renderText(event.content, !isMe)}
                </div>

                {/* Attachment original ticket */}
                {event.attachment_path && !event.attachment_name && (
                  <div className="mt-2">
                    {isImage(event.attachment_path) ? (
                      <img
                        src={`${API_STORAGE}/storage/${event.attachment_path}`}
                        alt="adjunto"
                        className="max-w-xs rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 shadow-sm"
                        onClick={() => setImageModal(`${API_STORAGE}/storage/${event.attachment_path!}`)}
                      />
                    ) : (
                      <a href={`${API_STORAGE}/storage/${event.attachment_path}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition">
                        <Paperclip className="w-3.5 h-3.5" /> Archivo adjunto
                      </a>
                    )}
                  </div>
                )}

                {/* Attachment widget message (single file) */}
                {event.attachment_path && event.attachment_name && (
                  <div className="mt-2">
                    {isImage(event.attachment_path) ? (
                      <img
                        src={`${API_STORAGE}/storage/${event.attachment_path}`}
                        alt={event.attachment_name}
                        className="max-w-xs rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 shadow-sm"
                        onClick={() => setImageModal(`${API_STORAGE}/storage/${event.attachment_path!}`)}
                      />
                    ) : (
                      <a href={`${API_STORAGE}/storage/${event.attachment_path}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition">
                        <Paperclip className="w-3.5 h-3.5" /> {event.attachment_name}
                      </a>
                    )}
                  </div>
                )}

                {/* Comment attachments (multi-file) */}
                {event.attachments && event.attachments.length > 0 && (() => {
                  const imgs = event.attachments!.filter(a => a.mime?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(a.name));
                  const files = event.attachments!.filter(a => !(a.mime?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(a.name)));
                  return (
                  <div className="mt-2 space-y-1.5">
                    {imgs.length > 0 && (
                      <div className={`grid gap-1 ${imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`} style={{ maxWidth: imgs.length === 1 ? 220 : 280 }}>
                        {imgs.map((a, i) => (
                          <img
                            key={i}
                            src={a.url}
                            alt={a.name}
                            className={`w-full object-cover cursor-pointer hover:opacity-90 shadow-sm border border-white/20 ${
                              imgs.length === 1 ? 'rounded-xl max-h-44' :
                              imgs.length === 3 && i === 0 ? 'col-span-2 h-28 rounded-lg' : 'h-24 rounded-lg'
                            }`}
                            onClick={() => setImageModal(a.url)}
                          />
                        ))}
                      </div>
                    )}
                    {files.map((a, i) => (
                      <a key={i} href={a.url} download={a.name} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition">
                        <Paperclip className="w-3.5 h-3.5" /> {a.name}
                      </a>
                    ))}
                  </div>
                  );
                })()
                }
              </div>
            </div>
          );
        })}

        {timeline.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay mensajes aún</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply box — solo si no está cerrado */}
      {!['cerrado'].includes(ticket.status.name) ? (
        <div className="border-t bg-white px-4 py-3 shrink-0 space-y-2">
          {/* File previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="relative group">
                  {f.type.startsWith('image/') ? (
                    <>
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-14 h-14 object-cover rounded-xl border border-blue-200 shadow-sm" />
                      <button
                        onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow text-xs"
                      >✕</button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="max-w-25 truncate">{f.name}</span>
                      <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-red-500 ml-0.5">✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 transition">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe un comentario... (Enter para enviar, Shift+Enter nueva línea)"
              className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-0 min-h-10 max-h-32"
              rows={1}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                setAttachedFiles(prev => [...prev, ...files]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition p-1"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={(!newComment.trim() && attachedFiles.length === 0) || sending}
              className="shrink-0 rounded-xl"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t bg-white px-4 py-3 shrink-0">
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
            <XCircle className="w-4 h-4" />
            Este ticket está cerrado
          </div>
        </div>
      )}

      {/* Image modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setImageModal(null)}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-gray-800">Imagen adjunta</span>
              <button onClick={() => setImageModal(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <img src={imageModal} alt="adjunto" className="w-full max-h-[75vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
