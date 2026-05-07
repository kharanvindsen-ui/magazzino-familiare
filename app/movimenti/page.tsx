import { getMovements } from '@/lib/supabase'
import MovimentiClient from '@/components/MovimentiClient'

export default async function MovimentiPage() {
  const movements = await getMovements(100).catch(() => [])
  return <MovimentiClient initialMovements={movements} />
}
