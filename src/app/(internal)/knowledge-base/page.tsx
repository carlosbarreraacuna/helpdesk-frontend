'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { kbApi, KbArticle, KbCategory, KbTag } from '@/lib/kb-api';
import { useAuthStore } from '@/lib/auth-store';
import {
  Search,
  Plus,
  BookOpen,
  Eye,
  ThumbsUp,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archivado', color: 'bg-gray-100 text-gray-500' },
};

export default function KnowledgeBasePage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [tags, setTags] = useState<KbTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, per_page: 15, total: 0,
  });
  const [filters, setFilters] = useState({
    q: '', category_id: '', subcategory_id: '', tag_ids: '', status: '', page: 1, per_page: 15,
  });
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const roleName = user?.role?.name ?? '';
  const canCreate = ['agente', 'supervisor', 'admin'].includes(roleName);
  const canManage = roleName === 'admin';

  const loadArticles = useCallback(async (isInitial = false) => {
    isInitial ? setLoading(true) : setTableLoading(true);
    try {
      const params: Record<string, unknown> = { page: filters.page, per_page: filters.per_page };
      if (filters.q) params.q = filters.q;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.subcategory_id) params.subcategory_id = filters.subcategory_id;
      if (filters.tag_ids) params.tag_ids = filters.tag_ids;
      if (filters.status) params.status = filters.status;

      const { data } = await kbApi.getArticles(params);
      setArticles(data.data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
    } finally {
      isInitial ? setLoading(false) : setTableLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    kbApi.getCategories().then(r => setCategories(r.data)).catch(() => {});
    kbApi.getTags().then(r => setTags(r.data)).catch(() => {});
    loadArticles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) loadArticles(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setFilter = (key: string, value: string | number) =>
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

  const handleTogglePublish = async (e: React.MouseEvent, article: KbArticle) => {
    e.stopPropagation();
    setPublishingId(article.id);
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await kbApi.updateStatus(article.id, newStatus);
      await loadArticles(false);
    } catch { /* empty */ } finally {
      setPublishingId(null);
    }
  };

  const getPageNumbers = () => {
    const { current_page, last_page } = pagination;
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, current_page - delta); i <= Math.min(last_page - 1, current_page + delta); i++) range.push(i);
    const result: (number | string)[] = [1];
    if (current_page - delta > 2) result.push('...');
    result.push(...range);
    if (current_page + delta < last_page - 1) result.push('...');
    if (last_page > 1) result.push(last_page);
    return result;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Base de Conocimiento</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {pagination.total} artículos
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => router.push('/knowledge-base/manage')}>
              <Settings className="h-4 w-4 mr-1" />
              Gestionar
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => router.push('/knowledge-base/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Artículo
            </Button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      {canCreate && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[['', 'Todos'], ['draft', 'Borradores'], ['published', 'Publicados'], ['archived', 'Archivados']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter('status', val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filters.status === val
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar artículos..."
              value={filters.q}
              onChange={e => setFilter('q', e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={filters.category_id || 'all'} onValueChange={v => setFilter('category_id', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.tag_ids || 'all'} onValueChange={v => setFilter('tag_ids', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Etiqueta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etiquetas</SelectItem>
              {tags.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setFilters({ q: '', category_id: '', subcategory_id: '', tag_ids: '', status: '', page: 1, per_page: 15 })}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Articles Grid */}
      {tableLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No se encontraron artículos</p>
            {canCreate && (
              <Button size="sm" className="mt-4" onClick={() => router.push('/knowledge-base/new')}>
                <Plus className="h-4 w-4 mr-1" /> Crear primer artículo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(article => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
              onClick={() => router.push(`/knowledge-base/${article.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">{article.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_LABELS[article.status]?.color}`}>
                    {STATUS_LABELS[article.status]?.label}
                  </span>
                </div>
                {article.category && (
                  <p className="text-xs text-blue-600 mb-2">{article.category.name}</p>
                )}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag.id} className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        <Tag className="h-2.5 w-2.5" />{tag.name}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{article.tags.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-gray-50">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views_count}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.useful_count}</span>
                  <span className="ml-auto text-gray-400">{article.author?.name}</span>
                  {(article.status === 'draft' || article.status === 'published') && canCreate && (
                    <button
                      onClick={e => handleTogglePublish(e, article)}
                      disabled={publishingId === article.id}
                      className={`flex items-center gap-1 text-xs font-medium disabled:opacity-50 ${
                        article.status === 'published'
                          ? 'text-orange-500 hover:text-orange-700'
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {publishingId === article.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <CheckCircle className="h-3 w-3" />}
                      {article.status === 'published' ? 'Quitar publicación' : 'Publicar'}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
          <span>
            Mostrando {(pagination.current_page - 1) * pagination.per_page + 1}–
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={pagination.current_page === 1} onClick={() => setFilters(p => ({ ...p, page: 1 }))}><ChevronsLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={pagination.current_page === 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft className="h-3 w-3" /></Button>
            {getPageNumbers().map((n, i) => n === '...' ? <span key={i} className="px-1">...</span> : (
              <Button key={i} variant={pagination.current_page === n ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setFilters(p => ({ ...p, page: n as number }))}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={pagination.current_page === pagination.last_page} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}><ChevronRight className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={pagination.current_page === pagination.last_page} onClick={() => setFilters(p => ({ ...p, page: pagination.last_page }))}><ChevronsRight className="h-3 w-3" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
