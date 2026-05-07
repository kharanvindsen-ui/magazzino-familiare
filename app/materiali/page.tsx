import { getMaterials } from '@/lib/supabase'
import MaterialiClient from '@/components/MaterialiClient'

export default async function MaterialiPage() {
  const materials = await getMaterials().catch(() => [])
  return <MaterialiClient initialMaterials={materials} />
}
