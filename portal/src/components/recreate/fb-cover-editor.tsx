'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Crop as CropIcon,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import type { FbArticleCover } from '@/lib/types/recreate-formats'
import { CoverPhotoCropper } from './cover-photo-cropper'
import { getDraftSourcePhotoUrl } from '@/lib/actions/recreate'

type Props = {
  draftId: string
  initial: FbArticleCover
  initialCoverUrl: string | null | undefined
  initialCoverPhotoUrl?: string | null
  onClose: () => void
}

function CharCounter({
  value,
  max,
}: {
  value: string
  max: number
}) {
  const len = value.length
  const over = len > max
  const near = !over && len > max * 0.85
  return (
    <div
      className={`text-[10px] mt-1 tabular-nums ${
        over ? 'text-red-600' : near ? 'text-amber-700' : 'text-muted-foreground'
      }`}
    >
      {len}/{max} chars
      {over && ' • ตกขอบแน่นอน — ตัดให้สั้นลง'}
    </div>
  )
}

function LineEditor({
  label,
  palette,
  value,
  highlight,
  onValueChange,
  onHighlightChange,
}: {
  label: string
  palette: { tag: string; tagBg: string; hint: string }
  value: string
  highlight: string
  onValueChange: (v: string) => void
  onHighlightChange: (v: string) => void
}) {
  const highlightInBody = highlight && value.includes(highlight)

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${palette.tagBg}`}
        >
          {palette.tag}
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={palette.hint}
        className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <CharCounter value={value} max={32} />
      <div className="mt-1.5">
        <input
          type="text"
          value={highlight}
          onChange={(e) => onHighlightChange(e.target.value)}
          placeholder="คำที่ต้องการเน้นในบรรทัดนี้ (เช่น $5,500/เดือน)"
          className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div
          className={`text-[10px] mt-1 ${
            highlight && !highlightInBody
              ? 'text-amber-700'
              : 'text-muted-foreground'
          }`}
        >
          {highlight
            ? highlightInBody
              ? `✓ จะเน้น “${highlight}” ในบรรทัดนี้`
              : `! ไม่พบ “${highlight}” ในบรรทัดด้านบน — ต้องพิมพ์ตรงเป๊ะ`
            : 'ปล่อยว่างได้ ถ้าไม่ต้องการเน้นคำในบรรทัดนี้'}
        </div>
      </div>
    </div>
  )
}

export function FbCoverEditor({
  draftId,
  initial,
  initialCoverUrl,
  initialCoverPhotoUrl,
  onClose,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cover, setCover] = useState<FbArticleCover>(initial)
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, startSaving] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(
    initialCoverPhotoUrl ?? null,
  )
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null)
  const [coverCacheBuster, setCoverCacheBuster] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [autoPreview, setAutoPreview] = useState(true)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [cropperImageUrl, setCropperImageUrl] = useState<string | null>(null)
  const [resolvingSrc, setResolvingSrc] = useState(false)
  const previewReqRef = useRef(0)

  const openCropper = async () => {
    setError(null)
    setResolvingSrc(true)
    try {
      const res = await getDraftSourcePhotoUrl(draftId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setCropperImageUrl(res.url)
      setCropperOpen(true)
    } finally {
      setResolvingSrc(false)
    }
  }

  const handleCropperSaved = (next: { coverPhotoUrl: string; coverUrl: string | null }) => {
    setCoverPhotoUrl(next.coverPhotoUrl)
    if (next.coverUrl) setCoverUrl(next.coverUrl)
    setCoverCacheBuster(String(Date.now()))
    setPreviewUri(null)
    setCropperOpen(false)
    router.refresh()
  }

  const update = <K extends keyof FbArticleCover>(k: K, v: FbArticleCover[K]) =>
    setCover((c) => ({ ...c, [k]: v }))

  const renderPreview = async (silentError = false) => {
    if (!silentError) setError(null)
    setPreviewing(true)
    const reqId = ++previewReqRef.current
    try {
      const res = await fetch(`/api/recreated/${draftId}/preview-cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover }),
      })
      // If a newer request started while this one was in-flight, drop result
      if (reqId !== previewReqRef.current) return
      const data = await res.json()
      if (!res.ok) {
        if (!silentError) setError(data.error || 'preview failed')
        return
      }
      setPreviewUri(data.cover_data_uri)
    } catch (e: unknown) {
      if (reqId !== previewReqRef.current) return
      if (!silentError) setError(e instanceof Error ? e.message : 'preview error')
    } finally {
      if (reqId === previewReqRef.current) setPreviewing(false)
    }
  }

  // Debounced auto-preview when cover fields change (800ms after last edit).
  // User can disable via toggle; manual "ดูตัวอย่าง" button still works.
  useEffect(() => {
    if (!autoPreview) return
    const t = setTimeout(() => {
      renderPreview(true)
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cover.line1,
    cover.line2,
    cover.line3,
    cover.line1_highlight,
    cover.line2_highlight,
    cover.line3_highlight,
    cover.subhead,
    cover.arrow_caption_top,
    cover.arrow_caption_bottom,
    cover.arrow_position,
    autoPreview,
  ])

  const handleUploadFile = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/recreated/${draftId}/upload-cover-photo`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'upload failed')
        return
      }
      setCoverPhotoUrl(data.cover_photo_url)
      setCoverUrl(data.cover_url)
      setCoverCacheBuster(String(Date.now()))
      setPreviewUri(null) // force re-fetch from new URL
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'upload error')
    } finally {
      setUploading(false)
    }
  }

  const handleClearOverride = async () => {
    setError(null)
    setUploading(true)
    try {
      const res = await fetch(`/api/recreated/${draftId}/upload-cover-photo`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'clear failed')
        return
      }
      setCoverPhotoUrl(null)
      setCoverUrl(data.cover_url)
      setCoverCacheBuster(String(Date.now()))
      setPreviewUri(null)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'clear error')
    } finally {
      setUploading(false)
    }
  }

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleUploadFile(file)
  }

  const save = () => {
    setError(null)
    startSaving(async () => {
      try {
        const res = await fetch(`/api/recreated/${draftId}/save-cover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'save failed')
          return
        }
        router.refresh()
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'save error')
      }
    })
  }

  return (
    <div className="surface-1 rounded-[14px] p-4 mb-4 border border-blue-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">แก้ไข Cover</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[440px_1fr] gap-4">
        {/* Preview pane */}
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden bg-muted aspect-[4/5] relative">
            {previewUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUri} alt="preview" className="w-full h-full object-cover" />
            ) : coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverCacheBuster ? `${coverUrl}?t=${coverCacheBuster}` : coverUrl}
                alt="current"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                ยังไม่มี preview
              </div>
            )}

            {/* Inline syncing indicator (top-right of preview) */}
            {previewing && (
              <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 text-white text-[10px] backdrop-blur-sm">
                <Loader2 className="animate-spin" size={10} />
                กำลัง render...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => renderPreview()}
              disabled={previewing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-foreground text-background text-sm rounded-md py-2 hover:opacity-90 disabled:opacity-50"
            >
              {previewing ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <RefreshCw size={14} />
              )}
              Re-render ตอนนี้
            </button>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPreview}
                onChange={(e) => setAutoPreview(e.target.checked)}
                className="cursor-pointer"
              />
              auto
            </label>
          </div>

          {/* Cover photo controls — crop / upload / reset / clear */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropFile}
            className="rounded-lg border border-border p-3 space-y-2"
          >
            <div className="text-[11px] font-medium text-foreground">
              Cover Photo
              {coverPhotoUrl ? (
                <span className="ml-2 text-emerald-700">✓ ใช้ภาพ upload</span>
              ) : (
                <span className="ml-2 text-muted-foreground">ใช้ YouTube thumbnail</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={openCropper}
                disabled={resolvingSrc || uploading}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-medium"
              >
                {resolvingSrc ? (
                  <Loader2 className="animate-spin" size={11} />
                ) : (
                  <CropIcon size={11} />
                )}
                Crop / Position
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-foreground text-xs font-medium disabled:opacity-50"
              >
                <ImagePlus size={11} />
                Upload ใหม่
              </button>
              {coverPhotoUrl ? (
                <button
                  type="button"
                  onClick={handleClearOverride}
                  disabled={uploading}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-red-600 hover:bg-red-50 text-xs disabled:opacity-50"
                >
                  <Trash2 size={11} />
                  ลบ override (กลับไปใช้ YouTube thumbnail)
                </button>
              ) : (
                <div className="col-span-2 text-[10px] text-muted-foreground text-center pt-0.5 inline-flex items-center justify-center gap-1">
                  <RotateCcw size={9} />
                  Crop YT thumbnail หรือ upload ภาพใหม่ก็ได้
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground leading-tight">
              ลากไฟล์มาวางตรงนี้ก็ได้ · PNG/JPG/WEBP · แนะนำ 1080×890
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUploadFile(f)
              }}
            />
            {uploading && (
              <div className="flex items-center justify-center text-xs text-muted-foreground gap-1.5">
                <Loader2 className="animate-spin" size={12} />
                กำลัง upload + re-render...
              </div>
            )}
          </div>
        </div>

        {/* Form fields — grouped into sections */}
        <div className="space-y-5">

          {/* === Headline (3 บรรทัด) === */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-1">Headline</h4>
            <p className="text-[11px] text-muted-foreground mb-3">
              3 บรรทัดบน cover — แต่ละบรรทัดเลือกคำเด่นที่จะให้สีพื้น/สีตัวอักษรเน้น
            </p>

            <LineEditor
              label="บรรทัดที่ 1"
              palette={{
                tag: 'แถบสีแดง',
                tagBg: 'bg-red-100 text-red-900',
                hint: 'pain / dream / ตัวเลขผลลัพธ์ใหญ่ (เช่น "$5,500/เดือน")',
              }}
              value={cover.line1}
              highlight={cover.line1_highlight ?? ''}
              onValueChange={(v) => update('line1', v)}
              onHighlightChange={(v) => update('line1_highlight', v || undefined)}
            />
            <LineEditor
              label="บรรทัดที่ 2"
              palette={{
                tag: 'ตัวอักษรเหลือง',
                tagBg: 'bg-yellow-100 text-yellow-900',
                hint: 'วิธี / how / framework (เช่น "ใช้ Claude Code")',
              }}
              value={cover.line2}
              highlight={cover.line2_highlight ?? ''}
              onValueChange={(v) => update('line2', v)}
              onHighlightChange={(v) => update('line2_highlight', v || undefined)}
            />
            <LineEditor
              label="บรรทัดที่ 3"
              palette={{
                tag: 'แถบสีส้ม (Outlier brand)',
                tagBg: 'bg-orange-100 text-orange-900',
                hint: 'tool / framework / promise (เช่น "ใน 21 วัน")',
              }}
              value={cover.line3}
              highlight={cover.line3_highlight ?? ''}
              onValueChange={(v) => update('line3', v)}
              onHighlightChange={(v) => update('line3_highlight', v || undefined)}
            />
          </section>

          {/* === Subhead === */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Subhead (ใต้ headline)
            </h4>
            <p className="text-[11px] text-muted-foreground mb-2">
              ประโยคสรุป 1 บรรทัด ครอบด้วย “— … —” อัตโนมัติ
            </p>
            <textarea
              value={cover.subhead ?? ''}
              onChange={(e) => update('subhead', e.target.value || undefined)}
              rows={2}
              placeholder="เช่น: Patrick Dang อดีต Silicon Valley sales เผยกระบวนการสร้าง 1-Person Business"
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <CharCounter value={cover.subhead ?? ''} max={110} />
          </section>

          {/* === Arrow caption === */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              ลูกศร + คำบรรยาย (ชี้ที่ตัวบุคคล)
            </h4>
            <p className="text-[11px] text-muted-foreground mb-2">
              ลายมือเขียน 2 บรรทัด — บรรทัดแรกบรรยาย, บรรทัดที่สองตัวเลขเงิน (สีเหลือง)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  value={cover.arrow_caption_top ?? ''}
                  onChange={(e) =>
                    update('arrow_caption_top', e.target.value || undefined)
                  }
                  placeholder='เช่น: "เปลี่ยนจาก 0 เป็น AI agency"'
                  className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="text-[10px] text-muted-foreground mt-1">
                  context (สีขาว)
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={cover.arrow_caption_bottom ?? ''}
                  onChange={(e) =>
                    update('arrow_caption_bottom', e.target.value || undefined)
                  }
                  placeholder='เช่น: "$5,500 ต่อเดือน"'
                  className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="text-[10px] text-muted-foreground mt-1">
                  ตัวเลขเงิน/scale (สีเหลือง bold)
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                ตำแหน่งลูกศรบนภาพ
              </div>
              <div className="flex gap-1.5">
                {[
                  { v: 'top-left', label: 'มุมบนซ้าย' },
                  { v: 'left', label: 'กลางซ้าย' },
                  { v: 'bottom-left', label: 'มุมล่างซ้าย' },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => update('arrow_position', opt.v)}
                    className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
                      (cover.arrow_position ?? 'bottom-left') === opt.v
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
        >
          ยกเลิก
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm rounded-md px-4 py-1.5 hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          บันทึก + Re-render
        </button>
      </div>

      {cropperOpen && cropperImageUrl && (
        <CoverPhotoCropper
          draftId={draftId}
          imageUrl={cropperImageUrl}
          onClose={() => setCropperOpen(false)}
          onSaved={handleCropperSaved}
        />
      )}
    </div>
  )
}
