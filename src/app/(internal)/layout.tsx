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
      <div className="h-screen overflow-hidden bg-gray-50 flex">
        {/* Sidebar fijo — no crece con el contenido */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Contenedor principal para topbar y content */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Topbar con botón de hamburguesa */}
          <Topbar 
            sidebarOpen={sidebarOpen} 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          {/* Main content — único elemento con scroll */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
