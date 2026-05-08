'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Edit3, Trash2, Settings } from 'lucide-react'
import { Category, MacroCategory } from '@/lib/types'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import CategoryFormModal from '@/components/CategoryFormModal'
import DeleteCategoryModal from '@/components/DeleteCategoryModal'
import MacroManagerModal from '@/components/MacroManagerModal'

interface Props {
  initialCategories: Category[]
  initialMacros: MacroCategory[]
}

type Tab = string | 'all' | 'none'

export default function CategorieClient({ initialCategories, initialMacros }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [macros, setMacros] = useState<MacroCategory[]>(initialMacros)
  const [tab, setTab] = useState<Tab>(initialMacros[0]?.id ?? 'all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [showMacroManager, setShowMacroManager] = useState(false)

  const refresh = useCallback(async () => {
    const [cats, mcs] = await Promise.all([api.categories.list(), api.macroCategories.list()])
    setCategories(cats)
    setMacros(mcs)
    if (tab !== 'all' && tab !== 'none' && !mcs.some(m => m.id === tab)) {
      setTab(mcs[0]?.id ?? 'all')
    }
  }, [tab])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refreshRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const filtered = categories.filter(c => {
    if (tab === 'all') return true
    if (tab === 'none') return !c.macro_category_id
    return c.macro_category_id === tab
  })

  const openEdit = (c: Category) => { setEditing(c); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const activeMacro = macros.find(m => m.id === tab)
  const newCategoryDefaultMacro = tab !== 'all' && tab !== 'none' ? tab : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">🏷️ Categorie</h1>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowMacroManager(true)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Gestisci macro categorie"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
              title="Nuova categoria"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              tab === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Tutte ({categories.length})
          </button>
          {macros.map(m => {
            const count = categories.filter(c => c.macro_category_id === m.id).length
            const active = tab === m.id
            return (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  active ? 'text-white' : 'bg-gray-100 text-gray-500'
                }`}
                style={active ? { backgroundColor: m.color } : {}}
              >
                {m.icon} {m.name} ({count})
              </button>
            )
          })}
          {categories.some(c => !c.macro_category_id) && (
            <button
              onClick={() => setTab('none')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === 'none' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              Senza macro ({categories.filter(c => !c.macro_category_id).length})
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {activeMacro && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: `${activeMacro.color}10` }}>
            <div className="text-2xl">{activeMacro.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: activeMacro.color }}>
                {activeMacro.name}
              </p>
              <p className="text-xs text-gray-500">Macro categoria</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl p-4 flex items-center gap-3"
              style={{ borderLeft: `4px solid ${c.color}` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${c.color}1A` }}
              >
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {c.macro_category ? `${c.macro_category.icon} ${c.macro_category.name}` : 'Senza macro'}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  aria-label="Modifica"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  aria-label="Elimina"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Nessuna categoria. Aggiungine una!</p>
            </div>
          )}
        </div>
      </main>

      <Navigation />

      {showForm && (
        <CategoryFormModal
          onClose={closeForm}
          onSaved={refresh}
          initial={editing ?? undefined}
          defaultMacroId={editing ? undefined : newCategoryDefaultMacro}
        />
      )}

      {deleting && (
        <DeleteCategoryModal
          category={deleting}
          allCategories={categories}
          macros={macros}
          onClose={() => setDeleting(null)}
          onDeleted={refresh}
        />
      )}

      {showMacroManager && (
        <MacroManagerModal
          macros={macros}
          onClose={() => setShowMacroManager(false)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
