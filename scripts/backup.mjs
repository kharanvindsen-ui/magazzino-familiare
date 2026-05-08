#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnvLocal() {
  const path = join(ROOT, '.env.local')
  if (!existsSync(path)) {
    console.error('❌ File .env.local non trovato in', path)
    process.exit(1)
  }
  const content = readFileSync(path, 'utf8')
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY mancanti in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

async function dumpTable(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    const msg = error.message ?? ''
    const missing =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /does not exist/i.test(msg) ||
      /could not find the table/i.test(msg) ||
      /schema cache/i.test(msg)
    if (missing) {
      console.warn(`⚠  Tabella "${table}" non esiste — skip`)
      return null
    }
    throw new Error(`Errore lettura "${table}": ${msg}`)
  }
  return data ?? []
}

async function main() {
  const startedAt = new Date()
  console.log(`▶  Backup avviato — ${startedAt.toISOString()}`)
  console.log(`   Supabase: ${url}`)

  const tables = ['macro_categories', 'categories', 'materials', 'movements']
  const dump = {
    meta: {
      exportedAt: startedAt.toISOString(),
      supabaseUrl: url,
      app: 'magazzino-familiare',
    },
    tables: {},
  }

  const summary = []
  for (const t of tables) {
    process.stdout.write(`   • ${t}... `)
    const rows = await dumpTable(t)
    if (rows === null) {
      summary.push({ table: t, count: 'n/a' })
      console.log('skip')
      continue
    }
    dump.tables[t] = rows
    summary.push({ table: t, count: rows.length })
    console.log(`${rows.length} righe`)
  }

  const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
  const outDir = join(ROOT, 'backups')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `backup-${stamp}.json`)
  writeFileSync(outPath, JSON.stringify(dump, null, 2), 'utf8')

  console.log(`\n✅ Backup salvato: ${outPath}`)
  console.table(summary)
}

main().catch(err => {
  console.error('\n❌ Errore durante il backup:', err.message ?? err)
  process.exit(1)
})
