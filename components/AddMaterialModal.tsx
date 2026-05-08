'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Plus } from 'lucide-react'
import { Category, MacroCategory } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  onClose: () => void
  onCreated: () => void
  defaultName?: string
  defaultMacroName?: string | null
}

const UNITS = ['pz', 'metri', 'litri', 'kg', 'rotoli', 'sacchi', 'confezioni', 'scatole']

export default function AddMaterialModal({ onClose, onCreated, defaultName = '', defaultMacroName }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [macros, setMacros] = useState<MacroCategory[]>([])
  const [name, setName] = useState(defaultName)
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('pz')
  const [minStock, setMinStock] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceHintApplied, setVoiceHintApplied] = useState(false)

  useEffect(() => {
    Promise.all([api.categories.list(), api.macroCategories.list()])
      .then(([cats, mcs]) => {
        setCategories(cats)
        setMacros(mcs)
        if (defaultMacroName && !voiceHintApplied) {
          const macro = mcs.find(m => m.name.toLowerCase() === defaultMacroName.toLowerCase())
          if (macro) {
            const firstCat = cats.find(c => c.macro_category_id === macro.id)
            if (firstCat) setCategoryId(firstCat.id)
          }
          setVoiceHintApplied(true)
        }
      })
      .catch(() => {})
  }, [defaultMacroName, voiceHintApplied])

  const grouped = useMemo(() => {
    const map = new Map<string | null, Category[]>()
    for (const c of categories) {
      const key = c.macro_category_id ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return map
  }, [categories])

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

  const suggestedMacro = defaultMacroName
    ? macros.find(m => m.name.toLowerCase() === defaultMacroName.toLowerCase())
    : null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">Nuovo Materiale</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {suggestedMacro && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <strong>Suggerimento vocale:</strong> macro <span className="font-semibold">{suggestedMacro.icon} {suggestedMacro.name}</span>. Conferma o cambia categoria sotto.
          </div>
        )}

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
              {macros.map(m => {
                const items = grouped.get(m.id) ?? []
                if (items.length === 0) return null
                return (
                  <optgroup key={m.id} label={`${m.icon} ${m.name}`}>
                    {items.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </optgroup>
                )
              })}
              {(grouped.get(null)?.length ?? 0) > 0 && (
                <optgroup label="Senza macro">
                  {grouped.get(null)!.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </optgroup>
              )}
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
