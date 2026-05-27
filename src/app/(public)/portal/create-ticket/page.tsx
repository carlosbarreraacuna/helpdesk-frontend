'use client';

import { Button } from '@/components/ui/button';
import {
  CheckCircle2, ArrowRight, Shield, Clock, Headphones, Upload, AlertCircle,
} from 'lucide-react';

function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute w-full h-full object-cover scale-105 blur-in-xs">
          <source src="/iguana.mp4" type="video/mp4" />
        </video>
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
              Mesa de Ayuda{' '}
              <span className="text-secondary">TI</span>
            </h1>

            <p className="text-lg text-white max-w-xl leading-relaxed">
              Bienvenido al portal de soporte técnico de <strong>CARDIQUE</strong>.
              Estamos aquí para resolver tus incidencias tecnológicas de manera
              rápida y eficiente, garantizando la continuidad de tus operaciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
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
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Headphones,   title: 'Soporte de Equipos',       description: 'Asistencia técnica para computadores de escritorio, portátiles y periféricos.' },
    { icon: Shield,       title: 'Conectividad de Red',       description: 'Solución de problemas de conectividad, VPN y acceso a recursos de red.' },
    { icon: Upload,       title: 'Impresoras y Escáneres',    description: 'Configuración y soporte para dispositivos de impresión y digitalización.' },
    { icon: Clock,        title: 'Correo Institucional',      description: 'Gestión de cuentas de correo electrónico y herramientas de colaboración.' },
    { icon: CheckCircle2, title: 'Sistemas Institucionales',  description: 'Soporte para aplicaciones y sistemas de información de CARDIQUE.' },
    { icon: AlertCircle,  title: 'Seguridad Informática',     description: 'Protección contra amenazas, antivirus y políticas de seguridad.' },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Características</span>
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
              <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CreateTicketPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}
