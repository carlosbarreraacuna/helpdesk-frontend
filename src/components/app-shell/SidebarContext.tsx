'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface MenuItem {
  id: number;
  key: string;
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
  metadata?: { badge?: string; color?: string };
}

// Contexto del menú — solo cambia una vez cuando llegan los datos
const MenuContext = createContext<MenuItem[]>([]);

// Contexto del toggle — cambia con resize y clicks
interface ToggleContextType {
  isOpen: boolean;
  toggle: () => void;
}
const ToggleContext = createContext<ToggleContextType>({ isOpen: true, toggle: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const loaded = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsOpen(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    // Verificar auth una sola vez al montar
    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (loaded.current) return;
    loaded.current = true;
    api.get('/menu/user')
      .then(({ data }) => setMenuItems(data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleValue = useMemo(() => ({ isOpen, toggle: () => setIsOpen(o => !o) }), [isOpen]);

  return (
    <MenuContext.Provider value={menuItems}>
      <ToggleContext.Provider value={toggleValue}>
        {children}
      </ToggleContext.Provider>
    </MenuContext.Provider>
  );
}

// useSidebar devuelve isOpen + toggle (para SidebarWrapper / TopbarWrapper)
export const useSidebar = () => useContext(ToggleContext);

// useMenuItems devuelve los items del menú (para Sidebar)
export const useMenuItems = () => useContext(MenuContext);
