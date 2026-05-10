'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import type { CoverFieldsPayload, VideoMetaPayload } from '@/lib/worker'

const ARROW_POSITIONS = [
  { id: 'bottom-left', label: 'Bottom-left' },
  { id: 'left', label: 'Mid-left' },
  { id: 'top-left', label: 'Top-left' },
  { id: 'center', label: 'Center' },
] as const

type Props = {
  draftId: string
  initialCover: CoverFieldsPayload
  initialCoverUrl: string | null
  videoMeta: VideoMetaPayload
}

export function CoverEditor({
  draftId,
  initialCover,
  initialCoverUrl,
  videoMeta,
}: Props) {
  const [fields, setFields] = useState<CoverFieldsPayload>(initialCover)
  // Either a data URI from latest /preview render, or the original
  // cover_url returned by /generate. data URIs are most accurate
  // (reflect current edits); falling back to the URL keeps something
  // visible while the first preview is in flight.
  const [previewSrc, setPreviewSrc] = useState<string | null>(initialCoverUrl)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce-key that only updates when render-relevant fields change.
  const fieldsKey = useMemo(
    () =>
      JSON.stringify({
        l1: fields.line1,
        l2: fields.line2,
        l3: fields.line3,
        h1: fields.line1_highlight,
        h2: fields.line2_highlight,
        h3: fields.line3_highlight,
        sh: fields.subhead,
        at: fields.arrow_caption_top,
        ab: fields.arrow_caption_bottom,
        ap: fields.arrow_position,
      }),
    [fields],
  )

  // Skip the very first effect tick — initial cover URL is already shown
  // and there's no reason to spend a render call to redraw the same thing.
  const skipFirstRender = useRef(true)

  useEffect(() => {
    if (skipFirstRender.current) {
      skipFirstRender.current = false
      return
    }
    const handle = setTimeout(() => {
      void renderPreview()
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldsKey])

  async function renderPreview() {
    setRendering(true)
    setError(null)
    try {
      const res = await fetch('/api/cover/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover: fields,
          video_meta: videoMeta,
          draft_id: draftId,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { cover_data_uri: string }
      setPreviewSrc(data.cover_data_uri)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'preview failed')
    } finally {
      setRendering(false)
    }
  }

  function patch<K extends keyof CoverFieldsPayload>(
    key: K,
    value: CoverFieldsPayload[K],
  ) {
    setFields((cur) => ({ ...cur, [key]: value }))
  }

  function downloadCover() {
    if (!previewSrc) return
    const a = document.createElement('a')
    a.href = previewSrc
    a.download = `riff-cover-${draftId}.png`
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-3">
      {/* Preview ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-text-muted">
          Cover
        </h2>
        <button
          type="button"
          onClick={downloadCover}
          disabled={!previewSrc || rendering}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[8px] hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <Download size={13} /> Download PNG
        </button>
      </div>

      <div className="relative rounded-[10px] overflow-hidden bg-background border border-border-soft">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="Cover" className="w-full h-auto block" />
        ) : (
          <div className="aspect-[4/5] flex items-center justify-center text-text-muted text-sm">
            Cover render failed
          </div>
        )}
        {rendering && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(9,50,31,0.55)' }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium"
              style={{ background: '#FBF7EC', color: '#09321F' }}
            >
              <Loader2 size={14} className="animate-spin" />
              Rendering
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="text-xs px-3 py-2 rounded-[8px]"
          style={{ background: 'rgba(159,42,24,0.08)', color: '#9F2A18' }}
        >
          {error}
        </div>
      )}

      {/* Headline editor ─────────────────────────────────────── */}
      <details className="rounded-[10px] border border-border-soft" open>
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Headline
        </summary>
        <div className="px-3 pb-3 space-y-3">
          <LineRow
            n={1}
            text={fields.line1}
            highlight={fields.line1_highlight ?? ''}
            colorHint="red"
            onText={(v) => patch('line1', v)}
            onHighlight={(v) => patch('line1_highlight', v || null)}
          />
          <LineRow
            n={2}
            text={fields.line2}
            highlight={fields.line2_highlight ?? ''}
            colorHint="yellow"
            onText={(v) => patch('line2', v)}
            onHighlight={(v) => patch('line2_highlight', v || null)}
          />
          <LineRow
            n={3}
            text={fields.line3}
            highlight={fields.line3_highlight ?? ''}
            colorHint="orange"
            onText={(v) => patch('line3', v)}
            onHighlight={(v) => patch('line3_highlight', v || null)}
          />
        </div>
      </details>

      {/* Sign-off ────────────────────────────────────────────── */}
      <details className="rounded-[10px] border border-border-soft">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Sign-off (subhead)
        </summary>
        <div className="px-3 pb-3">
          <Input
            value={fields.subhead ?? ''}
            onChange={(v) => patch('subhead', v || null)}
            placeholder="Earth Rati"
          />
        </div>
      </details>

      {/* Arrow caption ───────────────────────────────────────── */}
      <details className="rounded-[10px] border border-border-soft">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Arrow caption
        </summary>
        <div className="px-3 pb-3 space-y-2">
          <Field label="Top line">
            <Input
              value={fields.arrow_caption_top ?? ''}
              onChange={(v) => patch('arrow_caption_top', v || null)}
            />
          </Field>
          <Field label="Bottom line (yellow accent)">
            <Input
              value={fields.arrow_caption_bottom ?? ''}
              onChange={(v) => patch('arrow_caption_bottom', v || null)}
            />
          </Field>
          <Field label="Position">
            <select
              value={fields.arrow_position ?? 'bottom-left'}
              onChange={(e) => patch('arrow_position', e.target.value)}
              className="w-full h-9 px-2.5 rounded-[8px] bg-background border border-border-soft text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {ARROW_POSITIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </details>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────

function LineRow({
  n,
  text,
  highlight,
  colorHint,
  onText,
  onHighlight,
}: {
  n: number
  text: string
  highlight: string
  colorHint: 'red' | 'yellow' | 'orange'
  onText: (v: string) => void
  onHighlight: (v: string) => void
}) {
  const dot =
    colorHint === 'red'
      ? '#E53935'
      : colorHint === 'yellow'
        ? '#FFD400'
        : '#FF6B1A'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-text-muted">
        <span
          aria-hidden
          className="inline-block rounded-full"
          style={{ width: 8, height: 8, background: dot }}
        />
        Line {n}
      </div>
      <Input value={text} onChange={onText} placeholder={`บรรทัดที่ ${n}`} />
      <Input
        value={highlight}
        onChange={onHighlight}
        placeholder="ส่วนที่ highlight (substring ของบรรทัดบน)"
        small
      />
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  small,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  small?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-2.5 rounded-[8px] bg-background border border-border-soft focus:outline-none focus:ring-2 focus:ring-brand ${
        small ? 'h-8 text-xs' : 'h-9 text-sm'
      }`}
    />
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-text-muted mb-1">
        {label}
      </div>
      {children}
    </div>
  )
}
