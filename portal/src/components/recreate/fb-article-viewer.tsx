'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Quote,
  RefreshCw,
  Send,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FbArticleOutput } from '@/lib/types/recreate-formats'
import { FbBodyEditor } from './fb-body-editor'
import { FbCoverEditor } from './fb-cover-editor'
import { StylePicker } from './style-picker'
import { setDraftCreativeStyle } from '@/lib/actions/recreate'

const SLOT_PATTERNS = [
  /\[ผู้เขียนใส่ pitch product\/service ของตัวเองตรงนี้\]/g,
  /\[ผู้เขียนใส่ CTA ของตัวเองตรงนี้\]/g,
]

const REQUIRED_HASHTAGS = [
  '#อ่านจบปุ๊ปเก่งขึ้นปั๊ป',
  '#สรุ๊ปสรุป',
  '#ความเห็นฉบับเอิร์ธ',
]

const REQUIRED_SIGNATURE = 'หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม'

/** Highlight slot placeholders + required hashtags inline. */
function highlightPostBody(body: string): React.ReactNode[] {
  const tokens: { type: 'text' | 'slot' | 'hashtag' | 'signature'; value: string }[] = []

  // Build a list of all interesting markers (slot placeholders, hashtags, signature)
  // and their positions, then split body around them.
  type Marker = { start: number; end: number; type: 'slot' | 'hashtag' | 'signature' }
  const markers: Marker[] = []

  for (const re of SLOT_PATTERNS) {
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(body)) !== null) {
      markers.push({ start: m.index, end: m.index + m[0].length, type: 'slot' })
    }
  }
  for (const tag of REQUIRED_HASHTAGS) {
    let from = 0
    while (true) {
      const idx = body.indexOf(tag, from)
      if (idx === -1) break
      markers.push({ start: idx, end: idx + tag.length, type: 'hashtag' })
      from = idx + tag.length
    }
  }
  const sigIdx = body.indexOf(REQUIRED_SIGNATURE)
  if (sigIdx !== -1) {
    markers.push({
      start: sigIdx,
      end: sigIdx + REQUIRED_SIGNATURE.length,
      type: 'signature',
    })
  }

  markers.sort((a, b) => a.start - b.start)

  let cursor = 0
  for (const m of markers) {
    if (m.start < cursor) continue // overlap; skip
    if (m.start > cursor) {
      tokens.push({ type: 'text', value: body.slice(cursor, m.start) })
    }
    tokens.push({ type: m.type, value: body.slice(m.start, m.end) })
    cursor = m.end
  }
  if (cursor < body.length) {
    tokens.push({ type: 'text', value: body.slice(cursor) })
  }

  return tokens.map((t, i) => {
    if (t.type === 'slot') {
      return (
        <mark
          key={i}
          className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium"
        >
          {t.value}
        </mark>
      )
    }
    if (t.type === 'hashtag') {
      return (
        <span key={i} className="text-blue-600 font-semibold">
          {t.value}
        </span>
      )
    }
    if (t.type === 'signature') {
      return (
        <span key={i} className="text-emerald-600 font-medium">
          {t.value}
        </span>
      )
    }
    return <span key={i}>{t.value}</span>
  })
}

