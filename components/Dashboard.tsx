'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Mic, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/api'
import { Material, MaterialMatch, ParsedVoiceCommand, Category, MacroCategory } from '@/lib/types'
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

  const findMaterialMatches = useCallback((name: string): MaterialMatch[] => {
    function normalize(s: string): string {
      return s
        .toLowerCase()
        .replace(/,/g, '.')
        // "N unit e mezzo" → (N+0.5)unit  e.g. "2 mm e mezzo" → "2.5mm"
        .replace(/(\d+(?:\.\d+)?)\s*(mm|cm|km|ml|cl|dl|mg|kg|pz|g|l|m)\b\s+e\s+mezzo\b/gi,
          (_: string, n: string, u: string) => String(parseFloat(n) + 0.5) + u)
        // "N e mezzo unit" → (N+0.5)unit
        .replace(/(\d+(?:\.\d+)?)\s+e\s+mezzo\s*(mm|cm|km|ml|cl|dl|mg|kg|pz|g|l|m)\b/gi,
          (_: string, n: string, u: string) => String(parseFloat(n) + 0.5) + u)
        // "N e mezzo" (no unit) → (N+0.5)
        .replace(/(\d+(?:\.\d+)?)\s+e\s+mezzo\b/gi,
          (_: string, n: string) => String(parseFloat(n) + 0.5))
        // "mezzo unit" → 0.5unit
        .replace(/\bmezzo\s+(mm|cm|km|ml|cl|dl|mg|kg|pz|g|l|m)\b/gi, '0.5$1')
        // digit space unit → merge
        .replace(/(\d)\s+(mm|cm|m|km|ml|cl|dl|l|mg|g|kg|pz)\b/g, '$1$2')
        // strip Italian stopwords unlikely to appear in material names
        .replace(/\b(da|di|del|dello|della|dei|degli|delle|per|il|lo|la|i|gli|le|un|uno|una)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function levenshtein(a: string, b: string): number {
      const m = a.length, n = b.length
      const dp: number[][] = []
      for (let i = 0; i <= m; i++) {
        dp[i] = []
        for (let j = 0; j <= n; j++) dp[i][j] = i === 0 ? j : j === 0 ? i : 0
      }
      for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
          dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])
      return dp[m][n]
    }

    const normName = normalize(name)
    const nameWords = normName.split(' ').filter(Boolean)

    const scored = materials.map(m => {
      const normM = normalize(m.name)
      const mWords = normM.split(' ').filter(Boolean)

      if (normM === normName || normM.includes(normName) || normName.includes(normM))
        return { material: m, score: 1.0 }

      const common = mWords.filter(w => nameWords.includes(w)).length
      const wordScore = common / Math.max(mWords.length, nameWords.length, 1)

      const dist = levenshtein(normName, normM)
      const charScore = Math.max(0, 1 - dist / Math.max(normName.length, normM.length, 1))

      return { material: m, score: 0.6 * wordScore + 0.4 * charScore }
    })

    return scored
      .filter(r => r.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [materials])

  const handleVoiceConfirm = async (command: ParsedVoiceCommand, voiceText: string, matched: Material) => {
    await api.movements.create(matched.id, command.quantity, command.movement_type, command.notes, voiceText)
    await refresh()
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
        <VoiceInput
          onConfirm={handleVoiceConfirm}
          onClose={() => setShowVoice(false)}
          findMatches={findMaterialMatches}
        />
      )}
      {showAdd && (
        <AddMaterialModal
          onClose={() => setShowAdd(false)}
          onCreated={refresh}
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
