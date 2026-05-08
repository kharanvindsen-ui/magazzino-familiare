import { NextRequest, NextResponse } from 'next/server'
import {
  countMaterialsByCategory,
  deleteCategory,
  deleteMaterialsByCategory,
  reassignCategoryMaterials,
  updateCategory,
} from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const count = await countMaterialsByCategory(id)
    return NextResponse.json({ materialsCount: count })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await req.json()
    await updateCategory(id, updates)
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
      await reassignCategoryMaterials(id, reassignTo || null)
    } else if (mode === 'cascade') {
      await deleteMaterialsByCategory(id)
    } else if (mode === 'empty') {
      const count = await countMaterialsByCategory(id)
      if (count > 0) {
        return NextResponse.json(
          { error: `La categoria ha ${count} materiali collegati. Trasferiscili o eliminali prima.` },
          { status: 409 }
        )
      }
    } else {
      return NextResponse.json({ error: 'Modalità non valida' }, { status: 400 })
    }

    await deleteCategory(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
