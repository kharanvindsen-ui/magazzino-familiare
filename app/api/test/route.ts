import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Variabili d\'ambiente mancanti', url: !!url, key: !!key })
  }

  try {
    const supabase = createClient(url, key)
    const { data, error, count } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code, details: error.details })
    }

    const { data: cats } = await supabase.from('categories').select('name, type')

    return NextResponse.json({
      ok: true,
      materials_count: count,
      categories: cats?.map(c => c.name),
      supabase_url: url.replace(/https:\/\/(.{6}).*\.supabase\.co/, 'https://$1***.supabase.co'),
      key_format: key.startsWith('sb_publishable_') ? 'nuovo (sb_publishable_)' : 'JWT (eyJ...)',
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) })
  }
}
