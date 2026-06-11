'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail, Plus, Trash2, Pencil, CheckCircle2, XCircle, AlertCircle,
  Loader2, Wifi, WifiOff, Play, ExternalLink, ShieldCheck,
} from 'lucide-react';

interface EmailChannel {
  id: number;
  name: string;
  email: string;
  display_name: string | null;
  imap_host: string | null;
  imap_port: number | null;
  imap_encryption: string | null;
  imap_username: string | null;
  imap_folder: string | null;
  is_active: boolean;
  last_polled_at: string | null;
  use_gmail_api: boolean;
  gmail_client_id: string | null;
  gmail_pubsub_topic: string | null;
}

const EMPTY_FORM = {
  channel_type: 'gmail' as 'imap' | 'gmail',
  name: '',
  email: '',
  display_name: '',
  // IMAP
  imap_host: 'imap.gmail.com',
  imap_port: 993,
  imap_encryption: 'ssl',
  imap_username: '',
  imap_password: '',
  imap_folder: 'INBOX',
  // Gmail API
  gmail_client_id: '',
  gmail_client_secret: '',
  gmail_pubsub_topic: '',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function EmailChannelsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [channels, setChannels] = useState<EmailChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmailChannel | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);
  const [polling, setPolling] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  const flash = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 6000);
  };

  const fetchChannels = useCallback(async () => {
    try {
      const res = await api.get('/email-channels');
      setChannels(res.data);
    } catch {
      flash('Error al cargar canales', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  // Handle OAuth callback redirect params
  useEffect(() => {
    const gmail = searchParams.get('gmail');
    if (gmail === 'connected') {
      flash('Gmail conectado correctamente. El canal está listo para recibir correos.');
      router.replace('/admin/email-channels');
      fetchChannels();
    } else if (gmail === 'error') {
      const errMsg = searchParams.get('msg') ?? 'Error al conectar Gmail';
      flash(errMsg, 'err');
      router.replace('/admin/email-channels');
    }
  }, [searchParams, router, fetchChannels]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        display_name: form.display_name,
        channel_type: form.channel_type,
      };

      if (form.channel_type === 'imap') {
        payload.imap_host = form.imap_host;
        payload.imap_port = form.imap_port;
        payload.imap_encryption = form.imap_encryption;
        payload.imap_username = form.imap_username;
        payload.imap_folder = form.imap_folder;
        if (form.imap_password) payload.imap_password = form.imap_password;
      } else {
        payload.gmail_client_id = form.gmail_client_id;
        if (form.gmail_client_secret) payload.gmail_client_secret = form.gmail_client_secret;
        payload.gmail_pubsub_topic = form.gmail_pubsub_topic || null;
      }

      if (editing) {
        await api.patch(`/email-channels/${editing.id}`, payload);
        flash('Canal actualizado. ' + (form.channel_type === 'gmail' && !editing.use_gmail_api ? 'Ahora haz clic en "Conectar Gmail" para autorizar.' : ''));
      } else {
        await api.post('/email-channels', payload);
        flash('Canal creado. ' + (form.channel_type === 'gmail' ? 'Ahora haz clic en "Conectar Gmail" para autorizar con Google.' : ''));
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...EMPTY_FORM });
      fetchChannels();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      flash(e.response?.data?.message || 'Error al guardar', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este canal?')) return;
    try {
      await api.delete(`/email-channels/${id}`);
      flash('Canal eliminado');
      fetchChannels();
    } catch {
      flash('Error al eliminar', 'err');
    }
  };

  const handleTest = async (channel: EmailChannel) => {
    setTesting(channel.id);
    try {
      const res = await api.post(`/email-channels/${channel.id}/test`);
      flash(res.data.message, res.data.success ? 'ok' : 'err');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      flash(e.response?.data?.message || 'Error de conexión', 'err');
    } finally {
      setTesting(null);
    }
  };

  const handlePollNow = async (channel: EmailChannel) => {
    setPolling(channel.id);
    try {
      const res = await api.post(`/email-channels/${channel.id}/poll`);
      flash(res.data.message);
    } catch {
      flash('Error al procesar correos', 'err');
    } finally {
      setPolling(null);
    }
  };

  const handleGmailConnect = (channel: EmailChannel) => {
    window.location.href = `${API_URL}/api/gmail/oauth/${channel.id}`;
  };

  const openEdit = (channel: EmailChannel) => {
    setEditing(channel);
    setForm({
      channel_type: channel.use_gmail_api ? 'gmail' : 'imap',
      name: channel.name,
      email: channel.email,
      display_name: channel.display_name ?? '',
      imap_host: channel.imap_host ?? 'imap.gmail.com',
      imap_port: channel.imap_port ?? 993,
      imap_encryption: channel.imap_encryption ?? 'ssl',
      imap_username: channel.imap_username ?? '',
      imap_password: '',
      imap_folder: channel.imap_folder ?? 'INBOX',
      gmail_client_id: channel.gmail_client_id ?? '',
      gmail_client_secret: '',
      gmail_pubsub_topic: channel.gmail_pubsub_topic ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Canales de Email
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Conecta bandejas de entrada para recibir tickets por correo
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Conectar Bandeja
        </Button>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
          msg.type === 'ok'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Channel list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay canales de email configurados</p>
          <p className="text-sm text-gray-400 mt-1">Haz clic en "Conectar Bandeja" para agregar uno</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(channel => (
            <div key={channel.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                      {channel.is_active
                        ? <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Wifi className="w-3 h-3" />Activo</span>
                        : <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full"><WifiOff className="w-3 h-3" />Inactivo</span>
                      }
                      {channel.use_gmail_api
                        ? <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" />Gmail API</span>
                        : <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">IMAP</span>
                      }
                    </div>
                    <p className="text-sm text-gray-500">{channel.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {channel.use_gmail_api
                        ? (channel.gmail_client_id ? 'OAuth configurado' : 'OAuth pendiente')
                        : (channel.imap_host ? `${channel.imap_host}:${channel.imap_port} · ${channel.imap_encryption?.toUpperCase() ?? ''}` : 'IMAP no configurado')
                      }
                      {channel.last_polled_at && (
                        <> · Último sondeo: {new Date(channel.last_polled_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {channel.use_gmail_api && channel.gmail_client_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGmailConnect(channel)}
                      title="Reconectar / reautorizar Gmail"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      {channel.use_gmail_api ? 'Reconectar' : 'Conectar Gmail'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(channel)}
                    disabled={testing === channel.id}
                    title="Probar conexión"
                  >
                    {testing === channel.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    }
                  </Button>
                  {!channel.use_gmail_api && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePollNow(channel)}
                      disabled={polling === channel.id}
                      title="Procesar correos ahora"
                    >
                      {polling === channel.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Play className="w-3.5 h-3.5 text-blue-500" />
                      }
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(channel)} title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(channel.id)} title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">
                {editing ? 'Editar canal de email' : 'Conectar bandeja de entrada'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre del canal</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Soporte CARDIQUE" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="soporte@gmail.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Nombre para mostrar (remitente)</Label>
                <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Mesa de Ayuda TI" />
              </div>

              {/* Type selector */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tipo de conexión</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, channel_type: 'gmail' }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      form.channel_type === 'gmail'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Gmail API (OAuth)
                    <span className="text-xs font-normal opacity-70">Recomendado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, channel_type: 'imap' }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      form.channel_type === 'imap'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                    IMAP
                    <span className="text-xs font-normal opacity-70">Servidor propio</span>
                  </button>
                </div>
              </div>

              {/* Gmail API fields */}
              {form.channel_type === 'gmail' && (
                <div className="space-y-3 bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <div className="flex items-start gap-2 text-xs text-purple-700 mb-1">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Necesitas un proyecto en Google Cloud Console con la API de Gmail habilitada y credenciales OAuth 2.0.
                      La URI de redirección debe ser: <code className="bg-purple-100 px-1 rounded">{API_URL}/api/gmail/oauth/callback</code>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client ID</Label>
                    <Input
                      value={form.gmail_client_id}
                      onChange={e => setForm(f => ({ ...f, gmail_client_id: e.target.value }))}
                      placeholder="xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Secret {editing && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}</Label>
                    <Input
                      type="password"
                      value={form.gmail_client_secret}
                      onChange={e => setForm(f => ({ ...f, gmail_client_secret: e.target.value }))}
                      placeholder={editing ? '(sin cambios)' : 'GOCSPX-...'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pub/Sub Topic <span className="text-gray-400 font-normal">(opcional — para notificaciones en tiempo real)</span></Label>
                    <Input
                      value={form.gmail_pubsub_topic}
                      onChange={e => setForm(f => ({ ...f, gmail_pubsub_topic: e.target.value }))}
                      placeholder="projects/mi-proyecto/topics/gmail-push"
                    />
                  </div>
                  {editing && editing.use_gmail_api && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Gmail ya está autorizado. Guarda los cambios y luego usa "Reconectar" solo si necesitas reautorizar.
                    </div>
                  )}
                  {editing && !editing.use_gmail_api && editing.gmail_client_id && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Credenciales guardadas pero OAuth pendiente. Guarda y luego haz clic en "Conectar Gmail".
                    </div>
                  )}
                </div>
              )}

              {/* IMAP fields */}
              {form.channel_type === 'imap' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Servidor IMAP</Label>
                      <Input value={form.imap_host} onChange={e => setForm(f => ({ ...f, imap_host: e.target.value }))} placeholder="imap.gmail.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Puerto</Label>
                      <Input type="number" value={form.imap_port} onChange={e => setForm(f => ({ ...f, imap_port: parseInt(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Cifrado</Label>
                      <select
                        value={form.imap_encryption}
                        onChange={e => setForm(f => ({ ...f, imap_encryption: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="ssl">SSL</option>
                        <option value="tls">TLS</option>
                        <option value="notls">Sin cifrado</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Carpeta</Label>
                      <Input value={form.imap_folder} onChange={e => setForm(f => ({ ...f, imap_folder: e.target.value }))} placeholder="INBOX" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Usuario IMAP</Label>
                      <Input value={form.imap_username} onChange={e => setForm(f => ({ ...f, imap_username: e.target.value }))} placeholder="tu@gmail.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contraseña / App Password</Label>
                      <Input type="password" value={form.imap_password} onChange={e => setForm(f => ({ ...f, imap_password: e.target.value }))} placeholder={editing ? '(sin cambios)' : ''} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editing ? 'Guardar cambios' : 'Crear canal'}
                </Button>
              </div>

              {/* OAuth button for new Gmail channel (after save) */}
              {editing && form.channel_type === 'gmail' && editing.gmail_client_id && (
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => handleGmailConnect(editing)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {editing.use_gmail_api ? 'Reconectar / Reautorizar con Google' : 'Conectar con Gmail (OAuth)'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailChannelsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <EmailChannelsContent />
    </Suspense>
  );
}
