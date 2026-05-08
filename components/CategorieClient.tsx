'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import { Category, CategoryType } from '@/lib/types'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import CategoryFormModal from '@/components/CategoryFormModal'
import DeleteCategoryModal from '@/components/DeleteCategoryModal'

export default function CategorieClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [tab, setTab] = useState<CategoryType>('lavoro')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const refresh = useCallback(async () => {
    const cats = await api.categories.list()
    setCategories(cats)
  }, [])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refreshRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const filtered = categories.filter(c => c.type === tab)

  const openEdit = (c: Category) => { setEditing(c); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">🏷️ Categorie</h1>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setTab('lavoro')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'lavoro' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              🔧 Lavoro
            </button>
            <button
              onClick={() => setTab('casa')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'casa' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              🏠 Casa
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
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
                <p className="text-xs text-gray-400 font-mono">{c.color.toUpperCase()}</p>
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
        />
      )}

      {deleting && (
        <DeleteCategoryModal
          category={deleting}
          allCategories={categories}
          onClose={() => setDeleting(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  )
}
