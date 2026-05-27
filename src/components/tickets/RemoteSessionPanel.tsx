'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Monitor, Plus, CheckCircle2, Clock,
  Trash2, X, ChevronDown, ChevronUp, Loader2, Copy, Check,
} from 'lucide-react';

interface RemoteSession {
  id: number;
  tool: 'anydesk' | 'teamviewer' | 'chrome_remote_desktop' | 'rustdesk' | 'other';
  session_code: string;
  notes: string | null;
  started_at: string | null;
  ended_at: string | null;
  is_active: boolean;
  duration_minutes: number | null;
  agent?: { id: number; name: string; email: string } | null;
  created_at: string;
}

interface Props {
  ticketId: number;
}

const TOOL_CONFIG = {
  rustdesk:              { label: 'RustDesk',   color: 'text-orange-600 bg-orange-50 border-orange-200', deepLink: () => null,                                                  webLink: null,                                        codeLabel: 'ID de RustDesk',    codePlaceholder: 'ej: 123456789',    hint: 'Copia el ID y pégalo en RustDesk → Conectar' },
  anydesk:               { label: 'AnyDesk',    color: 'text-red-600 bg-red-50 border-red-200',          deepLink: () => null,                                                  webLink: null,                                        codeLabel: 'ID de AnyDesk',     codePlaceholder: 'ej: 123 456 789',  hint: 'Copia el ID y pégalo en AnyDesk → Conectar a otro equipo' },
  teamviewer:            { label: 'TeamViewer', color: 'text-blue-600 bg-blue-50 border-blue-200',        deepLink: () => null,                                                  webLink: null,                                        codeLabel: 'ID de TeamViewer',  codePlaceholder: 'ej: 987 654 321', hint: 'Copia el ID y pégalo en TeamViewer → Control remoto' },
  chrome_remote_desktop: { label: 'Chrome RD',  color: 'text-green-600 bg-green-50 border-green-200',    deepLink: () => null,                                                  webLink: 'https://remotedesktop.google.com/support', codeLabel: 'Código de acceso', codePlaceholder: 'ej: 1234-5678-9012', hint: 'Abre Chrome Remote Desktop, ingresa el código y conecta' },
  other:                 { label: 'Otro',        color: 'text-gray-600 bg-gray-50 border-gray-200',       deepLink: () => null,                                                  webLink: null,                                        codeLabel: 'Código / Enlace',   codePlaceholder: 'código de sesión', hint: '' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export default function RemoteSessionPanel({ ticketId }: Props) {
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Form state
  const [tool, setTool] = useState<'rustdesk' | 'anydesk' | 'teamviewer' | 'chrome_remote_desktop' | 'other'>('rustdesk');
  const [sessionCode, setSessionCode] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const load = async () => {
    try {
      const { data } = await api.get(`/tickets/${ticketId}/remote-sessions`);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  const handleStart = async () => {
    if (!sessionCode.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/tickets/${ticketId}/remote-sessions`, {
        tool, session_code: sessionCode.trim(), notes: notes.trim() || null,
      });
      setSessions(prev => [data, ...prev]);
      setSessionCode('');
      setNotes('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async (session: RemoteSession) => {
    setFinishing(session.id);
    try {
      const { data } = await api.patch(`/tickets/${ticketId}/remote-sessions/${session.id}/finish`);
      setSessions(prev => prev.map(s => s.id === session.id ? data : s));
    } finally {
      setFinishing(null);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tickets/${ticketId}/remote-sessions/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const activeSessions = sessions.filter(s => s.is_active);
  const pastSessions   = sessions.filter(s => !s.is_active);

  return (
    <section>
      {/* Section header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full mb-2.5"
      >
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-cyan-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Escritorio Remoto</span>
          {activeSessions.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Sesión activa" />
          )}
        </div>
        {expanded ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="space-y-3">

          {/* Active sessions */}
          {activeSessions.map(s => {
            const cfg = TOOL_CONFIG[s.tool];
            const link = cfg.deepLink();
            return (
              <div key={s.id} className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-500">Activa</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFinish(s)}
                      disabled={finishing === s.id}
                      title="Finalizar sesión"
                      className="p-1 rounded hover:bg-green-100 text-green-700 transition"
                    >
                      {finishing === s.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <CheckCircle2 size={13} />}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      title="Eliminar"
                      className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-400 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Session code — copy */}
                <button
                  type="button"
                  onClick={() => copyCode(s.id, s.session_code)}
                  title="Copiar ID"
                  className="w-full flex items-center gap-2 bg-white rounded-lg border border-green-200 px-2.5 py-1.5 hover:bg-green-50 transition group"
                >
                  <Monitor size={12} className="text-gray-400 shrink-0" />
                  <span className="font-mono text-sm font-semibold text-gray-800 flex-1 text-left select-all">{s.session_code}</span>
                  {copied === s.id
                    ? <Check size={13} className="text-green-600 shrink-0" />
                    : <Copy size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0" />}
                </button>
                <p className="text-xs text-gray-400">
                  Copia el ID y pégalo en {cfg.label} → <span className="font-medium">Conectar a otro equipo</span>
                </p>

                {s.started_at && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> Iniciada {fmt(s.started_at)}
                    {s.agent && ` · ${s.agent.name}`}
                  </p>
                )}
                {s.notes && <p className="text-xs text-gray-500 italic">{s.notes}</p>}
              </div>
            );
          })}

          {/* New session form */}
          {showForm ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Nueva sesión remota</span>
                <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              </div>

              {/* Tool selector */}
              <div className="grid grid-cols-3 gap-1">
                {(['rustdesk', 'anydesk', 'teamviewer', 'chrome_remote_desktop', 'other'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                      tool === t ? TOOL_CONFIG[t].color : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {TOOL_CONFIG[t].label}
                  </button>
                ))}
              </div>

              {/* Chrome RD instructions */}
              {tool === 'chrome_remote_desktop' && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 py-2 text-xs text-green-700 space-y-0.5">
                  <p className="font-semibold">El usuario debe:</p>
                  <p>1. Abrir <a href="https://remotedesktop.google.com/support" target="_blank" rel="noopener noreferrer" className="underline font-medium">remotedesktop.google.com/support</a></p>
                  <p>2. Hacer clic en <span className="font-medium">"Generar código"</span></p>
                  <p>3. Compartir el código de 12 dígitos contigo</p>
                </div>
              )}

              {/* Session code */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{TOOL_CONFIG[tool].codeLabel}</label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={e => setSessionCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder={TOOL_CONFIG[tool].codePlaceholder}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ej: problema con impresora"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                />
              </div>

              <Button
                size="sm"
                className="w-full h-8 gap-1.5 bg-cyan-600 hover:bg-cyan-700"
                onClick={handleStart}
                disabled={!sessionCode.trim() || saving}
              >
                {saving
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Monitor size={13} />}
                {saving ? 'Iniciando...' : 'Iniciar sesión'}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition"
            >
              <Plus size={13} /> Nueva sesión remota
            </button>
          )}

          {/* Past sessions */}
          {pastSessions.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Historial</p>
              <div className="space-y-1.5">
                {pastSessions.map(s => {
                  const cfg = TOOL_CONFIG[s.tool];
                  return (
                    <div key={s.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="font-mono text-xs text-gray-600 flex-1 truncate">{s.session_code}</span>
                      {s.duration_minutes !== null && (
                        <span className="text-xs text-gray-400 shrink-0">{s.duration_minutes} min</span>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="shrink-0 text-gray-200 hover:text-red-400 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-3">
              <Loader2 size={16} className="animate-spin text-gray-300" />
            </div>
          )}

          {!loading && sessions.length === 0 && !showForm && (
            <p className="text-xs text-gray-400 text-center py-1">Sin sesiones remotas.</p>
          )}
        </div>
      )}
    </section>
  );
}
