'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: Role[];
  areas: Area[];
}

export default function CreateUserModal({ isOpen, onClose, onSuccess, roles, areas }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    cedula: '',
    password: '',
    password_confirmation: '',
    role_id: '',
    area_id: '',
    phone: '',
    whatsapp_phone: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        username: '',
        email: '',
        cedula: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        area_id: '',
        phone: '',
        whatsapp_phone: '',
        is_active: true,
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    try {
      await api.post('/users', formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error al crear usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Crear Nuevo Usuario</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
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
              <label className="block text-sm font-medium mb-1">Username *</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Ej: cbarrera"
                required
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username[0]}</p>}
              <p className="text-xs text-gray-500 mt-1">Este será el nombre de usuario para iniciar sesión</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cédula de Ciudadanía *</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.cedula}
              onChange={(e) => setFormData({...formData, cedula: e.target.value})}
              placeholder="Ej: 123456789"
              required
            />
            {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula[0]}</p>}
            <p className="text-xs text-gray-500 mt-1">Número de cédula para autenticación vía WhatsApp</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña *</label>
              <input
                type="password"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Contraseña *</label>
              <input
                type="password"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rol *</label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.role_id}
                onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                required
              >
                <option value="">Seleccionar rol...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.display_name} (Nivel {role.level})
                  </option>
                ))}
              </select>
              {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Área</label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.area_id}
                onChange={(e) => setFormData({...formData, area_id: e.target.value})}
              >
                <option value="">Sin área asignada</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Ej: 3001234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input
              type="tel"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.whatsapp_phone}
              onChange={(e) => setFormData({...formData, whatsapp_phone: e.target.value})}
              placeholder="Ej: 573001234567"
            />
            <p className="text-xs text-gray-500 mt-1">Número de WhatsApp con código de país</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Usuario activo</label>
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
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
