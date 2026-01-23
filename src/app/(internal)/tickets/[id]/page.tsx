'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Ticket {
  id: number;
  ticket_number: string;
  requester_name: string;
  requester_email: string;
  requester_area: string;
  description: string;
  attachment_path: string | null;
  verification_code: string;
  priority: string;
  status: {
    id: number;
    name: string;
    color: string;
  };
  assigned_agent?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface Comment {
  id: number;
  comment: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user } = useAuth(); // Obtener usuario autenticado
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // Form states
  const [assignUserId, setAssignUserId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState('media'); // valor por defecto
  
  // Lists for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await api.get(`/tickets/${ticketId}`);
        setTicket(response.data);
        setStatusId(response.data.status.id.toString());
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar el ticket');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.data);
      } catch (err: any) {
        console.error('Error loading users:', err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const response = await api.get('/ticket-statuses');
        setStatuses(response.data);
      } catch (err: any) {
        console.error('Error loading statuses:', err);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await api.get(`/tickets/${ticketId}/comments`);
        setComments(response.data);
      } catch (err: any) {
        console.error('Error loading comments:', err);
      }
    };

    fetchTicket();
    fetchUsers();
    fetchStatuses();
    fetchComments();
  }, [ticketId]);

  const handleAssign = async () => {
    if (!assignUserId) return;
    
    setActionLoading('assign');
    try {
      await api.post(`/tickets/${ticketId}/assign`, { 
        agent_id: parseInt(assignUserId),
        priority: priority
      });
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar ticket');
    } finally {
      setActionLoading('');
    }
  };

  const handleEscalate = async () => {
    setActionLoading('escalate');
    try {
      await api.post(`/tickets/${ticketId}/escalate`);
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al escalar ticket');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusId) return;
    
    setActionLoading('status');
    try {
      // Encontrar el estado por ID y enviar el nombre
      const selectedStatus = statuses.find(s => s.id.toString() === statusId);
      if (!selectedStatus) {
        setError('Estado no encontrado');
        return;
      }
      
      await api.patch(`/tickets/${ticketId}/status`, { 
        status: selectedStatus.name 
      });
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setActionLoading('');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setActionLoading('comment');
    try {
      await api.post(`/tickets/${ticketId}/comments`, { comment });
      setComment('');
      // Recargar comentarios
      const response = await api.get(`/tickets/${ticketId}/comments`);
      setComments(response.data);
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar comentario');
    } finally {
      setActionLoading('');
    }
  };

  const handleClose = async () => {
    setActionLoading('close');
    try {
      await api.post(`/tickets/${ticketId}/close`);
      router.push('/tickets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cerrar ticket');
    } finally {
      setActionLoading('');
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

  const isImageFile = (filename: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  };

  // Verificar si el usuario tiene rol "usuario"
  const isUserRole = () => {
    if (!user || !user.role) return false;
    return user.role.name === 'usuario' || user.role.name === 'user';
  };

  // Verificar si el usuario puede realizar acciones administrativas
  const canPerformActions = () => {
    return !isUserRole();
  };

  const openImageModal = (imagePath: string) => {
    setSelectedImage(`http://127.0.0.1:8000/storage/${imagePath}`);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Ticket no encontrado'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{ticket.ticket_number}</h1>
          <p className="text-gray-600">Detalles del ticket</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Solicitante</Label>
              <p className="font-medium">{ticket.requester_name}</p>
              <p className="text-sm text-gray-500">{ticket.requester_email}</p>
            </div>
            <div>
              <Label>Área</Label>
              <p className="font-medium">{ticket.requester_area}</p>
            </div>
            <div>
              <Label>Prioridad</Label>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <div className="mt-1">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: ticket.status.color + '20',
                    color: ticket.status.color 
                  }}
                >
                  {ticket.status.name}
                </span>
              </div>
            </div>
            <div>
              <Label>Agente Asignado</Label>
              <p className="font-medium">
                {ticket.assigned_agent ? ticket.assigned_agent.name : 'Sin asignar'}
              </p>
            </div>
            <div>
              <Label>Código de Verificación</Label>
              <p className="font-medium">{ticket.verification_code}</p>
            </div>
          </div>
          
          <div>
            <Label>Descripción</Label>
            <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded">
              {ticket.description}
            </p>
          </div>
          
          {/* Attachment */}
          {ticket.attachment_path && (
            <div>
              <Label>Archivo Adjunto</Label>
              <div className="mt-1">
                {isImageFile(ticket.attachment_path) ? (
                  <div className="space-y-3">
                    <img 
                      src={`http://127.0.0.1:8000/storage/${ticket.attachment_path}`}
                      alt="Archivo adjunto"
                      className="max-w-md rounded-lg shadow-md cursor-pointer hover:opacity-80 transition"
                      onClick={() => ticket.attachment_path && openImageModal(ticket.attachment_path)}
                    />
                    <button
                      onClick={() => ticket.attachment_path && openImageModal(ticket.attachment_path)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Ver Imagen Completa
                    </button>
                  </div>
                ) : (
                  <a 
                    href={`http://127.0.0.1:8000/storage/${ticket.attachment_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Descargar Archivo
                  </a>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <Label>Creado</Label>
              <p>{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            <div>
              <Label>Actualizado</Label>
              <p>{new Date(ticket.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions - Solo para usuarios que no son de rol "usuario" */}
      {canPerformActions() && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Assign Ticket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asignar Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assignUserId">Asignar a Usuario</Label>
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona prioridad..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Media</SelectItem>
                    <SelectItem value="baja">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAssign} 
                disabled={!assignUserId || actionLoading === 'assign'}
                className="w-full"
              >
                {actionLoading === 'assign' ? 'Asignando...' : 'Asignar'}
              </Button>
            </CardContent>
          </Card>

          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cambiar Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="statusId">Nuevo Estado</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleUpdateStatus} 
                disabled={!statusId || actionLoading === 'status'}
                className="w-full"
              >
                {actionLoading === 'status' ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </CardContent>
          </Card>

          {/* Other Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Otras Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleEscalate} 
                variant="outline"
                disabled={actionLoading === 'escalate'}
                className="w-full"
              >
                {actionLoading === 'escalate' ? 'Escalando...' : 'Escalar Ticket'}
              </Button>
              <Button 
                onClick={handleClose} 
                variant="destructive"
                disabled={actionLoading === 'close'}
                className="w-full"
              >
                {actionLoading === 'close' ? 'Cerrando...' : 'Cerrar Ticket'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Comment - Disponible para todos los usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Comentarios del Ticket</CardTitle>
          <CardDescription>Comunica actualizaciones y seguimiento del ticket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulario para agregar comentario */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Agregar Comentario</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu comentario o actualización aquí..."
                rows={3}
              />
            </div>
            <Button 
              onClick={handleAddComment} 
              disabled={!comment.trim() || actionLoading === 'comment'}
            >
              {actionLoading === 'comment' ? 'Agregando...' : 'Agregar Comentario'}
            </Button>
          </div>

          {/* Separador */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Historial de Comentarios</h4>
            
            {/* Lista de comentarios */}
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay comentarios aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((commentItem) => (
                  <div key={commentItem.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{commentItem.user.name}</p>
                        <p className="text-sm text-gray-500">{commentItem.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(commentItem.created_at).toLocaleString()}
                        </p>
                        {commentItem.updated_at !== commentItem.created_at && (
                          <p className="text-xs text-amber-600">Editado</p>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {commentItem.comment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-screen overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Vista Previa de Imagen</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage}
                alt="Imagen adjunta"
                className="max-w-full h-auto rounded"
              />
            </div>
            <div className="p-4 border-t flex justify-end">
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Descargar Imagen
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
