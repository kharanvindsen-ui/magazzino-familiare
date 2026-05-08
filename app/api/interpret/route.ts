import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ParsedVoiceCommand } from '@/lib/types'
import { getMacroCategories } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Testo mancante' }, { status: 400 })
    }

    const macros = await getMacroCategories().catch(() => [])
    const macroNames = macros.map(m => m.name)
    const macroList = macroNames.length
      ? macroNames.map(n => `"${n}"`).join(' | ') + ' | null'
      : 'null'
    const macroHint = macroNames.length
      ? `Le macro categorie disponibili sono: ${macroNames.join(', ')}. Scegli quella più pertinente al materiale, oppure null se non sei sicuro.`
      : 'Nessuna macro disponibile, usa null.'

    const SYSTEM_PROMPT = `Sei un assistente per la gestione di un magazzino familiare italiano.
Il tuo compito è analizzare frasi in italiano che descrivono movimenti di materiali e restituire un JSON strutturato.

Regole:
- "ho usato", "ho consumato", "ho messo", "ho applicato" → movement_type: "out"
- "ho comprato", "ho preso", "ho caricato", "ho ricevuto", "ho acquistato" → movement_type: "in"
- Se non è chiaro, deduci dal contesto (es. "per l'impianto" = uso = "out")
- ${macroHint}
- Il nome del materiale deve rispecchiare ESATTAMENTE le parole pronunciate: non aggiungere, rimuovere o parafrasare (es. non aggiungere "diametro", "tipo", "modello" se non detti)
- Normalizza le unità: mt/m/metri → "metri", pz/pezzo/pezzi → "pz", lt/litri/l → "litri", kg/chili → "kg"
- Se le unità non sono specificate, usa "pz"
- confidence: 0.0-1.0 (quanto sei sicuro dell'interpretazione)

Rispondi SOLO con JSON valido, senza markdown, senza spiegazioni.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analizza questa frase: "${text}"

Restituisci un JSON con questa struttura esatta:
{
  "material_name": "nome del materiale",
  "quantity": numero,
  "movement_type": "in" | "out",
  "unit": "unità",
  "notes": "note aggiuntive o null",
  "category_hint": ${macroList},
  "confidence": 0.0-1.0
}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Risposta non valida')

    const raw = content.text.trim()
    const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed: ParsedVoiceCommand = JSON.parse(jsonText)

    if (!parsed.material_name || !parsed.quantity || !parsed.movement_type) {
      throw new Error('Dati incompleti')
    }

    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
