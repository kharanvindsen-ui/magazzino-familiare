'use client'

import { useState } from 'react'
import { X, Plus, Edit3, Trash2 } from 'lucide-react'
import { MacroCategory } from '@/lib/types'
import MacroFormModal from '@/components/MacroFormModal'
import DeleteMacroModal from '@/components/DeleteMacroModal'

interface Props {
  macros: MacroCategory[]
  onClose: () => void
  onChanged: () => void
}

export default function MacroManagerModal({ macros, onClose, onChanged }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MacroCategory | null>(null)
  const [deleting, setDeleting] = useState<MacroCategory | null>(null)

  const closeForm = () => { setShowForm(false); setEditing(null) }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 pb-4">
            <h2 className="text-lg font-bold">Macro categorie</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="w-full mb-4 py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Nuova macro
            </button>

            <div className="space-y-2">
              {macros.map(m => (
                <div
                  key={m.id}
                  className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                  style={{ borderLeft: `4px solid ${m.color}` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${m.color}1A` }}
                  >
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{m.color.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(m); setShowForm(true) }}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"
                      aria-label="Modifica"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleting(m)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                      aria-label="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {macros.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>Nessuna macro categoria. Creane una!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <MacroFormModal
          onClose={closeForm}
          onSaved={onChanged}
          initial={editing ?? undefined}
        />
      )}

      {deleting && (
        <DeleteMacroModal
          macro={deleting}
          allMacros={macros}
          onClose={() => setDeleting(null)}
          onDeleted={onChanged}
        />
      )}
    </>
  )
}
