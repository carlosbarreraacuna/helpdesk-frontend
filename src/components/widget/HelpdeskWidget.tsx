'use client';

import { useEffect, useRef } from 'react';
import { useWidget, WidgetProvider } from './WidgetContext';
import WidgetHome from './WidgetHome';
import WidgetSearch from './WidgetSearch';
import WidgetArticle from './WidgetArticle';
import WidgetChat from './WidgetChat';
import WidgetRecentTickets from './WidgetRecentTickets';
import { MessageCircle, X } from 'lucide-react';
import { loadSearchContext } from '@/lib/widget-api';

interface WidgetUser {
  id: number;
  name: string;
  token: string;
}

interface Props {
  user?: WidgetUser | null;
}

function WidgetInner({ user }: Props) {
  const { isOpen, openWidget, closeWidget, view, setView, persistContext, searchContext } = useWidget();
  const panelRef = useRef<HTMLDivElement>(null);

  // Restaurar contexto y abrir chat automáticamente si el usuario acaba de autenticarse
  useEffect(() => {
    if (!user) return;
    const saved = loadSearchContext();
    if (saved) {
      persistContext(saved);
      openWidget();
      setView('chat');
    }
  }, [user?.id]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeWidget();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closeWidget]);

  const isAuthenticated = !!user;

  return (
    <>
      {/* Panel flotante */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-5 z-50 w-[360px] h-[560px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden bg-white"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Close button siempre visible */}
          <button
            onClick={closeWidget}
            className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors"
            aria-label="Cerrar widget"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Vistas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'home'    && <WidgetHome userName={user?.name} isAuthenticated={isAuthenticated} />}
            {view === 'search'  && <WidgetSearch />}
            {view === 'article' && <WidgetArticle isAuthenticated={isAuthenticated} />}
            {view === 'recent'  && isAuthenticated && <WidgetRecentTickets />}
            {view === 'chat'    && isAuthenticated && (
              <WidgetChat token={user!.token} userId={user!.id} userName={user!.name} />
            )}
            {view === 'chat' && !isAuthenticated && (
              <WidgetSearch />
            )}
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => isOpen ? closeWidget() : openWidget()}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200"
        aria-label="Soporte"
      >
        {isOpen
          ? <X className="h-5 w-5" />
          : <><MessageCircle className="h-5 w-5" /><span className="text-sm font-semibold">Soporte</span></>
        }
      </button>
    </>
  );
}

export default function HelpdeskWidget({ user }: Props) {
  return (
    <WidgetProvider>
      <WidgetInner user={user} />
    </WidgetProvider>
  );
}
