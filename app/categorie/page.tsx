import { getCategories, getMacroCategories } from '@/lib/supabase'
import CategorieClient from '@/components/CategorieClient'

export const dynamic = 'force-dynamic'

export default async function CategoriePage() {
  const [categories, macros] = await Promise.all([
    getCategories().catch(() => []),
    getMacroCategories().catch(() => []),
  ])
  return <CategorieClient initialCategories={categories} initialMacros={macros} />
}
