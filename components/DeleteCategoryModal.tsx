'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react'
import { Category } from '@/lib/types'
import { api } from '@/lib/api'

interface Props {
  category: Category
  allCategories: Category[]
  onClose: () => void
  onDeleted: () => void
}

type Step = 'choose' | 'confirm-cascade'

export default function DeleteCategoryModal({ category, allCategories, onClose, onDeleted }: Props) {
  const [materialsCount, setMaterialsCount] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('choose')
  const [reassignTo, setReassignTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.categories.materialsCount(category.id)
      .then(({ materialsCount }) => setMaterialsCount(materialsCount))
      .catch(err => setError(err instanceof Error ? err.message : 'Errore'))
  }, [category.id])

  const others = allCategories.filter(c => c.id !== category.id)

  const handleDeleteEmpty = async () => {
    setLoading(true); setError(null)
    try {
      await api.categories.deleteEmpty(category.id)
      onDeleted(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally { setLoading(false) }
  }

  const handleReassign = async () => {
    if (!reassignTo) { setError('Seleziona una categoria di destinazione'); return }
    setLoading(true); setError(null)
    try {
      await api.categories.deleteWithReassign(category.id, reassignTo)
      onDeleted(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally { setLoading(false) }
  }

  const handleCascade = async () => {
    setLoading(true); setError(null)
    try {
      await api.categories.deleteCascade(category.id)
      onDeleted(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            Elimina categoria
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 mb-5 rounded-xl bg-gray-50">
          <div className="text-2xl">{category.icon}</div>
          <div>
            <p className="font-semibold text-sm">{category.name}</p>
            <p className="text-xs text-gray-500">{category.type === 'lavoro' ? '🔧 Lavoro' : '🏠 Casa'}</p>
          </div>
        </div>

        {materialsCount === null && !error && (
          <p className="text-sm text-gray-500 text-center py-6">Verifica materiali collegati...</p>
        )}

        {materialsCount === 0 && (
          <>
            <p className="text-sm text-gray-700 mb-5">Questa categoria non ha materiali collegati. Procedere con l'eliminazione?</p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
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

        {materialsCount !== null && materialsCount > 0 && step === 'choose' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                Ci sono <strong>{materialsCount}</strong> {materialsCount === 1 ? 'materiale collegato' : 'materiali collegati'} a questa categoria. Cosa vuoi fare?
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight size={16} className="text-blue-500" />
                  <p className="font-semibold text-sm">Trasferisci i materiali</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">Sposta tutti i materiali su un'altra categoria, poi elimina questa.</p>
                <select
                  value={reassignTo}
                  onChange={e => setReassignTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
                >
                  <option value="">— Seleziona categoria di destinazione —</option>
                  <optgroup label="🔧 Lavoro">
                    {others.filter(c => c.type === 'lavoro').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🏠 Casa">
                    {others.filter(c => c.type === 'casa').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </optgroup>
                </select>
                <button
                  onClick={handleReassign}
                  disabled={loading || !reassignTo}
                  className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 disabled:opacity-60"
                >
                  {loading ? 'Trasferimento...' : 'Trasferisci ed elimina'}
                </button>
              </div>

              <div className="border border-red-200 rounded-xl p-4 bg-red-50/40">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 size={16} className="text-red-500" />
                  <p className="font-semibold text-sm text-red-900">Elimina anche i materiali</p>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  Tutti i {materialsCount} materiali e i loro movimenti verranno eliminati. Operazione irreversibile.
                </p>
                <button
                  onClick={() => setStep('confirm-cascade')}
                  className="w-full py-2.5 bg-white border border-red-300 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50"
                >
                  Procedi all'eliminazione
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
            >
              Annulla
            </button>
          </>
        )}

        {step === 'confirm-cascade' && (
          <>
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-red-600" />
                <p className="font-bold text-red-900">Conferma eliminazione</p>
              </div>
              <p className="text-sm text-red-900">
                Stai per eliminare la categoria <strong>{category.name}</strong> e tutti i suoi <strong>{materialsCount}</strong> materiali. Questa operazione è <strong>irreversibile</strong>.
              </p>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                Indietro
              </button>
              <button
                onClick={handleCascade}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {loading ? 'Eliminazione...' : 'Sì, elimina tutto'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
