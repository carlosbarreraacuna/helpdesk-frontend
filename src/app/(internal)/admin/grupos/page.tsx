'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus, Trash2, Pencil, X, Check, Users, Tag, ChevronDown, ChevronRight,
  Settings2, GripVertical, UserMinus, UserPlus, FolderOpen,
} from 'lucide-react';

interface Agent { id: number; name: string; email: string }
interface Category { id: number; name: string }
interface WorkGroup {
  id: number;
  name: string;
  description: string | null;
  priority_order: number;
  is_active: boolean;
  is_default: boolean;
  agents: Agent[];
  categories: Category[];
}

export default function GruposPage() {
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // New group form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOrder, setNewOrder] = useState('');

  // Edit group
  const [editGroup, setEditGroup] = useState<{ id: number; name: string; description: string } | null>(null);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [groupsRes, agentsRes, catsRes] = await Promise.all([
        api.get<WorkGroup[]>('/work-groups'),
        api.get<Agent[]>('/work-groups/available-agents'),
        api.get<Category[]>('/ticket-categories/all'),
      ]);
      setGroups(groupsRes.data);
      setAllAgents(agentsRes.data);
      setAllCategories(catsRes.data);
    } catch {
      setError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Groups CRUD ────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.post('/work-groups', {
        name: newName.trim(),
        description: newDesc.trim() || null,
        priority_order: newOrder ? parseInt(newOrder) : groups.length,
      });
      setNewName(''); setNewDesc(''); setNewOrder('');
      await loadAll();
      flash('Grupo creado.');
    } catch { setError('Error al crear grupo.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editGroup) return;
    setSaving(true);
    try {
      await api.patch(`/work-groups/${editGroup.id}`, {
        name: editGroup.name,
        description: editGroup.description || null,
      });
      setEditGroup(null);
      await loadAll();
      flash('Grupo actualizado.');
    } catch { setError('Error al actualizar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este grupo de trabajo?')) return;
    try {
      await api.delete(`/work-groups/${id}`);
      await loadAll();
      flash('Grupo eliminado.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Error al eliminar.');
    }
  };

  const handleToggleActive = async (group: WorkGroup) => {
    try {
      await api.patch(`/work-groups/${group.id}`, { is_active: !group.is_active });
      await loadAll();
    } catch { setError('Error al cambiar estado.'); }
  };

  // ── Agents ─────────────────────────────────────────────────────

  const handleAddAgent = async (groupId: number, agentId: number) => {
    try {
      await api.post(`/work-groups/${groupId}/agents`, { agent_id: agentId });
      await loadAll();
      flash('Agente agregado.');
    } catch { setError('Error al agregar agente.'); }
  };

  const handleRemoveAgent = async (groupId: number, agentId: number) => {
    try {
      await api.delete(`/work-groups/${groupId}/agents/${agentId}`);
      await loadAll();
      flash('Agente removido.');
    } catch { setError('Error al remover agente.'); }
  };

  // ── Categories ─────────────────────────────────────────────────

  const handleAddCategory = async (groupId: number, catId: number) => {
    try {
      await api.post(`/work-groups/${groupId}/categories`, { category_id: catId });
      await loadAll();
      flash('Categoría asignada.');
    } catch { setError('Error al asignar categoría.'); }
  };

  const handleRemoveCategory = async (groupId: number, catId: number) => {
    try {
      await api.delete(`/work-groups/${groupId}/categories/${catId}`);
      await loadAll();
      flash('Categoría removida.');
    } catch { setError('Error al remover categoría.'); }
  };

  // ── New ticket category ─────────────────────────────────────────

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await api.post('/ticket-categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim() || null,
      });
      setNewCatName(''); setNewCatDesc('');
      await loadAll();
      flash('Categoría de ticket creada.');
    } catch { setError('Error al crear categoría. Puede ya existir.'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings2 className="h-5 w-5 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Grupos de Trabajo</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{groups.length} grupos</span>
      </div>

      {/* Alerts */}
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

      {/* ── Create group ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-500" /> Nuevo grupo de trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre *" className="h-8 text-sm" />
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción" className="h-8 text-sm" />
            <Input value={newOrder} onChange={e => setNewOrder(e.target.value)} type="number" placeholder="Prioridad (0 = mayor)" className="h-8 text-sm" />
          </div>
          <Button size="sm" className="mt-3 h-7 text-xs" onClick={handleCreate} disabled={saving || !newName.trim()}>
            <Plus className="h-3 w-3 mr-1" /> Crear grupo
          </Button>
        </CardContent>
      </Card>

      {/* ── Groups list ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {groups.map(group => {
          const isExpanded = expanded.has(group.id);
          const isEditing = editGroup?.id === group.id;
          const assignedAgentIds = group.agents.map(a => a.id);
          const assignedCatIds = group.categories.map(c => c.id);
          const availableAgents = allAgents.filter(a => !assignedAgentIds.includes(a.id));
          const availableCats = allCategories.filter(c => !assignedCatIds.includes(c.id));

          return (
            <Card key={group.id} className={`transition-all ${!group.is_active ? 'opacity-60' : ''}`}>
              {/* Group header */}
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleExpand(group.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                      <Input value={editGroup.name} onChange={e => setEditGroup({ ...editGroup, name: e.target.value })} className="h-7 text-sm w-44" autoFocus />
                      <Input value={editGroup.description} onChange={e => setEditGroup({ ...editGroup, description: e.target.value })} className="h-7 text-sm w-44" placeholder="Descripción" />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-gray-800">{group.name}</span>
                      {group.description && <span className="ml-2 text-xs text-gray-400">{group.description}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-gray-400">Orden: {group.priority_order}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${group.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {group.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleUpdate}><Check className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400" onClick={() => setEditGroup(null)}><X className="h-3 w-3" /></Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600" onClick={() => setEditGroup({ id: group.id, name: group.name, description: group.description ?? '' })}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-600" onClick={() => handleToggleActive(group)} title={group.is_active ? 'Desactivar' : 'Activar'}>
                          {group.is_active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-600" onClick={() => handleDelete(group.id)}><Trash2 className="h-3 w-3" /></Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-gray-100 grid md:grid-cols-2 gap-0 divide-x divide-gray-100">
                  {/* ── Agents ── */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-400" /> Agentes ({group.agents.length})
                    </p>

                    {/* Current agents */}
                    <div className="space-y-1.5">
                      {group.agents.map(agent => (
                        <div key={agent.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded border border-gray-100 text-xs">
                          <span className="text-gray-700 font-medium">{agent.name}</span>
                          <button onClick={() => handleRemoveAgent(group.id, agent.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <UserMinus className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {group.agents.length === 0 && <p className="text-xs text-gray-400">Sin agentes asignados.</p>}
                    </div>

                    {/* Add agent dropdown */}
                    {availableAgents.length > 0 && (
                      <select
                        className="w-full h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-600"
                        defaultValue=""
                        onChange={e => { if (e.target.value) { handleAddAgent(group.id, parseInt(e.target.value)); e.target.value = ''; } }}
                      >
                        <option value="" disabled>+ Agregar agente...</option>
                        {availableAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    )}
                  </div>

                  {/* ── Categories ── */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5 text-purple-400" /> Categorías ({group.categories.length})
                    </p>

                    <div className="space-y-1.5">
                      {group.categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded border border-gray-100 text-xs">
                          <span className="text-gray-700 font-medium">{cat.name}</span>
                          <button onClick={() => handleRemoveCategory(group.id, cat.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {group.categories.length === 0 && <p className="text-xs text-gray-400">Sin categorías asignadas. Los tickets de cualquier categoría no se enrutarán a este grupo.</p>}
                    </div>

                    {availableCats.length > 0 && (
                      <select
                        className="w-full h-7 text-xs border border-gray-200 rounded px-2 bg-white text-gray-600"
                        defaultValue=""
                        onChange={e => { if (e.target.value) { handleAddCategory(group.id, parseInt(e.target.value)); e.target.value = ''; } }}
                      >
                        <option value="" disabled>+ Asignar categoría...</option>
                        {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {groups.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No hay grupos. Crea el primero arriba.</p>
        )}
      </div>

      {/* ── Ticket categories management ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-500" /> Categorías de Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs text-gray-500">
            Las categorías se muestran en el formulario de tickets y determinan el enrutamiento a grupos de trabajo.
          </p>

          {/* Create category */}
          <div className="flex items-center gap-2">
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nueva categoría *" className="h-8 text-sm" onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); }} />
            <Input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Descripción" className="h-8 text-sm w-48" />
            <Button size="sm" className="h-8 shrink-0" onClick={handleCreateCategory} disabled={saving || !newCatName.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Crear
            </Button>
          </div>

          {/* Categories list */}
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => (
              <span key={cat.id} className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">
                {cat.name}
              </span>
            ))}
            {allCategories.length === 0 && <p className="text-xs text-gray-400">No hay categorías creadas.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
