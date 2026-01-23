'use client';
import { useState } from 'react';
import api from '@/lib/api';
import * as Icons from 'lucide-react';

const availableIcons = [
  'Home', 'LayoutDashboard', 'Ticket', 'Users', 'Settings', 
  'BarChart3', 'Shield', 'Building2', 'Menu', 'FileText',
  'Clock', 'Bell', 'Search', 'Filter', 'Download', 'Upload',
  'Mail', 'Phone', 'Calendar', 'Folder', 'Tag'
];

interface CreateMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allItems: any[];
}

export default function CreateMenuItemModal({ isOpen, onClose, onSuccess, allItems }: CreateMenuItemModalProps) {
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    icon: 'Circle',
    route: '',
    parent_id: '',
    order: 0,
    metadata: {},
  });
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/menu-items', formData);
      onSuccess();
      onClose();
      setFormData({
        key: '',
        label: '',
        icon: 'Circle',
        route: '',
        parent_id: '',
        order: 0,
        metadata: {},
      });
    } catch (error) {
      alert('Error al crear item');
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any;
    if (typeof IconComponent === 'function') {
      return <IconComponent size={24} />;
    }
    return <Icons.Circle size={24} />;
  };

  if (!isOpen) return null;

  const topLevelItems = allItems.filter((item: any) => !item.parent_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Crear Item de Menú</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key (Identificador) *</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="ej: my_module"
                value={formData.key}
                onChange={(e) => setFormData({...formData, key: e.target.value})}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Único, sin espacios</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Label (Texto) *</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="ej: Mi Módulo"
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Icono</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full p-3 border rounded flex items-center gap-2 hover:bg-gray-50"
                >
                  {getIcon(formData.icon)}
                  <span>{formData.icon}</span>
                </button>
                
                {showIconPicker && (
                  <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg p-3 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2">
                      {availableIcons.map(iconName => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, icon: iconName});
                            setShowIconPicker(false);
                          }}
                          className="p-2 hover:bg-blue-50 rounded flex items-center justify-center"
                          title={iconName}
                        >
                          {getIcon(iconName)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ruta *</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="/my-module"
                value={formData.route}
                onChange={(e) => setFormData({...formData, route: e.target.value})}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Usar # para items con sub-menú</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Padre (Opcional)</label>
              <select
                className="w-full p-2 border rounded"
                value={formData.parent_id}
                onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
              >
                <option value="">Ninguno (Nivel superior)</option>
                {topLevelItems.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Orden</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                min={0}
              />
            </div>
          </div>

          {/* Metadata opcional */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Opciones Avanzadas (Opcional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Badge</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="new, beta, etc"
                  onChange={(e) => setFormData({
                    ...formData, 
                    metadata: {...formData.metadata, badge: e.target.value}
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => setFormData({
                    ...formData, 
                    metadata: {...formData.metadata, color: e.target.value}
                  })}
                >
                  <option value="">Default</option>
                  <option value="blue">Azul</option>
                  <option value="green">Verde</option>
                  <option value="red">Rojo</option>
                  <option value="yellow">Amarillo</option>
                  <option value="purple">Morado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
