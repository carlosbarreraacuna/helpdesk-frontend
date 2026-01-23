'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ArrowRight, Shield, Clock, Headphones, Upload, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

const createTicketSchema = z.object({
  requester_name: z.string().min(1, 'El nombre es requerido'),
  requester_email: z.string().email('Email inválido'),
  requester_area: z.string().min(1, 'El área es requerida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['baja', 'media', 'alta']),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

// Hero Section Component
function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover scale-105 blur-in-xs"
        >
          <source
            src="/iguana.mp4"
            type="video/mp4"
          />
        </video>
        {/* Overlay for readability */}
        <div className="absolute inset-0 from-white/85 via-white/80 to-primary/20" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-white px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Soporte Técnico Profesional
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance">
              Mesa de Ayuda{" "}
              <span className="text-secondary">TI</span>
            </h1>
            
            <p className="text-lg text-white max-w-xl leading-relaxed">
              Bienvenido al portal de soporte técnico de <strong>CARDIQUE</strong>. 
              Estamos aquí para resolver tus incidencias tecnológicas de manera 
              rápida y eficiente, garantizando la continuidad de tus operaciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base">
                <Headphones className="w-5 h-5 mr-2" />
                Crear Nuevo Ticket
              </Button>
              <Button size="lg" variant="outline" className="text-primary border-primary hover:bg-primary/10 text-base bg-transparent">
                Ver Estado de Tickets
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="text-sm text-black">Respuesta en menos de 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                <span className="text-sm text-black">Soporte certificado</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative">
              {/* Decorative circles */}
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
              
              {/*   
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-border">
                <Image
                  src="/images/images.png"
                  alt="CARDIQUE Logo"
                  width={280}
                  height={280}
                  className="mx-auto"
                />
                <p className="text-center mt-4 text-primary font-semibold text-lg">
                  Corporación Autónoma Regional del Canal del Dique
                </p>
              </div>
              */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section Component
function FeaturesSection() {
  const features = [
    {
      icon: Headphones,
      title: "Soporte de Equipos",
      description: "Asistencia técnica para computadores de escritorio, portátiles y periféricos."
    },
    {
      icon: Shield,
      title: "Conectividad de Red",
      description: "Solución de problemas de conectividad, VPN y acceso a recursos de red."
    },
    {
      icon: Upload,
      title: "Impresoras y Escáneres",
      description: "Configuración y soporte para dispositivos de impresión y digitalización."
    },
    {
      icon: Clock,
      title: "Correo Institucional",
      description: "Gestión de cuentas de correo electrónico y herramientas de colaboración."
    },
    {
      icon: CheckCircle2,
      title: "Sistemas Institucionales",
      description: "Soporte para aplicaciones y sistemas de información de CARDIQUE."
    },
    {
      icon: AlertCircle,
      title: "Seguridad Informática",
      description: "Protección contra amenazas, antivirus y políticas de seguridad."
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
            Características
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 text-balance">
            Servicios de soporte que ofrecemos
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Nuestro equipo de TI está capacitado para resolver una amplia gama de 
            incidencias tecnológicas en CARDIQUE.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-background border border-border hover:border-secondary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CreateTicketPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ ticket_number: string } | null>(null);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      requester_name: '',
      requester_email: '',
      requester_area: '',
      description: '',
      priority: 'media',
    },
  });

  const priority = watch('priority');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo (solo imágenes)
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 5MB');
        return;
      }
      
      setAttachment(file);
      
      // Crear preview
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
    setSuccess(null);

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
      setSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <HeroSection />
        
        <section className="py-16 lg:py-24 bg-primary/5">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary text-balance">
                Ticket Creado Exitosamente
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Tu ticket ha sido registrado y será procesado pronto
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-primary mb-4">Detalles del Ticket</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Número de Ticket:</p>
                    <p className="text-3xl font-bold text-primary">{success.ticket_number}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Importante:</strong> Guarda este número de ticket para futuras consultas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
                <h3 className="text-xl font-semibold text-primary mb-4">Próximos Pasos</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Recibirás un correo de confirmación</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Un técnico asignado revisará tu caso</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Respuesta en menos de 24 horas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" onClick={() => router.push('/portal/search-ticket')}>
                Consultar Ticket
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                setSuccess(null);
                router.push('/portal/create-ticket');
              }}>
                Crear Otro Ticket
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
        
        <FeaturesSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      
      <section className="py-16 lg:py-24 bg-primary/5">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">
              Crear Ticket
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 text-balance">
              Solicita Soporte Técnico
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Completa el formulario detallando tu incidencia y nuestro equipo de TI 
              te ayudará a resolverla lo más pronto posible.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="requester_name" className="text-base font-medium">Nombre Completo *</Label>
                  <Input
                    id="requester_name"
                    className="h-12"
                    {...register('requester_name')}
                  />
                  {errors.requester_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.requester_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requester_email" className="text-base font-medium">Email *</Label>
                  <Input
                    id="requester_email"
                    type="email"
                    className="h-12"
                    {...register('requester_email')}
                  />
                  {errors.requester_email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.requester_email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="requester_area" className="text-base font-medium">Área/Departamento *</Label>
                  <Input
                    id="requester_area"
                    placeholder="Ventas, TI, Recursos Humanos, etc."
                    className="h-12"
                    {...register('requester_area')}
                  />
                  {errors.requester_area && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.requester_area.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base font-medium">Prioridad</Label>
                  <Select value={priority} onValueChange={(value) => setValue('priority', value as 'baja' | 'media' | 'alta')}>
                    <SelectTrigger className="h-12">
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
                <Label htmlFor="description" className="text-base font-medium">Descripción del Problema *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe detalladamente el problema o solicitud que necesitas soporte..."
                  rows={6}
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
                <Label htmlFor="attachment" className="text-base font-medium">Adjuntar Imagen (Opcional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  {attachmentPreview ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <img 
                          src={attachmentPreview} 
                          alt="Preview" 
                          className="mx-auto max-h-48 rounded-lg shadow-md"
                        />
                        <button
                          type="button"
                          onClick={removeAttachment}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={removeAttachment}
                          className="text-red-600 hover:text-red-700"
                        >
                          Eliminar Imagen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <label htmlFor="attachment" className="cursor-pointer">
                          <span className="text-primary hover:text-primary/80 font-medium text-lg">
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
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG, GIF hasta 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/')}
                  className="text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creando Ticket...
                    </>
                  ) : (
                    <>
                      <Headphones className="w-4 h-4 mr-2" />
                      Crear Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
      
      <FeaturesSection />
    </div>
  );
}
