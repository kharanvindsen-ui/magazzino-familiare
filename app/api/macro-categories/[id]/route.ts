import { NextRequest, NextResponse } from 'next/server'
import {
  countCategoriesByMacro,
  deleteMacroCategory,
  reassignMacroCategories,
  updateMacroCategory,
} from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const count = await countCategoriesByMacro(id)
    return NextResponse.json({ categoriesCount: count })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await req.json()
    await updateMacroCategory(id, updates)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const mode = req.nextUrl.searchParams.get('mode') ?? 'empty'
    const reassignTo = req.nextUrl.searchParams.get('to')

    if (mode === 'reassign') {
      await reassignMacroCategories(id, reassignTo || null)
    } else if (mode === 'detach') {
      await reassignMacroCategories(id, null)
    } else if (mode === 'empty') {
      const count = await countCategoriesByMacro(id)
      if (count > 0) {
        return NextResponse.json(
          { error: `La macro ha ${count} categorie collegate. Trasferiscile o staccale prima.` },
          { status: 409 }
        )
      }
    } else {
      return NextResponse.json({ error: 'Modalità non valida' }, { status: 400 })
    }

    await deleteMacroCategory(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
