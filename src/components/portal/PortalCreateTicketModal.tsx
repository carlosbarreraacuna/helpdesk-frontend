'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Headphones, AlertCircle, CheckCircle2, Upload, Sparkles, Paperclip, FileText } from 'lucide-react';
import { AuthUser } from '@/lib/auth-store';

interface TicketCategory { id: number; name: string }

const schema = z.object({
  requester_area: z.string().min(1, 'El área es requerida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['baja', 'media', 'alta']),
  category_id: z.string().optional(),
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
  const [success, setSuccess] = useState<{ ticketNumber: string; category: string | null; assignedAgent: string | null } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ priority: string; category_id: number | null; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get<TicketCategory[]>('/ticket-categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requester_area: user.area?.name ?? '', priority: 'media', description: '', category_id: '' },
  });

  const priority = watch('priority');
  const categoryId = watch('category_id');
  const description = watch('description');

  useEffect(() => {
    if (description.length < 20) { setAiSuggestion(null); return; }
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    aiDebounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await api.post('/ai/classify-ticket', { description });
        setAiSuggestion(res.data);
      } catch { /* silent */ } finally {
        setAiLoading(false);
      }
    }, 1200);
    return () => { if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current); };
  }, [description]);

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setValue('priority', aiSuggestion.priority as 'baja' | 'media' | 'alta');
    if (aiSuggestion.category_id) setValue('category_id', String(aiSuggestion.category_id));
    setAiSuggestion(null);
  };

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
      if (data.category_id) form.append('category_id', data.category_id);
      attachments.forEach(f => form.append('attachments[]', f));

      const res = await api.post('/portal/tickets', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess({
        ticketNumber: res.data.ticket_number,
        category: res.data.category ?? null,
        assignedAgent: res.data.assigned_agent ?? null,
      });
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
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Número de ticket</p>
                <p className="text-2xl font-bold text-primary font-mono">{success.ticketNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div className="text-left">
                  <p className="text-xs text-gray-500 mb-0.5">Categoría</p>
                  <p className="text-sm font-medium text-gray-800">{success.category ?? 'Sin categoría'}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 mb-0.5">Asignado a</p>
                  <p className="text-sm font-medium text-gray-800">{success.assignedAgent ?? 'Pendiente de asignación'}</p>
                </div>
              </div>
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

              {categories.length > 0 && (
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label className="text-sm font-medium">Tipo de solicitud</Label>
                  <Select value={categoryId || 'none'} onValueChange={v => setValue('category_id', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
              <Label className="text-sm font-medium">Adjuntos (opcional)</Label>
              <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">
                  {attachments.length > 0
                    ? `${attachments.length} archivo${attachments.length > 1 ? 's' : ''} seleccionado${attachments.length > 1 ? 's' : ''}`
                    : 'Seleccionar documentos (PDF, Word, Excel, imágenes — máx 40 MB en total)'}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => {
                    setAttachmentError('');
                    const incoming = Array.from(e.target.files ?? []);
                    const currentTotal = attachments.reduce((s, f) => s + f.size, 0);
                    const newTotal = incoming.reduce((s, f) => s + f.size, 0);
                    if (currentTotal + newTotal > 40 * 1024 * 1024) {
                      setAttachmentError(`El total de archivos no puede superar 40 MB (llevas ${(currentTotal / (1024 * 1024)).toFixed(1)} MB)`);
                      e.target.value = '';
                      return;
                    }
                    setAttachments(prev => [...prev, ...incoming]);
                    e.target.value = '';
                  }}
                />
              </label>
              {attachmentError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />{attachmentError}
                </p>
              )}
              {attachments.length > 0 && (
                <ul className="space-y-1 mt-1">
                  {attachments.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                      {f.type.startsWith('image/') ? <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" /> : <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-gray-400 shrink-0">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 transition shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sugerencia IA */}
            {aiLoading && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
                <span>Analizando descripción con IA...</span>
              </div>
            )}
            {aiSuggestion && !aiLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700">Sugerencia IA</span>
                </div>
                <p className="text-xs text-blue-800">{aiSuggestion.reason}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600">
                    Prioridad sugerida: <strong className="capitalize">{aiSuggestion.priority}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={applyAiSuggestion}
                    className="ml-auto text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                  >
                    Aplicar sugerencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs text-blue-400 hover:text-blue-600"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            )}

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
