'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Plus, Trash2, Edit3, X, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { Material } from '@/lib/types'
import Navigation from '@/components/Navigation'
import AddMaterialModal from '@/components/AddMaterialModal'

export default function MaterialiClient({ initialMaterials }: { initialMaterials: Material[] }) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editStock, setEditStock] = useState(0)

  const refresh = useCallback(async () => {
    const mats = await api.materials.list()
    setMaterials(mats)
  }, [])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refreshRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    (m.category?.name ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return
    await api.materials.delete(id)
    await refresh()
  }

  const saveEdit = async (id: string) => {
    await api.materials.update(id, { current_stock: editStock })
    setEditing(null)
    await refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">📦 Materiali</h1>
          <button onClick={() => setShowAdd(true)} className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
            <Plus size={18} />
          </button>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca materiale o categoria..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-safe">
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-white rounded-xl p-4 flex items-center gap-3">
              <div className="text-2xl">{m.category?.icon ?? '📦'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{m.name}</p>
                <p className="text-xs text-gray-400">{m.category?.name ?? 'Nessuna categoria'}</p>
              </div>

              {editing === m.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editStock}
                    onChange={e => setEditStock(parseFloat(e.target.value) || 0)}
                    className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-sm text-center"
                    step="0.5"
                    autoFocus
                  />
                  <span className="text-xs text-gray-500">{m.unit}</span>
                  <button onClick={() => saveEdit(m.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => { setEditing(m.id); setEditStock(m.current_stock) }} className="text-right">
                    <p className={`text-sm font-bold ${
                      m.min_stock > 0 && m.current_stock <= m.min_stock
                        ? m.current_stock === 0 ? 'text-red-500' : 'text-orange-500'
                        : 'text-gray-700'
                    }`}>
                      {m.current_stock} {m.unit}
                    </p>
                    <p className="text-xs text-gray-400">min {m.min_stock}</p>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(m.id); setEditStock(m.current_stock) }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(m.id, m.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>{query ? `Nessun risultato per "${query}"` : 'Nessun materiale. Aggiungine uno!'}</p>
            </div>
          )}
        </div>
      </main>

      <Navigation />
      {showAdd && <AddMaterialModal onClose={() => setShowAdd(false)} onCreated={refresh} />}
    </div>
  )
}
