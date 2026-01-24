'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CreateTicketModal from '@/components/CreateTicketModal';
import api from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Plus,
  Eye,
} from 'lucide-react';

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
  area?: {
    id: number;
    name: string;
  };
  assigned_agent?: {
    id: number;
    name: string;
  };
}

interface PaginatedResponse {
  data: Ticket[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface Area {
  id: number;
  name: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status_id: '',
    priority: '',
    area_id: '',
    page: 1,
    per_page: 10,
  });

  useEffect(() => {
    loadTickets(true); // Carga inicial
    loadStatuses();
    loadAreas();
  }, []); // Solo al montar

  useEffect(() => {
    if (!loading) { // Evitar carga inicial duplicada
      loadTickets(false); // Cargas por filtros
    }
  }, [filters]);

  const loadTickets = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setTableLoading(true);
    }
    
    try {
      console.log('Cargando tickets con filtros:', filters);
      const response = await api.get('/tickets', { params: filters });
      console.log('Respuesta del servidor - Total tickets:', response.data.total);
      console.log('Respuesta del servidor - Tickets encontrados:', response.data.data.length);
      setTickets(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los tickets');
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setTableLoading(false);
      }
    }
  };

  const loadStatuses = async () => {
    try {
      const { data } = await api.get('/ticket-statuses');
      const statusesData = Array.isArray(data) ? data : data.data || [];
      setStatuses(statusesData);
    } catch (error) {
      console.error('Error loading statuses:', error);
      setStatuses([]);
    }
  };

  const loadAreas = async () => {
    try {
      const { data } = await api.get('/areas');
      const areasData = Array.isArray(data) ? data : data.data || [];
      setAreas(areasData);
    } catch (error) {
      console.error('Error loading areas:', error);
      setAreas([]);
    }
  };

  const handleCreateTicketSuccess = (ticketNumber: string) => {
    console.log('Ticket creado:', ticketNumber);
    loadTickets(false); // No es carga inicial, solo refrescar tabla
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePerPageChange = (perPage: number) => {
    console.log('Cambiando filas por página a:', perPage);
    setFilters({ ...filters, per_page: perPage, page: 1 });
  };

  const handleFilterChange = (newFilters: any) => {
    console.log('Filtros antes de procesar:', newFilters);
    const processedFilters = { ...newFilters };
    if (processedFilters.status_id === 'all') processedFilters.status_id = '';
    if (processedFilters.priority === 'all') processedFilters.priority = '';
    if (processedFilters.area_id === 'all') processedFilters.area_id = '';
    
    console.log('Filtros procesados:', processedFilters);
    setFilters({ ...processedFilters, page: 1 });
  };

  const getPageNumbers = () => {
    const { current_page, last_page } = pagination;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current_page - delta);
      i <= Math.min(last_page - 1, current_page + delta);
      i++
    ) {
      range.push(i);
    }

    if (current_page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current_page + delta < last_page - 1) {
      rangeWithDots.push('...', last_page);
    } else {
      rangeWithDots.push(last_page);
    }

    return rangeWithDots;
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
    <div className="space-y-4">
      
     

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar ticket..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value.trim() })}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <Select
            value={filters.status_id || undefined}
            onValueChange={(value) => handleFilterChange({ ...filters, status_id: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status.id} value={status.id.toString()}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || undefined}
            onValueChange={(value) => handleFilterChange({ ...filters, priority: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.area_id || undefined}
            onValueChange={(value) => handleFilterChange({ ...filters, area_id: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todas las áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {areas.map(area => (
                <SelectItem key={area.id} value={area.id.toString()}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Button>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {tableLoading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-xs text-gray-600">Cargando...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="py-2 px-3 text-xs font-medium">Código</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Solicitante</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Asunto</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Prioridad</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Estado</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Asignado a</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Área</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Fecha</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50/50 border-b border-gray-100">
                      <TableCell className="py-2 px-3">
                        <span className="text-xs font-mono text-gray-600">
                          {ticket.ticket_number}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ticket.requester_name}</p>
                          <p className="text-xs text-gray-500 truncate">{ticket.requester_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <p className="text-sm text-gray-900 max-w-xs truncate" title={ticket.description}>
                          {ticket.description}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
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
                      <TableCell className="py-2 px-3">
                        {ticket.assigned_agent ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <span className="text-blue-600 text-xs font-semibold">
                                {ticket.assigned_agent.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-700">{ticket.assigned_agent.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-xs text-gray-600">
                          {ticket.area?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-xs text-gray-600">
                          {new Date(ticket.created_at).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/tickets/${ticket.id}`}
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="border-t border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      Mostrando{' '}
                      <span className="font-medium">
                        {(pagination.current_page - 1) * pagination.per_page + 1}
                      </span>{' '}
                      a{' '}
                      <span className="font-medium">
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                      </span>{' '}
                      de{' '}
                      <span className="font-medium">{pagination.total}</span> resultados
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Rows per page */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-600">Filas:</span>
                        <Select
                          value={pagination.per_page.toString()}
                          onValueChange={(value) => handlePerPageChange(Number(value))}
                        >
                          <SelectTrigger className="w-14 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Page navigation */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.current_page === 1}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronsLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          disabled={pagination.current_page === 1}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        
                        {/* Page numbers */}
                        {getPageNumbers().map((pageNum, index) => (
                          pageNum === '...' ? (
                            <span key={index} className="px-1 text-xs text-gray-500">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={index}
                              variant={pagination.current_page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum as number)}
                              className="h-7 w-7 p-0 text-xs"
                            >
                              {pageNum}
                            </Button>
                          )
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          disabled={pagination.current_page === pagination.last_page}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.last_page)}
                          disabled={pagination.current_page === pagination.last_page}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronsRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
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
