import { getLowStockMaterials } from '@/lib/supabase'
import AlertClient from '@/components/AlertClient'

export default async function AlertPage() {
  const materials = await getLowStockMaterials().catch(() => [])
  return <AlertClient initialMaterials={materials} />
}
