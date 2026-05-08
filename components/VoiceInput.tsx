'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Loader2, Check, X, RotateCcw } from 'lucide-react'
import { ParsedVoiceCommand, Material, MaterialMatch } from '@/lib/types'

interface Props {
  onConfirm: (command: ParsedVoiceCommand, voiceText: string, matched: Material) => Promise<void>
  onClose: () => void
  findMatches: (name: string) => MaterialMatch[]
}

type State = 'idle' | 'recording' | 'processing' | 'preview' | 'error' | 'success'

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export default function VoiceInput({ onConfirm, onClose, findMatches }: Props) {
  const [state, setState] = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [parsed, setParsed] = useState<ParsedVoiceCommand | null>(null)
  const [matched, setMatched] = useState<Material | null>(null)
  const [candidates, setCandidates] = useState<MaterialMatch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const recRef = useRef<ISpeechRecognition | null>(null)
  const transcriptRef = useRef('')
  const findMatchesRef = useRef(findMatches)
  useEffect(() => { findMatchesRef.current = findMatches }, [findMatches])

  useEffect(() => {
    return () => { recRef.current?.stop() }
  }, [])

  const interpret = useCallback(async (text: string) => {
    setState('processing')
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: ParsedVoiceCommand = await res.json()
      setParsed(data)

      const results = findMatchesRef.current(data.material_name)
      setCandidates(results)
      // auto-match if top result is confident enough
      setMatched(results.length > 0 && results[0].score >= 0.65 ? results[0].material : null)

      setState('preview')
    } catch {
      setError('Impossibile interpretare. Riprova o usa i tasti manuali.')
      setState('error')
    }
  }, [])

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      setError('Riconoscimento vocale non supportato. Usa Chrome o Safari.')
      setState('error')
      return
    }
    transcriptRef.current = ''
    setTranscript('')
    setInterim('')

    const rec = new SR()
    rec.lang = 'it-IT'
    rec.continuous = false
    rec.interimResults = true

    let interpreted = false

    rec.onresult = (e) => {
      let fin = ''
      let int = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript
        else int += e.results[i][0].transcript
      }
      if (fin) {
        transcriptRef.current = fin
        setTranscript(fin)
      }
      setInterim(int)
    }

    rec.onend = () => {
      if (interpreted) return
      interpreted = true
      setInterim('')
      const text = transcriptRef.current.trim()
      if (text) interpret(text)
      else setState('idle')
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') { rec.stop(); return }
      if (e.error !== 'aborted') {
        setError(`Errore microfono: ${e.error}`)
        setState('error')
      }
    }

    recRef.current = rec
    rec.start()
    setState('recording')
  }, [interpret])

  const stopRecording = () => recRef.current?.stop()

  const handleConfirm = async () => {
    if (!parsed || !matched) return
    setSaving(true)
    try {
      await onConfirm(parsed, transcript, matched)
      setState('success')
      setTimeout(onClose, 1200)
    } catch {
      setError('Errore nel salvataggio. Riprova.')
      setState('error')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setState('idle')
    setTranscript('')
    setInterim('')
    setParsed(null)
    setMatched(null)
    setCandidates([])
    setError(null)
    transcriptRef.current = ''
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-0" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4 min-h-64"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Input Vocale</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {state === 'idle' && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-6">Descrivi il movimento a voce in italiano</p>
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-xl hover:bg-blue-600 active:scale-95 transition-all"
            >
              <Mic size={36} />
            </button>
            <p className="text-xs text-gray-400 mt-4 italic">
              Es. "Ho usato 3 metri di cavo elettrico"<br />
              Es. "Comprati 20 litri di vernice bianca"
            </p>
          </div>
        )}

        {state === 'recording' && (
          <div className="text-center py-6">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full bg-red-200 animate-ping" />
              <button
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl"
              >
                <MicOff size={32} />
              </button>
            </div>
            <p className="text-red-500 font-semibold mb-3">In ascolto... tocca per fermare</p>
            {(transcript || interim) && (
              <div className="text-left bg-gray-50 rounded-xl p-3 text-sm">
                <span className="text-gray-700">{transcript}</span>
                <span className="text-gray-400 italic">{interim}</span>
              </div>
            )}
          </div>
        )}

        {state === 'processing' && (
          <div className="text-center py-6">
            <Loader2 size={44} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-3">Interpretazione con AI...</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 italic">
              "{transcript}"
            </div>
          </div>
        )}

        {state === 'preview' && parsed && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 italic">
              "{transcript}"
            </div>

            {/* Matched material or suggestions */}
            {matched ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm">
                <Check size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-gray-500 text-xs">Materiale:</span>
                <span className="font-semibold text-green-800 flex-1">{matched.name}</span>
                <button
                  onClick={() => setMatched(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs underline"
                >
                  cambia
                </button>
              </div>
            ) : candidates.length > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
                <p className="text-xs text-yellow-800 font-medium">Seleziona il materiale corretto:</p>
                {candidates.map(({ material, score }) => (
                  <button
                    key={material.id}
                    onClick={() => setMatched(material)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 bg-white border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">{material.name}</span>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {Math.round(score * 100)}% simile
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
                Materiale non trovato — riregistra usando il nome esatto del magazzino
              </div>
            )}

            {/* Movement details */}
            <div className={`rounded-xl p-4 ${parsed.movement_type === 'in' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  parsed.movement_type === 'in' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {parsed.movement_type === 'in' ? '↑ CARICO' : '↓ SCARICO'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  parsed.confidence > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {Math.round(parsed.confidence * 100)}% sicuro
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Quantità</p>
                  <p className="font-semibold">{parsed.quantity} {parsed.unit}</p>
                </div>
                {parsed.notes && (
                  <div>
                    <p className="text-gray-400 text-xs">Note</p>
                    <p className="font-semibold">{parsed.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={16} /> Riregistra
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || !matched}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center gap-2 font-semibold transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Conferma
              </button>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check size={32} className="text-green-600" />
            </div>
            <p className="font-semibold text-green-700">Movimento registrato!</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center py-6">
            <p className="text-red-500 mb-4 text-sm">{error}</p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold transition-colors"
            >
              Riprova
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
