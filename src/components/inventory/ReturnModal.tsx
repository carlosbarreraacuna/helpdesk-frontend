'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { assetsApi } from '@/lib/assets-api';
import { X, RotateCcw } from 'lucide-react';

interface Props {
  assetId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({ assetId, onClose, onSuccess }: Props) {
  const [returnNotes, setReturnNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await assetsApi.returnAsset(assetId, returnNotes || undefined);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Error al procesar devolución.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-yellow-500" /> Registrar Devolución
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Notas de devolución (opcional)</Label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              value={returnNotes}
              onChange={e => setReturnNotes(e.target.value)}
              placeholder="Estado del equipo al momento de la devolución..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} variant="outline">
              {saving ? 'Procesando...' : 'Confirmar Devolución'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
