'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  parseAndSaveCarouselTemplate,
  type CarouselTemplateFormat,
} from '@/lib/actions/carousel-templates'

const BUCKET = 'carousel-templates'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])

export function CarouselTemplateUploader() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<
    'idle' | 'uploading' | 'parsing'
  >('idle')
  const [error, setError] = useState<string | null>(null)
  // FB-only mode: every uploaded template is fb_post until carousel
  // generation quality matures.
  const formatType: CarouselTemplateFormat = 'fb_post'

  function pick() {
    inputRef.current?.click()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('รองรับเฉพาะ PNG / JPG / WebP')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`ไฟล์ใหญ่เกิน 8MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Session หมดอายุ — รีเฟรชแล้วลองใหม่')
      return
    }

    const tempId = crypto.randomUUID()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${user.id}/${tempId}/source.${ext}`

    setStep('uploading')
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      })

    if (upErr) {
      setStep('idle')
      setError(`upload failed: ${upErr.message}`)
      return
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    if (!pub?.publicUrl) {
      setStep('idle')
      setError('ดึง public URL ไม่ได้')
      return
    }

    setStep('parsing')
    startTransition(async () => {
      const res = await parseAndSaveCarouselTemplate({
        source_image_path: path,
        source_image_url: pub.publicUrl,
        user_name: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
        format_type: formatType,
      })
      if (!res.ok) {
        setStep('idle')
        setError(res.error)
        // Best-effort cleanup of the orphaned upload
        await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
        return
      }
      setStep('idle')
      router.push(`/carousel-templates/${res.id}`)
    })
  }

  const busy = step !== 'idle' || pending

  return (
    <div className="flex flex-col items-end gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFile}
        disabled={busy}
      />
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-sm font-medium rounded-[8px] bg-brand hover:bg-brand-hover text-white disabled:opacity-60 px-4 py-2"
      >
        {busy ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            {step === 'uploading' && 'กำลังอัปโหลด…'}
            {step === 'parsing' && 'AI กำลังวิเคราะห์ template…'}
          </>
        ) : (
          <>
            <Upload size={14} />
            Upload FB template
          </>
        )}
      </button>
      {error && (
        <div className="text-xs text-status-red-text bg-status-red-bg border border-status-red-border rounded-[8px] px-2.5 py-1.5 max-w-xs text-right">
          {error}
        </div>
      )}
    </div>
  )
}
