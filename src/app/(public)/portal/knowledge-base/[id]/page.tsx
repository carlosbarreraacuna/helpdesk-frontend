'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowLeft, BookOpen, Eye, ThumbsUp, ThumbsDown,
  Tag, Clock, ChevronRight,
} from 'lucide-react';

interface KbArticle {
  id: number;
  title: string;
  category?: { id: number; name: string };
  subcategory?: { id: number; name: string };
  tags?: { id: number; name: string }[];
  views_count: number;
  useful_count: number;
  not_useful_count: number;
  published_at?: string;
  published_version?: { content: string; editor?: { name: string } };
  author?: { name: string };
}

export default function PublicArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<1 | -1 | null>(null);
  const [voteCounts, setVoteCounts] = useState({ useful: 0, notUseful: 0 });
  const [voteMsg, setVoteMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/portal/kb/articles/${id}`);
        setArticle(data);
        setVoteCounts({ useful: data.useful_count, notUseful: data.not_useful_count });
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Public vote using localStorage to prevent double vote
  const handleVote = (vote: 1 | -1) => {
    const key = `kb_vote_${id}`;
    if (localStorage.getItem(key)) {
      setVoteMsg('Ya registraste tu opinión sobre este artículo.');
      return;
    }
    localStorage.setItem(key, String(vote));
    setVoted(vote);
    setVoteCounts(prev => ({
      useful: vote === 1 ? prev.useful + 1 : prev.useful,
      notUseful: vote === -1 ? prev.notUseful + 1 : prev.notUseful,
    }));
    setVoteMsg(vote === 1 ? '¡Gracias por tu opinión!' : 'Gracias por tu comentario. Mejoraremos este artículo.');
  };

  useEffect(() => {
    const key = `kb_vote_${id}`;
    const stored = localStorage.getItem(key);
    if (stored) setVoted(Number(stored) as 1 | -1);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20 text-gray-400">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Artículo no encontrado.</p>
        <a href="/portal/knowledge-base" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          Ver todos los artículos
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <a href="/portal/knowledge-base" className="hover:text-blue-600 flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> Base de Conocimiento
        </a>
        {article.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-blue-600">{article.category.name}</span>
          </>
        )}
        {article.subcategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>{article.subcategory.name}</span>
          </>
        )}
      </nav>

      {/* Article */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(article.published_at).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{article.views_count} vistas</span>
          </div>
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {article.tags.map(tag => (
                <span key={tag.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  <Tag className="h-2.5 w-2.5" />{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {article.published_version?.content ? (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {article.published_version.content}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">
              Este artículo no tiene contenido disponible.
            </p>
          )}
        </div>

        {/* Vote section */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">¿Te fue útil este artículo?</p>
          {voteMsg ? (
            <p className="text-sm text-green-600">{voteMsg}</p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(1)}
                disabled={voted !== null}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  voted === 1
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600 disabled:opacity-50'
                }`}
              >
                <ThumbsUp className="h-4 w-4" /> Sí, me ayudó ({voteCounts.useful})
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={voted !== null}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  voted === -1
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600 disabled:opacity-50'
                }`}
              >
                <ThumbsDown className="h-4 w-4" /> No resolvió mi problema ({voteCounts.notUseful})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTA if not useful */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">¿Necesitas más ayuda?</p>
          <p className="text-xs text-gray-500 mt-0.5">Crea un ticket y un agente te asistirá personalmente.</p>
        </div>
        <a
          href="/portal/create-ticket"
          className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear ticket
        </a>
      </div>

      {/* Back */}
      <a href="/portal/knowledge-base" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Ver todos los artículos
      </a>
    </div>
  );
}
