import { NextRequest, NextResponse } from 'next/server'
import { createCategory, getCategories } from '@/lib/supabase'

export async function GET() {
  try {
    const data = await getCategories()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, icon, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    if (type !== 'lavoro' && type !== 'casa') return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 })
    const category = await createCategory(name.trim(), type, icon || '📦', color || '#3B82F6')
    return NextResponse.json(category)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
