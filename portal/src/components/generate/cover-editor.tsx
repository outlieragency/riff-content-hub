'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Download, Upload, X } from 'lucide-react'
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
  initialVideoMeta: VideoMetaPayload
}

export function CoverEditor({
  draftId,
  initialCover,
  initialCoverUrl,
  initialVideoMeta,
}: Props) {
  const [fields, setFields] = useState<CoverFieldsPayload>(initialCover)
  const [meta, setMeta] = useState<VideoMetaPayload>(initialVideoMeta)
  const [previewSrc, setPreviewSrc] = useState<string | null>(initialCoverUrl)
  const [rendering, setRendering] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hasOverride, setHasOverride] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Render-relevant fields → debounce key.
  const previewKey = useMemo(
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
        cn: meta.channel_name,
        sc: meta.subscriber_count,
        ca: meta.channel_avatar_url,
        tn: meta.thumbnail_url,
        ov: hasOverride,
      }),
    [fields, meta, hasOverride],
  )

  // Skip the very first effect — initialCoverUrl is already showing
  // and the inputs match it exactly, so no need to repaint.
  const skipFirst = useRef(true)

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }
    const handle = setTimeout(() => {
      void renderPreview()
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey])

  async function renderPreview() {
    setRendering(true)
    setError(null)
    try {
      const res = await fetch('/api/cover/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover: fields,
          video_meta: meta,
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

  function patchMeta<K extends keyof VideoMetaPayload>(
    key: K,
    value: VideoMetaPayload[K],
  ) {
    setMeta((cur) => ({ ...cur, [key]: value }))
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

  async function handleFileSelected(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('draft_id', draftId)
      fd.append('file', file)
      const res = await fetch('/api/cover/upload-source', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? body.error ?? `HTTP ${res.status}`)
      }
      // Override now lives at fb-covers/{user}/{draft}/cover-photo.png — toggling
      // hasOverride re-runs renderPreview which picks up the override.
      setHasOverride(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function clearOverride() {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/cover/clear-source?draft_id=${draftId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? body.error ?? `HTTP ${res.status}`)
      }
      setHasOverride(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'clear failed')
    } finally {
      setUploading(false)
    }
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
        {(rendering || uploading) && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(9,50,31,0.55)' }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium"
              style={{ background: '#FBF7EC', color: '#09321F' }}
            >
              <Loader2 size={14} className="animate-spin" />
              {uploading ? 'Uploading' : 'Rendering'}
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

      {/* Image source row ────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFileSelected(f)
            e.target.value = '' // allow same-file re-select
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[8px] bg-secondary hover:bg-secondary/80 disabled:opacity-50"
        >
          <Upload size={13} /> Replace photo
        </button>
        {hasOverride && (
          <button
            type="button"
            onClick={clearOverride}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[8px] hover:bg-secondary disabled:opacity-50"
          >
            <X size={13} /> Use YouTube thumbnail
          </button>
        )}
      </div>

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

      {/* Creator badge editor ────────────────────────────────── */}
      <details className="rounded-[10px] border border-border-soft">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Creator badge
        </summary>
        <div className="px-3 pb-3 space-y-2">
          <Field label="Channel name">
            <Input
              value={meta.channel_name ?? ''}
              onChange={(v) => patchMeta('channel_name', v || null)}
              placeholder="@earthrati"
            />
          </Field>
          <Field label="Subscribers (number)">
            <Input
              value={
                meta.subscriber_count != null ? String(meta.subscriber_count) : ''
              }
              onChange={(v) => {
                const trimmed = v.trim()
                if (!trimmed) {
                  patchMeta('subscriber_count', null)
                  return
                }
                const n = Number(trimmed.replace(/[,_]/g, ''))
                if (Number.isFinite(n)) patchMeta('subscriber_count', n)
              }}
              placeholder="55400"
            />
          </Field>
          <Field label="Avatar URL">
            <Input
              value={meta.channel_avatar_url ?? ''}
              onChange={(v) => patchMeta('channel_avatar_url', v || null)}
              placeholder="https://yt3.googleusercontent.com/..."
            />
          </Field>
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
