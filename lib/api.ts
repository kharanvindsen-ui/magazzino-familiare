import { Category, MacroCategory, Material, Movement } from './types'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(body)
  }
  return res.json()
}

export const api = {
  materials: {
    list: () => apiFetch<Material[]>('/api/materials'),
    lowStock: () => apiFetch<Material[]>('/api/materials?low=true'),
    create: (name: string, categoryId: string | null, unit: string, minStock: number, initialStock = 0) =>
      apiFetch<Material>('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, categoryId, unit, minStock, initialStock }),
      }),
    update: (id: string, updates: object) =>
      apiFetch<{ ok: boolean }>(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/materials/${id}`, { method: 'DELETE' }),
  },
  movements: {
    list: (limit = 100) => apiFetch<Movement[]>(`/api/movements?limit=${limit}`),
    create: (materialId: string, quantity: number, type: 'in' | 'out', notes: string | null, voiceInput: string | null) =>
      apiFetch<{ ok: boolean }>('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, quantity, type, notes, voiceInput }),
      }),
  },
  categories: {
    list: () => apiFetch<Category[]>('/api/categories'),
    create: (name: string, macroCategoryId: string | null, icon: string, color: string) =>
      apiFetch<Category>('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, macroCategoryId, icon, color }),
      }),
    update: (id: string, updates: Partial<{ name: string; macro_category_id: string | null; icon: string; color: string }>) =>
      apiFetch<{ ok: boolean }>(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }),
    materialsCount: (id: string) =>
      apiFetch<{ materialsCount: number }>(`/api/categories/${id}`),
    deleteEmpty: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/categories/${id}?mode=empty`, { method: 'DELETE' }),
    deleteWithReassign: (id: string, toId: string | null) => {
      const qs = toId ? `mode=reassign&to=${encodeURIComponent(toId)}` : 'mode=reassign'
      return apiFetch<{ ok: boolean }>(`/api/categories/${id}?${qs}`, { method: 'DELETE' })
    },
    deleteCascade: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/categories/${id}?mode=cascade`, { method: 'DELETE' }),
  },
  macroCategories: {
    list: () => apiFetch<MacroCategory[]>('/api/macro-categories'),
    create: (name: string, icon: string, color: string) =>
      apiFetch<MacroCategory>('/api/macro-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, color }),
      }),
    update: (id: string, updates: Partial<{ name: string; icon: string; color: string }>) =>
      apiFetch<{ ok: boolean }>(`/api/macro-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }),
    categoriesCount: (id: string) =>
      apiFetch<{ categoriesCount: number }>(`/api/macro-categories/${id}`),
    deleteEmpty: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/macro-categories/${id}?mode=empty`, { method: 'DELETE' }),
    deleteWithReassign: (id: string, toId: string | null) => {
      const qs = toId ? `mode=reassign&to=${encodeURIComponent(toId)}` : 'mode=reassign'
      return apiFetch<{ ok: boolean }>(`/api/macro-categories/${id}?${qs}`, { method: 'DELETE' })
    },
    deleteDetach: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/macro-categories/${id}?mode=detach`, { method: 'DELETE' }),
  },
}
