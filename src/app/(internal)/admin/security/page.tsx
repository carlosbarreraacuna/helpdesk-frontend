'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Shield, ShieldCheck, ShieldOff, Loader2,
  CheckCircle2, AlertCircle, Users, ShieldX,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/auth-store';

interface UserRow {
  id: number;
  name: string;
  email: string;
  two_factor_enabled: boolean;
  two_factor_confirmed_at: string | null;
  role: { display_name: string };
}

// ── Toggle de requisito global ────────────────────────────────────────────────

function GlobalToggleCard() {
  const [required, setRequired] = useState<boolean | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.get('/admin/settings/security')
      .then(({ data }) => setRequired(data.two_factor_required))
      .catch(() => setError('No se pudo cargar la configuración'));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const { data } = await api.patch('/admin/settings/security', { two_factor_required: value });
      setRequired(data.two_factor_required);
      setSuccess('Configuración guardada');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Verificación en 2 pasos (2FA)</h3>
          <p className="text-sm text-gray-500">Controla si el 2FA es obligatorio para administradores y supervisores</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
        <div className="flex items-center gap-3">
          {required
            ? <ShieldCheck className="w-5 h-5 text-green-600" />
            : <ShieldOff   className="w-5 h-5 text-gray-400" />}
          <div>
            <p className="text-sm font-medium text-gray-800">
              {required === null
                ? 'Cargando…'
                : required
                  ? 'Requerido para admins y supervisores'
                  : 'Opcional — cada usuario elige activarlo'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {required
                ? 'Al iniciar sesión se forzará la configuración de 2FA si no está activo.'
                : 'Los usuarios pueden activar 2FA desde su perfil de seguridad.'}
            </p>
          </div>
        </div>

        {saving
          ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          : required !== null && (
            <Switch
              checked={required}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          )}
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-600">Cuando está activo:</strong> los administradores y
          supervisores sin 2FA configurado serán redirigidos a configurarlo al iniciar sesión.
          Quienes ya lo tienen continuarán con el flujo de verificación normal.
          Todos los demás usuarios pueden configurarlo libremente desde{' '}
          <span className="text-violet-600">Configuración → Seguridad</span>.
        </p>
      </div>
    </div>
  );
}

// ── Estado de 2FA por usuario ─────────────────────────────────────────────────

function UserTwoFactorTable() {
  const currentUser = useAuthStore(s => s.user);
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [disabling,  setDisabling]  = useState<number | null>(null);
  const [feedback,   setFeedback]   = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.get('/users', { params: { roles: ['admin', 'supervisor', 'agente'], per_page: 200 } })
      .then(({ data }) => setUsers(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDisable = async (user: UserRow) => {
    if (!confirm(`¿Desactivar el 2FA de ${user.name}? Tendrá que volver a configurarlo.`)) return;
    setDisabling(user.id); setFeedback(null);
    try {
      const { data } = await api.delete(`/admin/settings/security/users/${user.id}/two-factor`);
      setUsers(prev => prev.map(u => u.id === user.id
        ? { ...u, two_factor_enabled: false, two_factor_confirmed_at: null }
        : u
      ));
      setFeedback({ id: user.id, msg: data.message, ok: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al desactivar';
      setFeedback({ id: user.id, msg, ok: false });
    } finally {
      setDisabling(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const enabled  = users.filter(u => u.two_factor_enabled).length;
  const disabled = users.length - enabled;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Estado 2FA por usuario</h3>
            <p className="text-sm text-gray-500">Cada usuario gestiona su propio 2FA desde Configuración → Seguridad</p>
          </div>
        </div>

        {!loading && (
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {enabled} con 2FA
            </span>
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2.5 py-1">
              <ShieldOff className="w-3.5 h-3.5" /> {disabled} sin 2FA
            </span>
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o correo…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-center">Estado 2FA</th>
                <th className="px-4 py-3 text-left">Configurado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No se encontraron usuarios</td>
                </tr>
              )}
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {feedback?.id === user.id && (
                      <p className={`text-xs mt-0.5 ${feedback.ok ? 'text-green-600' : 'text-red-500'}`}>
                        {feedback.msg}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.role?.display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {user.two_factor_enabled
                      ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs rounded-full px-2.5 py-0.5 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" /> Activo
                        </span>
                      : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs rounded-full px-2.5 py-0.5">
                          <ShieldOff className="w-3.5 h-3.5" /> Inactivo
                        </span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.two_factor_confirmed_at
                      ? new Date(user.two_factor_confirmed_at).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.two_factor_enabled && currentUser?.id !== user.id ? (
                      <button
                        onClick={() => handleDisable(user)}
                        disabled={disabling === user.id}
                        title="Desactivar 2FA"
                        className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {disabling === user.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <ShieldX className="w-3.5 h-3.5" />}
                        Desactivar
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSecurityPage() {
  return (
    <div className="p-6 space-y-6">
      <GlobalToggleCard />
      <UserTwoFactorTable />
    </div>
  );
}
