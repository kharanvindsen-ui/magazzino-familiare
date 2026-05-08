'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { MacroCategory } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  onClose: () => void
  onSaved: () => void
  initial?: MacroCategory
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#06B6D4', '#A855F7',
]

const PRESET_EMOJIS = [
  '🔧', '🏠', '🚗', '🌱', '🏢', '🛠️', '💼', '🎨',
  '⚡', '🪛', '📦', '🔨', '🍳', '🧴', '🧹', '🧺',
  '🪜', '🚿', '⚙️', '🌳', '🐾', '🛒', '📐', '🎯',
]

export default function MacroFormModal({ onClose, onSaved, initial }: Props) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📦')
  const [color, setColor] = useState(initial?.color ?? '#3B82F6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Inserisci un nome'); return }
    setLoading(true)
    setError(null)
    try {
      if (isEdit && initial) {
        await api.macroCategories.update(initial.id, { name: name.trim(), icon, color })
      } else {
        await api.macroCategories.create(name.trim(), icon, color)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">{isEdit ? 'Modifica macro' : 'Nuova macro categoria'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${color}1A` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white shadow-sm">
              {icon}
            </div>
            <p className="text-sm font-semibold" style={{ color }}>{name || 'Anteprima'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Es. Auto, Giardino, Ufficio"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icona</label>
            <input
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value.slice(0, 4))}
              maxLength={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2"
            />
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`aspect-square rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colore</label>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
              />
              <span className="text-sm text-gray-500 font-mono">{color.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`aspect-square rounded-lg transition-all ${
                    color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={18} />
            {loading ? 'Salvataggio...' : isEdit ? 'Salva modifiche' : 'Crea macro'}
          </button>
        </form>
      </div>
    </div>
  )
}
