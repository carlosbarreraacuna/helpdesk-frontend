'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, AlertCircle, ArrowLeft, Copy, Check } from 'lucide-react';

type Step = 'qr' | 'confirm';

export default function TwoFactorSetupPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const [step,    setStep]    = useState<Step>('qr');
  const [qrUri,   setQrUri]   = useState('');
  const [secret,  setSecret]  = useState('');
  const [code,    setCode]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('2fa_setup_token');
    if (!token) { router.replace('/login'); return; }

    // Fetch QR immediately
    (async () => {
      try {
        const { data } = await api.post('/auth/two-factor/force-setup', { setup_token: token });
        setQrUri(data.qr_uri);
        setSecret(data.secret);
      } catch {
        sessionStorage.removeItem('2fa_setup_token');
        router.replace('/login');
      }
    })();
  }, [router]);

  useEffect(() => {
    if (step === 'confirm') inputRef.current?.focus();
  }, [step]);

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    const setupToken = sessionStorage.getItem('2fa_setup_token');
    if (!setupToken) { router.replace('/login'); return; }

    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/two-factor/force-confirm', {
        setup_token: setupToken,
        code,
      });
      sessionStorage.removeItem('2fa_setup_token');
      setAuth(data.token, data.user);
      const role = data.user?.role?.name;
      router.replace(role === 'usuario' ? '/portal/mis-tickets' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Código inválido';
      setError(msg);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">Configurar verificación en 2 pasos</h1>
            <p className="text-sm text-gray-400 mt-1 text-center">
              Requerido por política de seguridad (MSPI) para tu rol administrativo
            </p>
          </div>

          {step === 'qr' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-300 text-center">
                Escanea este código QR con <span className="text-white font-medium">Google Authenticator</span> o cualquier app TOTP
              </p>

              {/* QR */}
              {qrUri ? (
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  <QRCodeSVG value={qrUri} size={180} />
                </div>
              ) : (
                <div className="h-[212px] bg-gray-800 rounded-xl animate-pulse" />
              )}

              {/* Manual secret */}
              {secret && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">O ingresa manualmente esta clave secreta:</p>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                    <code className="flex-1 text-xs font-mono text-violet-300 tracking-widest break-all">{secret}</code>
                    <button onClick={copySecret} className="text-gray-400 hover:text-white transition-colors shrink-0">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('confirm')}
                disabled={!qrUri}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                Ya lo configuré, continuar
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <form onSubmit={confirm} className="space-y-4">
              <p className="text-sm text-gray-300 text-center">
                Ingresa el código de 6 dígitos que muestra tu app para confirmar la configuración
              </p>

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-600"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {loading ? 'Confirmando…' : 'Confirmar y continuar'}
              </button>

              <button
                type="button"
                onClick={() => { setCode(''); setError(''); setStep('qr'); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ver el código QR de nuevo
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
