import { getMaterials, getLowStockMaterials } from '@/lib/supabase'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [materials, lowStock] = await Promise.all([
    getMaterials().catch(() => []),
    getLowStockMaterials().catch(() => []),
  ])
  return <Dashboard initialMaterials={materials} initialLowStock={lowStock} />
}
