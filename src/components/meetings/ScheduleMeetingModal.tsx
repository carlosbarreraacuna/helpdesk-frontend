'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { meetingsApi, Meeting } from '@/lib/meetings-api';
import api from '@/lib/api';
import { X, Trash2, Video, Calendar, Search, UserPlus } from 'lucide-react';

interface Props {
  ticketId?: number;
  requesterEmail?: string;
  requesterName?: string;
  onClose: () => void;
  onCreated: (meeting: Meeting) => void;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
  role?: { name: string } | null;
}

export default function ScheduleMeetingModal({ ticketId, requesterEmail, requesterName, onClose, onCreated }: Props) {
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(now.getTime() + 60 * 60 * 1000);

  const toLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: ticketId ? 'Reunión de soporte' : '',
    description: '',
    start_time: toLocal(now),
    end_time: toLocal(end),
  });

  const [invitees, setInvitees] = useState<{ email: string; name: string }[]>(
    requesterEmail ? [{ email: requesterEmail, name: requesterName ?? '' }] : []
  );

  // User search state
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/users', { params: { search: value, per_page: 20 } });
        const users: UserOption[] = res.data.data ?? res.data;
        setResults(users.filter(u => !invitees.some(inv => inv.email === u.email)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const addInvitee = (user: UserOption) => {
    if (invitees.some(i => i.email.toLowerCase() === user.email.toLowerCase())) return;
    setInvitees(prev => [...prev, { email: user.email, name: user.name }]);
    setSearch('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await meetingsApi.create({
        ...form,
        ticket_id: ticketId,
        invitees,
      });
      onCreated(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Error al crear la reunión');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (role?: { name: string } | null) => {
    if (!role) return null;
    const map: Record<string, string> = {
      admin: 'Admin',
      agente: 'Agente',
      supervisor: 'Supervisor',
      usuario: 'Usuario',
    };
    return map[role.name] ?? role.name;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Programar Reunión</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div>
            <Label>Título *</Label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Revisión del problema de red"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Inicio *</Label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Fin *</Label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <textarea
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Contexto de la reunión..."
            />
          </div>

          {/* Invitees */}
          <div>
            <Label>Invitados</Label>

            {/* Selected invitees list */}
            {invitees.length > 0 && (
              <ul className="mt-2 space-y-1.5 mb-3">
                {invitees.map((inv, i) => (
                  <li key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {(inv.name || inv.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {inv.name && <p className="text-xs font-medium text-gray-800 truncate">{inv.name}</p>}
                      <p className="text-xs text-gray-500 truncate">{inv.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInvitees(prev => prev.filter((_, j) => j !== i))}
                      className="shrink-0 text-gray-300 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Searchable user selector */}
            <div ref={searchRef} className="relative mt-1">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition bg-white">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => search.trim() && setShowDropdown(true)}
                  placeholder="Buscar usuario por nombre o email..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                />
                {searching && (
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {search && (
                  <button type="button" onClick={() => { setSearch(''); setResults([]); setShowDropdown(false); }}
                    className="text-gray-300 hover:text-gray-500 transition shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && (results.length > 0 || (search.trim().length >= 1 && !searching)) && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      Sin resultados para "{search}"
                    </div>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {results.map(u => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => addInvitee(u)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                            {u.role && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                                {roleLabel(u.role)}
                              </span>
                            )}
                            <UserPlus className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
              <Calendar className="h-4 w-4" />
              {saving ? 'Creando...' : 'Crear Reunión'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
