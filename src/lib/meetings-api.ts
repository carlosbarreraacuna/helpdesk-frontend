import api from './api';

export interface MeetingInvitee {
  id: number;
  email: string;
  name: string | null;
}

export interface Meeting {
  id: number;
  ticket_id: number | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  meet_link: string | null;
  calendar_event_id: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration_minutes: number | null;
  notes: string | null;
  organizer: { id: number; name: string; email: string };
  invitees: MeetingInvitee[];
  ticket?: { id: number; ticket_number: string; requester_name?: string } | null;
  created_at: string;
}

export interface MeetingMetrics {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  avg_duration: number;
  meetings_this_week: number;
}

export const meetingsApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get('/meetings', { params }),

  get: (id: number) => api.get<Meeting>(`/meetings/${id}`),

  create: (data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    ticket_id?: number;
    invitees?: { email: string; name?: string }[];
  }) => api.post<Meeting>('/meetings', data),

  update: (id: number, data: Partial<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    status: Meeting['status'];
    duration_minutes: number;
    notes: string;
  }>) => api.patch<Meeting>(`/meetings/${id}`, data),

  delete: (id: number) => api.delete(`/meetings/${id}`),

  quickMeet: (ticketId: number, data?: { extra_invitees?: { email: string; name?: string | null }[] }) =>
    api.post<{ meeting: Meeting; meet_link: string }>(`/tickets/${ticketId}/quick-meet`, data ?? {}),

  metrics: () => api.get<MeetingMetrics>('/meetings/metrics'),

  // Google OAuth
  googleStatus: () => api.get<{ connected: boolean; email: string | null }>('/google/oauth/status'),
  googleRedirectUrl: () => api.get<{ url: string }>('/google/oauth/redirect-url'),
  googleDisconnect: () => api.delete('/google/oauth/disconnect'),
};
