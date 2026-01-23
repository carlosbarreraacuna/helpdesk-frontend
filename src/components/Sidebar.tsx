'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import * as Icons from 'lucide-react';

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

export default function Sidebar() {
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
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
            active
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          } ${level > 0 ? 'pl-8' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className={active ? 'text-white' : 'text-gray-500'}>
              {getIcon(item.icon)}
            </span>
            <span className="font-medium">{item.label}</span>
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
          <div className="mt-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">HelpDesk</h2>
        <nav>
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
      </div>
    </aside>
  );
}
