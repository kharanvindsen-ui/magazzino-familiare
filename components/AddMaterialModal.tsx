'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Category } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  onClose: () => void
  onCreated: () => void
  defaultName?: string
  defaultCategory?: 'lavoro' | 'casa'
}

const UNITS = ['pz', 'metri', 'litri', 'kg', 'rotoli', 'sacchi', 'confezioni', 'scatole']

export default function AddMaterialModal({ onClose, onCreated, defaultName = '', defaultCategory }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState(defaultName)
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('pz')
  const [minStock, setMinStock] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.categories.list().then(cats => {
      setCategories(cats)
      if (defaultCategory) {
        const match = cats.find(c => c.type === defaultCategory)
        if (match) setCategoryId(match.id)
      }
    })
  }, [defaultCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Inserisci un nome'); return }
    setLoading(true)
    setError(null)
    try {
      await api.materials.create(name.trim(), categoryId || null, unit, minStock)
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">Nuovo Materiale</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Es. Cavo elettrico 2.5mm"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="">— Nessuna categoria —</option>
              <optgroup label="🔧 Lavoro">
                {categories.filter(c => c.type === 'lavoro').map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </optgroup>
              <optgroup label="🏠 Casa">
                {categories.filter(c => c.type === 'casa').map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unità</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scorta minima</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={minStock}
                onChange={e => setMinStock(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            {loading ? 'Salvataggio...' : 'Aggiungi Materiale'}
          </button>
        </form>
      </div>
    </div>
  )
}
