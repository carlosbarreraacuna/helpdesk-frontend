'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWidget } from './WidgetContext';
import { widgetApi, WidgetChatMessage, WidgetChatSession } from '@/lib/widget-api';
import { getEcho } from '@/lib/echo';
import { ArrowLeft, Send, Paperclip, Loader2, CheckCheck, X } from 'lucide-react';

interface Props {
  token: string;
  userId: number;
  userName: string;
}

export default function WidgetChat({ token, userId, userName }: Props) {
  const { setView, setSession: setCtxSession, searchContext } = useWidget();
  const [localSession, setLocalSession] = useState<WidgetChatSession | null>(null);
  const [messages, setMessages]         = useState<WidgetChatMessage[]>([]);
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [attachment, setAttachment]     = useState<File | null>(null);
  const [loading, setLoading]           = useState(true);
  const bottomRef                       = useRef<HTMLDivElement>(null);
  const fileRef                         = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: sess } = await widgetApi.getOrCreateSession(searchContext ?? undefined);
        setLocalSession(sess);
        setCtxSession(sess);
        const { data: msgs } = await widgetApi.getMessages(sess.id);
        setMessages(msgs);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!localSession?.id || !token) return;

    const echo = getEcho(token);
    const channel = echo.private(`widget.session.${localSession.id}`);

    channel.listen('.message.sent', (data: WidgetChatMessage) => {
      setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data]);
      scrollToBottom();
      widgetApi.markRead(localSession.id);
    });

    channel.listen('.session.updated', (data: Partial<WidgetChatSession>) => {
      setLocalSession(prev => prev ? { ...prev, ...data } : prev);
    });

    return () => {
      echo.leave(`widget.session.${localSession.id}`);
    };
  }, [localSession?.id, token]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;
    if (!localSession) return;
    setSending(true);
    try {
      const { data: msg } = await widgetApi.sendMessage(localSession.id, input.trim(), attachment ?? undefined);
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      setInput('');
      setAttachment(null);
      if (!localSession.ticket_id) {
        const { data: updated } = await widgetApi.getOrCreateSession();
        setLocalSession(updated);
        setCtxSession(updated);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const isFirstMessage = messages.filter(m => m.sender_type === 'user').length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 px-4 py-3 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('home')} className="text-blue-200 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {localSession?.assigned_agent ? localSession.assigned_agent.name : 'Soporte'}
            </p>
            <p className="text-xs text-blue-200">
              {localSession?.status === 'pending' ? 'Esperando agente...' :
               localSession?.status === 'active'  ? 'En línea' : 'Cerrado'}
            </p>
          </div>
          {localSession?.ticket_id && (
            <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
              #{localSession.ticket?.ticket_number}
            </span>
          )}
        </div>
      </div>

      {searchContext?.query && isFirstMessage && (
        <div className="mx-3 mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Hola {userName.split(' ')[0]} 👋</p>
          <p>Veo que estabas buscando ayuda con:</p>
          <p className="italic mt-1">&ldquo;{searchContext.query}&rdquo;</p>
          <p className="text-blue-500 mt-1">Escribe tu mensaje para contactar soporte.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-white">
        {messages.length === 0 && !searchContext?.query && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">Escribe tu mensaje para iniciar la conversación.</p>
            <p className="text-xs text-gray-300 mt-1">Un agente te responderá pronto.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              msg.sender_type === 'system'
                ? 'bg-gray-100 text-gray-500 text-xs text-center mx-auto'
                : msg.sender_id === userId
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.sender_type !== 'system' && msg.sender_id !== userId && (
                <p className="text-xs font-semibold text-blue-600 mb-0.5">
                  {msg.sender?.name ?? msg.sender_name}
                </p>
              )}
              <p className="whitespace-pre-wrap break-all">{msg.body}</p>
              {msg.attachment_name && (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block mt-1 text-xs underline opacity-80"
                >
                  📎 {msg.attachment_name}
                </a>
              )}
              <div className={`flex items-center gap-1 mt-0.5 ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-[10px] ${msg.sender_id === userId ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender_id === userId && msg.is_read && (
                  <CheckCheck className="h-3 w-3 text-blue-200" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="mx-3 mb-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate flex-1">{attachment.name}</span>
          <button onClick={() => setAttachment(null)}>
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {localSession?.status !== 'closed' && (
        <div className="border-t border-gray-100 bg-white rounded-b-2xl px-3 py-2 flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-gray-600 pb-1.5">
            <Paperclip className="h-5 w-5" />
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] ?? null)} />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none text-sm border-0 outline-none bg-transparent py-1.5 max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={sending || (!input.trim() && !attachment)}
            className="pb-1.5 text-blue-600 disabled:text-gray-300 hover:text-blue-700 transition-colors"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      )}
      {localSession?.status === 'closed' && (
        <div className="border-t border-gray-100 bg-gray-50 rounded-b-2xl px-4 py-3 text-center text-xs text-gray-500">
          Esta conversación ha sido cerrada.
        </div>
      )}
    </div>
  );
}
