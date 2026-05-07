import { NextRequest, NextResponse } from 'next/server'
import { getMovements, applyMovement } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100')
    const data = await getMovements(limit)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { materialId, quantity, type, notes, voiceInput } = await req.json()
    await applyMovement(materialId, quantity, type, notes ?? null, voiceInput ?? null)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
