'use client'

import { useState } from 'react'
import { X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { Material } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  material: Material
  type: 'in' | 'out'
  onClose: () => void
  onDone: () => void
}

export default function QuickMoveModal({ material, type, onClose, onDone }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) { setError('Quantità non valida'); return }
    setLoading(true)
    try {
      await api.movements.create(material.id, quantity, type, notes || null, null)
      onDone()
      onClose()
    } catch {
      setError('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const isIn = type === 'in'
  const color = isIn ? 'green' : 'red'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {isIn
              ? <TrendingUp size={20} className="text-green-600" />
              : <TrendingDown size={20} className="text-red-600" />}
            <h2 className="text-lg font-bold">
              {isIn ? 'Carico' : 'Scarico'}: {material.name}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Scorta attuale: <strong>{material.current_stock} {material.unit}</strong>
          {!isIn && material.current_stock > 0 && (
            <> → <strong>{Math.max(0, material.current_stock - quantity)} {material.unit}</strong></>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantità ({material.unit})
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center"
              >−</button>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center"
              >+</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Es. usato per cucina, acquistato al ferramenta..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              isIn ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } disabled:opacity-60`}
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : isIn ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {loading ? 'Salvataggio...' : `Conferma ${isIn ? 'Carico' : 'Scarico'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
