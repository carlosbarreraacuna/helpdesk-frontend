'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Upload, X, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const createTicketSchema = z.object({
  requester_name: z.string().min(1, 'El nombre es requerido'),
  requester_email: z.string().email('Email inválido'),
  requester_area: z.string().min(1, 'El área es requerida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['baja', 'media', 'alta']),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticketNumber: string) => void;
}

export default function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  
  // Obtener datos del usuario autenticado
  const { user } = useAuth();
  
  // Debug: mostrar datos del usuario
  console.log('Usuario en modal:', user);
  console.log('¿Hay usuario?', !!user);
  console.log('Nombre:', user?.name);
  console.log('Email:', user?.email);
  console.log('Área:', user?.area);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      requester_name: user?.name || '',
      requester_email: user?.email || '',
      requester_area: user?.area?.name || '',
      description: '',
      priority: 'media',
    },
  });

  // Efecto para actualizar los campos cuando el usuario cambia
  useEffect(() => {
    if (user) {
      console.log('Usuario detectado:', user);
      setValue('requester_name', user.name || '');
      setValue('requester_email', user.email || '');
      
      // Manejar diferentes estructuras del área
      let areaName = '';
      if (user.area) {
        if (typeof user.area === 'string') {
          areaName = user.area;
        } else if (user.area.name) {
          areaName = user.area.name;
        } else if (user.area.nombre) {
          areaName = user.area.nombre;
        }
      }
      
      console.log('Área detectada:', areaName);
      setValue('requester_area', areaName);
    }
  }, [user, setValue]);

  const priority = watch('priority');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 5MB');
        return;
      }
      
      setAttachment(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    setError('');
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('requester_name', data.requester_name);
      formData.append('requester_email', data.requester_email);
      formData.append('requester_area', data.requester_area);
      formData.append('description', data.description);
      formData.append('priority', data.priority);
      
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await api.post('/portal/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      onSuccess(response.data.ticket_number);
      reset();
      setAttachment(null);
      setAttachmentPreview(null);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setAttachment(null);
      setAttachmentPreview(null);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Completa el formulario para solicitar soporte técnico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requester_name">Nombre Completo *</Label>
              <Input
                id="requester_name"
                placeholder="Tu nombre"
                {...register('requester_name')}
                disabled={!!user}
                className={user ? "bg-gray-100" : ""}
              />
              {errors.requester_name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.requester_name.message}
                </p>
              )}
              {!user && (
                <p className="text-xs text-amber-600">No se detectó usuario autenticado. Por favor ingresa tu nombre.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester_email">Email *</Label>
              <Input
                id="requester_email"
                type="email"
                placeholder="tu@email.com"
                {...register('requester_email')}
                disabled={!!user}
                className={user ? "bg-gray-100" : ""}
              />
              {errors.requester_email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.requester_email.message}
                </p>
              )}
              {!user && (
                <p className="text-xs text-amber-600">No se detectó usuario autenticado. Por favor ingresa tu email.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requester_area">Área/Departamento *</Label>
              <Input
                id="requester_area"
                placeholder="Tu área o departamento"
                {...register('requester_area')}
                disabled={!!user}
                className={user ? "bg-gray-100" : ""}
              />
              {errors.requester_area && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.requester_area.message}
                </p>
              )}
              {!user && (
                <p className="text-xs text-amber-600">No se detectó área del usuario. Por favor ingresa tu área.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={(value) => setValue('priority', value as 'baja' | 'media' | 'alta')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del Problema *</Label>
            <Textarea
              id="description"
              placeholder="Describe detalladamente el problema o solicitud que necesitas soporte..."
              rows={4}
              className="resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Adjuntar Imagen (Opcional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              {attachmentPreview ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={attachmentPreview} 
                      alt="Preview" 
                      className="mx-auto max-h-32 rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeAttachment}
                      className="text-red-600 hover:text-red-700"
                    >
                      Eliminar Imagen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <label htmlFor="attachment" className="cursor-pointer">
                      <span className="text-primary hover:text-primary/80 font-medium">
                        Seleccionar imagen
                      </span>
                      <input
                        id="attachment"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creando Ticket...
                </>
              ) : (
                'Crear Ticket'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
