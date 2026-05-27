'use client';

import { useState, useEffect } from 'react';
import { meetingsApi, Meeting } from '@/lib/meetings-api';
import { Button } from '@/components/ui/button';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import {
  Video, ExternalLink, Calendar, Clock, CheckCircle2,
  XCircle, Plus, Loader2, ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import api from '@/lib/api';

interface Props {
  ticketId: number;
  requesterEmail: string;
  requesterName: string;
}

interface Participant {
  id: number;
  name: string;
  email: string;
  role?: { name: string } | null;
}

const STATUS_CONFIG = {
  scheduled: { label: 'Programada', cls: 'bg-blue-100 text-blue-700', Icon: Calendar },
  completed: { label: 'Completada', cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelada',  cls: 'bg-gray-100 text-gray-500',  Icon: XCircle },
};

export default function TicketMeetingsPanel({ ticketId, requesterEmail, requesterName }: Props) {
  const [meetings, setMeetings]       = useState<Meeting[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [expanded, setExpanded]       = useState(true);
  const [notesForm, setNotesForm]     = useState<{ id: number; notes: string; duration: string } | null>(null);

  // Quick-meet participant selector
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const loadMeetings = async () => {
    try {
      const { data } = await meetingsApi.list({ ticket_id: ticketId, per_page: 50 });
      setMeetings(data.data ?? data);
    } catch { setMeetings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMeetings(); }, [ticketId]);

  const openQuickMeetModal = async () => {
    setLoadingParticipants(true);
    setShowParticipantModal(true);
    try {
      const { data } = await api.get(`/tickets/${ticketId}/participants`);
      const list: Participant[] = data.data ?? data;
      setParticipants(list);
      // Pre-select all
      setSelectedEmails(new Set(list.map((p: Participant) => p.email)));
    } catch {
      setParticipants([]);
      setSelectedEmails(new Set());
    } finally {
      setLoadingParticipants(false);
    }
  };

  const toggleParticipant = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const confirmQuickMeet = async () => {
    setShowParticipantModal(false);
    setQuickLoading(true);
    try {
      const extra = participants
        .filter(p => selectedEmails.has(p.email))
        .map(p => ({ email: p.email, name: p.name }));

      const { data } = await meetingsApi.quickMeet(ticketId, { extra_invitees: extra });
      window.open(data.meet_link, '_blank');
      loadMeetings();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error al crear videollamada');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleComplete = (meeting: Meeting) => {
    setNotesForm({ id: meeting.id, notes: meeting.notes ?? '', duration: meeting.duration_minutes?.toString() ?? '' });
  };

  const saveCompletion = async () => {
    if (!notesForm) return;
    await meetingsApi.update(notesForm.id, {
      status: 'completed',
      notes: notesForm.notes,
      duration_minutes: notesForm.duration ? parseInt(notesForm.duration) : undefined,
    });
    setNotesForm(null);
    loadMeetings();
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar esta reunión?')) return;
    await meetingsApi.update(id, { status: 'cancelled' });
    loadMeetings();
  };

  return (
    <section>
      <button
        className="flex items-center gap-2 mb-3 w-full"
        onClick={() => setExpanded(v => !v)}
      >
        <Video size={15} className="text-blue-500" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1 text-left">
          Reuniones Google Meet
          {meetings.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
              {meetings.length}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={openQuickMeetModal}
              disabled={quickLoading}
            >
              {quickLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Video className="h-3.5 w-3.5" />}
              Llamada rápida
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => setShowModal(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Programar
            </Button>
          </div>

          {/* Meetings list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : meetings.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Sin reuniones registradas.</p>
          ) : (
            <ul className="space-y-2">
              {meetings.map(m => {
                const cfg = STATUS_CONFIG[m.status];
                return (
                  <li key={m.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{m.title}</p>
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(m.start_time).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>

                    {m.meet_link && (
                      <a
                        href={m.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Unirse al Meet
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {m.notes && (
                      <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
                        {m.notes}
                      </p>
                    )}
                    {m.duration_minutes && (
                      <p className="text-xs text-gray-400">Duración: {m.duration_minutes} min</p>
                    )}

                    {m.status === 'scheduled' && (
                      <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => handleComplete(m)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Completar
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => handleCancel(m.id)}
                          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition"
                        >
                          <XCircle className="h-3 w-3" /> Cancelar
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Complete notes form */}
          {notesForm && (
            <div className="border border-green-200 rounded-xl p-3 bg-green-50 space-y-2">
              <p className="text-xs font-semibold text-green-800">Registrar finalización</p>
              <input
                type="number"
                min={1}
                placeholder="Duración en minutos"
                value={notesForm.duration}
                onChange={e => setNotesForm(f => f ? { ...f, duration: e.target.value } : f)}
                className="w-full border border-green-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
              />
              <textarea
                placeholder="Notas post-llamada..."
                rows={2}
                value={notesForm.notes}
                onChange={e => setNotesForm(f => f ? { ...f, notes: e.target.value } : f)}
                className="w-full border border-green-200 rounded-lg px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs" onClick={saveCompletion}>Guardar</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setNotesForm(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick-meet participant selector modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs sm:max-w-sm p-4 sm:p-5 space-y-4 mx-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Seleccionar participantes</h3>
            </div>
            <p className="text-xs text-gray-500">
              El solicitante siempre se incluye. Elige qué participantes invitar a la llamada.
            </p>

            {/* Requester — always included, not removable */}
            <div className="flex items-center gap-2.5 p-2 bg-blue-50 rounded-lg">
              <div className="h-4 w-4 rounded border-2 border-blue-400 bg-blue-400 flex items-center justify-center shrink-0">
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{requesterName || 'Solicitante'}</p>
                <p className="text-xs text-gray-500 truncate">{requesterEmail}</p>
              </div>
              <span className="ml-auto text-xs text-blue-500 font-medium shrink-0">Solicitante</span>
            </div>

            {/* Ticket participants */}
            {loadingParticipants ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                No hay participantes adicionales en este ticket.
              </p>
            ) : (
              <ul className="space-y-1 max-h-32 sm:max-h-48 overflow-y-auto">
                {participants.map(p => (
                  <li key={p.id}>
                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded accent-blue-500 shrink-0"
                        checked={selectedEmails.has(p.email)}
                        onChange={() => toggleParticipant(p.email)}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.email}</p>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={confirmQuickMeet}
                disabled={quickLoading}
              >
                <Video className="h-3.5 w-3.5" />
                Iniciar llamada
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setShowParticipantModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ScheduleMeetingModal
          ticketId={ticketId}
          requesterEmail={requesterEmail}
          requesterName={requesterName}
          onClose={() => setShowModal(false)}
          onCreated={meeting => {
            setShowModal(false);
            loadMeetings();
            if (meeting.meet_link) window.open(meeting.meet_link, '_blank');
          }}
        />
      )}
    </section>
  );
}
