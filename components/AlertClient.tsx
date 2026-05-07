'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AlertTriangle, ShoppingCart, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Material } from '@/lib/types'
import Navigation from '@/components/Navigation'
import QuickMoveModal from '@/components/QuickMoveModal'

export default function AlertClient({ initialMaterials }: { initialMaterials: Material[] }) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [quickMove, setQuickMove] = useState<Material | null>(null)

  const refresh = useCallback(async () => {
    const mats = await api.materials.lowStock()
    setMaterials(mats)
  }, [])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refreshRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const critical = materials.filter(m => m.current_stock === 0)
  const low = materials.filter(m => m.current_stock > 0 && m.current_stock <= m.min_stock)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">🚨 Alert Scorte</h1>
          <p className="text-xs text-gray-400">{materials.length} materiali sotto soglia</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-safe">
        {materials.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
            <p className="text-lg font-semibold text-green-600">Tutto OK!</p>
            <p className="text-sm mt-1">Tutte le scorte sono nella norma</p>
          </div>
        ) : (
          <div className="space-y-4">
            {critical.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} /> Esauriti ({critical.length})
                </h2>
                <div className="space-y-2">
                  {critical.map(m => (
                    <div key={m.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-800">{m.name}</p>
                        <p className="text-xs text-red-600">{m.category?.icon} {m.category?.name}</p>
                        <p className="text-xs text-red-500 mt-0.5">Min: {m.min_stock} {m.unit}</p>
                      </div>
                      <button onClick={() => setQuickMove(m)} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
                        <ShoppingCart size={14} /> Rifornisci
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {low.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} /> Scorta bassa ({low.length})
                </h2>
                <div className="space-y-2">
                  {low.map(m => (
                    <div key={m.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <p className="font-semibold text-orange-800">{m.name}</p>
                        <p className="text-xs text-orange-600">{m.category?.icon} {m.category?.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-orange-200 rounded-full">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (m.current_stock / m.min_stock) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                            {m.current_stock}/{m.min_stock} {m.unit}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setQuickMove(m)} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 flex-shrink-0">
                        <ShoppingCart size={14} /> Rifornisci
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Navigation alertCount={materials.length} />
      {quickMove && (
        <QuickMoveModal material={quickMove} type="in" onClose={() => setQuickMove(null)} onDone={refresh} />
      )}
    </div>
  )
}
