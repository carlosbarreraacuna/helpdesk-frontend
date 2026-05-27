'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Headphones, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { AuthUser } from '@/lib/auth-store';

const schema = z.object({
  requester_area: z.string().min(1, 'El área es requerida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['baja', 'media', 'alta']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  user: AuthUser;
  onClose: () => void;
  onCreated: () => void;
}

export default function PortalCreateTicketModal({ user, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requester_area: user.area?.name ?? '', priority: 'media', description: '' },
  });

  const priority = watch('priority');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('requester_name', user.name);
      form.append('requester_email', user.email);
      form.append('requester_area', data.requester_area);
      form.append('description', data.description);
      form.append('priority', data.priority);
      form.append('created_by_user_id', String(user.id));
      if (attachment) form.append('attachment', attachment);

      const res = await api.post('/portal/tickets', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(res.data.ticket_number);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Nueva Solicitud de Soporte</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">¡Solicitud Creada!</h3>
            <p className="text-gray-500 text-sm">Tu solicitud ha sido registrada exitosamente.</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Número de ticket</p>
              <p className="text-2xl font-bold text-primary font-mono">{success}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Cerrar</Button>
              <Button onClick={onCreated} className="flex-1">Ver Mis Tickets</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Solicitante (readonly) */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Solicitante</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Área / Dependencia *</Label>
                <Input {...register('requester_area')} placeholder="Tu área o dependencia" />
                {errors.requester_area && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.requester_area.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label className="text-sm font-medium">Prioridad</Label>
                <Select value={priority} onValueChange={v => setValue('priority', v as 'baja' | 'media' | 'alta')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja"><span className="text-green-600 font-medium">● Baja</span></SelectItem>
                    <SelectItem value="media"><span className="text-yellow-600 font-medium">● Media</span></SelectItem>
                    <SelectItem value="alta"><span className="text-red-600 font-medium">● Alta</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Descripción del problema *</Label>
              <Textarea
                {...register('description')}
                placeholder="Describe detalladamente el problema o solicitud..."
                rows={4}
                className="resize-none"
              />
              {errors.description && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Adjunto (opcional)</Label>
              <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {attachment ? attachment.name : 'Seleccionar imagen (PNG, JPG, máx 5MB)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f && f.size <= 5 * 1024 * 1024) setAttachment(f);
                  }}
                />
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : 'Crear Solicitud'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
