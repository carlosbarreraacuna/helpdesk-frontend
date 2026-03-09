'use client';

import { useState, useEffect } from 'react';
import { useWidget } from './WidgetContext';
import { widgetApi } from '@/lib/widget-api';
import { ArrowLeft, ThumbsUp, ThumbsDown, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  isAuthenticated: boolean;
}

interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  published_version?: { content: string } | null;
}

export default function WidgetArticle({ isAuthenticated }: Props) {
  const { setView, openedArticleId, persistContext, searchContext } = useWidget();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!openedArticleId) return;
    setLoading(true);
    widgetApi.getArticle(openedArticleId)
      .then(({ data }) => {
        setArticle({
          id: data.id,
          title: data.title,
          slug: data.slug,
          content: data.published_version?.content ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, [openedArticleId]);

  const handleFeedback = async (helpful: boolean) => {
    if (!openedArticleId) return;
    setFeedback(helpful ? 'helpful' : 'not_helpful');
    await widgetApi.articleFeedback(openedArticleId, helpful);
    setFeedbackSent(true);

    if (helpful) {
      setTimeout(() => setView('home'), 1500);
    }
  };

  const handleNotHelpful = () => {
    if (!isAuthenticated) {
      // Guardar contexto y redirigir al login
      if (searchContext) {
        persistContext(searchContext);
      }
      router.push('/login?redirect=widget');
    } else {
      setView('chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 px-4 py-3 text-white rounded-t-2xl flex items-center gap-2">
        <button onClick={() => setView('search')} className="text-blue-200 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold text-sm line-clamp-1">{article.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">{article.title}</h2>
        <div
          className="prose prose-sm text-gray-700 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>

      {/* Feedback */}
      <div className="border-t border-gray-100 bg-white rounded-b-2xl p-4">
        {!feedbackSent ? (
          <>
            <p className="text-sm text-center text-gray-600 mb-3">¿Esta respuesta fue útil?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${feedback === 'helpful' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'}`}
              >
                <ThumbsUp className="h-4 w-4" /> Sí
              </button>
              <button
                onClick={handleNotHelpful}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${feedback === 'not_helpful' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-300'}`}
              >
                <ThumbsDown className="h-4 w-4" /> No
              </button>
            </div>
          </>
        ) : feedback === 'helpful' ? (
          <div className="text-center py-2">
            <p className="text-green-600 font-medium text-sm">¡Nos alegra haber ayudado! 🎉</p>
          </div>
        ) : (
          <div className="text-center py-2 space-y-2">
            {!isAuthenticated ? (
              <>
                <p className="text-sm text-gray-600">Para contactar soporte debes iniciar sesión.</p>
                <button
                  onClick={() => router.push('/login?redirect=widget')}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => setView('chat')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4" /> Hablar con soporte
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
