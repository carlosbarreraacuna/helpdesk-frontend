'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Topbar } from '@/components/app-shell/topbar';

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileView = width < 1024; // lg breakpoint
      setIsMobile(isMobileView);
      
      // Auto-ocultar sidebar en móvil, mostrar en desktop
      if (isMobileView) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar con estado controlado */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Contenedor principal para topbar y content */}
        <div className="flex-1 flex flex-col">
          {/* Topbar con botón de hamburguesa */}
          <Topbar 
            sidebarOpen={sidebarOpen} 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          {/* Main content */}
          <main className={`
            flex-1 transition-all duration-300 ease-in-out
            p-4 lg:p-6
            overflow-auto
          `}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
