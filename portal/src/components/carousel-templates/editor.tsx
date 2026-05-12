'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Download,
  FileArchive,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  deleteCarouselTemplate,
  generateCarouselSlides,
  saveCarouselDraft,
  updateCarouselTemplate,
  type CarouselSlideValues,
  type CarouselTemplateRow,
} from '@/lib/actions/carousel-templates'
import type {
  CarouselTemplateField,
  CarouselTemplateTheme,
} from '@/lib/worker'

type Props = {
  template: CarouselTemplateRow
}

type FieldValues = Record<string, string>

function defaultsFromSchema(schema: CarouselTemplateField[]): FieldValues {
  const out: FieldValues = {}
  for (const f of schema) out[f.key] = f.default ?? ''
  return out
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// Curated short list — keeps the picker clean and matches what Google
// Fonts can actually serve via the worker render path.
const FONT_CHOICES = [
  'Inter',
  'IBM Plex Sans Thai',
  'Sarabun',
  'Prompt',
  'Kanit',
  'Noto Sans Thai',
  'Plus Jakarta Sans',
  'DM Serif Display',
  'Playfair Display',
  'Space Grotesk',
  'JetBrains Mono',
]

export function CarouselTemplateEditor({ template }: Props) {
  const router = useRouter()

  const [name, setName] = useState(template.name)
  const [writingPrompt, setWritingPrompt] = useState(
    template.writing_prompt ?? '',
  )
  const isFbPost = template.format_type === 'fb_post'
  // Hydrate from last_draft if present so reload doesn't lose work
  const initialSlides: FieldValues[] = template.last_draft?.slides?.length
    ? (template.last_draft.slides as CarouselSlideValues[]).map((s) => ({
        ...defaultsFromSchema(template.schema),
        ...s,
      }))
    : [defaultsFromSchema(template.schema)]
  const initialTheme: CarouselTemplateTheme =
    template.last_draft?.theme ?? template.default_theme

  const [slides, setSlides] = useState<FieldValues[]>(initialSlides)
  const [activeIdx, setActiveIdx] = useState(0)
  const [theme, setTheme] = useState<CarouselTemplateTheme>(initialTheme)
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)

  const fields = slides[activeIdx] ?? {}
  function setFields(updater: (f: FieldValues) => FieldValues) {
    setSlides((prev) =>
      prev.map((s, i) => (i === activeIdx ? updater(s) : s)),
    )
  }

  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [renderingPng, setRenderingPng] = useState(false)
  const [renderingZip, setRenderingZip] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState<{
    tone: 'error' | 'ok'
    text: string
  } | null>(null)

  // Iframe live preview
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const reqIdRef = useRef(0)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)

  const cacheKey = useMemo(
    () =>
      JSON.stringify({
        h: template.html_template,
        f: fields,
        t: theme,
      }),
    [template.html_template, fields, theme],
  )

  useEffect(() => {
    const handle = setTimeout(() => {
      const myReqId = ++reqIdRef.current
      setPreviewLoading(true)
      setPreviewError(null)
      fetch('/api/carousel-templates/preview-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html_template: template.html_template,
          fields,
          theme,
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
          setPreviewHtml(data.html)
        })
        .catch((e: unknown) => {
          if (myReqId !== reqIdRef.current) return
          setPreviewError(
            e instanceof Error ? e.message : 'preview failed',
          )
        })
        .finally(() => {
          if (myReqId === reqIdRef.current) setPreviewLoading(false)
        })
    }, 250)
    return () => clearTimeout(handle)
  }, [cacheKey, template.html_template, fields, theme])

  // Scale iframe to wrapper width
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    function recompute() {
      if (!wrapper) return
      const w = wrapper.clientWidth
      if (w > 0) setScale(w / template.width)
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [template.width])

  // ----- Auto-save draft (debounced) -----
  const draftKey = useMemo(
    () => JSON.stringify({ slides, theme }),
    [slides, theme],
  )
  // Skip first render — only save on actual user edits
  const firstDraftRender = useRef(true)
  useEffect(() => {
    if (firstDraftRender.current) {
      firstDraftRender.current = false
      return
    }
    const handle = setTimeout(() => {
      void saveCarouselDraft(template.id, { slides, theme }).then((res) => {
        if (res.ok) setDraftSavedAt(Date.now())
      })
    }, 1200)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // ----- AI generate slides from idea -----
  async function generate(idea: string, count: number) {
    setMsg(null)
    setGenerating(true)
    try {
      const res = await generateCarouselSlides(template.id, {
        idea,
        slide_count: count,
      })
      if (!res.ok) {
        setMsg({ tone: 'error', text: res.error })
        return
      }
      // Merge AI values with schema defaults so any missing key is filled
      const filled = res.slides.map((s) => ({
        ...defaultsFromSchema(template.schema),
        ...s,
      }))
      setSlides(filled)
      setActiveIdx(0)
      setShowGenerate(false)
      setMsg({
        tone: 'ok',
        text: `สร้าง ${filled.length} slides แล้ว — แก้ใน editor ก่อน render ได้`,
      })
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof Error ? e.message : 'generation failed',
      })
    } finally {
      setGenerating(false)
    }
  }

  function save() {
    setMsg(null)
    startSave(async () => {
      const res = await updateCarouselTemplate(template.id, {
        name,
        default_theme: theme,
        writing_prompt: writingPrompt,
      })
      if (!res.ok) {
        setMsg({ tone: 'error', text: res.error })
        return
      }
      setMsg({ tone: 'ok', text: 'บันทึก theme เรียบร้อย' })
      router.refresh()
    })
  }

  function destroy() {
    if (!confirm('ลบ template นี้?')) return
    startDelete(async () => {
      const res = await deleteCarouselTemplate(template.id)
      if (!res.ok) {
        setMsg({ tone: 'error', text: res.error })
        return
      }
      router.push('/carousel-templates')
    })
  }

  // ----- Multi-slide helpers -----
  const MAX_SLIDES = 10
  function addSlide() {
    if (slides.length >= MAX_SLIDES) return
    setSlides((prev) => [...prev, defaultsFromSchema(template.schema)])
    setActiveIdx(slides.length)
  }
  function duplicateSlide() {
    if (slides.length >= MAX_SLIDES) return
    setSlides((prev) => {
      const cur = prev[activeIdx] ?? defaultsFromSchema(template.schema)
      const next = [...prev]
      next.splice(activeIdx + 1, 0, { ...cur })
      return next
    })
    setActiveIdx(activeIdx + 1)
  }
  function removeSlide(idx: number) {
    if (slides.length <= 1) return
    setSlides((prev) => prev.filter((_, i) => i !== idx))
    if (activeIdx >= idx && activeIdx > 0) {
      setActiveIdx(Math.max(0, activeIdx - 1))
    }
  }

  // ----- Render PNG (single slide) -----
  async function downloadCurrentPng() {
    setMsg(null)
    setRenderingPng(true)
    try {
      const res = await fetch(
        '/api/carousel-templates/render-png',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html_template: template.html_template,
            fields,
            theme,
            width: template.width,
            height: template.height,
          }),
        },
      )
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const idxStr = String(activeIdx + 1).padStart(2, '0')
      const slug = slugify(name) || 'carousel'
      a.download = `${slug}-slide-${idxStr}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof Error ? e.message : 'render failed',
      })
    } finally {
      setRenderingPng(false)
    }
  }

  // ----- Render all slides → ZIP -----
  async function downloadAllZip() {
    setMsg(null)
    setRenderingZip(true)
    try {
      const res = await fetch(
        '/api/carousel-templates/render-pngs-zip',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html_template: template.html_template,
            slides,
            theme,
            width: template.width,
            height: template.height,
            filename_prefix: slugify(name) || 'carousel',
          }),
        },
      )
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const slug = slugify(name) || 'carousel'
      a.download = `${slug}-slides.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof Error ? e.message : 'render failed',
      })
    } finally {
      setRenderingZip(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5">
      {/* ===== Left: form ===== */}
      <div className="space-y-4">
        <section className="rounded-[12px] border border-border-soft bg-card p-4 space-y-3">
          <FieldLabel>Template name</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </section>

        <section className="rounded-[12px] border border-border-soft bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
                {isFbPost ? 'Cover' : `Slides (${slides.length})`}
              </div>
              {isFbPost && (
                <span className="text-[10px] uppercase tracking-wide font-medium text-brand bg-brand-soft rounded-full px-1.5 py-0.5">
                  FB Post
                </span>
              )}
              {draftSavedAt && (
                <span className="text-[10px] text-muted-foreground">
                  · auto-saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowGenerate(true)}
                title="Let AI fill slides from an idea"
                className="inline-flex items-center gap-1 text-[11px] rounded-[6px] bg-brand text-white px-2 py-1 hover:bg-brand-hover"
              >
                <Sparkles size={11} />
                Generate
              </button>
              {!isFbPost && (
                <>
                  <button
                    type="button"
                    onClick={duplicateSlide}
                    disabled={slides.length >= 10}
                    title="Duplicate current slide"
                    className="inline-flex items-center gap-1 text-[11px] rounded-[6px] border border-border bg-background px-2 py-1 hover:bg-secondary disabled:opacity-40"
                  >
                    <Copy size={11} />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={addSlide}
                    disabled={slides.length >= 10}
                    title="Add empty slide"
                    className="inline-flex items-center gap-1 text-[11px] rounded-[6px] border border-border bg-background px-2 py-1 hover:bg-secondary disabled:opacity-40"
                  >
                    <Plus size={11} />
                    Add
                  </button>
                </>
              )}
            </div>
          </div>
          {!isFbPost && (
            <div className="flex flex-wrap gap-1">
              {slides.map((_, i) => {
                const active = i === activeIdx
                return (
                  <div
                    key={i}
                    className={`group inline-flex items-center rounded-[6px] border text-xs transition-colors ${
                      active
                        ? 'bg-brand text-white border-brand'
                        : 'bg-background border-border text-foreground hover:bg-secondary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      className="pl-2.5 pr-1.5 py-1 font-medium"
                    >
                      Slide {i + 1}
                    </button>
                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlide(i)}
                        title="Remove this slide"
                        className={`pr-2 pl-0.5 py-1 opacity-50 hover:opacity-100 ${
                          active ? 'text-white' : 'text-muted-foreground'
                        }`}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {template.schema.length > 0 && (
          <section className="rounded-[12px] border border-border-soft bg-card p-4 space-y-3">
            <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
              Content fields
            </div>
            {template.schema.map((f) => (
              <div key={f.key}>
                <FieldLabel>
                  {f.label}{' '}
                  {f.type !== 'image' && f.max_chars && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {(fields[f.key] ?? '').length}/{f.max_chars}
                    </span>
                  )}
                </FieldLabel>
                {f.type === 'image' ? (
                  <ImageField
                    templateId={template.id}
                    fieldKey={f.key}
                    value={fields[f.key] ?? ''}
                    onChange={(v) =>
                      setFields((s) => ({ ...s, [f.key]: v }))
                    }
                  />
                ) : f.type === 'longtext' ? (
                  <textarea
                    value={fields[f.key] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setFields((s) => ({ ...s, [f.key]: v }))
                    }}
                    rows={3}
                    className="w-full px-3 py-2 rounded-[8px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={fields[f.key] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setFields((s) => ({ ...s, [f.key]: v }))
                    }}
                    className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                )}
              </div>
            ))}
          </section>
        )}

        <section className="rounded-[12px] border border-border-soft bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
              Writing prompt
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {writingPrompt.length}/8000
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            บอก AI ว่าควรเขียน slide ของ template นี้ยังไง (tone, ความยาว,
            โครงสร้าง). ใช้ทุกครั้งที่กด Generate หรือ recreate จาก URL
            ด้วย template นี้ — layered บน prompt ทั่วไป
          </p>
          <textarea
            value={writingPrompt}
            onChange={(e) => setWritingPrompt(e.target.value)}
            placeholder='เช่น "Slide 1 ต้องเป็น hook ขัดสามัญสำนึก ใช้ตัวเลขจริง. Slide 2-4 เล่า conflict สั้น ๆ ไม่เกิน 2 ประโยคต่อ slide. Slide สุดท้าย CTA แบบ direct ไม่ขอ like share"'
            rows={5}
            maxLength={8000}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-[8px] border border-border bg-background text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand resize-y font-mono"
          />
        </section>

        <section className="rounded-[12px] border border-border-soft bg-card p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
            Theme
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ColorField
              label="Background"
              value={theme.bg ?? '#FFFFFF'}
              onChange={(v) => setTheme({ ...theme, bg: v })}
            />
            <ColorField
              label="Text"
              value={theme.fg ?? '#000000'}
              onChange={(v) => setTheme({ ...theme, fg: v })}
            />
            <ColorField
              label="Accent"
              value={theme.accent ?? '#FF751F'}
              onChange={(v) => setTheme({ ...theme, accent: v })}
            />
          </div>

          <FieldLabel>Heading font</FieldLabel>
          <select
            value={theme.font_heading ?? 'Inter'}
            onChange={(e) =>
              setTheme({ ...theme, font_heading: e.target.value })
            }
            className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {FONT_CHOICES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            {!FONT_CHOICES.includes(theme.font_heading ?? '') &&
              theme.font_heading && (
                <option value={theme.font_heading}>
                  {theme.font_heading}
                </option>
              )}
          </select>

          <FieldLabel>Body font</FieldLabel>
          <select
            value={theme.font_body ?? 'Inter'}
            onChange={(e) =>
              setTheme({ ...theme, font_body: e.target.value })
            }
            className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {FONT_CHOICES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            {!FONT_CHOICES.includes(theme.font_body ?? '') &&
              theme.font_body && (
                <option value={theme.font_body}>{theme.font_body}</option>
              )}
          </select>
        </section>

        {msg && (
          <div
            className={`text-sm rounded-[8px] border px-3 py-2 ${
              msg.tone === 'error'
                ? 'border-status-red-border bg-status-red-bg text-status-red-text'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className={isFbPost ? '' : 'grid grid-cols-2 gap-2'}>
          <button
            type="button"
            onClick={downloadCurrentPng}
            disabled={renderingPng || renderingZip}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-[8px] bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50 px-3 py-2"
            title="Download the active slide as PNG"
          >
            {renderingPng ? (
              <Loader2 className="animate-spin" size={13} />
            ) : (
              <Download size={13} />
            )}
            {isFbPost ? 'Download cover' : 'Download slide'}
          </button>
          {!isFbPost && (
            <button
              type="button"
              onClick={downloadAllZip}
              disabled={renderingPng || renderingZip}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-[8px] bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50 px-3 py-2"
              title={`Render all ${slides.length} slides and download as ZIP`}
            >
              {renderingZip ? (
                <Loader2 className="animate-spin" size={13} />
              ) : (
                <FileArchive size={13} />
              )}
              Render all ({slides.length})
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || deleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-[8px] bg-brand hover:bg-brand-hover text-white disabled:opacity-50 px-4 py-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={13} />
            ) : (
              <Save size={13} />
            )}
            Save template
          </button>
          <button
            type="button"
            onClick={destroy}
            disabled={saving || deleting}
            className="inline-flex items-center gap-1.5 text-sm rounded-[8px] border border-border text-status-red-text hover:bg-status-red-bg disabled:opacity-50 px-3 py-2"
          >
            {deleting ? (
              <Loader2 className="animate-spin" size={13} />
            ) : (
              <Trash2 size={13} />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* ===== Right: iframe live preview ===== */}
      <div
        ref={wrapperRef}
        className="relative w-full bg-[#0a0a0a] rounded-[12px] overflow-hidden"
        style={{
          aspectRatio: `${template.width} / ${template.height}`,
        }}
      >
        {previewHtml ? (
          <iframe
            title="carousel preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${template.width}px`,
              height: `${template.height}px`,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
            {previewError ? (
              <span className="px-3 py-2 rounded-[8px] bg-red-600/80 text-white text-xs max-w-[80%] text-center">
                {previewError}
              </span>
            ) : (
              <Loader2 size={20} className="animate-spin" />
            )}
          </div>
        )}

        {previewLoading && previewHtml && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 text-white text-[10px] font-medium pointer-events-none">
            <Loader2 size={10} className="animate-spin" />
            updating
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          defaultCount={
            isFbPost ? 1 : Math.max(3, Math.min(slides.length || 5, 9))
          }
          countLocked={isFbPost}
          isFbPost={isFbPost}
          generating={generating}
          onClose={() => setShowGenerate(false)}
          onSubmit={generate}
        />
      )}
    </div>
  )
}

function GenerateModal({
  defaultCount,
  countLocked,
  isFbPost,
  generating,
  onClose,
  onSubmit,
}: {
  defaultCount: number
  countLocked?: boolean
  isFbPost?: boolean
  generating: boolean
  onClose: () => void
  onSubmit: (idea: string, count: number) => void
}) {
  const [idea, setIdea] = useState('')
  const [count, setCount] = useState(defaultCount)
  const trimmed = idea.trim()
  const canSubmit = trimmed.length >= 10 && !generating

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !generating) onClose()
      }}
    >
      <div className="bg-card rounded-[14px] border border-border-soft w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-border-soft flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Generate slides from idea
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI จะเขียนเนื้อหาให้ทุก slide ตาม template schema +
              voice profile ของพี่
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Idea / topic
            </label>
            <textarea
              autoFocus
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="เช่น 5 เหตุผลที่ Solopreneur ควรเริ่มเก็บ Email List ตั้งแต่วันแรก"
              rows={5}
              maxLength={8000}
              disabled={generating}
              className="w-full px-3 py-2 rounded-[8px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>ขั้นต่ำ 10 ตัวอักษร</span>
              <span className="tabular-nums">{idea.length}/8000</span>
            </div>
          </div>
          {!countLocked ? (
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Number of slides
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={9}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  disabled={generating}
                  className="flex-1"
                />
                <span className="text-sm font-medium tabular-nums w-6 text-right">
                  {count}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground bg-secondary/40 rounded-[8px] px-2.5 py-1.5">
              {isFbPost
                ? 'FB post template = single cover image (1 slide).'
                : `Slide count locked at ${count}.`}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border-soft flex justify-end gap-2 bg-secondary/30">
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="text-sm rounded-[8px] border border-border bg-background px-3 py-2 hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(trimmed, count)}
            className="inline-flex items-center gap-1.5 text-sm font-medium rounded-[8px] bg-brand text-white px-4 py-2 hover:bg-brand-hover disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={13} />
                AI กำลังเขียน...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1">
      <span>{children}</span>
    </label>
  )
}

function ImageField({
  templateId,
  fieldKey,
  value,
  onChange,
}: {
  templateId: string
  fieldKey: string
  value: string
  onChange: (v: string) => void
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function uploadFile(file: File) {
    setErr(null)
    if (!file.type.startsWith('image/')) {
      setErr('ต้องเป็นรูปภาพเท่านั้น')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setErr('ไฟล์ใหญ่เกิน 8MB')
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setErr('Session หมดอายุ')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const stamp = Date.now()
    const path = `${user.id}/${templateId}/fields/${fieldKey}-${stamp}.${ext}`

    setUploading(true)
    const { error } = await supabase.storage
      .from('carousel-templates')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) {
      setUploading(false)
      setErr(error.message)
      return
    }
    const { data } = supabase.storage
      .from('carousel-templates')
      .getPublicUrl(path)
    setUploading(false)
    if (data?.publicUrl) onChange(data.publicUrl)
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void uploadFile(file)
  }

  const hasImage = !!value

  return (
    <div className="space-y-1.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
        disabled={uploading}
      />

      {hasImage ? (
        <div className="flex items-center gap-2 rounded-[10px] border border-border bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={fieldKey}
            className="w-14 h-14 rounded-[8px] object-cover bg-secondary shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-foreground">
              รูปพร้อมใช้
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              ระบบจะ fit ลง slot ของ template ให้อัตโนมัติ
              (ตัดเป็นวงกลม / สี่เหลี่ยมตาม layout)
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-[11px] text-foreground hover:bg-secondary border border-border rounded-[6px] px-2 py-1 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={11} />
            ) : (
              'Replace'
            )}
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={uploading}
            className="text-[11px] text-muted-foreground hover:text-status-red-text rounded-[6px] px-2 py-1 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed cursor-pointer transition-colors py-5 px-3 text-center ${
            dragOver
              ? 'border-brand bg-brand-soft'
              : 'border-border hover:border-brand hover:bg-secondary/30'
          } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span className="text-[11px] text-muted-foreground">
                กำลังอัปโหลด…
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={18} className="text-muted-foreground" />
              <span className="text-[12px] font-medium text-foreground">
                ลากรูปมาวาง หรือคลิกเพื่อเลือกไฟล์
              </span>
              <span className="text-[10px] text-muted-foreground">
                PNG / JPG / WebP (max 8MB) — ระบบจะ fit ลง template ให้
              </span>
            </>
          )}
        </div>
      )}

      {showUrl && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... (ถ้ามี URL อยู่แล้ววางที่นี่)"
          spellCheck={false}
          className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
        />
      )}

      <div className="flex items-center justify-between">
        {err ? (
          <div className="text-[11px] text-status-red-text">{err}</div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          {showUrl ? 'ซ่อน URL' : 'วาง URL แทน'}
        </button>
      </div>
    </div>
  )
}

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
    <div>
      <div className="text-[10px] font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-[6px] border border-border cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 h-9 px-2 rounded-[6px] border border-border bg-background text-[11px] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
    </div>
  )
}
