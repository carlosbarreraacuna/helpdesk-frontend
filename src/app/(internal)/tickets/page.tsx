'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CreateTicketModal from '@/components/CreateTicketModal';
import api from '@/lib/api';

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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar los tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleCreateTicketSuccess = (ticketNumber: string) => {
    // Opcional: mostrar notificación de éxito
    console.log('Ticket creado:', ticketNumber);
    // Recargar la lista de tickets
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar los tickets');
      }
    };
    fetchTickets();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'text-red-600 bg-red-50';
      case 'media': return 'text-yellow-600 bg-yellow-50';
      case 'baja': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Gestión de tickets de soporte</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Crear Nuevo Ticket</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay tickets disponibles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.requester_name}</p>
                        <p className="text-sm text-gray-500">{ticket.requester_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate" title={ticket.description}>
                        {ticket.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: ticket.status.color + '20',
                          color: ticket.status.color 
                        }}
                      >
                        {ticket.status.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/tickets/${ticket.id}`}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateTicketSuccess}
      />
    </div>
  );
}
