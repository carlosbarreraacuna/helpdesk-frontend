'use client';

import { useState, useEffect, useRef } from 'react';
import { useWidget } from './WidgetContext';
import { widgetApi, KbArticleSuggestion } from '@/lib/widget-api';
import { Search, FileText, ArrowLeft, Loader2 } from 'lucide-react';

export default function WidgetSearch() {
  const { setView, query, setQuery, setSuggestions, suggestions, openArticle, persistContext } = useWidget();
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await widgetApi.searchKb(query);
        setSuggestions(data);
        persistContext({ query, suggested_articles: data.map((a: KbArticleSuggestion) => a.id) });
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleOpenArticle = (id: number) => {
    persistContext({ opened_article: id });
    openArticle(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 px-4 py-4 text-white rounded-t-2xl">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setView('home')} className="text-blue-200 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="font-semibold">Buscar en base de conocimiento</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Describe tu problema..."
            className="w-full bg-white/20 text-white placeholder-blue-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200 animate-spin" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-3">
        {query.length < 3 ? (
          <p className="text-xs text-gray-400 text-center mt-6">Escribe al menos 3 caracteres para buscar...</p>
        ) : suggestions.length === 0 && !loading ? (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">No se encontraron artículos.</p>
            <button
              onClick={() => setView('chat')}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Contactar soporte →
            </button>
          </div>
        ) : (
          <>
            {suggestions.length > 0 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                Artículos que pueden ayudarte
              </p>
            )}
            <div className="space-y-1">
              {suggestions.map(article => (
                <button
                  key={article.id}
                  onClick={() => handleOpenArticle(article.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-800">{article.title}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 mb-1">¿No encontraste lo que buscabas?</p>
              <button
                onClick={() => setView('chat')}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Hablar con un agente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
