'use client'

import { Material } from '@/lib/types'
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

interface Props {
  material: Material
  onQuickMove?: (material: Material, type: 'in' | 'out') => void
}

export default function MaterialCard({ material, onQuickMove }: Props) {
  const { current_stock, min_stock, unit, name, category } = material
  const isLow = min_stock > 0 && current_stock <= min_stock
  const isCritical = min_stock > 0 && current_stock === 0
  const stockPercent = min_stock > 0
    ? Math.min(100, (current_stock / (min_stock * 3)) * 100)
    : current_stock > 0 ? 50 : 0

  const barColor = isCritical
    ? 'bg-red-500'
    : isLow
    ? 'bg-orange-400'
    : 'bg-green-500'

  const categoryColor = category?.type === 'lavoro' ? '#3B82F6' : '#10B981'

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
      isCritical ? 'border-red-500' : isLow ? 'border-orange-400' : 'border-transparent'
    }`} style={{ borderLeftColor: !isLow && !isCritical ? categoryColor : undefined }}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {category && (
              <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: categoryColor }}>
                {category.icon} {category.name}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 truncate text-sm">{name}</h3>
        </div>
        {(isLow || isCritical) && (
          <AlertTriangle size={16} className={isCritical ? 'text-red-500' : 'text-orange-400'} />
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900">{current_stock}</span>
        <span className="text-sm text-gray-500">{unit}</span>
        {min_stock > 0 && (
          <span className="text-xs text-gray-400 ml-1">/ min {min_stock}</span>
        )}
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full stock-bar transition-all ${barColor}`}
          style={{ width: `${stockPercent}%` }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onQuickMove?.(material, 'out')}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <TrendingDown size={14} /> Scarico
        </button>
        <button
          onClick={() => onQuickMove?.(material, 'in')}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
        >
          <TrendingUp size={14} /> Carico
        </button>
      </div>
    </div>
  )
}
