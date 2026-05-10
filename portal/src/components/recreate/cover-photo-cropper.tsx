'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Loader2, RotateCcw, Sparkles, Upload, X } from 'lucide-react'
import {
  cropImageToBlob,
  detectBlackBars,
  type BlackBarBox,
} from '@/lib/utils/black-bar-detect'

const COVER_PHOTO_ASPECT = 1080 / 890

type Props = {
  draftId: string
  imageUrl: string
  onClose: () => void
  onSaved: (next: { coverPhotoUrl: string; coverUrl: string | null }) => void
}

/**
 * In-app cropper for the cover photo source image.
 *
 * Lets the user pan / zoom an image (YouTube thumbnail or override) and save
 * a cropped 1080×890 result back to Storage as the override. The aspect ratio
 * is locked to match the cover render exactly so what you see is what gets
 * burned into the final cover.
 *
 * Auto-trim toggle uses black-bar detection to pre-position the cropper to
 * exclude letterbox bars common in YouTube cinematic thumbnails.
 */
export function CoverPhotoCropper({
  draftId,
  imageUrl,
  onClose,
  onSaved,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [autoTrim, setAutoTrim] = useState(true)
  const [bars, setBars] = useState<BlackBarBox | null>(null)
  const [autoTrimNote, setAutoTrimNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const detectedRef = useRef(false)

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx)
  }, [])

  // Detect bars once when image URL is set, then if autoTrim is on, apply them
  useEffect(() => {
    if (detectedRef.current) return
    detectedRef.current = true
    let cancelled = false
    detectBlackBars(imageUrl)
      .then((box) => {
        if (cancelled) return
        setBars(box)
      })
      .catch(() => {
        if (cancelled) return
        setBars(null)
      })
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  // When autoTrim toggle or bars info changes, set zoom to focus on content area.
  // Reacting to derived state (bars detection result) is the intended pattern.
  useEffect(() => {
    if (!autoTrim || !bars) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoTrimNote(null)
      return
    }
    if (!bars.trustworthy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoTrimNote(
        'ตรวจพบ pixel ดำมากผิดปกติ ไม่ได้ trim — ลอง crop manual',
      )
      return
    }
    const trimmedW = bars.width - bars.left - bars.right
    const trimmedH = bars.height - bars.top - bars.bottom
    if (trimmedW === bars.width && trimmedH === bars.height) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoTrimNote('ไม่พบขอบดำ')
      return
    }
    // Zoom needed so the trimmed content fills the crop frame
    const ratioW = bars.width / Math.max(1, trimmedW)
    const ratioH = bars.height / Math.max(1, trimmedH)
    const nextZoom = Math.min(3, Math.max(1, Math.max(ratioW, ratioH)))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(nextZoom)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoTrimNote('ตัดขอบดำให้แล้ว — ปรับเพิ่มได้ตามต้องการ')
  }, [autoTrim, bars])

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      setError('ยังไม่ได้ crop')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const blob = await cropImageToBlob(imageUrl, croppedAreaPixels)
      const fd = new FormData()
      fd.append('file', new File([blob], 'cover-photo.png', { type: 'image/png' }))
      const res = await fetch(`/api/recreated/${draftId}/upload-cover-photo`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'upload failed')
        return
      }
      onSaved({
        coverPhotoUrl: data.cover_photo_url,
        coverUrl: data.cover_url ?? null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'crop save error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div className="bg-card rounded-[14px] w-[720px] max-w-[96vw] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
            <Upload size={15} />
            Crop Cover Photo
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground"
            aria-label="ปิด"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative w-full h-[420px] bg-secondary rounded-[10px] overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={COVER_PHOTO_ASPECT}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.5}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-brand"
            />
            <span className="text-xs tabular-nums text-foreground shrink-0 w-12 text-right">
              {zoom.toFixed(2)}x
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setZoom(1)
              setCrop({ x: 0, y: 0 })
            }}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <RotateCcw size={11} />
            Reset zoom
          </button>
        </div>

        <label className="flex items-start gap-2 mt-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoTrim}
            onChange={(e) => setAutoTrim(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <div className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand" />
              Auto-trim ขอบดำ (smart detect)
            </div>
            {autoTrimNote && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {autoTrimNote}
              </p>
            )}
          </div>
        </label>

        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          กรอบ crop จะตรงกับสัดส่วน cover photo (1080×890) — ภาพที่บันทึกจะถูก burn เข้า
          cover ทันที ลาก/หมุนล้อ scroll เพื่อ pan/zoom
        </p>

        {error && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !croppedAreaPixels}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                บันทึก crop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
