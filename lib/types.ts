export type MovementType = 'in' | 'out'

export interface MacroCategory {
  id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  macro_category_id: string | null
  color: string
  icon: string
  created_at: string
  macro_category?: MacroCategory | null
}

export interface Material {
  id: string
  name: string
  category_id: string | null
  unit: string
  current_stock: number
  min_stock: number
  created_at: string
  category?: Category
}

export interface Movement {
  id: string
  material_id: string
  quantity: number
  type: MovementType
  notes: string | null
  voice_input: string | null
  created_at: string
  material?: Material
}

export interface MaterialMatch {
  material: Material
  score: number
}

export interface ParsedVoiceCommand {
  material_name: string
  quantity: number
  movement_type: MovementType
  unit: string
  notes: string | null
  category_hint: string | null
  confidence: number
}
