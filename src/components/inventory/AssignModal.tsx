'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assetsApi } from '@/lib/assets-api';
import api from '@/lib/api';
import { X, UserPlus } from 'lucide-react';

interface User { id: number; name: string; email: string; }

interface Props {
  assetId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignModal({ assetId, onClose, onSuccess }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: User[] }>('/users').then(({ data }) => setUsers(data.data ?? data as unknown as User[]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      await assetsApi.assignAsset(assetId, Number(userId), reason || undefined);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Error al asignar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" /> Asignar Activo
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Usuario *</Label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
            >
              <option value="">Seleccionar usuario...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Motivo (opcional)</Label>
            <Input
              className="mt-1"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Trabajo remoto, reemplazo temporal..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
