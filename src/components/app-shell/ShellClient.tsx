'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import HelpdeskWidget from '@/components/widget/HelpdeskWidget';
import TicketNotifications from '@/components/TicketNotifications';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

export default function ShellClient({ children }: { children: React.ReactNode }) {
  const { user, token, loading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const checkMobile = () => setSidebarOpen(window.innerWidth >= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push('/login');
      return;
    }
    // Verificar token en background sin bloquear la UI
    checkAuth().catch(() => router.push('/login'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Bloquear UI solo mientras hidrata (un frame) o si no hay usuario en absoluto
  if (!hydrated || !token || !user) {
    if (hydrated && !token) return null; // ya redirigiendo
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <HelpdeskWidget user={{ id: user.id, name: user.name, token }} />
      {token && (
        <TicketNotifications token={token} userRole={user.role?.name ?? ''} />
      )}
    </div>
  );
}
