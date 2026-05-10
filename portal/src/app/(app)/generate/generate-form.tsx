'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Copy, Check, AlertCircle } from 'lucide-react'
import type { CoverFieldsPayload, GenerateResponse } from '@/lib/worker'
import { CoverEditor } from '@/components/generate/cover-editor'

type Phase = 'idle' | 'generating' | 'ready' | 'error'

export function GenerateForm() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [copied, setCopied] = useState(false)

  async function onGenerate() {
    if (!url.trim()) {
      setError('วาง YouTube URL ก่อน')
      return
    }
    setPhase('generating')
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as GenerateResponse
      setResult(data)
      setPhase('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      setPhase('error')
    }
  }

  async function copyContent() {
    if (!result?.content) return
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="space-y-6">
      <UrlInputBar
        url={url}
        setUrl={setUrl}
        onGenerate={onGenerate}
        busy={phase === 'generating'}
      />

      {error && (
        <div
          className="flex items-start gap-2 px-4 py-3 rounded-[10px] text-sm"
          style={{ background: 'rgba(159,42,24,0.08)', color: '#9F2A18' }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {phase === 'generating' && <GeneratingState />}

      {phase === 'ready' && result && (
        <ResultGrid
          result={result}
          copied={copied}
          onCopy={copyContent}
        />
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────

function UrlInputBar({
  url,
  setUrl,
  onGenerate,
  busy,
}: {
  url: string
  setUrl: (v: string) => void
  onGenerate: () => void
  busy: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        disabled={busy}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !busy) onGenerate()
        }}
        className="flex-1 h-12 px-4 rounded-[10px] bg-card border border-border text-base focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onGenerate}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[10px] font-medium disabled:opacity-50 transition-colors"
        style={{ background: '#09321F', color: '#F1ECDF' }}
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate
          </>
        )}
      </button>
    </div>
  )
}

function GeneratingState() {
  return (
    <div className="rounded-[14px] border border-border-soft p-8 text-center">
      <Loader2 className="animate-spin mx-auto mb-3" size={28} />
      <p className="text-sm text-text-muted">
        กำลังดึง transcript → สรุป → เขียน FB post + cover (30-60 วินาที)
      </p>
    </div>
  )
}

function ResultGrid({
  result,
  copied,
  onCopy,
}: {
  result: GenerateResponse
  copied: boolean
  onCopy: () => void
}) {
  const initialCover: CoverFieldsPayload = {
    line1: result.cover_data.line1 ?? '',
    line2: result.cover_data.line2 ?? '',
    line3: result.cover_data.line3 ?? '',
    line1_highlight: result.cover_data.line1_highlight ?? null,
    line2_highlight: result.cover_data.line2_highlight ?? null,
    line3_highlight: result.cover_data.line3_highlight ?? null,
    subhead: result.cover_data.subhead ?? null,
    arrow_caption_top: result.cover_data.arrow_caption_top ?? null,
    arrow_caption_bottom: result.cover_data.arrow_caption_bottom ?? null,
    arrow_position: result.cover_data.arrow_position ?? 'bottom-left',
    cover_template: result.cover_data.cover_template ?? 'trendtech-portrait',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left: post copy */}
      <div className="bg-card border border-border-soft rounded-[14px] p-5 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-text-muted">
            Post copy
          </h2>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[8px] hover:bg-secondary transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} /> Copied
              </>
            ) : (
              <>
                <Copy size={13} /> Copy
              </>
            )}
          </button>
        </div>
        <textarea
          value={result.content}
          readOnly
          className="flex-1 min-h-[480px] w-full font-mono text-[13px] leading-relaxed p-3 rounded-[8px] bg-background border border-border-soft resize-none focus:outline-none"
        />
        {result.style_warnings.length > 0 && (
          <div className="mt-3 text-xs text-text-muted space-y-0.5">
            {result.style_warnings.map((w, i) => (
              <div key={i}>· {w}</div>
            ))}
          </div>
        )}
      </div>

      {/* Right: live cover editor */}
      <div className="bg-card border border-border-soft rounded-[14px] p-5">
        <CoverEditor
          draftId={result.draft_id}
          initialCover={initialCover}
          initialCoverUrl={result.cover_url}
          videoMeta={result.video_meta}
        />
      </div>
    </div>
  )
}
