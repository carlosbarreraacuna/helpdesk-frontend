import api from './api';

export interface SearchContext {
  query: string;
  suggested_articles: number[];
  opened_article: number | null;
  timestamp: string;
}

export interface WidgetChatSession {
  id: number;
  user_id: number;
  ticket_id: number | null;
  assigned_agent_id: number | null;
  status: 'pending' | 'active' | 'closed' | 'transferred';
  search_context: SearchContext | null;
  started_at: string | null;
  closed_at: string | null;
  messages?: WidgetChatMessage[];
  assigned_agent?: { id: number; name: string } | null;
  ticket?: { id: number; ticket_number: string; status_id: number } | null;
}

export interface WidgetChatMessage {
  id: number;
  session_id: number;
  sender_id: number;
  sender_type: 'user' | 'agent' | 'system';
  sender_name?: string;
  sender?: { id: number; name: string };
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface KbArticleSuggestion {
  id: number;
  title: string;
  slug: string;
}

export interface RecentTicket {
  id: number;
  ticket_number: string;
  summary: string;
  status: string;
  status_color: string;
  created_at: string;
}

export const widgetApi = {
  // KB Search (no requiere auth)
  searchKb: (q: string) =>
    api.get<KbArticleSuggestion[]>('/widget/kb/search', { params: { q } }),

  // Artículo completo (ruta pública del portal)
  getArticle: (id: number) =>
    api.get<{ id: number; title: string; slug: string; published_version: { content: string } | null }>(`/portal/kb/articles/${id}`),

  // Feedback útil/no útil
  articleFeedback: (articleId: number, helpful: boolean) =>
    api.post(`/widget/articles/${articleId}/feedback`, { helpful }),

  // Sesión de chat
  getOrCreateSession: (searchContext?: SearchContext) =>
    api.post<WidgetChatSession>('/widget/session', { search_context: searchContext }),

  // Tickets recientes
  getRecentTickets: () =>
    api.get<RecentTicket[]>('/widget/recent-tickets'),

  // Mensajes
  getMessages: (sessionId: number) =>
    api.get<WidgetChatMessage[]>(`/widget/sessions/${sessionId}/messages`),

  sendMessage: (sessionId: number, body: string, attachment?: File) => {
    if (attachment) {
      const form = new FormData();
      form.append('body', body);
      form.append('attachment', attachment);
      return api.post<WidgetChatMessage>(`/widget/sessions/${sessionId}/messages`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post<WidgetChatMessage>(`/widget/sessions/${sessionId}/messages`, { body });
  },

  markRead: (sessionId: number) =>
    api.post(`/widget/sessions/${sessionId}/read`),

  closeSession: (sessionId: number) =>
    api.post(`/widget/sessions/${sessionId}/close`),

  // Panel agente
  getActiveSessions: () =>
    api.get<WidgetChatSession[]>('/widget/active-sessions'),

  getUnreadCount: () =>
    api.get<{ unread_count: number }>('/widget/unread-count'),

  assignAgent: (sessionId: number, agentId: number) =>
    api.post(`/widget/sessions/${sessionId}/assign`, { agent_id: agentId }),
};

// ── Contexto local (localStorage) ─────────────────────────────────────────────
const CONTEXT_KEY = 'widget_search_context';

export function saveSearchContext(ctx: SearchContext): void {
  try { localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx)); } catch { /* */ }
}

export function loadSearchContext(): SearchContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSearchContext(): void {
  try { localStorage.removeItem(CONTEXT_KEY); } catch { /* */ }
}
