'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Shield, ShieldCheck, ShieldOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSecurityPage() {
  const [twoFactorRequired, setTwoFactorRequired] = useState<boolean | null>(null);
  const [loading, setLoading]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [success, setSuccess]   = useState('');
  const [error,   setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/settings/security')
      .then(({ data }) => setTwoFactorRequired(data.two_factor_required))
      .catch(() => setError('No se pudo cargar la configuración'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const { data } = await api.patch('/admin/settings/security', {
        two_factor_required: !twoFactorRequired,
      });
      setTwoFactorRequired(data.two_factor_required);
      setSuccess('Configuración guardada');
    } catch {
      setError('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seguridad del sistema</h1>
        <p className="text-sm text-gray-500 mt-1">Configuración global de autenticación para todos los usuarios</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Verificación en 2 pasos (2FA)</h3>
            <p className="text-sm text-gray-500">Controla si el 2FA es obligatorio para administradores y supervisores</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando configuración…
          </div>
        )}

        {!loading && twoFactorRequired !== null && (
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
            <div className="flex items-center gap-3">
              {twoFactorRequired
                ? <ShieldCheck className="w-5 h-5 text-green-600" />
                : <ShieldOff   className="w-5 h-5 text-gray-400" />}
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {twoFactorRequired ? 'Requerido para admins y supervisores' : 'Opcional para todos los usuarios'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {twoFactorRequired
                    ? 'Al iniciar sesión, se forzará la configuración de 2FA si no está activo.'
                    : 'Los usuarios pueden activar 2FA desde su configuración de seguridad.'}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant={twoFactorRequired ? 'outline' : 'default'}
              onClick={toggle}
              disabled={saving}
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : twoFactorRequired ? 'Desactivar requisito' : 'Activar requisito'}
            </Button>
          </div>
        )}

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

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-600">Cuando está activo:</strong> los administradores y supervisores que aún no tengan 2FA configurado serán redirigidos a configurarlo al iniciar sesión. Los que ya lo tienen configurado continuarán con el flujo de verificación normal.
          </p>
        </div>
      </div>
    </div>
  );
}
