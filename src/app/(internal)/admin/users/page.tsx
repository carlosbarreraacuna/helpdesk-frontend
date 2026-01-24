'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import CreateUserModal from '@/components/CreateUserModal';
import EditUserModal from '@/components/EditUserModal';
import AssignRoleModal from '@/components/AssignRoleModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  MoreHorizontal,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role_id: number;
  area_id?: number;
  is_active: boolean;
  last_login?: string;
  role?: {
    id: number;
    name: string;
    display_name: string;
  };
  area?: {
    id: number;
    name: string;
  };
}

interface PaginatedResponse {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  level: number;
}

interface Area {
  id: number;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role_id: '',
    area_id: '',
    is_active: '',
    page: 1,
    per_page: 10,
  });
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadAreas();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', { params: filters });
      setUsers(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      // Handle paginated response - extract data array
      const rolesData = Array.isArray(data) ? data : data.data || [];
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]); // Set empty array on error
    }
  };

  const loadAreas = async () => {
    try {
      const { data } = await api.get('/areas');
      // Handle paginated response - extract data array
      const areasData = Array.isArray(data) ? data : data.data || [];
      setAreas(areasData);
    } catch (error) {
      console.error('Error loading areas:', error);
      setAreas([]); // Set empty array on error
    }
  };

  const handleToggleStatus = async (userId: number) => {
    if (confirm('¿Estás seguro de cambiar el estado de este usuario?')) {
      try {
        await api.patch(`/users/${userId}/toggle-status`);
        loadUsers();
      } catch (error) {
        alert('Error al cambiar estado del usuario');
      }
    }
  };

  const handleDelete = async (userId: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/users/${userId}`);
        loadUsers();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar usuario');
      }
    }
  };

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePerPageChange = (perPage: number) => {
    setFilters({ ...filters, per_page: perPage, page: 1 });
  };

  const handleFilterChange = (newFilters: any) => {
    // Convert "all" values back to empty strings for API
    const processedFilters = { ...newFilters };
    if (processedFilters.role_id === 'all') processedFilters.role_id = '';
    if (processedFilters.area_id === 'all') processedFilters.area_id = '';
    if (processedFilters.is_active === 'all') processedFilters.is_active = '';
    
    setFilters({ ...processedFilters, page: 1 });
  };

  // Pagination logic
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuario..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value.trim() })}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <Select
            value={filters.role_id || undefined}
            onValueChange={(value) => handleFilterChange({ ...filters, role_id: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.display_name}
                </SelectItem>
              ))}
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

          <Select
            value={filters.is_active || undefined}
            onValueChange={(value) => handleFilterChange({ ...filters, is_active: value })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Activos</SelectItem>
              <SelectItem value="0">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-xs text-gray-600 flex items-center">
            {pagination.total} usuarios
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-xs text-gray-600">Cargando...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="py-2 px-3 text-xs font-medium">Usuario</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Username</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Rol</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Área</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Estado</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Último acceso</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50 border-b border-gray-100">
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-xs font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-xs text-gray-600 font-mono">
                          {user.username}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignRole(user)}
                          className="h-7 text-xs px-2 flex items-center gap-1"
                        >
                          {(() => {
                            if (user.role?.display_name) return user.role.display_name;
                            if (user.role?.name) return user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1);
                            if (user.role_id) return `Rol ID: ${user.role_id}`;
                            return 'Sin rol';
                          })()}
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-xs text-gray-600">
                          {user.area?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Button
                          variant={user.is_active ? "default" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`h-7 text-xs px-2 ${
                            user.is_active ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""
                          }`}
                        >
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Button>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-xs text-gray-600">
                          {user.last_login 
                            ? new Date(user.last_login).toLocaleDateString('es-ES', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: '2-digit'
                              })
                            : 'Nunca'
                          }
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

      {/* Modales */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadUsers}
        roles={roles}
        areas={areas}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
        roles={roles}
        areas={areas}
      />

      <AssignRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
        roles={roles}
      />
    </div>
  );
}
