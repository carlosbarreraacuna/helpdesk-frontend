'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Module {
  id: number;
  name: string;
  display_name: string;
}

interface CreatePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePermissionModal({ isOpen, onClose, onSuccess }: CreatePermissionModalProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [formData, setFormData] = useState({
    module_id: '',
    name: '',
    display_name: '',
    description: '',
    action_type: 'read',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadModules();
      setFormData({
        module_id: '',
        name: '',
        display_name: '',
        description: '',
        action_type: 'read',
      });
      setError('');
    }
  }, [isOpen]);

  const loadModules = async () => {
    try {
      const { data } = await api.get('/modules');
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/permissions', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el permiso');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Crear Nuevo Permiso</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Módulo</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.module_id}
              onChange={(e) => setFormData({...formData, module_id: e.target.value})}
              required
            >
              <option value="">Seleccionar módulo...</option>
              {modules.map(mod => (
                <option key={mod.id} value={mod.id}>{mod.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre Técnico</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej: tickets.export_data"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              pattern="[a-z_]+\.[a-z_]+"
              title="Formato: modulo.accion (ej: tickets.create)"
            />
            <p className="text-xs text-gray-500 mt-1">Formato: modulo.accion</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre para Mostrar</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej: Exportar Datos de Tickets"
              value={formData.display_name}
              onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Describe qué permite este permiso..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Acción</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.action_type}
              onChange={(e) => setFormData({...formData, action_type: e.target.value})}
            >
              <option value="create">➕ Crear (Create)</option>
              <option value="read">👁️ Leer (Read)</option>
              <option value="update">✏️ Actualizar (Update)</option>
              <option value="delete">🗑️ Eliminar (Delete)</option>
              <option value="special">⚡ Especial (Special)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Permiso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
