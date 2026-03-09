'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { kbApi, KbCategory, KbSubcategory, KbTag } from '@/lib/kb-api';
import {
  ArrowLeft, Plus, Trash2, Settings, Tag as TagIcon,
  FolderOpen, ChevronDown, ChevronRight, Pencil, X, Check,
} from 'lucide-react';

export default function KbManagePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [tags, setTags] = useState<KbTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<number, KbSubcategory[]>>({});

  // Forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newSubMap, setNewSubMap] = useState<Record<number, string>>({});
  const [editCat, setEditCat] = useState<{ id: number; name: string } | null>(null);
  const [editSub, setEditSub] = useState<{ id: number; name: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, tagRes] = await Promise.all([
        kbApi.getAllCategories(),
        kbApi.getTags(),
      ]);
      setCategories(catRes.data);
      setTags(tagRes.data);
      // Pre-load subcategories for expanded categories
      const subs: Record<number, KbSubcategory[]> = {};
      for (const cat of catRes.data) {
        if (cat.subcategories) subs[cat.id] = cat.subcategories;
      }
      setSubcategoriesMap(subs);
    } catch {
      setError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleCategory = async (catId: number) => {
    const next = new Set(expandedCategories);
    if (next.has(catId)) {
      next.delete(catId);
    } else {
      next.add(catId);
      if (!subcategoriesMap[catId]) {
        try {
          const { data } = await kbApi.getSubcategories(catId);
          setSubcategoriesMap(prev => ({ ...prev, [catId]: data }));
        } catch { /* empty */ }
      }
    }
    setExpandedCategories(next);
  };

  // Categories
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const { data } = await kbApi.createCategory({
        name: newCatName,
        description: newCatDesc,
        icon: newCatIcon,
      });
      setCategories(prev => [...prev, data]);
      setNewCatName(''); setNewCatDesc(''); setNewCatIcon('');
      showSuccess('Categoría creada.');
    } catch {
      setError('Error al crear categoría.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCat) return;
    setSaving(true);
    try {
      const { data } = await kbApi.updateCategory(editCat.id, { name: editCat.name });
      setCategories(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
      setEditCat(null);
      showSuccess('Categoría actualizada.');
    } catch {
      setError('Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría y todas sus subcategorías?')) return;
    try {
      await kbApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showSuccess('Categoría eliminada.');
    } catch {
      setError('Error al eliminar. Puede tener artículos asociados.');
    }
  };

  // Subcategories
  const handleCreateSubcategory = async (catId: number) => {
    const name = newSubMap[catId]?.trim();
    if (!name) return;
    setSaving(true);
    try {
      const { data } = await kbApi.createSubcategory(catId, { name });
      setSubcategoriesMap(prev => ({ ...prev, [catId]: [...(prev[catId] ?? []), data] }));
      setNewSubMap(prev => ({ ...prev, [catId]: '' }));
      showSuccess('Subcategoría creada.');
    } catch {
      setError('Error al crear subcategoría.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubcategory = async () => {
    if (!editSub) return;
    setSaving(true);
    try {
      const { data } = await kbApi.updateSubcategory(editSub.id, { name: editSub.name });
      setSubcategoriesMap(prev => {
        const updated = { ...prev };
        for (const catId in updated) {
          updated[catId] = updated[catId].map(s => s.id === data.id ? { ...s, ...data } : s);
        }
        return updated;
      });
      setEditSub(null);
      showSuccess('Subcategoría actualizada.');
    } catch {
      setError('Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubcategory = async (catId: number, subId: number) => {
    if (!confirm('¿Eliminar esta subcategoría?')) return;
    try {
      await kbApi.deleteSubcategory(subId);
      setSubcategoriesMap(prev => ({ ...prev, [catId]: (prev[catId] ?? []).filter(s => s.id !== subId) }));
      showSuccess('Subcategoría eliminada.');
    } catch {
      setError('Error al eliminar. Puede tener artículos asociados.');
    }
  };

  // Tags
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setSaving(true);
    try {
      const { data } = await kbApi.createTag(newTagName);
      setTags(prev => [...prev, data]);
      setNewTagName('');
      showSuccess('Etiqueta creada.');
    } catch {
      setError('Error al crear etiqueta. Puede ya existir.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!confirm('¿Eliminar esta etiqueta?')) return;
    try {
      await kbApi.deleteTag(id);
      setTags(prev => prev.filter(t => t.id !== id));
      showSuccess('Etiqueta eliminada.');
    } catch {
      setError('Error al eliminar la etiqueta.');
    }
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Settings className="h-5 w-5 text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-900">Gestionar Base de Conocimiento</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded flex items-center gap-2">
          <Check className="h-4 w-4" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-500" />
            Categorías y Subcategorías
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {/* Create Category */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Nueva categoría</p>
            <div className="grid grid-cols-3 gap-2">
              <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nombre *" className="h-8 text-sm" />
              <Input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Descripción" className="h-8 text-sm" />
              <Input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="Icono (ej: book)" className="h-8 text-sm" />
            </div>
            <Button size="sm" onClick={handleCreateCategory} disabled={saving || !newCatName.trim()} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Crear categoría
            </Button>
          </div>

          {/* Categories list */}
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden">
                {/* Category row */}
                <div className="flex items-center justify-between p-2.5 bg-white hover:bg-gray-50">
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {expandedCategories.has(cat.id) ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                    {editCat?.id === cat.id ? (
                      <Input
                        value={editCat.name}
                        onChange={e => setEditCat({ ...editCat, name: e.target.value })}
                        className="h-6 text-xs w-48"
                        onClick={e => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    {editCat?.id === cat.id ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleUpdateCategory}><Check className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400" onClick={() => setEditCat(null)}><X className="h-3 w-3" /></Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600" onClick={() => setEditCat({ id: cat.id, name: cat.name })}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-600" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-3 w-3" /></Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.has(cat.id) && (
                  <div className="border-t border-gray-100 bg-gray-50 p-2 pl-6 space-y-1.5">
                    {(subcategoriesMap[cat.id] ?? []).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between py-1 px-2 rounded bg-white border border-gray-100">
                        {editSub?.id === sub.id ? (
                          <Input
                            value={editSub.name}
                            onChange={e => setEditSub({ ...editSub, name: e.target.value })}
                            className="h-6 text-xs w-48"
                            autoFocus
                          />
                        ) : (
                          <span className="text-xs text-gray-600">{sub.name}</span>
                        )}
                        <div className="flex items-center gap-1">
                          {editSub?.id === sub.id ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-green-600" onClick={handleUpdateSubcategory}><Check className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400" onClick={() => setEditSub(null)}><X className="h-3 w-3" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600" onClick={() => setEditSub({ id: sub.id, name: sub.name })}><Pencil className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-red-600" onClick={() => handleDeleteSubcategory(cat.id, sub.id)}><Trash2 className="h-3 w-3" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* New subcategory */}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={newSubMap[cat.id] ?? ''}
                        onChange={e => setNewSubMap(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        placeholder="Nueva subcategoría..."
                        className="h-6 text-xs"
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateSubcategory(cat.id); }}
                      />
                      <Button size="sm" className="h-6 text-xs" disabled={saving} onClick={() => handleCreateSubcategory(cat.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">No hay categorías. Crea la primera.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-purple-500" />
            Etiquetas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="Nombre de la etiqueta..."
              className="h-8 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateTag(); }}
            />
            <Button size="sm" onClick={handleCreateTag} disabled={saving || !newTagName.trim()} className="h-8 shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" /> Crear
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {tag.name}
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-gray-400">No hay etiquetas creadas.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
