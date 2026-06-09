'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail, Plus, Trash2, Pencil, CheckCircle2, XCircle, AlertCircle,
  Loader2, RefreshCw, Wifi, WifiOff, Play,
} from 'lucide-react';

interface EmailChannel {
  id: number;
  name: string;
  email: string;
  display_name: string | null;
  imap_host: string;
  imap_port: number;
  imap_encryption: string;
  imap_username: string;
  imap_folder: string;
  is_active: boolean;
  last_polled_at: string | null;
}

const EMPTY_FORM = {
  name: '', email: '', display_name: '',
  imap_host: 'imap.gmail.com', imap_port: 993, imap_encryption: 'ssl',
  imap_username: '', imap_password: '', imap_folder: 'INBOX',
};

export default function EmailChannelsPage() {
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
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchChannels = async () => {
    try {
      const res = await api.get('/email-channels');
      setChannels(res.data);
    } catch {
      flash('Error al cargar canales', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChannels(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/email-channels/${editing.id}`, form);
        flash('Canal actualizado');
      } else {
        await api.post('/email-channels', form);
        flash('Canal creado');
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

  const openEdit = (channel: EmailChannel) => {
    setEditing(channel);
    setForm({
      name: channel.name, email: channel.email, display_name: channel.display_name ?? '',
      imap_host: channel.imap_host, imap_port: channel.imap_port,
      imap_encryption: channel.imap_encryption, imap_username: channel.imap_username,
      imap_password: '', imap_folder: channel.imap_folder,
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
          {msg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Gmail setup instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Configuración para Gmail
        </h3>
        <ol className="text-blue-700 space-y-1 list-decimal list-inside">
          <li>Activa el acceso IMAP en Gmail → Configuración → Ver toda la configuración → Reenvío e IMAP/POP</li>
          <li>Genera una <strong>Contraseña de aplicación</strong> en tu cuenta de Google (Seguridad → Verificación en 2 pasos → Contraseñas de aplicación)</li>
          <li>Usa esa contraseña de 16 caracteres en el campo "Contraseña IMAP" de abajo</li>
          <li>Host: <code className="bg-blue-100 px-1 rounded">imap.gmail.com</code> · Puerto: <code className="bg-blue-100 px-1 rounded">993</code> · Cifrado: <code className="bg-blue-100 px-1 rounded">SSL</code></li>
        </ol>
      </div>

      {/* Channel list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay canales de email configurados</p>
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                      {channel.is_active
                        ? <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Wifi className="w-3 h-3" />Activo</span>
                        : <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full"><WifiOff className="w-3 h-3" />Inactivo</span>
                      }
                    </div>
                    <p className="text-sm text-gray-500">{channel.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {channel.imap_host ? `${channel.imap_host}:${channel.imap_port} · ${channel.imap_encryption?.toUpperCase()}` : 'IMAP no configurado'}
                      {channel.last_polled_at && (
                        <> · Último sondeo: {new Date(channel.last_polled_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Configuración IMAP (entrada)</p>
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
                <div className="grid grid-cols-2 gap-3 mt-3">
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
                <div className="grid grid-cols-2 gap-3 mt-3">
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

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editing ? 'Guardar cambios' : 'Conectar canal'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
