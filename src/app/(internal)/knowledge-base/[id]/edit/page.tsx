'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { kbApi, KbArticle, KbTag } from '@/lib/kb-api';
import { ArrowLeft, BookOpen, X } from 'lucide-react';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [article, setArticle] = useState<KbArticle | null>(null);
  const [allTags, setAllTags] = useState<KbTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<KbTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    change_summary: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [articleRes, tagsRes] = await Promise.all([
          kbApi.getArticle(id),
          kbApi.getTags(),
        ]);
        const a = articleRes.data;
        setArticle(a);
        setAllTags(tagsRes.data);
        setForm({
          title: a.title,
          content: a.published_version?.content ?? '',
          change_summary: '',
        });
        if (a.tags) setSelectedTags(a.tags);
      } catch {
        setError('No se pudo cargar el artículo.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleTag = (tag: KbTag) => {
    setSelectedTags(prev =>
      prev.find(t => t.id === tag.id) ? prev.filter(t => t.id !== tag.id) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) {
      setError('El contenido no puede estar vacío.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await kbApi.createVersion(id, {
        title: form.title,
        content: form.content,
        change_summary: form.change_summary,
        tag_ids: selectedTags.map(t => t.id),
      });
      router.push(`/knowledge-base/${id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Error al guardar la versión.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          {[...Array(4)].map((_, i) => (<div key={i} className="h-4 bg-gray-200 rounded" style={{width: `${75 + i * 5}%`}} />))}
        </div>
      </div>
    );
  }

  if (!article) {
    return <p className="text-sm text-red-600 p-4">{error || 'Artículo no encontrado.'}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Nueva versión</h1>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          v{article.current_version} → v{article.current_version + 1}
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2 rounded">
        Se creará una nueva versión del artículo. La versión actual <strong>no será modificada</strong>.
        Un administrador deberá publicar la nueva versión para que sea visible.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Título</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Título del artículo..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    selectedTags.find(t => t.id === tag.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map(tag => (
                  <span key={tag.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {tag.name}
                    <button type="button" onClick={() => toggleTag(tag)}><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Contenido *</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Escribe el contenido actualizado..."
              rows={18}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Label className="text-xs font-medium text-gray-600">Resumen del cambio</Label>
            <Input
              value={form.change_summary}
              onChange={e => setForm(p => ({ ...p, change_summary: e.target.value }))}
              placeholder="ej: Corrección de pasos, actualización de capturas..."
              className="mt-1"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar nueva versión'}
          </Button>
        </div>
      </form>
    </div>
  );
}