export function FbArticleViewer({
  draftId,
  output,
  status,
  creativeStyleId,
  creativeStyleName,
  referenceImages = [],
}: {
  draftId: string
  output: FbArticleOutput
  status: string
  creativeStyleId: string | null
  creativeStyleName?: string | null
  referenceImages?: { url: string; uploaded_at?: string }[]
}) {
  const router = useRouter()
  const [copied, setCopied] = useState<'body' | 'cover' | null>(null)
  const [editing, setEditing] = useState<'cover' | 'body' | null>(null)
  const [pushing, startPushing] = useTransition()
  const [pushError, setPushError] = useState<string | null>(null)
  const [posting, startPosting] = useTransition()
  const [rerendering, startRerendering] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [currentStyleId, setCurrentStyleId] = useState<string | null>(creativeStyleId)
  const [swappingStyle, startStyleSwap] = useTransition()

  const handleSwapStyle = (newId: string | null) => {
    if (newId === currentStyleId) return
    setCurrentStyleId(newId)
    startStyleSwap(async () => {
      const res = await setDraftCreativeStyle(draftId, newId)
      if (!res.ok) {
        showToast(res.error || 'swap style fail')
        setCurrentStyleId(creativeStyleId)
        return
      }
      // Auto-rerender with new style
      try {
        const rer = await fetch(`/api/recreated/${draftId}/save-cover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover: output.cover }),
        })
        if (!rer.ok) {
          const data = await rer.json().catch(() => ({}))
          showToast(data.error || 'rerender fail')
          return
        }
        showToast('เปลี่ยน style + render ใหม่แล้ว ✓')
        router.refresh()
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'rerender error')
      }
    })
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const handleCopyBody = async () => {
    if (!output.post_body) return
    await navigator.clipboard.writeText(output.post_body)
    setCopied('body')
    setTimeout(() => setCopied(null), 1500)
    showToast('Copy post body แล้ว')
  }

  const handleDownloadCover = async () => {
    if (!output.cover_url) return
    try {
      const { downloadUrlAs } = await import('@/lib/utils/download')
      await downloadUrlAs(output.cover_url, `riff-cover-${draftId}.png`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'download error')
    }
  }

  const handlePushToNotion = () => {
    setPushError(null)
    startPushing(async () => {
      try {
        const res = await fetch(`/api/recreated/${draftId}/push-notion`, {
          method: 'POST',
        })
        const data = await res.json()
        if (!res.ok) {
          setPushError(data.error || 'Notion push failed')
          return
        }
        showToast('Push to Notion สำเร็จ ✓')
        router.refresh()
      } catch (e: unknown) {
        setPushError(e instanceof Error ? e.message : 'push error')
      }
    })
  }

  const handleRerenderCover = () => {
    startRerendering(async () => {
      try {
        const res = await fetch(`/api/recreated/${draftId}/save-cover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover: output.cover }),
        })
        const data = await res.json()
        if (!res.ok) {
          showToast(data.error || 'Re-render error')
          return
        }
        showToast('Cover render ใหม่แล้ว ✓')
        router.refresh()
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'rerender error')
      }
    })
  }

  const handleMarkPosted = () => {
    startPosting(async () => {
      try {
        const res = await fetch(`/api/recreated/${draftId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        })
        if (!res.ok) {
          showToast('Update status ผิดพลาด')
          return
        }
        showToast('ตั้งสถานะ posted แล้ว ✓')
        router.refresh()
      } catch {
        showToast('Update status error')
      }
    })
  }

  const slotCount = SLOT_PATTERNS.reduce(
    (n, re) => n + ((output.post_body || '').match(re)?.length ?? 0),
    0
  )
  const missingHashtags = REQUIRED_HASHTAGS.filter(
    (t) => !(output.post_body || '').includes(t)
  )
  const hasSignature = (output.post_body || '').includes(REQUIRED_SIGNATURE)

  const allWarnings = [
    ...(output.style_warnings || []),
    ...(output.cover_warnings || []),
  ]

  if (editing === 'cover') {
    return (
      <FbCoverEditor
        draftId={draftId}
        initial={output.cover}
        initialCoverUrl={output.cover_url}
        initialCoverPhotoUrl={output.cover_photo_url}
        creativeStyleName={creativeStyleName ?? null}
        referenceImages={referenceImages}
        onClose={() => setEditing(null)}
      />
    )
  }

  if (editing === 'body') {
    return (
      <FbBodyEditor
        draftId={draftId}
        initialBody={output.post_body || ''}
        pristineBody={output.post_body || ''}
        onClose={() => setEditing(null)}
      />
    )
  }

  const isPublished = status === 'published'

  return (
    <div className="space-y-4 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-lg shadow-lg animate-in slide-in-from-top">
          {toast}
        </div>
      )}

      {/* Action bar — sticky at top */}
      <div className="surface-1 rounded-[14px] p-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleCopyBody}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-foreground text-background hover:opacity-90"
        >
          {copied === 'body' ? <Check size={14} /> : <Copy size={14} />}
          Copy post body
        </button>
        <button
          onClick={handleDownloadCover}
          disabled={!output.cover_url}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-border text-foreground hover:bg-secondary disabled:opacity-50"
        >
          <Download size={14} />
          ดาวน์โหลด cover
        </button>
        <button
          onClick={handlePushToNotion}
          disabled={pushing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-border text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {pushing ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
          Push to Notion
        </button>
        {output.notion_output_url && (
          <a
            href={output.notion_output_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink size={12} />
            ดูใน Notion
          </a>
        )}
        <div className="flex-1" />
        {isPublished ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-emerald-100 text-emerald-900">
            <CheckCircle2 size={14} />
            Posted
          </span>
        ) : (
          <button
            onClick={handleMarkPosted}
            disabled={posting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {posting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            ตั้งเป็น Posted
          </button>
        )}
      </div>

      {pushError && (
        <div className="rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
          Push to Notion error: {pushError}
        </div>
      )}

      {/* Status warnings */}
      {allWarnings.length > 0 && (
        <div className="surface-1 rounded-[14px] p-4 border border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-700" />
            <span className="text-sm font-semibold text-amber-900">
              Style + render warnings ({allWarnings.length})
            </span>
          </div>
          <ul className="space-y-1 text-xs text-amber-900">
            {allWarnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cover preview + Headline meta */}
      <div className="grid grid-cols-1 md:grid-cols-[440px_1fr] gap-4">
        {/* Cover */}
        <div className="surface-1 rounded-[14px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ImageIcon size={12} />
              Cover ปก
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing('cover')}
                className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Pencil size={12} />
                แก้ Cover
              </button>
              <button
                onClick={handleRerenderCover}
                disabled={rerendering}
                className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 disabled:opacity-50"
                title="ใช้เมื่อ cover เก่ามีปัญหา (เช่น BG ดำ) เพื่อ render ใหม่"
              >
                {rerendering ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Re-render
              </button>
              {output.cover_url && (
                <button
                  onClick={handleDownloadCover}
                  className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <Download size={12} />
                  ดาวน์โหลด
                </button>
              )}
            </div>
          </div>
          {output.cover_url ? (
            <div className="rounded-lg overflow-hidden bg-muted">
              <Image
                src={output.cover_url}
                alt="FB cover"
                width={400}
                height={500}
                unoptimized
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="rounded-lg bg-muted aspect-[4/5] flex items-center justify-center text-xs text-muted-foreground">
              ยังไม่มี cover (กำลัง render หรือ render fail)
            </div>
          )}

          {/* Creative style swap */}
          <div className="mt-3 pt-3 border-t border-border-soft">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Visual style
            </div>
            <StylePicker
              formatType="cover"
              selectedId={currentStyleId}
              onChange={handleSwapStyle}
              disabled={swappingStyle || rerendering}
            />
            {swappingStyle && (
              <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                เปลี่ยน style + render ใหม่...
              </p>
            )}
          </div>
        </div>

        {/* Headline meta */}
        <div className="surface-1 rounded-[14px] p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
            <Quote size={12} />
            Headline + Highlight
          </div>

          {[
            { label: 'บรรทัดที่ 1 · แถบสีแดง', value: output.cover.line1, hl: output.cover.line1_highlight, color: 'bg-red-100 text-red-900' },
            { label: 'บรรทัดที่ 2 · ตัวอักษรเหลือง', value: output.cover.line2, hl: output.cover.line2_highlight, color: 'bg-yellow-100 text-yellow-900' },
            { label: 'บรรทัดที่ 3 · แถบสีส้ม', value: output.cover.line3, hl: output.cover.line3_highlight, color: 'bg-orange-100 text-orange-900' },
          ].map((row) => (
            <div key={row.label} className="text-sm">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                {row.label}
              </div>
              <div className="font-medium text-foreground">{row.value}</div>
              {row.hl && (
                <div className="mt-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${row.color}`}>
                    highlight: {row.hl}
                  </span>
                </div>
              )}
            </div>
          ))}

          {output.cover.subhead && (
            <div className="text-sm pt-1 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Subhead
              </div>
              <div className="text-muted-foreground italic">- {output.cover.subhead} -</div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance checklist */}
      <div className="surface-1 rounded-[14px] p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
          <Check size={12} />
          Style guide compliance
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
          <li className={`flex items-center gap-2 ${slotCount > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
            <Hash size={10} />
            Slot placeholders: {slotCount} (Earth ใส่เอง)
          </li>
          <li className={`flex items-center gap-2 ${missingHashtags.length === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            <Hash size={10} />
            Hashtags ครบ 3: {3 - missingHashtags.length}/3
            {missingHashtags.length > 0 && ` (ขาด: ${missingHashtags.join(', ')})`}
          </li>
          <li className={`flex items-center gap-2 ${hasSignature ? 'text-emerald-700' : 'text-amber-700'}`}>
            <Check size={10} />
            Signature: {hasSignature ? 'ครบ' : 'ขาด'}
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Eye size={10} />
            Sections: {output.section_count} ({(output.post_body || '').split('==========').length - 1} dividers)
          </li>
        </ul>
      </div>

      {/* Post body */}
      <div className="surface-1 rounded-[14px] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <FileText size={12} /> Post body
            <span className="text-muted-foreground font-normal">
              · {(output.post_body || '').length.toLocaleString()} chars
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing('body')}
              className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <Pencil size={12} />
              แก้ Body
            </button>
            <button
              onClick={handleCopyBody}
              className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              {copied === 'body' ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy ทั้งหมด
                </>
              )}
            </button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
          {highlightPostBody(output.post_body || '')}
        </pre>
        <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
          <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded mr-2">
            สีเหลือง = slot ที่ Earth ต้องใส่เอง
          </span>
          <span className="inline-block px-1.5 py-0.5 text-blue-600 mr-2">
            สีน้ำเงิน = required hashtag
          </span>
          <span className="inline-block px-1.5 py-0.5 text-emerald-600">
            สีเขียว = signature line
          </span>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground text-center">
        Status: <span className="font-medium text-foreground">{status}</span>
      </div>
    </div>
  )
}
