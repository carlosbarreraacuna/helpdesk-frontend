'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { kbApi, KbCategory, KbSubcategory, KbTag } from '@/lib/kb-api';
import { ArrowLeft, BookOpen, X, Tag, AlertTriangle, Settings } from 'lucide-react';

export default function NewArticlePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [subcategories, setSubcategories] = useState<KbSubcategory[]>([]);
  const [tags, setTags] = useState<KbTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<KbTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category_id: '',
    subcategory_id: '',
    change_summary: '',
  });

  useEffect(() => {
    Promise.all([
      kbApi.getCategories().then(r => setCategories(r.data)),
      kbApi.getTags().then(r => setTags(r.data)),
    ]).finally(() => setLoadingCats(false));
  }, []);

  const handleCategoryChange = async (value: string) => {
    setForm(p => ({ ...p, category_id: value, subcategory_id: '' }));
    setSubcategories([]);
    if (value) {
      try {
        const { data } = await kbApi.getSubcategories(Number(value));
        setSubcategories(data);
      } catch { /* empty */ }
    }
  };

  const toggleTag = (tag: KbTag) => {
    setSelectedTags(prev =>
      prev.find(t => t.id === tag.id) ? prev.filter(t => t.id !== tag.id) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.category_id) {
      setError('Título, contenido y categoría son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await kbApi.createArticle({
        title: form.title,
        content: form.content,
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : undefined,
        tag_ids: selectedTags.map(t => t.id),
        change_summary: form.change_summary || 'Versión inicial',
      });
      router.push(`/knowledge-base/${data.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Error al crear el artículo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-4 lg:-m-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Nuevo Artículo</h1>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Borrador</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button size="sm" disabled={saving} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {saving ? 'Guardando...' : 'Guardar borrador'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded shrink-0">
          {error}
        </div>
      )}

      {/* Two-column body */}
      <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 gap-0">

        {/* LEFT: metadata panel */}
        <div className="w-72 shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto p-4 space-y-5">

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Título *
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Título del artículo..."
              className="mt-1.5 bg-white"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Categoría *
            </Label>
            {loadingCats ? (
              <div className="mt-1.5 h-9 bg-gray-200 animate-pulse rounded-md" />
            ) : categories.length === 0 ? (
              <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 flex items-center gap-1.5 font-medium mb-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  No hay categorías creadas
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/knowledge-base/manage')}
                  className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" /> Ir a Gestionar KB para crearlas
                </button>
              </div>
            ) : (
              <Select
                value={form.category_id || undefined}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="mt-1.5 bg-white">
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Subcategory */}
          {categories.length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Subcategoría
              </Label>
              <Select
                value={form.subcategory_id || undefined}
                onValueChange={v => setForm(p => ({ ...p, subcategory_id: v }))}
                disabled={!form.category_id || subcategories.length === 0}
              >
                <SelectTrigger className="mt-1.5 bg-white">
                  <SelectValue placeholder={
                    !form.category_id
                      ? 'Elige categoría primero'
                      : subcategories.length === 0
                      ? 'Sin subcategorías'
                      : 'Opcional...'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Tag className="h-3 w-3" /> Etiquetas
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(tag => (
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
              {tags.length === 0 && (
                <span className="text-xs text-gray-400">Sin etiquetas disponibles</span>
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
                {selectedTags.map(tag => (
                  <span key={tag.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {tag.name}
                    <button type="button" onClick={() => toggleTag(tag)}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Change summary */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Resumen del cambio
            </Label>
            <Input
              value={form.change_summary}
              onChange={e => setForm(p => ({ ...p, change_summary: e.target.value }))}
              placeholder="ej: Versión inicial"
              className="mt-1.5 bg-white"
            />
          </div>
        </div>

        {/* RIGHT: content editor */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Contenido *
          </Label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder="Escribe el contenido del artículo aquí..."
            className="flex-1 w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
          />
        </div>
      </form>
    </div>
  );
}
