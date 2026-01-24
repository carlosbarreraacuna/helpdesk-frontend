'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

interface Area {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAreaModal({ isOpen, onClose, onSuccess }: CreateAreaModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    try {
      await api.post('/areas', formData);
      onSuccess();
      onClose();
      setFormData({ name: '', description: '' });
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al crear área');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Crear Nueva Área</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Área *</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Área'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  area: Area | null;
}

function EditAreaModal({ isOpen, onClose, onSuccess, area }: EditAreaModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && area) {
      setFormData({
        name: area.name,
        description: area.description || '',
      });
      setErrors({});
    }
  }, [isOpen, area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    try {
      await api.patch(`/areas/${area!.id}`, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al actualizar área');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !area) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Editar Área</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Área *</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Área'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    per_page: 10,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  useEffect(() => {
    loadAreas();
  }, [filters]);

  const loadAreas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/areas', { params: filters });
      setAreas(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (error: any) {
      console.error('Error loading areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = () => {
    setShowCreateModal(true);
  };

  const handleEditArea = (area: Area) => {
    setSelectedArea(area);
    setShowEditModal(true);
  };

  const handleDeleteArea = async (area: Area) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el área "${area.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/areas/${area.id}`);
      loadAreas();
    } catch (error: any) {
      if (error.response?.status === 422) {
        alert('No se puede eliminar el área porque tiene usuarios asignados');
      } else {
        alert('Error al eliminar área');
      }
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handlePerPageChange = (perPage: number) => {
    setFilters({ ...filters, per_page: perPage, page: 1 });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-0">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar área..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value.trim() })}
                className="pl-8 h-9 text-sm"
              />
            </div>
            
            <Select
              value={filters.per_page.toString()}
              onValueChange={(value) => handlePerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-9 text-sm">
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

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="py-2 px-3 text-xs font-medium">Área</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Descripción</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium">Creado</TableHead>
                  <TableHead className="py-2 px-3 text-xs font-medium text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-xs text-gray-600">Cargando...</p>
                    </TableCell>
                  </TableRow>
                ) : areas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <p className="text-sm text-gray-500">No se encontraron áreas</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map(area => (
                    <TableRow key={area.id} className="hover:bg-gray-50/50 border-b border-gray-100">
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <span className="text-green-600 text-xs font-semibold">
                              {area.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{area.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <p className="text-xs text-gray-600 truncate max-w-xs">
                          {area.description || 'Sin descripción'}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <span className="text-xs text-gray-500">
                          {area.created_at ? new Date(area.created_at).toLocaleDateString('es-ES') : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditArea(area)}
                            className="h-7 text-xs px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteArea(area)}
                            className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between mt-4 text-xs">
              <div className="text-gray-600">
                Mostrando {areas.length} de {pagination.total} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="h-8 text-xs px-3"
                >
                  Anterior
                </Button>
                <span className="text-gray-600">
                  Página {pagination.current_page} de {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="h-8 text-xs px-3"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateAreaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAreas}
      />
      
      <EditAreaModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadAreas}
        area={selectedArea}
      />
    </div>
  );
}
