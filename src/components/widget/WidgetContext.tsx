'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SearchContext, WidgetChatSession, KbArticleSuggestion, saveSearchContext, loadSearchContext } from '@/lib/widget-api';

export type WidgetView = 'home' | 'search' | 'article' | 'chat' | 'recent';

interface WidgetContextValue {
  isOpen: boolean;
  view: WidgetView;
  query: string;
  suggestions: KbArticleSuggestion[];
  openedArticleId: number | null;
  session: WidgetChatSession | null;
  searchContext: SearchContext | null;

  openWidget: () => void;
  closeWidget: () => void;
  setView: (v: WidgetView) => void;
  setQuery: (q: string) => void;
  setSuggestions: (s: KbArticleSuggestion[]) => void;
  openArticle: (id: number) => void;
  setSession: (s: WidgetChatSession | null) => void;
  persistContext: (ctx: Partial<SearchContext>) => void;
  clearContext: () => void;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen]         = useState(false);
  const [view, setView]             = useState<WidgetView>('home');
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState<KbArticleSuggestion[]>([]);
  const [openedArticleId, setOpenedArticleId] = useState<number | null>(null);
  const [session, setSession]       = useState<WidgetChatSession | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(() => loadSearchContext());

  const openWidget = useCallback(() => setIsOpen(true), []);
  const closeWidget = useCallback(() => setIsOpen(false), []);

  const openArticle = useCallback((id: number) => {
    setOpenedArticleId(id);
    setView('article');
  }, []);

  const persistContext = useCallback((partial: Partial<SearchContext>) => {
    setSearchContext(prev => {
      const next: SearchContext = {
        query:               partial.query               ?? prev?.query ?? '',
        suggested_articles:  partial.suggested_articles  ?? prev?.suggested_articles ?? [],
        opened_article:      partial.opened_article      ?? prev?.opened_article ?? null,
        timestamp:           new Date().toISOString().split('T')[0],
      };
      saveSearchContext(next);
      return next;
    });
  }, []);

  const clearContext = useCallback(() => {
    setSearchContext(null);
    import('@/lib/widget-api').then(({ clearSearchContext }) => clearSearchContext());
  }, []);

  return (
    <WidgetContext.Provider value={{
      isOpen, view, query, suggestions, openedArticleId, session, searchContext,
      openWidget, closeWidget, setView, setQuery, setSuggestions,
      openArticle, setSession, persistContext, clearContext,
    }}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidget() {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error('useWidget must be used inside WidgetProvider');
  return ctx;
}
