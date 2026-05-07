import { getMovements } from '@/lib/supabase'
import MovimentiClient from '@/components/MovimentiClient'

export const dynamic = 'force-dynamic'

export default async function MovimentiPage() {
  const movements = await getMovements(100).catch(() => [])
  return <MovimentiClient initialMovements={movements} />
}
