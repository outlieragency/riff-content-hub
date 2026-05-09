'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  createCreativeStyleFromExtract,
  extractStyleFromReferences,
} from '@/lib/actions/creative-styles'
import type {
  ExtractedCreativeStyle,
  FormatType,
} from '@/lib/types/creative-style'

const MAX_REFS = 12
const MAX_BYTES = 10 * 1024 * 1024 // 10MB matches storage bucket
const ACCEPTED = 'image/png,image/jpeg,image/webp'

type UploadedRef = {
  url: string
  path: string // storage path for cleanup
  size: number
}

type Step = 'upload' | 'extract' | 'save'

const FORMAT_OPTIONS: { value: FormatType; label: string; desc: string }[] = [
  { value: 'cover', label: 'FB Cover', desc: '1080×1350 portrait — โพสต์ Facebook' },
  { value: 'carousel', label: 'IG Carousel', desc: '1080×1080 square — Instagram slides' },
  { value: 'thumbnail', label: 'YouTube Thumbnail', desc: '1280×720 landscape' },
  { value: 'reel', label: 'Reel/Short', desc: '1080×1920 vertical' },
]

export function NewTemplateWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [formatType, setFormatType] = useState<FormatType>('cover')
  const [refs, setRefs] = useState<UploadedRef[]>([])
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedCreativeStyle | null>(null)
  const [name, setName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    setError(null)

    if (refs.length + files.length > MAX_REFS) {
      setError(`upload ได้สูงสุด ${MAX_REFS} ภาพ`)
      return
    }

    setUploading(true)
    try {
      const sb = createClient()
      const {
        data: { user },
      } = await sb.auth.getUser()
      if (!user) {
        setError('ต้อง login ก่อน')
        return
      }

      const newRefs: UploadedRef[] = []
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name} ใหญ่เกิน 10MB`)
          continue
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          setError(`${file.name} ต้องเป็น PNG/JPEG/WEBP`)
          continue
        }

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const path = `${user.id}/uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`

        const { error: upErr } = await sb.storage
          .from('creative-styles')
          .upload(path, file, {
            contentType: file.type,
            cacheControl: '3600',
          })

        if (upErr) {
          setError(`upload ${file.name} fail: ${upErr.message}`)
          continue
        }

        const { data: pub } = sb.storage
          .from('creative-styles')
          .getPublicUrl(path)

        newRefs.push({ url: pub.publicUrl, path, size: file.size })
      }
      setRefs((cur) => [...cur, ...newRefs])
    } finally {
      setUploading(false)
    }
  }

  async function removeRef(index: number) {
    const r = refs[index]
    if (!r) return
    const sb = createClient()
    await sb.storage.from('creative-styles').remove([r.path])
    setRefs((cur) => cur.filter((_, i) => i !== index))
  }

  async function runExtract() {
    if (refs.length === 0) {
      setError('upload reference อย่างน้อย 1 ภาพก่อน')
      return
    }
    setError(null)
    setExtracting(true)
    setStep('extract')
    try {
      const res = await extractStyleFromReferences(
        refs.map((r) => r.url),
        formatType,
      )
      if (!res.ok) {
        setError(res.error)
        setStep('upload')
        return
      }
      setExtracted(res.extracted)
      setName(res.extracted.naming_suggestion)
      setStep('save')
    } finally {
      setExtracting(false)
    }
  }

  function handleSave() {
    if (!extracted) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('ตั้งชื่อ template ก่อน')
      return
    }
    setError(null)
    startSave(async () => {
      const res = await createCreativeStyleFromExtract({
        name: trimmed,
        format_type: formatType,
        reference_images: refs.map((r) => ({
          url: r.url,
          uploaded_at: new Date().toISOString(),
        })),
        extracted,
        set_as_default: setAsDefault,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`/templates/${res.id}`)
    })
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {error && (
        <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <UploadStep
          formatType={formatType}
          setFormatType={setFormatType}
          refs={refs}
          uploading={uploading}
          onFiles={handleFiles}
          onRemove={removeRef}
          onNext={runExtract}
        />
      )}

      {step === 'extract' && (
        <ExtractingStep refs={refs} done={!extracting && !!extracted} />
      )}

      {step === 'save' && extracted && (
        <SaveStep
          extracted={extracted}
          name={name}
          setName={setName}
          setAsDefault={setAsDefault}
          setSetAsDefault={setSetAsDefault}
          saving={saving}
          onBack={() => setStep('upload')}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const order: Step[] = ['upload', 'extract', 'save']
  const idx = order.indexOf(step)
  const labels: Record<Step, string> = {
    upload: 'Upload references',
    extract: 'AI วิเคราะห์',
    save: 'ตั้งชื่อ + บันทึก',
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      {order.map((s, i) => {
        const active = i === idx
        const done = i < idx
        return (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                active
                  ? 'bg-brand text-white'
                  : done
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {done ? (
                <CheckCircle2 size={11} />
              ) : (
                <span className="font-semibold">{i + 1}</span>
              )}
              <span>{labels[s]}</span>
            </span>
            {i < order.length - 1 && (
              <ArrowRight size={12} className="text-muted-foreground" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function UploadStep({
  formatType,
  setFormatType,
  refs,
  uploading,
  onFiles,
  onRemove,
  onNext,
}: {
  formatType: FormatType
  setFormatType: (v: FormatType) => void
  refs: UploadedRef[]
  uploading: boolean
  onFiles: (f: FileList | null) => void
  onRemove: (i: number) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormatType(f.value)}
              className={`text-left p-3 rounded-[10px] border transition-colors ${
                formatType === f.value
                  ? 'border-brand bg-brand-soft'
                  : 'border-border hover:border-border-strong'
              }`}
            >
              <div className="text-sm font-semibold text-foreground">
                {f.label}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {f.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Reference images ({refs.length}/{MAX_REFS})
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          upload cover/carousel ที่คุณชอบ — AI จะอ่านสี, ฟอนต์, layout, vibe
          แล้วสกัดเป็น style guide PNG/JPEG/WEBP, ≤10MB ต่อภาพ
        </p>
        <Dropzone uploading={uploading} onFiles={onFiles} disabled={refs.length >= MAX_REFS} />

        {refs.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {refs.map((r, i) => (
              <div
                key={r.path}
                className="group relative aspect-[4/5] rounded-[8px] overflow-hidden bg-secondary border border-border-soft"
              >
                <Image
                  src={r.url}
                  alt={`ref ${i + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="ลบ"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={refs.length === 0 || uploading}
          onClick={onNext}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2.5"
        >
          <Sparkles size={14} />
          AI วิเคราะห์สไตล์
        </button>
      </div>
    </div>
  )
}

