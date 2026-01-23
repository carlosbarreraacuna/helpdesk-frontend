'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

const searchTicketSchema = z.object({
  ticket_number: z.string().min(1, 'El número de ticket es requerido'),
});

type SearchTicketFormData = z.infer<typeof searchTicketSchema>;

interface Ticket {
  id: number;
  ticket_number: string;
  requester_name: string;
  requester_email: string;
  description: string;
  priority: string;
  status: {
    id: number;
    name: string;
    color: string;
  };
  created_at: string;
}

export default function SearchTicketPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchTicketFormData>({
    resolver: zodResolver(searchTicketSchema),
  });

  const onSubmit = async (data: SearchTicketFormData) => {
    setLoading(true);
    setError('');
    setTicket(null);
    setSearched(true);

    try {
      const response = await api.post('/portal/tickets/search', data);
      setTicket(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ticket no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'text-red-600 bg-red-50';
      case 'media': return 'text-yellow-600 bg-yellow-50';
      case 'baja': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consultar Ticket</CardTitle>
          <CardDescription>
            Ingresa el número de ticket para ver su estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_number">Número de Ticket *</Label>
              <Input
                id="ticket_number"
                placeholder="TKT-2026-0001"
                {...register('ticket_number')}
              />
              {errors.ticket_number && (
                <p className="text-sm text-red-600">{errors.ticket_number.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Buscando...' : 'Buscar Ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && searched && (
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {ticket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{ticket.ticket_number}</span>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: ticket.status.color + '20',
                  color: ticket.status.color 
                }}
              >
                {ticket.status.name}
              </span>
            </CardTitle>
            <CardDescription>
              Detalles del ticket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Solicitante</Label>
                <p className="font-medium">{ticket.requester_name}</p>
                <p className="text-sm text-gray-500">{ticket.requester_email}</p>
              </div>
              <div>
                <Label>Prioridad</Label>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Descripción</Label>
              <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded">
                {ticket.description}
              </p>
            </div>
            
            <div className="text-sm text-gray-500">
              <Label>Fecha de Creación</Label>
              <p>{new Date(ticket.created_at).toLocaleString()}</p>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Estado Actual:</strong> {ticket.status.name}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Para más información o seguimiento, contacta al equipo de soporte.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
