'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail, Plus, Trash2, Pencil, CheckCircle2, XCircle, AlertCircle,
  Loader2, Wifi, WifiOff, ExternalLink, ShieldCheck,
} from 'lucide-react';

interface EmailChannel {
  id: number;
  name: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  last_polled_at: string | null;
  use_gmail_api: boolean;
  gmail_client_id: string | null;
  gmail_pubsub_topic: string | null;
}

const EMPTY_FORM = {
  name: '',
  email: '',
  display_name: '',
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

  useEffect(() => {
    const gmail = searchParams.get('gmail');
    if (gmail === 'connected') {
      flash('Gmail conectado correctamente. El canal está listo para recibir correos en tiempo real.');
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
        display_name: form.display_name || null,
        gmail_client_id: form.gmail_client_id,
        gmail_pubsub_topic: form.gmail_pubsub_topic || null,
      };
      if (form.gmail_client_secret) {
        payload.gmail_client_secret = form.gmail_client_secret;
      }

      if (editing) {
        await api.patch(`/email-channels/${editing.id}`, payload);
        flash('Canal actualizado. Si cambiaste las credenciales, vuelve a conectar con Gmail.');
      } else {
        const res = await api.post('/email-channels', payload);
        flash('Canal creado. Ahora haz clic en "Conectar Gmail" para autorizar con Google.');
        setShowForm(false);
        setEditing(null);
        setForm({ ...EMPTY_FORM });
        await fetchChannels();
        // Auto-open OAuth for the new channel
        window.location.href = `${API_URL}/api/gmail/oauth/${res.data.id}`;
        return;
      }

      setShowForm(false);
      setEditing(null);
      setForm({ ...EMPTY_FORM });
      fetchChannels();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = e.response?.data?.errors;
      if (errors) {
        flash(Object.values(errors).flat().join(' · '), 'err');
      } else {
        flash(e.response?.data?.message || 'Error al guardar', 'err');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este canal? Los tickets existentes no se borran.')) return;
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

  const handleGmailConnect = (channel: EmailChannel) => {
    window.location.href = `${API_URL}/api/gmail/oauth/${channel.id}`;
  };

  const openEdit = (channel: EmailChannel) => {
    setEditing(channel);
    setForm({
      name: channel.name,
      email: channel.email,
      display_name: channel.display_name ?? '',
      gmail_client_id: channel.gmail_client_id ?? '',
      gmail_client_secret: '',
      gmail_pubsub_topic: channel.gmail_pubsub_topic ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
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
            Conecta cuentas de Gmail para recibir tickets en tiempo real
          </p>
        </div>
        <Button onClick={() => { closeForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Conectar Gmail
        </Button>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
          msg.type === 'ok'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Channel list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay canales de email configurados</p>
          <p className="text-sm text-gray-400 mt-1">Haz clic en "Conectar Gmail" para agregar uno</p>
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
                        ? <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <Wifi className="w-3 h-3" />Activo
                          </span>
                        : <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                            <WifiOff className="w-3 h-3" />Inactivo
                          </span>
                      }
                      {channel.use_gmail_api
                        ? <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />Gmail API · Tiempo real
                          </span>
                        : <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />OAuth pendiente
                          </span>
                      }
                    </div>
                    <p className="text-sm text-gray-500">{channel.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {channel.gmail_pubsub_topic
                        ? `Pub/Sub: ${channel.gmail_pubsub_topic}`
                        : 'Sin Pub/Sub configurado'}
                      {channel.last_polled_at && (
                        <> · Último push: {new Date(channel.last_polled_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGmailConnect(channel)}
                    title={channel.use_gmail_api ? 'Reautorizar Gmail' : 'Conectar con Gmail'}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    {channel.use_gmail_api ? 'Reautorizar' : 'Conectar Gmail'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(channel)}
                    disabled={testing === channel.id}
                    title="Verificar token de Gmail"
                  >
                    {testing === channel.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    }
                  </Button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                {editing ? 'Editar canal Gmail' : 'Conectar cuenta de Gmail'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre del canal</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Soporte CARDIQUE"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email de la cuenta</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="soporte@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Nombre para mostrar <span className="text-gray-400 font-normal">(remitente en respuestas)</span></Label>
                <Input
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Mesa de Ayuda TI CARDIQUE"
                />
              </div>

              {/* Gmail API credentials */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-start gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Necesitas credenciales OAuth 2.0 de Google Cloud Console (API de Gmail habilitada).
                    La URI de redirección autorizada debe ser:
                    <code className="block mt-1 bg-purple-100 px-2 py-1 rounded font-mono text-purple-800 break-all">
                      {API_URL}/api/gmail/oauth/callback
                    </code>
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
                  <Label>
                    Client Secret
                    {editing && <span className="text-gray-400 font-normal ml-1">(dejar vacío para no cambiar)</span>}
                  </Label>
                  <Input
                    type="password"
                    value={form.gmail_client_secret}
                    onChange={e => setForm(f => ({ ...f, gmail_client_secret: e.target.value }))}
                    placeholder={editing ? '(sin cambios)' : 'GOCSPX-...'}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Pub/Sub Topic
                    <span className="text-gray-400 font-normal ml-1">(requerido para tiempo real)</span>
                  </Label>
                  <Input
                    value={form.gmail_pubsub_topic}
                    onChange={e => setForm(f => ({ ...f, gmail_pubsub_topic: e.target.value }))}
                    placeholder="projects/mi-proyecto/topics/gmail-helpdesk"
                  />
                  <p className="text-xs text-gray-400">
                    Formato: <code>projects/&#123;project-id&#125;/topics/&#123;topic-name&#125;</code>
                  </p>
                </div>

                {editing && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                    editing.use_gmail_api
                      ? 'text-green-700 bg-green-50 border-green-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {editing.use_gmail_api
                      ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Gmail autorizado correctamente.</>
                      : <><AlertCircle className="w-3.5 h-3.5 shrink-0" /> OAuth pendiente — guarda y usa el botón "Conectar Gmail".</>
                    }
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={closeForm} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editing ? 'Guardar cambios' : 'Guardar y conectar →'}
                </Button>
              </div>

              {editing && (
                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => handleGmailConnect(editing)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {editing.use_gmail_api ? 'Reautorizar con Google' : 'Conectar con Gmail (OAuth)'}
                </Button>
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
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <EmailChannelsContent />
    </Suspense>
  );
}
