'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Mic, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/api'
import { Material, ParsedVoiceCommand, Category, MacroCategory } from '@/lib/types'
import MaterialCard from '@/components/MaterialCard'
import VoiceInput from '@/components/VoiceInput'
import StockAlert from '@/components/StockAlert'
import Navigation from '@/components/Navigation'
import AddMaterialModal from '@/components/AddMaterialModal'
import QuickMoveModal from '@/components/QuickMoveModal'

type Filter = 'tutti' | string

interface Props {
  initialMaterials: Material[]
  initialLowStock: Material[]
}

export default function Dashboard({ initialMaterials, initialLowStock }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [lowStock, setLowStock] = useState<Material[]>(initialLowStock)
  const [categories, setCategories] = useState<Category[]>([])
  const [macros, setMacros] = useState<MacroCategory[]>([])
  const [filter, setFilter] = useState<Filter>('tutti')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [quickMove, setQuickMove] = useState<{ material: Material; type: 'in' | 'out' } | null>(null)
  const [pendingVoice, setPendingVoice] = useState<ParsedVoiceCommand | null>(null)

  useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {})
    api.macroCategories.list().then(setMacros).catch(() => {})
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const [mats, low, cats, mcs] = await Promise.all([
        api.materials.list(),
        api.materials.lowStock(),
        api.categories.list(),
        api.macroCategories.list(),
      ])
      setMaterials(mats)
      setLowStock(low)
      setCategories(cats)
      setMacros(mcs)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refreshRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => refreshRef.current(), 15_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let es: EventSource
    let retryTimer: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/realtime')

      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'connected') setConnected(true)
          if (msg.type === 'update') refreshRef.current()
        } catch { /* ignore parse errors */ }
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        retryTimer = setTimeout(connect, 5_000)
      }
    }

    connect()
    return () => { es?.close(); clearTimeout(retryTimer) }
  }, [])

  const handleVoiceConfirm = async (command: ParsedVoiceCommand, voiceText: string) => {
    const normalizedName = command.material_name.toLowerCase().trim()
    const match = materials.find(m =>
      m.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(m.name.toLowerCase())
    )
    if (match) {
      await api.movements.create(match.id, command.quantity, command.movement_type, command.notes, voiceText)
      await refresh()
    } else {
      setPendingVoice(command)
      setShowVoice(false)
      setShowAdd(true)
    }
  }

  const handleFilterChange = (f: Filter) => {
    setFilter(f)
    setCategoryId(null)
  }

  const subCategories = filter === 'tutti' ? [] : categories.filter(c => c.macro_category_id === filter)

  const visibleLowStock = lowStock.filter(m =>
    filter === 'tutti' ? true : m.category?.macro_category_id === filter
  )

  const filtered = materials.filter(m => {
    if (filter === 'tutti') return true
    if (m.category?.macro_category_id !== filter) return false
    if (categoryId) return m.category_id === categoryId
    return true
  })

  const macroCounts = new Map<string, number>()
  for (const m of materials) {
    const key = m.category?.macro_category_id
    if (key) macroCounts.set(key, (macroCounts.get(key) ?? 0) + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🏠 Magazzino Materiali</h1>
              <p className="text-xs text-gray-400">{materials.length} materiali</p>
            </div>
            <div
              title={connected ? 'Sincronizzazione live attiva' : 'Connessione in corso...'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {connected
                ? <><Wifi size={10} /> Live</>
                : <><WifiOff size={10} /> ...</>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleFilterChange('tutti')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              filter === 'tutti' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tutti ({materials.length})
          </button>
          {macros.map(m => {
            const count = macroCounts.get(m.id) ?? 0
            const active = filter === m.id
            return (
              <button
                key={m.id}
                onClick={() => handleFilterChange(m.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  active ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={active ? { backgroundColor: m.color } : {}}
              >
                {m.icon} {m.name} ({count})
              </button>
            )
          })}
        </div>

        {filter !== 'tutti' && subCategories.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                !categoryId ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Tutte
            </button>
            {subCategories.map(c => {
              const count = materials.filter(m => m.category_id === c.id).length
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    categoryId === c.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={categoryId === c.id ? { backgroundColor: c.color } : {}}
                >
                  {c.icon} {c.name} ({count})
                </button>
              )
            })}
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-safe">
        <StockAlert materials={visibleLowStock} />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Nessun materiale</p>
            <p className="text-sm">Aggiungi il primo con + o usa la voce</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(m => (
              <MaterialCard
                key={m.id}
                material={m}
                onQuickMove={(mat, type) => setQuickMove({ material: mat, type })}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => setShowVoice(true)}
        className="fixed right-4 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all z-30"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Mic size={24} />
      </button>

      <Navigation alertCount={lowStock.length} />

      {showVoice && (
        <VoiceInput onConfirm={handleVoiceConfirm} onClose={() => setShowVoice(false)} />
      )}
      {showAdd && (
        <AddMaterialModal
          onClose={() => { setShowAdd(false); setPendingVoice(null) }}
          onCreated={refresh}
          defaultName={pendingVoice?.material_name}
          defaultMacroName={pendingVoice?.category_hint ?? null}
        />
      )}
      {quickMove && (
        <QuickMoveModal
          material={quickMove.material}
          type={quickMove.type}
          onClose={() => setQuickMove(null)}
          onDone={refresh}
        />
      )}
    </div>
  )
}
