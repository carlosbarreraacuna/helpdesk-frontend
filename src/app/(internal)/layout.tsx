'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Topbar } from '@/components/app-shell/topbar';

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Topbar />
        
        <main className="ml-64 mt-16 p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
