'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, BookOpen, Eye, ThumbsUp, Tag, ChevronRight, X } from 'lucide-react';

interface KbCategory {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface KbArticle {
  id: number;
  title: string;
  category?: { id: number; name: string };
  tags?: { id: number; name: string }[];
  views_count: number;
  useful_count: number;
  published_at?: string;
  published_version?: { content: string };
}

interface KbPaginated {
  data: KbArticle[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function PublicKnowledgeBasePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  useEffect(() => {
    loadCategories();
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadArticles(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/portal/kb/categories');
      setCategories(data);
    } catch { /* empty */ }
  };

  const loadArticles = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 12 };
      if (search) params.q = search;
      if (selectedCategory) params.category_id = selectedCategory;
      const { data } = await api.get<KbPaginated>('/portal/kb/articles', { params });
      setArticles(data.data);
      setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  const getExcerpt = (article: KbArticle) => {
    const content = article.published_version?.content ?? '';
    return content.length > 140 ? content.substring(0, 140) + '...' : content;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-2">
          <BookOpen className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Base de Conocimiento</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Encuentra respuestas rápidas a los problemas más comunes antes de crear un ticket.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="¿Qué problema tienes? Ej: no puedo imprimir, wifi lento..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory('')}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              !selectedCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === String(cat.id) ? '' : String(cat.id))}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                selectedCategory === String(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-gray-400 text-center">
          {pagination.total} artículo{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
          {search && <span> para "<strong>{search}</strong>"</span>}
        </p>
      )}

      {/* Articles grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se encontraron artículos{search ? ` para "${search}"` : ''}.</p>
          <a href="/portal/create-ticket" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3">
            Crear un ticket de soporte <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(article => (
            <a
              key={article.id}
              href={`/portal/knowledge-base/${article.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              {article.category && (
                <p className="text-xs text-blue-600 font-medium mb-1">{article.category.name}</p>
              )}
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 mb-2 line-clamp-2">
                {article.title}
              </h3>
              {getExcerpt(article) && (
                <p className="text-xs text-gray-500 line-clamp-3 mb-3">{getExcerpt(article)}</p>
              )}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag.id} className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      <Tag className="h-2.5 w-2.5" />{tag.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views_count}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.useful_count} útil</span>
                <span className="ml-auto flex items-center gap-1 text-blue-500 group-hover:text-blue-700">
                  Leer <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => loadArticles(p)}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                p === pagination.current_page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-600 mb-3">¿No encontraste solución a tu problema?</p>
        <a
          href="/portal/create-ticket"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear ticket de soporte
        </a>
      </div>
    </div>
  );
}
