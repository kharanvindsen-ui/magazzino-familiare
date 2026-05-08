'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react'
import { MacroCategory } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  macro: MacroCategory
  allMacros: MacroCategory[]
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteMacroModal({ macro, allMacros, onClose, onDeleted }: Props) {
  const [count, setCount] = useState<number | null>(null)
  const [reassignTo, setReassignTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.macroCategories.categoriesCount(macro.id)
      .then(({ categoriesCount }) => setCount(categoriesCount))
      .catch(err => setError(err instanceof Error ? err.message : 'Errore'))
  }, [macro.id])

  const others = allMacros.filter(m => m.id !== macro.id)

  const handleDeleteEmpty = async () => {
    setLoading(true); setError(null)
    try {
      await api.macroCategories.deleteEmpty(macro.id)
      onDeleted(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally { setLoading(false) }
  }

  const handleReassign = async () => {
    if (!reassignTo) { setError('Seleziona la macro di destinazione'); return }
    setLoading(true); setError(null)
    try {
      await api.macroCategories.deleteWithReassign(macro.id, reassignTo)
      onDeleted(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally { setLoading(false) }
  }

  const handleDetach = async () => {
    setLoading(true); setError(null)
    try {
      await api.macroCategories.deleteDetach(macro.id)
      onDeleted(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            Elimina macro
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 mb-5 rounded-xl bg-gray-50">
          <div className="text-2xl">{macro.icon}</div>
          <p className="font-semibold text-sm">{macro.name}</p>
        </div>

        {count === null && !error && (
          <p className="text-sm text-gray-500 text-center py-6">Verifica categorie collegate...</p>
        )}

        {count === 0 && (
          <>
            <p className="text-sm text-gray-700 mb-5">Questa macro non ha categorie collegate. Procedere con l'eliminazione?</p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">
                Annulla
              </button>
              <button
                onClick={handleDeleteEmpty}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {loading ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </>
        )}

        {count !== null && count > 0 && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                Ci sono <strong>{count}</strong> {count === 1 ? 'categoria collegata' : 'categorie collegate'} a questa macro. Cosa vuoi fare?
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {others.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight size={16} className="text-blue-500" />
                    <p className="font-semibold text-sm">Trasferisci le categorie</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Sposta tutte le categorie su un'altra macro, poi elimina questa.</p>
                  <select
                    value={reassignTo}
                    onChange={e => setReassignTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
                  >
                    <option value="">— Seleziona macro di destinazione —</option>
                    {others.map(m => (
                      <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleReassign}
                    disabled={loading || !reassignTo}
                    className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 disabled:opacity-60"
                  >
                    {loading ? 'Trasferimento...' : 'Trasferisci ed elimina'}
                  </button>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 size={16} className="text-gray-500" />
                  <p className="font-semibold text-sm">Stacca le categorie</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Le {count} {count === 1 ? 'categoria collegata' : 'categorie collegate'} restano in archivio ma senza macro. I materiali non vengono toccati.
                </p>
                <button
                  onClick={handleDetach}
                  disabled={loading}
                  className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {loading ? 'Eliminazione...' : 'Stacca ed elimina la macro'}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">
              Annulla
            </button>
          </>
        )}
      </div>
    </div>
  )
}
