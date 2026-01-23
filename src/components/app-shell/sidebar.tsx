'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import * as Icons from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  id: number;
  key: string;
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
  metadata?: {
    badge?: string;
    color?: string;
  };
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const { data } = await api.get('/menu/user');
      setMenuItems(data);
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  const toggleExpand = (itemId: number) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavigate = (route: string, hasChildren: boolean, itemId: number) => {
    if (hasChildren) {
      toggleExpand(itemId);
    } else if (route !== '#') {
      router.push(route);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any;
    if (typeof IconComponent === 'function') {
      return <IconComponent size={20} />;
    }
    return <Icons.Circle size={20} />;
  };

  const isActive = (route: string) => {
    return pathname === route || (route !== '#' && pathname.startsWith(route + '/'));
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.route || '#');

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() => handleNavigate(item.route, hasChildren, item.id)}
          className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
            active
              ? 'bg-gray-800 border-r-4 border-blue-500 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } ${level > 0 ? 'pl-12' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className={active ? 'text-white' : 'text-gray-400'}>
              {getIcon(item.icon)}
            </span>
            <span>{item.label}</span>
            {item.metadata?.badge && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {item.metadata.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <Icons.ChevronDown
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="bg-gray-800 border-l-2 border-gray-700">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold">HelpDesk</h1>
        
        {/* Info del usuario */}
        <div className="mb-6 p-3 bg-gray-800 rounded-lg">
          <p className="font-semibold text-sm">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role?.display_name || user?.role?.name}</p>
        </div>
      </div>
      
      <nav className="mt-8">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Botón logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-900 hover:text-red-300 rounded-lg transition-colors"
        >
          <Icons.LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
