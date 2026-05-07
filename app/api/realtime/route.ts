import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  let cleanup: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )

      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* controller già chiuso */ }
      }

      send({ type: 'connected' })

      const channel = supabase
        .channel('sse-magazzino')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' },
          () => send({ type: 'update', table: 'materials' }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' },
          () => send({ type: 'update', table: 'movements' }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' },
          () => send({ type: 'update', table: 'categories' }))
        .subscribe()

      // Heartbeat ogni 25s per tenere viva la connessione
      const heartbeat = setInterval(() => send({ type: 'ping' }), 25_000)

      cleanup = () => {
        clearInterval(heartbeat)
        supabase.removeChannel(channel)
      }
    },
    cancel() {
      cleanup?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
