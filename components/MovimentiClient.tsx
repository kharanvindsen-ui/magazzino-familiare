'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Mic2, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { Movement } from '@/lib/types'
import Navigation from '@/components/Navigation'

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Oggi'
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri'
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export default function MovimentiClient({ initialMovements }: { initialMovements: Movement[] }) {
  const [movements, setMovements] = useState<Movement[]>(initialMovements)

  const refresh = useCallback(async () => {
    const movs = await api.movements.list(100)
    setMovements(movs)
  }, [])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refreshRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const grouped = movements.reduce<Record<string, Movement[]>>((acc, m) => {
    const key = formatDate(m.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">📋 Movimenti</h1>
          <p className="text-xs text-gray-400">{movements.length} operazioni recenti</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-safe">
        {movements.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Nessun movimento registrato</p>
            <p className="text-sm mt-1">Usa il microfono nella home per aggiungere movimenti</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, movs]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{date}</h2>
                </div>
                <div className="space-y-2">
                  {movs.map(m => {
                    const mat = m.material as { name: string; unit: string } | undefined
                    const isIn = m.type === 'in'
                    return (
                      <div key={m.id} className="bg-white rounded-xl p-4 flex items-start gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${isIn ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isIn
                            ? <TrendingUp size={18} className="text-green-600" />
                            : <TrendingDown size={18} className="text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm">{mat?.name ?? 'Materiale eliminato'}</p>
                            <span className={`text-sm font-bold flex-shrink-0 ml-2 ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                              {isIn ? '+' : '−'}{m.quantity} {mat?.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{formatTime(m.created_at)}</span>
                            {m.voice_input && (
                              <span className="text-xs text-blue-400 flex items-center gap-0.5">
                                <Mic2 size={10} /> Voce
                              </span>
                            )}
                          </div>
                          {m.notes && <p className="text-xs text-gray-500 mt-1 italic">{m.notes}</p>}
                          {m.voice_input && (
                            <p className="text-xs text-blue-500 mt-1 bg-blue-50 px-2 py-1 rounded-lg italic">
                              "{m.voice_input}"
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Navigation />
    </div>
  )
}
