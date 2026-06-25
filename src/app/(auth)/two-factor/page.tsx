'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

export default function TwoFactorPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const [code,    setCode]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const token = sessionStorage.getItem('2fa_challenge_token');
    if (!token) router.replace('/login');
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    const challengeToken = sessionStorage.getItem('2fa_challenge_token');
    if (!challengeToken) { router.replace('/login'); return; }

    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/two-factor/verify', {
        challenge_token: challengeToken,
        code,
      });
      sessionStorage.removeItem('2fa_challenge_token');
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
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">Verificación en 2 pasos</h1>
            <p className="text-sm text-gray-400 mt-1 text-center">
              Ingresa el código de 6 dígitos de tu aplicación autenticadora
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-600"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {loading ? 'Verificando…' : 'Verificar'}
            </button>
          </form>

          <button
            onClick={() => { sessionStorage.removeItem('2fa_challenge_token'); router.push('/login'); }}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio de sesión
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Google Authenticator · Microsoft Authenticator · Authy
        </p>
      </div>
    </div>
  );
}
