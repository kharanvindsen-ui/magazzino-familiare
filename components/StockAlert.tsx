import { Material } from '@/lib/types'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  materials: Material[]
  onDismiss?: () => void
}

export default function StockAlert({ materials, onDismiss }: Props) {
  if (materials.length === 0) return null

  const critical = materials.filter(m => m.current_stock === 0)
  const low = materials.filter(m => m.current_stock > 0 && m.current_stock <= m.min_stock)

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          <span className="font-semibold text-orange-800">
            {critical.length > 0
              ? `${critical.length} materiale${critical.length > 1 ? 'i' : ''} esaurito${critical.length > 1 ? 'i' : ''}`
              : `${low.length} scorta${low.length > 1 ? 'e' : ''} bassa`}
          </span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-orange-400 hover:text-orange-600">
            <X size={16} />
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {critical.slice(0, 3).map(m => (
          <li key={m.id} className="text-sm text-red-700 flex justify-between">
            <span className="font-medium">{m.name}</span>
            <span className="text-red-500 font-bold">ESAURITO</span>
          </li>
        ))}
        {low.slice(0, 3).map(m => (
          <li key={m.id} className="text-sm text-orange-700 flex justify-between">
            <span className="font-medium">{m.name}</span>
            <span>{m.current_stock} {m.unit} rimasti</span>
          </li>
        ))}
        {materials.length > 6 && (
          <li className="text-xs text-orange-500">...e altri {materials.length - 6}</li>
        )}
      </ul>
    </div>
  )
}
