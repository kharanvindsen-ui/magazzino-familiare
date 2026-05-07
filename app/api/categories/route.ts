import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/supabase'

export async function GET() {
  try {
    const data = await getCategories()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