function Dropzone({
  uploading,
  onFiles,
  disabled,
}: {
  uploading: boolean
  onFiles: (f: FileList | null) => void
  disabled: boolean
}) {
  const [drag, setDrag] = useState(false)
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (!disabled) onFiles(e.dataTransfer.files)
      }}
      className={`block rounded-[12px] border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
        disabled
          ? 'border-border opacity-50 cursor-not-allowed'
          : drag
            ? 'border-brand bg-brand-soft'
            : 'border-border hover:border-border-strong hover:bg-secondary/40'
      }`}
    >
      <input
        type="file"
        accept={ACCEPTED}
        multiple
        disabled={disabled || uploading}
        onChange={(e) => onFiles(e.target.files)}
        className="hidden"
      />
      <div className="inline-flex items-center gap-2 text-sm text-foreground">
        {uploading ? (
          <>
            <Loader2 className="animate-spin text-brand" size={14} />
            กำลัง upload...
          </>
        ) : (
          <>
            <Upload size={14} className="text-brand" />
            <span>คลิกเพื่อเลือกภาพ หรือลากมาวาง</span>
          </>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        แนะนำ 3-8 ภาพ — สไตล์ของช่อง/แบรนด์เดียวกัน
      </p>
    </label>
  )
}

function ExtractingStep({
  refs,
  done,
}: {
  refs: UploadedRef[]
  done: boolean
}) {
  return (
    <div className="rounded-[14px] border border-border-soft bg-card p-8 text-center">
      <div className="mb-4">
        {done ? (
          <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
        ) : (
          <Loader2 size={32} className="mx-auto animate-spin text-brand" />
        )}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {done ? 'วิเคราะห์เสร็จแล้ว' : 'AI กำลังวิเคราะห์ภาพ...'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {refs.length} ภาพ · ใช้เวลาประมาณ 15-30 วินาที
      </p>
      {refs.length > 0 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {refs.slice(0, 6).map((r) => (
            <div
              key={r.path}
              className="w-12 h-15 rounded-[6px] overflow-hidden bg-secondary relative"
            >
              <Image
                src={r.url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaveStep({
  extracted,
  name,
  setName,
  setAsDefault,
  setSetAsDefault,
  saving,
  onBack,
  onSave,
}: {
  extracted: ExtractedCreativeStyle
  name: string
  setName: (v: string) => void
  setAsDefault: boolean
  setSetAsDefault: (v: boolean) => void
  saving: boolean
  onBack: () => void
  onSave: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-border-soft bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          AI สรุปสไตล์ที่อ่านได้
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Vibe">
            {extracted.visual_tone.primary_descriptor} ·{' '}
            {extracted.visual_tone.energy_level} energy
          </Field>
          <Field label="Base template">
            {extracted.suggested_base_template}
          </Field>
          <Field label="Photo">
            {extracted.layout.photo_treatment} ·{' '}
            {extracted.layout.photo_position}
          </Field>
          <Field label="Headline">
            {extracted.layout.headline_lines} lines ·{' '}
            {extracted.layout.highlight_pattern}
          </Field>
        </div>
        <div className="mt-3 pt-3 border-t border-border-soft">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Color palette
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <Swatch hex={extracted.color_palette.background} label="bg" />
            <Swatch hex={extracted.color_palette.foreground} label="fg" />
            {extracted.color_palette.accent_colors.map((c, i) => (
              <Swatch key={i} hex={c} label={`accent ${i + 1}`} />
            ))}
            <Swatch
              hex={extracted.color_palette.highlight_colors.primary}
              label="hl 1"
            />
            <Swatch
              hex={extracted.color_palette.highlight_colors.secondary}
              label="hl 2"
            />
            <Swatch
              hex={extracted.color_palette.highlight_colors.tertiary}
              label="hl 3"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          ตั้งชื่อ template
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={48}
          placeholder="เช่น Bold Headliner, Loud Money, Minimal Editorial"
          className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          AI แนะนำ:{' '}
          <button
            type="button"
            className="underline hover:text-foreground"
            onClick={() => setName(extracted.naming_suggestion)}
          >
            {extracted.naming_suggestion}
          </button>
        </p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="mt-0.5"
        />
        <div>
          <div className="text-sm font-medium text-foreground">
            ตั้งเป็น default
          </div>
          <p className="text-[11px] text-muted-foreground">
            ใช้ style นี้เป็น default ตอน generate cover ใหม่
          </p>
        </div>
      </label>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
        >
          ย้อนกลับ
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2.5"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              บันทึก template
            </>
          )}
        </button>
      </div>
    </div>
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
      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className="text-foreground">{children}</span>
    </div>
  )
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-7 h-7 rounded-md border border-border-soft"
        style={{ backgroundColor: hex }}
        title={`${label} ${hex}`}
      />
      <span className="text-[9px] text-muted-foreground tabular-nums">
        {hex.toUpperCase()}
      </span>
    </div>
  )
}
