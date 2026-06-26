'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, ShieldOff, Key, Eye, EyeOff,
  Copy, Check, AlertCircle, CheckCircle2, Clock, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysUntil(iso: string | null | undefined) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── 2FA Section ───────────────────────────────────────────────────────────────

function TwoFactorSection() {
  const user = useAuthStore(s => s.user);

  const [enabled,           setEnabled]           = useState<boolean | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [step,              setStep]              = useState<'idle' | 'qr' | 'confirm' | 'disable'>('idle');
  const [qrUri,             setQrUri]             = useState('');
  const [secret,            setSecret]            = useState('');
  const [code,              setCode]              = useState('');
  const [password,          setPassword]          = useState('');
  const [error,             setError]             = useState('');
  const [success,           setSuccess]           = useState('');
  const [loading,           setLoading]           = useState(false);
  const [copied,            setCopied]            = useState(false);
  const [showDisPass,       setShowDisPass]       = useState(false);

  useEffect(() => {
    api.get('/auth/two-factor').then(({ data }) => setEnabled(data.enabled));
    api.get('/admin/settings/security')
      .then(({ data }) => setTwoFactorRequired(data.two_factor_required))
      .catch(() => {/* no permission — ignore */});
  }, []);

  const startSetup = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/two-factor/setup');
      setQrUri(data.qr_uri);
      setSecret(data.secret);
      setStep('qr');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/two-factor/confirm', { code });
      setEnabled(true); setStep('idle');
      setSuccess('2FA activado correctamente');
      setCode('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Código inválido');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/two-factor/disable', { code, password });
      setEnabled(false); setStep('idle');
      setSuccess('2FA desactivado');
      setCode(''); setPassword('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = ['admin', 'supervisor'].includes(user?.role?.name ?? '');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            {enabled ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <ShieldOff className="w-5 h-5 text-gray-400" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Verificación en 2 pasos (2FA)</h3>
            <p className="text-sm text-gray-500">
              {enabled === null ? 'Cargando…' : enabled ? 'Activado · Tu cuenta tiene protección adicional' : 'Desactivado'}
            </p>
          </div>
        </div>
        {enabled !== null && step === 'idle' && (
          <Button
            size="sm"
            variant={enabled ? 'outline' : 'default'}
            onClick={() => { setError(''); setSuccess(''); enabled ? setStep('disable') : startSetup(); }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : enabled ? 'Desactivar' : 'Activar'}
          </Button>
        )}
      </div>

      {isAdmin && !enabled && twoFactorRequired && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Tu rol requiere 2FA activo. El administrador del sistema lo ha establecido como obligatorio.</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* QR step */}
      {step === 'qr' && (
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-600">
            Escanea este código QR con tu app autenticadora (Google Authenticator, Authy…)
          </p>
          <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-xl w-fit mx-auto">
            <QRCodeSVG value={qrUri} size={160} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">O ingresa manualmente:</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <code className="flex-1 text-xs font-mono text-violet-700 tracking-widest">{secret}</code>
              <button onClick={copySecret} className="text-gray-400 hover:text-gray-700 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={() => { setStep('confirm'); setError(''); }}>
            Ya lo configuré, ingresar código
          </Button>
          <button onClick={() => setStep('idle')} className="w-full text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
        </div>
      )}

      {/* Confirm step */}
      {step === 'confirm' && (
        <form onSubmit={confirmSetup} className="space-y-4 pt-2">
          <p className="text-sm text-gray-600">Ingresa el código de 6 dígitos de tu app para confirmar:</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoFocus
            className="w-full text-center text-2xl tracking-[0.4em] font-mono border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('qr')}>Atrás</Button>
            <Button type="submit" className="flex-1" disabled={loading || code.length !== 6}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </div>
        </form>
      )}

      {/* Disable step */}
      {step === 'disable' && (
        <form onSubmit={disable} className="space-y-4 pt-2">
          <p className="text-sm text-gray-600">Para desactivar 2FA confirma tu contraseña y el código actual:</p>
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showDisPass ? 'text' : 'password'}
                placeholder="Contraseña actual"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowDisPass(v => !v)}>
                {showDisPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Código 2FA (000000)"
              className="w-full text-center text-xl tracking-[0.4em] font-mono border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setStep('idle'); setCode(''); setPassword(''); }}>Cancelar</Button>
            <Button type="submit" variant="destructive" className="flex-1" disabled={loading || !password || code.length !== 6}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desactivar 2FA'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Password Section ──────────────────────────────────────────────────────────

function PasswordSection() {
  const user       = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);

  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);

  const expiresAt = user?.password_expires_at;
  const days      = daysUntil(expiresAt);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/change-password', {
        current_password:      current,
        new_password:          next,
        new_password_confirmation: confirm,
      });
      setSuccess('Contraseña actualizada correctamente');
      setCurrent(''); setNext(''); setConfirm('');
      // Refresh user data to get new expiration date
      const { data } = await api.get('/auth/me');
      updateUser(data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = [
    'Mínimo 10 caracteres',
    'Al menos una letra mayúscula',
    'Al menos una letra minúscula',
    'Al menos un número',
    'Al menos un carácter especial (!@#$%...)',
    'No puede ser igual a las últimas 5 contraseñas',
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Cambiar contraseña</h3>
          <p className="text-sm text-gray-500">Política de seguridad: contraseña compleja y rotación periódica</p>
        </div>
      </div>

      {/* Expiration status */}
      {expiresAt && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          days !== null && days <= 7
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {days !== null && days <= 0
              ? 'Contraseña expirada — debes cambiarla para continuar'
              : `Contraseña expira en ${days} días (${formatDate(expiresAt)})`}
          </span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Contraseña actual</Label>
          <div className="relative">
            <Input
              type={showCur ? 'text' : 'password'}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder="••••••••••"
              required
            />
            <button type="button" onClick={() => setShowCur(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nueva contraseña</Label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={next}
              onChange={e => setNext(e.target.value)}
              placeholder="••••••••••"
              required
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Confirmar nueva contraseña</Label>
          <Input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••••"
            required
          />
        </div>

        {/* Requirements */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Requisitos de la contraseña:</p>
          <ul className="space-y-1">
            {passwordRules.map(rule => (
              <li key={rule} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !current || !next || !confirm}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cambiando…</> : 'Cambiar contraseña'}
        </Button>
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecuritySettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seguridad de la cuenta</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona la autenticación y la contraseña de tu cuenta</p>
      </div>

      <TwoFactorSection />
      <PasswordSection />
    </div>
  );
}
