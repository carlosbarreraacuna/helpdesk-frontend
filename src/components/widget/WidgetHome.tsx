'use client';

import { useWidget } from './WidgetContext';
import { MessageCircle, Search, Clock } from 'lucide-react';

interface Props {
  userName?: string;
  isAuthenticated: boolean;
}

export default function WidgetHome({ userName, isAuthenticated }: Props) {
  const { setView } = useWidget();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-linear-to-br from-blue-600 to-blue-700 px-5 py-6 text-white rounded-t-2xl">
        <p className="text-2xl font-bold">
          {isAuthenticated && userName ? `Hola, ${userName.split(' ')[0]} 👋` : 'Hola 👋'}
        </p>
        <p className="text-blue-100 mt-1 text-sm">¿En qué podemos ayudarte?</p>
      </div>

      {/* Actions */}
      <div className="flex-1 p-4 space-y-3 bg-white">
        <button
          onClick={() => setView('search')}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Search className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Buscar solución</p>
            <p className="text-xs text-gray-500">Encuentra respuestas en la base de conocimiento</p>
          </div>
        </button>

        <button
          onClick={() => isAuthenticated ? setView('chat') : setView('search')}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Contactar soporte</p>
            <p className="text-xs text-gray-500">Chatea con un agente en tiempo real</p>
          </div>
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setView('recent')}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Mis solicitudes</p>
              <p className="text-xs text-gray-500">Ver el estado de tus tickets recientes</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
