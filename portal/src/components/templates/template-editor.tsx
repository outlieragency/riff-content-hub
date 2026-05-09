'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  addReferenceImagesToStyle,
  deleteCreativeStyle,
  reExtractStyleFromCurrentRefs,
  removeReferenceFromStyle,
  setDefaultCreativeStyle,
  updateCreativeStyle,
} from '@/lib/actions/creative-styles'
import {
  extractedToRendererConfig,
  type CreativeStyleRow,
  type ReferenceImage,
  type RendererConfig,
} from '@/lib/types/creative-style'

export function TemplateEditor({ initial }: { initial: CreativeStyleRow }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initial.name)
  const [styleGuide, setStyleGuide] = useState(initial.style_guide_md)
  const [config, setConfig] = useState<RendererConfig>(initial.renderer_config)
  const [refs, setRefs] = useState<ReferenceImage[]>(initial.reference_images)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [makingDefault, startDefault] = useTransition()
  const [uploadingRefs, setUploadingRefs] = useState(false)
  const [removingRefUrl, setRemovingRefUrl] = useState<string | null>(null)
  const [reExtracting, startReExtract] = useTransition()

  const dirty =
    name !== initial.name ||
    styleGuide !== initial.style_guide_md ||
    JSON.stringify(config) !== JSON.stringify(initial.renderer_config)

  function save() {
    setError(null)
    setInfo(null)
    startSave(async () => {
      const res = await updateCreativeStyle(initial.id, {
        name,
        style_guide_md: styleGuide,
        renderer_config: config,
      })
      if (!res.ok) {
        setError(res.error ?? 'save failed')
        return
      }
      setInfo('บันทึกแล้ว')
      router.refresh()
    })
  }

  function makeDefault() {
    setError(null)
    setInfo(null)
    startDefault(async () => {
      const res = await setDefaultCreativeStyle(initial.id)
      if (!res.ok) {
        setError(res.error ?? 'failed')
        return
      }
      setInfo('ตั้งเป็น default แล้ว')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`ลบ template "${initial.name}" ?`)) return
    setError(null)
    startDelete(async () => {
      const res = await deleteCreativeStyle(initial.id)
      if (!res.ok) {
        setError(res.error ?? 'delete failed')
        return
      }
      router.push('/templates')
    })
  }

  async function handleUploadRefs(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setInfo(null)
    setUploadingRefs(true)
    try {
      const sb = createClient()
      const {
        data: { user },
      } = await sb.auth.getUser()
      if (!user) {
        setError('unauthorized')
        return
      }

      const newUrls: string[] = []
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} ใหญ่เกิน 10MB`)
          continue
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          setError(`${file.name} ต้องเป็น PNG / JPEG / WEBP`)
          continue
        }
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const path = `${user.id}/${initial.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await sb.storage
          .from('creative-styles')
          .upload(path, file, { contentType: file.type, cacheControl: '3600' })
        if (upErr) {
          setError(`upload ${file.name} fail: ${upErr.message}`)
          continue
        }
        const { data: pub } = sb.storage
          .from('creative-styles')
          .getPublicUrl(path)
        newUrls.push(pub.publicUrl)
      }

      if (newUrls.length === 0) return

      const res = await addReferenceImagesToStyle(initial.id, newUrls)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRefs((cur) => [
        ...cur,
        ...newUrls.map((url) => ({
          url,
          uploaded_at: new Date().toISOString(),
        })),
      ])
      setInfo(`เพิ่ม ${newUrls.length} ภาพ — รวม ${res.total} refs`)
      router.refresh()
    } finally {
      setUploadingRefs(false)
    }
  }

  async function handleRemoveRef(url: string) {
    if (!confirm('ลบภาพนี้ออกจาก template ?')) return
    setRemovingRefUrl(url)
    setError(null)
    setInfo(null)
    try {
      const res = await removeReferenceFromStyle(initial.id, url)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRefs((cur) => cur.filter((r) => r.url !== url))
      setInfo(`ลบแล้ว — เหลือ ${res.remaining} refs`)
      router.refresh()
    } finally {
      setRemovingRefUrl(null)
    }
  }

  function handleReExtract() {
    if (refs.length === 0) {
      setError('ต้องมี reference อย่างน้อย 1 ภาพก่อน re-extract')
      return
    }
    if (!confirm('Re-extract style จาก refs ที่มีอยู่ ? Style guide + theme จะถูกเขียนทับ')) return
    setError(null)
    setInfo(null)
    startReExtract(async () => {
      const res = await reExtractStyleFromCurrentRefs(initial.id, initial.format_type)
      if (!res.ok) {
        setError(res.error)
        return
      }
      // Apply extracted result to local state
      setStyleGuide(res.extracted.style_guide_md)
      setConfig(extractedToRendererConfig(res.extracted))
      setInfo(`Re-extract เสร็จ ใน ${(res.meta.latency_ms / 1000).toFixed(1)}s — กด Save เพื่อบันทึก`)
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
          {error}
        </div>
      )}
      {info && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] px-3 py-2 text-sm text-emerald-900">
          {info}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left: name + style guide markdown editor */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              ชื่อ template
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={48}
              className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Style Guide (Markdown)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              AI จะอ่านส่วนนี้ตอน generate ใหม่ — เพิ่ม rule, เปลี่ยน tone, ระบุ DON&apos;T ได้ตามใจ
            </p>
            <textarea
              value={styleGuide}
              onChange={(e) => setStyleGuide(e.target.value)}
              rows={20}
              className="w-full px-3 py-2.5 rounded-[8px] border border-border bg-background text-sm text-foreground font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand resize-y"
            />
          </div>

          <RendererConfigEditor config={config} onChange={setConfig} />
        </div>

        {/* Right: refs gallery + actions */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">
                Reference images
              </h3>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {refs.length} / 12
              </span>
            </div>

            {refs.length === 0 ? (
              <p className="text-xs text-muted-foreground mb-2">
                ยังไม่มี reference — upload เพื่อให้ AI วิเคราะห์ style
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {refs.map((r, i) => {
                  const isRemoving = removingRefUrl === r.url
                  return (
                    <div
                      key={`${r.url}-${i}`}
                      className="relative aspect-[4/5] rounded-[8px] overflow-hidden bg-secondary border border-border-soft group"
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
                        onClick={() => handleRemoveRef(r.url)}
                        disabled={isRemoving || uploadingRefs}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                        aria-label="ลบ"
                      >
                        {isRemoving ? (
                          <Loader2 className="animate-spin" size={11} />
                        ) : (
                          <X size={11} />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingRefs || refs.length >= 12}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] border border-dashed border-border hover:border-brand text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {uploadingRefs ? (
                <>
                  <Loader2 className="animate-spin" size={11} />
                  กำลัง upload...
                </>
              ) : (
                <>
                  <Upload size={11} />
                  + Add reference
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleUploadRefs(e.target.files)}
            />

            {refs.length > 0 && (
              <button
                type="button"
                onClick={handleReExtract}
                disabled={reExtracting || uploadingRefs}
                className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                {reExtracting ? (
                  <Loader2 className="animate-spin" size={10} />
                ) : (
                  <Sparkles size={10} />
                )}
                Re-extract style จาก refs ปัจจุบัน
              </button>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-border-soft">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2.5"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={14} />
                  บันทึก
                </>
              )}
            </button>

            <button
              type="button"
              onClick={makeDefault}
              disabled={initial.is_default || makingDefault}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-secondary hover:bg-secondary/70 disabled:opacity-50 text-foreground text-sm font-medium rounded-[8px] px-4 py-2.5"
            >
              {initial.is_default ? (
                <>
                  <Star size={14} fill="currentColor" />
                  Default แล้ว
                </>
              ) : (
                <>
                  <Star size={14} />
                  ตั้งเป็น default
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full inline-flex items-center justify-center gap-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm rounded-[8px] px-4 py-2"
            >
              <Trash2 size={14} />
              ลบ template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RendererConfigEditor({
  config,
  onChange,
}: {
  config: RendererConfig
  onChange: (next: RendererConfig) => void
}) {
  function setTheme(key: keyof RendererConfig['theme'], value: string) {
    onChange({ ...config, theme: { ...config.theme, [key]: value } })
  }
  function setFont(key: keyof RendererConfig['fonts'], value: string) {
    onChange({ ...config, fonts: { ...config.fonts, [key]: value } })
  }

  return (
    <details className="rounded-[10px] border border-border-soft p-4">
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        Renderer config (advanced)
      </summary>
      <div className="mt-4 space-y-4">
        <div>
          <span className="block text-xs text-muted-foreground mb-1">
            Base template
          </span>
          <select
            value={config.base_template}
            onChange={(e) =>
              onChange({
                ...config,
                base_template: e.target.value as RendererConfig['base_template'],
              })
            }
            className="w-full h-9 px-2 rounded-[6px] border border-border bg-background text-sm"
          >
            <option value="headliner">Headliner</option>
            <option value="minimal-card">Minimal Card</option>
            <option value="bold-quote">Bold Quote</option>
            <option value="full-text">Full Text</option>
            <option value="photo-frame">Photo Frame</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ColorField label="bg" value={config.theme.bg} onChange={(v) => setTheme('bg', v)} />
          <ColorField label="fg" value={config.theme.fg} onChange={(v) => setTheme('fg', v)} />
          <ColorField label="accent" value={config.theme.accent} onChange={(v) => setTheme('accent', v)} />
          <ColorField label="hl_red" value={config.theme.hl_red ?? '#E53935'} onChange={(v) => setTheme('hl_red', v)} />
          <ColorField label="hl_yellow" value={config.theme.hl_yellow ?? '#FFD400'} onChange={(v) => setTheme('hl_yellow', v)} />
          <ColorField label="hl_orange" value={config.theme.hl_orange ?? '#FF6B1A'} onChange={(v) => setTheme('hl_orange', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-xs text-muted-foreground mb-1">
              heading font
            </span>
            <select
              value={config.fonts.heading}
              onChange={(e) => setFont('heading', e.target.value)}
              className="w-full h-9 px-2 rounded-[6px] border border-border bg-background text-sm"
            >
              {SUPPORTED_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground mb-1">
              body font
            </span>
            <select
              value={config.fonts.body}
              onChange={(e) => setFont('body', e.target.value)}
              className="w-full h-9 px-2 rounded-[6px] border border-border bg-background text-sm"
            >
              {SUPPORTED_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-2xs text-muted-foreground mt-2 leading-snug">
          ทุก font รองรับไทย load จาก Google Fonts ใน template
        </p>
      </div>
    </details>
  )
}

const SUPPORTED_FONTS = [
  'Noto Sans Thai',
  'IBM Plex Sans Thai',
  'Sarabun',
  'Anuphan',
  'Bai Jamjuree',
  'Krub',
  'Mitr',
  'Prompt',
  'Pridi',
  'Inter',
  'Inter Tight',
] as const

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-md border border-border-soft cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-9 px-2 rounded-[6px] border border-border bg-background text-xs font-mono uppercase"
        />
      </div>
    </label>
  )
}
