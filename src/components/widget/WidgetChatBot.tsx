'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, BookOpen, CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import api from '@/lib/api';

const BOT_NAME = process.env.NEXT_PUBLIC_BOT_NAME ?? 'Asistente de Soporte';

type Step =
  | 'idle'
  | 'searching'
  | 'article_shown'
  | 'escalate_offer'
  | 'select_category'
  | 'describe'
  | 'creating'
  | 'done';

interface BotMessage {
  id: string;
  from: 'bot' | 'user';
  text: string;
  article?: {
    id: number;
    title: string;
    published_version?: { content: string };
    category?: { name: string };
  };
  buttons?: Array<{ label: string; action: string; primary?: boolean }>;
}

interface TicketCategory { id: number; name: string }

interface Props {
  userName: string;
  userEmail: string;
  userArea: string;
  userId: number;
}

function uid() { return Math.random().toString(36).slice(2); }

export default function WidgetChatBot({ userName, userEmail, userArea, userId }: Props) {
  const greetingText = `¡Hola ${userName.split(' ')[0]}! 👋 Soy ${BOT_NAME}. ¿En qué puedo ayudarte hoy?`;

  const [step, setStep] = useState<Step>('idle');
  const [messages, setMessages] = useState<BotMessage[]>([
    { id: 'greeting', from: 'bot', text: greetingText },
  ]);
  const [input, setInput] = useState('');
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [transcript, setTranscript] = useState<Array<{ from: string; text: string }>>([
    { from: 'bot', text: greetingText },
  ]);
  const [kbArticle, setKbArticle] = useState<BotMessage['article'] | null>(null);
  const [kbHelpful, setKbHelpful] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addMsg = (msg: BotMessage) => setMessages(prev => [...prev, msg]);
  const addLog = (from: 'bot' | 'user', text: string) =>
    setTranscript(prev => [...prev, { from, text }]);

  const botSay = (text: string, extra?: Partial<BotMessage>): BotMessage => {
    const msg: BotMessage = { id: uid(), from: 'bot', text, ...extra };
    addMsg(msg);
    addLog('bot', text);
    return msg;
  };

  const userSay = (text: string) => {
    addMsg({ id: uid(), from: 'user', text });
    addLog('user', text);
  };

  useEffect(() => {
    api.get<TicketCategory[]>('/ticket-categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (step === 'idle') void handleUserQuery();
    else if (step === 'describe') void handleCreateTicket();
  };

  const handleUserQuery = async () => {
    if (!input.trim()) return;
    const query = input.trim();
    setInput('');
    userSay(query);
    setStep('searching');

    try {
      const res = await api.get('/kb/articles', {
        params: { search: query, status: 'published', per_page: 1 },
      });
      const articles: BotMessage['article'][] = res.data.data ?? [];

      if (articles.length === 0) {
        botSay('No encontré artículos relacionados con tu consulta. ¿Deseas hablar con un agente de soporte?', {
          buttons: [{ label: '👤 Hablar con un agente', action: 'escalate', primary: true }],
        });
        setStep('escalate_offer');
        return;
      }

      let fullArticle: BotMessage['article'] = articles[0];
      try {
        const d = await api.get(`/kb/articles/${articles[0]!.id}`);
        fullArticle = d.data;
      } catch { /* use partial article */ }
      setKbArticle(fullArticle);

      botSay('Encontré un artículo que podría ayudarte:', {
        article: fullArticle,
        buttons: [
          { label: '✅ Sí, resolvió mi duda', action: 'helpful_yes', primary: true },
          { label: '❌ No, no resolvió mi duda', action: 'helpful_no', primary: false },
        ],
      });
      setStep('article_shown');
    } catch {
      botSay('No pude buscar artículos en este momento. ¿Deseas hablar con un agente?', {
        buttons: [{ label: '👤 Hablar con un agente', action: 'escalate', primary: true }],
      });
      setStep('escalate_offer');
    }
  };

  const handleAction = (action: string) => {
    if (action === 'helpful_yes') {
      userSay('✅ Sí, resolvió mi duda');
      setKbHelpful(true);
      botSay('¡Excelente! 🎉 Me alegra haber podido ayudarte. Si tienes más preguntas en el futuro, aquí estaré. ¡Que tengas un buen día!');
      setStep('done');
    } else if (action === 'helpful_no') {
      userSay('❌ No, no resolvió mi duda');
      setKbHelpful(false);
      botSay('Lamentamos no haber podido resolver tu duda con el artículo. ¿Deseas hablar con un agente de soporte para recibir ayuda personalizada?', {
        buttons: [{ label: '👤 Hablar con un agente', action: 'escalate', primary: true }],
      });
      setStep('escalate_offer');
    } else if (action === 'escalate') {
      userSay('👤 Quiero hablar con un agente');
      if (categories.length > 0) {
        botSay('Para conectarte con el agente adecuado, ¿cuál es el tipo de solicitud?');
        setStep('select_category');
      } else {
        botSay('Por favor describe tu problema o solicitud con el mayor detalle posible:');
        setStep('describe');
      }
    }
  };

  const handleCategorySelect = (cat: TicketCategory) => {
    setSelectedCategory(cat);
    userSay(`Categoría: ${cat.name}`);
    botSay(`Categoría: **${cat.name}**. Ahora describe tu problema o solicitud con el mayor detalle posible:`);
    setStep('describe');
  };

  const handleCreateTicket = async () => {
    if (!input.trim()) return;
    const description = input.trim();
    setInput('');
    userSay(description);
    setStep('creating');

    const fullTranscript = [
      ...transcript,
      { from: 'user', text: description },
    ];
    const transcriptText = fullTranscript
      .map(t => `[${t.from === 'bot' ? BOT_NAME : userName}]: ${t.text}`)
      .join('\n');

    try {
      const form = new FormData();
      form.append('requester_name', userName);
      form.append('requester_email', userEmail);
      form.append('requester_area', userArea);
      form.append('description', description);
      form.append('priority', 'media');
      form.append('created_by_user_id', String(userId));
      form.append('bot_context', transcriptText);
      if (selectedCategory) form.append('category_id', String(selectedCategory.id));
      if (kbArticle) {
        form.append('bot_kb_article_id', String(kbArticle.id));
        form.append('bot_kb_article_title', kbArticle.title);
      }
      if (kbHelpful !== null) form.append('bot_kb_helpful', kbHelpful ? '1' : '0');
      if (attachment) form.append('attachment', attachment);

      const res = await api.post('/portal/tickets', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTicketNumber(res.data.ticket_number);
      botSay(`✅ Tu ticket **${res.data.ticket_number}** ha sido creado exitosamente. Un agente revisará tu caso pronto y recibirás notificación por correo. Puedes hacer seguimiento desde el portal.`);
      setStep('done');
    } catch {
      botSay('Ocurrió un error al crear el ticket. Por favor intenta de nuevo.');
      setStep('describe');
    }
  };

  const inputActive = step === 'idle' || step === 'describe';
  const inputPlaceholder = step === 'describe'
    ? 'Describe tu problema o solicitud...'
    : 'Escribe tu mensaje...';

  const renderText = (text: string) =>
    text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );

  const buttonsDisabled = (msg: BotMessage) => {
    if (msg.buttons?.some(b => b.action === 'helpful_yes' || b.action === 'helpful_no'))
      return step !== 'article_shown';
    if (msg.buttons?.some(b => b.action === 'escalate'))
      return step !== 'escalate_offer';
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3 text-white rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">{BOT_NAME}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-xs text-blue-200">Asistente virtual · En línea</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-2 ${msg.from === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {/* Bot avatar label */}
              {msg.from === 'bot' && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-400">{BOT_NAME}</span>
                </div>
              )}

              {/* Bubble */}
              <div className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.from === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                {renderText(msg.text)}
              </div>

              {/* Article card */}
              {msg.article && (
                <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-sm w-full">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {msg.article.category && (
                        <p className="text-xs text-blue-500 font-medium mb-0.5">{msg.article.category.name}</p>
                      )}
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{msg.article.title}</p>
                      {msg.article.published_version?.content && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-4 whitespace-pre-wrap">
                          {msg.article.published_version.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="flex flex-col gap-1.5 w-full">
                  {msg.buttons.map(btn => (
                    <button
                      key={btn.action}
                      onClick={() => handleAction(btn.action)}
                      disabled={buttonsDisabled(msg)}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        btn.primary
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {(step === 'searching' || step === 'creating') && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              {step === 'searching' ? (
                <>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Buscando en la base de conocimiento...</span>
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400">Creando tu ticket...</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Category picker */}
        {step === 'select_category' && (
          <div className="flex justify-start w-full px-1">
            <div className="w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-400">{BOT_NAME}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition text-left leading-snug"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Done — see tickets link */}
        {step === 'done' && ticketNumber && (
          <div className="flex justify-center pt-1">
            <a
              href="/portal/mis-tickets"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ver mis tickets
            </a>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Attachment preview */}
      {attachment && step === 'describe' && (
        <div className="mx-3 mb-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 shrink-0">
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate flex-1">{attachment.name}</span>
          <button onClick={() => setAttachment(null)}>
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 bg-white rounded-b-2xl px-3 py-2 flex items-end gap-2 shrink-0">
        {step === 'describe' && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-gray-400 hover:text-gray-600 pb-1.5 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={e => setAttachment(e.target.files?.[0] ?? null)}
            />
          </>
        )}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={inputActive ? inputPlaceholder : ''}
          disabled={!inputActive}
          rows={1}
          className="flex-1 resize-none text-sm border-0 outline-none bg-transparent py-1.5 max-h-24 disabled:opacity-40 placeholder:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!inputActive || !input.trim()}
          className="pb-1.5 text-blue-600 disabled:text-gray-300 hover:text-blue-700 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
