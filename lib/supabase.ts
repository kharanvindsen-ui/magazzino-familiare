import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Category, CategoryType, Material, Movement } from './types'

let _client: SupabaseClient | null = null

function client(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Variabili Supabase mancanti: configura NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return _client
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await client().from('categories').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await client()
    .from('materials')
    .select('*, category:categories(*)')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createMaterial(
  name: string,
  categoryId: string | null,
  unit: string,
  minStock: number
): Promise<Material> {
  const { data, error } = await client()
    .from('materials')
    .insert({ name, category_id: categoryId, unit, current_stock: 0, min_stock: minStock })
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data
}

export async function applyMovement(
  materialId: string,
  quantity: number,
  type: 'in' | 'out',
  notes: string | null,
  voiceInput: string | null
): Promise<void> {
  const delta = type === 'in' ? quantity : -quantity
  const { data: material, error: fetchError } = await client()
    .from('materials')
    .select('current_stock')
    .eq('id', materialId)
    .single()
  if (fetchError) throw fetchError

  const newStock = Math.max(0, (material.current_stock as number) + delta)

  const { error: moveError } = await client()
    .from('movements')
    .insert({ material_id: materialId, quantity, type, notes, voice_input: voiceInput })
  if (moveError) throw moveError

  const { error: updateError } = await client()
    .from('materials')
    .update({ current_stock: newStock })
    .eq('id', materialId)
  if (updateError) throw updateError
}

export async function getMovements(limit = 50): Promise<Movement[]> {
  const { data, error } = await client()
    .from('movements')
    .select('*, material:materials(name, unit, category:categories(*))')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getLowStockMaterials(): Promise<Material[]> {
  const { data, error } = await client()
    .from('materials')
    .select('*, category:categories(*)')
    .filter('min_stock', 'gt', 0)
  if (error) throw error
  return (data ?? []).filter((m: Material) => m.current_stock <= m.min_stock)
}

export async function updateMaterial(
  id: string,
  updates: Partial<Pick<Material, 'name' | 'unit' | 'min_stock' | 'category_id'> & { current_stock: number }>
): Promise<void> {
  const { error } = await client().from('materials').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await client().from('materials').delete().eq('id', id)
  if (error) throw error
}

export async function createCategory(
  name: string,
  type: CategoryType,
  icon: string,
  color: string
): Promise<Category> {
  const { data, error } = await client()
    .from('categories')
    .insert({ name, type, icon, color })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'type' | 'icon' | 'color'>>
): Promise<void> {
  const { error } = await client().from('categories').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await client().from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function countMaterialsByCategory(id: string): Promise<number> {
  const { count, error } = await client()
    .from('materials')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
  if (error) throw error
  return count ?? 0
}

export async function listMaterialsByCategory(id: string): Promise<Material[]> {
  const { data, error } = await client()
    .from('materials')
    .select('*')
    .eq('category_id', id)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function reassignCategoryMaterials(fromId: string, toId: string | null): Promise<void> {
  const { error } = await client()
    .from('materials')
    .update({ category_id: toId })
    .eq('category_id', fromId)
  if (error) throw error
}

export async function deleteMaterialsByCategory(id: string): Promise<void> {
  const { error } = await client().from('materials').delete().eq('category_id', id)
  if (error) throw error
}
