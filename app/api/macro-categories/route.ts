import { NextRequest, NextResponse } from 'next/server'
import { createMacroCategory, getMacroCategories } from '@/lib/supabase'

export async function GET() {
  try {
    const data = await getMacroCategories()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, icon, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })
    const macro = await createMacroCategory(name.trim(), icon || '📦', color || '#3B82F6')
    return NextResponse.json(macro)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
