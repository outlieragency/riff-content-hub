'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type {
  CoverFieldsPayload,
  VideoMetaPayload,
} from '@/lib/worker'

const CANVAS_W = 1080
const CANVAS_H = 1350

type Props = {
  draftId?: string
  cover: CoverFieldsPayload
  videoMeta?: VideoMetaPayload
  /** Debounce window in ms before fetching new HTML. 200ms keeps it
   *  feeling real-time while collapsing rapid typing. */
  debounceMs?: number
}

/**
 * Live cover preview backed by the SAME Jinja2 template Playwright
 * screenshots on save. Server returns HTML → iframe renders it →
 * browser handles CSS / fonts / layout exactly as Chromium would in
 * the screenshot path. Eliminates the React/Jinja2 drift that
 * cover-live-preview.tsx struggled with (live ≠ PNG).
 */
export function CoverIframePreview({
  draftId,
  cover,
  videoMeta,
  debounceMs = 200,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const reqIdRef = useRef(0)

  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)

  // Re-fetch only when cover/meta change, not on every render.
  const key = useMemo(
    () =>
      JSON.stringify({
        c: cover,
        v: videoMeta,
        d: draftId,
      }),
    [cover, videoMeta, draftId],
  )

  useEffect(() => {
    const handle = setTimeout(() => {
      const myReqId = ++reqIdRef.current
      setLoading(true)
      setError(null)
      fetch('/api/cover/preview-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover,
          video_meta: videoMeta,
          draft_id: draftId,
        }),
      })
        .then(async (res) => {
          const txt = await res.text()
          if (!res.ok) {
            let detail = `HTTP ${res.status}`
            try {
              const j = JSON.parse(txt)
              detail = j.error || j.detail || detail
            } catch {
              if (txt) detail = `${detail}: ${txt.slice(0, 200)}`
            }
            throw new Error(detail)
          }
          return JSON.parse(txt) as { html: string }
        })
        .then((data) => {
          if (myReqId !== reqIdRef.current) return
          setHtml(data.html)
        })
        .catch((e: unknown) => {
          if (myReqId !== reqIdRef.current) return
          setError(e instanceof Error ? e.message : 'preview failed')
        })
        .finally(() => {
          if (myReqId === reqIdRef.current) setLoading(false)
        })
    }, debounceMs)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Watch container width and scale the 1080×1350 iframe to fit.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    function recompute() {
      if (!wrapper) return
      const w = wrapper.clientWidth
      if (w > 0) setScale(w / CANVAS_W)
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-[#0a0a0a] rounded-[10px] overflow-hidden"
      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
    >
      {html ? (
        <iframe
          ref={iframeRef}
          title="cover preview"
          srcDoc={html}
          sandbox="allow-same-origin"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${CANVAS_W}px`,
            height: `${CANVAS_H}px`,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
          {error ? (
            <span className="px-3 py-2 rounded-[8px] bg-red-600/80 text-white text-xs max-w-[80%] text-center">
              {error}
            </span>
          ) : (
            <Loader2 size={20} className="animate-spin" />
          )}
        </div>
      )}

      {loading && html && (
        <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 text-white text-[10px] font-medium pointer-events-none">
          <Loader2 size={10} className="animate-spin" />
          updating
        </div>
      )}
    </div>
  )
}
