'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Topbar } from './topbar';
import HelpdeskWidget from '@/components/widget/HelpdeskWidget';
import TicketNotifications from '@/components/TicketNotifications';
import api from '@/lib/api';

interface MenuItem {
  id: number;
  key: string;
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
  metadata?: { badge?: string; color?: string };
}

// ─── NavMenu: se re-renderiza solo cuando pathname cambia ────────────────────
const NavMenu = memo(function NavMenu({ items }: { items: MenuItem[] }) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) return;
    const toExpand: number[] = [];
    items.forEach((item) => {
      if (item.children?.length) {
        const childActive = item.children.some(
          (child) => child.route !== '#' && pathname.startsWith(child.route)
        );
        if (childActive) toExpand.push(item.id);
      }
    });
    if (toExpand.length > 0) {
      setExpandedItems((prev) => Array.from(new Set([...prev, ...toExpand])));
    }
  }, [items, pathname]);

  const toggleExpand = (id: number) =>
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const isActive = (route: string, children?: MenuItem[]) => {
    if (route !== '#' && (pathname === route || pathname.startsWith(route + '/'))) return true;
    return children?.some((c) => c.route !== '#' && pathname.startsWith(c.route)) ?? false;
  };

  const getIcon = (name: string) => {
    const IC = Icons[name as keyof typeof Icons] as React.ComponentType<{ size: number }>;
    return typeof IC === 'function' ? <IC size={20} /> : <Icons.Circle size={20} />;
  };

  const renderItem = (item: MenuItem, level = 0): React.ReactNode => {
    const hasChildren = Boolean(item.children?.length);
    const expanded = expandedItems.includes(item.id);
    const active = isActive(item.route || '#', item.children);
    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() =>
            hasChildren ? toggleExpand(item.id) : item.route !== '#' && router.push(item.route)
          }
          className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
            active
              ? 'bg-gray-800 border-r-4 border-blue-500 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } ${level > 0 ? 'pl-12' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className={active ? 'text-white' : 'text-gray-400'}>{getIcon(item.icon)}</span>
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
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        {hasChildren && expanded && (
          <div className="bg-gray-800 border-l-2 border-gray-700">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return <nav className="mt-8">{items.map((item) => renderItem(item))}</nav>;
});

// Variables a nivel de módulo — sobreviven re-mounts del componente
let _menuLoaded = false;
let _cachedMenuItems: MenuItem[] = [];

// ─── AppShell: Client Component que recibe children del Server ───────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(_cachedMenuItems);

  // Auth check — solo si no hay token
  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    if (!storedToken) {
      router.push('/login');
    }
  }, [router]);

  // Sidebar responsive
  useEffect(() => {
    const check = () => setSidebarOpen(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch menú — una sola vez en toda la vida del módulo
  useEffect(() => {
    if (_menuLoaded) {
      setMenuItems(_cachedMenuItems);
      return;
    }
    const storedToken = localStorage.getItem('auth-token');
    if (!storedToken) return;
    _menuLoaded = true;
    api.get('/menu/user')
      .then(({ data }) => {
        _cachedMenuItems = data;
        setMenuItems(data);
      })
      .catch(() => { _menuLoaded = false; });
  }, []);

  const toggle = () => setSidebarOpen((o) => !o);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'block' : 'hidden lg:block'}
          w-64 bg-gray-900 text-white h-screen flex-shrink-0
          lg:relative fixed inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transform transition-transform duration-300 ease-in-out
        `}
      >
        <div className="p-4 lg:p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl lg:text-2xl font-bold">HelpDesk</h1>
            <button
              onClick={toggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Icons.X size={20} />
            </button>
          </div>
          <div className="mb-6 p-3 bg-gray-800 rounded-lg">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role?.name}</p>
          </div>
          <NavMenu items={menuItems} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={toggle} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Widgets */}
      {user && token && (
        <>
          <HelpdeskWidget user={{ id: user.id, name: user.name, token }} />
          <TicketNotifications token={token} userRole={user.role?.name ?? ''} />
        </>
      )}
    </div>
  );
}
