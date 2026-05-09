'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Check, Copy, Loader2, Wand2 } from 'lucide-react'
import { rewriteWithVoice } from '@/lib/actions/tools'

const SAMPLE_PROMPTS = [
  'AI ทำให้ทำงานเร็วขึ้น 10 เท่า แต่ยังต้องคิดเอง',
  'ถ้าคุณกำลังจะเริ่มขายของออนไลน์ อย่าทำผิดพลาดเหมือนผม',
  '5 เครื่องมือที่ผมใช้ทุกวันในการสร้าง content',
]

/**
 * "Test mode" for a voice profile — paste any text and see how AI rewrites it
 * using the active voice. Side-by-side comparison so user sees the diff.
 */
export function VoiceTestMode({ voiceProfileId }: { voiceProfileId: string }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ model: string; latency_ms: number } | null>(
    null,
  )
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)

  function run() {
    if (!input.trim()) {
      setError('ใส่ text ที่อยากทดสอบก่อน')
      return
    }
    setError(null)
    setOutput(null)
    setMeta(null)
    start(async () => {
      const res = await rewriteWithVoice({
        voice_profile_id: voiceProfileId,
        text: input,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOutput(res.output_markdown)
      setMeta({ model: res.meta.model, latency_ms: res.meta.latency_ms })
    })
  }

  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-[14px] border border-border-soft bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-[10px] bg-brand-soft text-brand inline-flex items-center justify-center shrink-0">
          <Wand2 size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Test voice on text
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            paste ข้อความใดก็ได้ → AI rewrite ในเสียงคุณ — ใช้ตรวจ voice profile ก่อน generate ของจริง
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {/* Original */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Original
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="paste text หรือเลือก sample ด้านล่าง..."
            rows={8}
            disabled={pending}
            className="w-full px-3 py-2 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-y"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SAMPLE_PROMPTS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(s)}
                disabled={pending}
                className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Rewritten */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Rewritten in your voice
            </div>
            {output && (
              <div className="flex items-center gap-2 text-[10px]">
                {meta && (
                  <span className="text-muted-foreground tabular-nums">
                    {(meta.latency_ms / 1000).toFixed(1)}s
                  </span>
                )}
                <button
                  type="button"
                  onClick={copy}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  Copy
                </button>
              </div>
            )}
          </div>
          <div
            className={`min-h-[208px] px-3 py-2 rounded-[8px] border bg-background text-sm leading-relaxed whitespace-pre-wrap ${
              output ? 'border-emerald-200 text-foreground' : 'border-border-soft text-muted-foreground italic'
            }`}
          >
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="animate-spin" size={12} />
                AI กำลัง rewrite...
              </span>
            ) : output ? (
              output
            ) : (
              'output จะปรากฏตรงนี้หลังกด rewrite'
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm bg-status-red-bg border border-status-red-border text-status-red-text rounded-[8px] px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={run}
          disabled={pending || !input.trim()}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              กำลัง rewrite...
            </>
          ) : (
            <>
              <ArrowRight size={14} />
              Rewrite ในเสียงนี้
            </>
          )}
        </button>
      </div>
    </section>
  )
}
