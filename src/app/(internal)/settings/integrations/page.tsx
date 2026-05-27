'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { meetingsApi } from '@/lib/meetings-api';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Video, ExternalLink, Loader2, Unlink } from 'lucide-react';

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    const result = searchParams.get('google');
    if (result === 'success') {
      const email = searchParams.get('email') ?? '';
      setFlash({ type: 'success', msg: `Google conectado correctamente${email ? ` (${email})` : ''}.` });
    } else if (result === 'error') {
      const msg = searchParams.get('msg') ?? 'Error desconocido';
      setFlash({ type: 'error', msg: `Error al conectar con Google: ${msg}` });
    }
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      const { data } = await meetingsApi.googleStatus();
      setGoogleStatus(data);
    } catch { setGoogleStatus({ connected: false, email: null }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data } = await meetingsApi.googleRedirectUrl();
      window.location.href = data.url;
    } catch {
      setFlash({ type: 'error', msg: 'No se pudo obtener la URL de autorización de Google.' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar la cuenta de Google? Las reuniones existentes conservarán sus links.')) return;
    setDisconnecting(true);
    try {
      await meetingsApi.googleDisconnect();
      setGoogleStatus({ connected: false, email: null });
      setFlash({ type: 'success', msg: 'Google desconectado.' });
    } catch {
      setFlash({ type: 'error', msg: 'Error al desconectar Google.' });
    } finally { setDisconnecting(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Conecta servicios externos con el helpdesk</p>
      </div>

      {flash && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          flash.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {flash.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <p>{flash.msg}</p>
          <button className="ml-auto text-current opacity-50 hover:opacity-100" onClick={() => setFlash(null)}>✕</button>
        </div>
      )}

      {/* Google Calendar / Meet */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Video className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Google Calendar & Meet</h2>
            <p className="text-xs text-gray-500">Crea videollamadas de Meet y sincroniza reuniones con Google Calendar</p>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Verificando conexión...</span>
            </div>
          ) : googleStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Conectado</p>
                  {googleStatus.email && (
                    <p className="text-xs text-gray-500">{googleStatus.email}</p>
                  )}
                </div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1.5">
                {[
                  'Crear salas Meet desde tickets con 1 clic',
                  'Programar reuniones y enviar invitaciones automáticas',
                  'Sincronizar con Google Calendar',
                  'Enviar el link Meet al solicitante por el chat del ticket',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                Desconectar Google
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <p className="text-sm text-gray-500">No conectado</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Antes de conectar:</p>
                <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
                  <li>Ve a <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Crea un proyecto y habilita <strong>Google Calendar API</strong></li>
                  <li>En "Credenciales", crea un <strong>OAuth 2.0 Client ID</strong> (tipo: Web application)</li>
                  <li>Agrega como URI de redirección autorizado:<br />
                    <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded font-mono">
                      {process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/google/oauth/callback
                    </code>
                  </li>
                  <li>Copia el <strong>Client ID</strong> y <strong>Client Secret</strong> al archivo <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">.env</code> del backend</li>
                </ol>
              </div>

              <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                Conectar con Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
