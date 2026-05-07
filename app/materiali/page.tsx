import { getMaterials } from '@/lib/supabase'
import MaterialiClient from '@/components/MaterialiClient'

export const dynamic = 'force-dynamic'

export default async function MaterialiPage() {
  const materials = await getMaterials().catch(() => [])
  return <MaterialiClient initialMaterials={materials} />
}
