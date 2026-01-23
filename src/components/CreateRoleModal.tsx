'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRoleModal({ isOpen, onClose, onSuccess }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    level: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        level: 1,
      });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/roles', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el rol');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Crear Nuevo Rol</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Técnico</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej: tecnico_especializado"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              pattern="[a-z_]+"
              title="Solo letras minúsculas y guiones bajos"
            />
            <p className="text-xs text-gray-500 mt-1">Sin espacios, solo letras minúsculas y guiones bajos</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre para Mostrar</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej: Técnico Especializado"
              value={formData.display_name}
              onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe las funciones de este rol..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nivel de Jerarquía</label>
            <select
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.level}
              onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
            >
              <option value={1}>Nivel 1 - Operativo</option>
              <option value={2}>Nivel 2 - Supervisión</option>
              <option value={3}>Nivel 3 - Administración</option>
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
              {loading ? 'Creando...' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
