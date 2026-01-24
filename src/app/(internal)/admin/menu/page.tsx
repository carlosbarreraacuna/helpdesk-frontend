'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, GripVertical, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import CreateMenuItemModal from '@/components/CreateMenuItemModal';

interface Role {
  id: number;
  name: string;
  display_name?: string;
  level: number;
}

interface MenuItem {
  id: number;
  key: string;
  label: string;
  icon: string;
  route: string;
  parent_id?: number;
  order: number;
  is_active: boolean;
  is_system: boolean;
  metadata?: any;
  children?: MenuItem[];
  is_visible?: boolean;
}

export default function MenuConfigPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
    loadAllMenuItems();
  }, []);

  const loadRoles = async () => {
    const { data } = await api.get('/roles');
    setRoles(data);
  };

  const loadAllMenuItems = async () => {
    const { data } = await api.get('/menu-items');
    setAllMenuItems(data);
  };

  const loadMenuForRole = async (roleId: number) => {
    setLoading(true);
    const { data } = await api.get(`/menu-items/role/${roleId}`);
    setMenuItems(data.menu_items);
    setLoading(false);
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    loadMenuForRole(role.id);
  };

  const toggleVisibility = (menuItemId: number, currentValue: boolean) => {
    const updatedItems = menuItems.map((item: MenuItem) => {
      if (item.id === menuItemId) {
        return { ...item, is_visible: !currentValue };
      }
      // También actualizar children
      if (item.children) {
        item.children = item.children.map((child: MenuItem) =>
          child.id === menuItemId
            ? { ...child, is_visible: !currentValue }
            : child
        );
      }
      return item;
    });
    setMenuItems(updatedItems);
  };

  const saveConfiguration = async () => {
    if (!selectedRole) return;
    
    const itemsToSave: any[] = [];
    
    menuItems.forEach((item: MenuItem) => {
      itemsToSave.push({
        menu_item_id: item.id,
        is_visible: item.is_visible || false
      });
      
      if (item.children) {
        item.children.forEach((child: MenuItem) => {
          itemsToSave.push({
            menu_item_id: child.id,
            is_visible: child.is_visible || false
          });
        });
      }
    });

    await api.post(`/menu-items/role/${selectedRole.id}`, {
      menu_items: itemsToSave
    });

    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="p-8">
      
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center p-2 gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo Item
        </button>

      <div className="grid grid-cols-12 gap-6">
        {/* Columna izquierda: Selección de rol */}
        <div className="col-span-3 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Seleccionar Rol</h2>
          <div className="space-y-2">
            {roles.map((role: any) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left p-3 rounded transition ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-100 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-semibold">{role.display_name || role.name}</p>
                <p className="text-xs text-gray-500">Nivel {role.level}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha: Configuración de menú */}
        <div className="col-span-9 bg-white rounded-lg shadow p-6">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Menú para: {selectedRole.display_name || selectedRole.name}</h2>
                  <p className="text-gray-600">Selecciona qué items serán visibles</p>
                </div>
                <button
                  onClick={saveConfiguration}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  💾 Guardar Cambios
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">Cargando...</div>
              ) : (
                <div className="space-y-4">
                  {menuItems.map((item: MenuItem) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      {/* Item Principal */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="text-gray-400 cursor-move" size={20} />
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="font-semibold">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.route}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleVisibility(item.id, item.is_visible || false)}
                            className={`p-2 rounded ${
                              item.is_visible
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {item.is_visible ? <Eye size={20} /> : <EyeOff size={20} />}
                          </button>
                          
                          {!item.is_system && (
                            <>
                              <button className="p-2 hover:bg-gray-100 rounded">
                                <Edit size={18} className="text-blue-600" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded">
                                <Trash2 size={18} className="text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sub-items */}
                      {item.children && item.children.length > 0 && (
                        <div className="mt-3 ml-8 space-y-2">
                          {item.children.map((child: MenuItem) => (
                            <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">└─</span>
                                <span>{child.label}</span>
                              </div>
                              <button
                                onClick={() => toggleVisibility(child.id, child.is_visible || false)}
                                className={`p-1 rounded ${
                                  child.is_visible
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {child.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Resumen</h3>
                <p className="text-sm text-blue-800">
                  Items visibles: <strong>
                    {menuItems.filter((i: any) => i.is_visible).length + 
                     menuItems.reduce((acc: number, i: any) => acc + (i.children?.filter((c: any) => c.is_visible).length || 0), 0)}
                  </strong> de {allMenuItems.length}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Selecciona un rol para configurar su menú
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Item */}
      <CreateMenuItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadAllMenuItems();
          if (selectedRole) loadMenuForRole(selectedRole.id);
        }}
        allItems={allMenuItems}
      />
    </div>
  );
}
