import { getCategories } from '@/lib/supabase'
import CategorieClient from '@/components/CategorieClient'

export const dynamic = 'force-dynamic'

export default async function CategoriePage() {
  const categories = await getCategories().catch(() => [])
  return <CategorieClient initialCategories={categories} />
}
