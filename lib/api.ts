import { Category, Material, Movement } from './types'

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
    create: (name: string, categoryId: string | null, unit: string, minStock: number) =>
      apiFetch<Material>('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, categoryId, unit, minStock }),
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
  },
}
