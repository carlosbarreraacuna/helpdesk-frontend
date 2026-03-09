'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { kbApi, KbArticle, KbArticleVersion } from '@/lib/kb-api';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowLeft, BookOpen, ThumbsUp, ThumbsDown, Eye, Tag,
  Clock, User, History, Plus, CheckCircle, Archive,
  BookMarked, ChevronDown, ChevronUp, EyeOff, Globe, Loader2,
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archivado', color: 'bg-gray-100 text-gray-500' },
};

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const user = useAuthStore(s => s.user);

  const [article, setArticle] = useState<KbArticle | null>(null);
  const [versions, setVersions] = useState<KbArticleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [voteLoading, setVoteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const roleName = user?.role?.name ?? '';
  const canEdit = ['supervisor', 'admin'].includes(roleName);
  const canPublish = roleName === 'admin';
  const canCreate = ['agente', 'supervisor', 'admin'].includes(roleName);

  useEffect(() => {
    loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const { data } = await kbApi.getArticle(id);
      setArticle(data);
    } catch {
      setError('No se pudo cargar el artículo.');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    setVersionLoading(true);
    try {
      const { data } = await kbApi.getVersions(id);
      setVersions(data);
    } catch { /* empty */ } finally {
      setVersionLoading(false);
    }
  };

  const handleShowVersions = () => {
    const next = !showVersions;
    setShowVersions(next);
    if (next && versions.length === 0) loadVersions();
  };

  const handleVote = async (vote: 1 | -1) => {
    if (!article) return;
    setVoteLoading(true);
    try {
      const { data } = await kbApi.vote(id, vote);
      setArticle(prev => prev ? {
        ...prev,
        useful_count: data.useful_count,
        not_useful_count: data.not_useful_count,
        user_vote: data.user_vote,
      } : prev);
    } catch { /* empty */ } finally {
      setVoteLoading(false);
    }
  };

  const handlePublishVersion = async (versionId: number) => {
    if (!article) return;
    setActionLoading(true);
    try {
      const { data } = await kbApi.publishVersion(id, versionId);
      setArticle(data);
      loadVersions();
      showSuccess('Versión publicada correctamente.');
    } catch {
      setError('No se pudo publicar la versión.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: 'draft' | 'published' | 'archived') => {
    if (!article) return;
    setActionLoading(true);
    try {
      const { data } = await kbApi.updateStatus(id, status);
      setArticle(data);
      const msgs: Record<string, string> = {
        published: 'Artículo publicado. Ya es visible en el portal público.',
        draft: 'Artículo quitado de publicación. Ya no es visible en el portal.',
        archived: 'Artículo archivado.',
      };
      showSuccess(msgs[status] ?? 'Estado actualizado.');
    } catch {
      setError('No se pudo cambiar el estado.');
    } finally {
      setActionLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          {[...Array(5)].map((_, i) => (<div key={i} className="h-4 bg-gray-200 rounded" style={{width: `${70 + i * 5}%`}} />))}
        </div>
      </div>
    );
  }

  if (error && !article) {
    return (
      <Card><CardContent className="p-6 text-center text-red-600 text-sm">{error}</CardContent></Card>
    );
  }

  if (!article) return null;

  const publishedVersion = article.published_version;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">{error}</div>
      )}

      {/* Article Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-600" />
                {article.category && (
                  <span className="text-xs text-blue-600">{article.category.name}</span>
                )}
                {article.subcategory && (
                  <>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-xs text-gray-500">{article.subcategory.name}</span>
                  </>
                )}
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{article.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />{article.author?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString('es-ES')
                    : new Date(article.created_at).toLocaleDateString('es-ES')}
                </span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views_count} vistas</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[article.status]?.color}`}>
                {STATUS_LABELS[article.status]?.label}
              </span>
              <span className="text-xs text-gray-400">v{article.current_version}</span>
            </div>
          </div>
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-3">
              {article.tags.map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  <Tag className="h-2.5 w-2.5" />{tag.name}
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          {/* Content */}
          {publishedVersion ? (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {publishedVersion.content}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-8">
              Este artículo no tiene una versión publicada todavía.
              {canPublish && ' Use el historial de versiones para publicar una.'}
            </div>
          )}

          {/* Vote bar */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">¿Te fue útil este artículo?</span>
              <button
                onClick={() => handleVote(1)}
                disabled={voteLoading}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  article.user_vote === 1
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
                }`}
              >
                <ThumbsUp className="h-3 w-3" /> {article.useful_count} Útil
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={voteLoading}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  article.user_vote === -1
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600'
                }`}
              >
                <ThumbsDown className="h-3 w-3" /> {article.not_useful_count} No útil
              </button>
            </div>

            {/* Admin actions */}
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/knowledge-base/${id}/edit`)}>
                  <Plus className="h-3 w-3 mr-1" /> Nueva versión
                </Button>
              )}
              {canPublish && (
                <>
                  {article.status !== 'published' ? (
                    <Button
                      size="sm"
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange('published')}
                    >
                      {actionLoading
                        ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        : <Globe className="h-3 w-3 mr-1" />}
                      Publicar en portal
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => handleStatusChange('draft')}
                    >
                      {actionLoading
                        ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        : <EyeOff className="h-3 w-3 mr-1" />}
                      Quitar del portal
                    </Button>
                  )}
                  {article.status === 'published' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      className="text-gray-500"
                      onClick={() => handleStatusChange('archived')}
                    >
                      <Archive className="h-3 w-3 mr-1" /> Archivar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      {(canEdit || canPublish) && (
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer flex flex-row items-center justify-between"
            onClick={handleShowVersions}
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4 text-gray-500" />
              Historial de versiones
            </CardTitle>
            {showVersions ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </CardHeader>

          {showVersions && (
            <CardContent className="pt-0">
              {versionLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay versiones registradas.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map(v => (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        v.is_published ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          v{v.version_number}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{v.title}</p>
                          <p className="text-xs text-gray-400">
                            {v.editor?.name} · {new Date(v.created_at).toLocaleDateString('es-ES')}
                            {v.change_summary && ` · ${v.change_summary}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.is_published && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Publicada
                          </span>
                        )}
                        {canPublish && !v.is_published && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handlePublishVersion(v.id)}
                            className="h-7 text-xs"
                          >
                            Publicar esta versión
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
