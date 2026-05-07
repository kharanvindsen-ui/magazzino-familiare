import { NextRequest, NextResponse } from 'next/server'
import { getMaterials, getLowStockMaterials, createMaterial } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const low = req.nextUrl.searchParams.get('low') === 'true'
    const data = low ? await getLowStockMaterials() : await getMaterials()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, categoryId, unit, minStock } = await req.json()
    const material = await createMaterial(name, categoryId ?? null, unit, minStock ?? 0)
    return NextResponse.json(material)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
