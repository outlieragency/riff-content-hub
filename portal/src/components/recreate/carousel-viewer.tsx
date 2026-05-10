'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  LayoutGrid,
} from 'lucide-react'
import type { CarouselOutput } from '@/lib/types/recreate-formats'
import { downloadUrlAs } from '@/lib/utils/download'

const SLIDE_KIND_LABEL: Record<string, string> = {
  tweet: 'Tweet',
  cover: 'Cover',
  content: 'Content',
  quote: 'Quote',
  list: 'List',
  cta: 'CTA',
}

export function CarouselViewer({
  draftId,
  output,
}: {
  draftId: string
  output: CarouselOutput
}) {
  const [copied, setCopied] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const urls = output.carousel_urls ?? []
  const slides = output.slides ?? []
  const renderedCount = urls.length

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(output, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function downloadOne(url: string, index: number) {
    await downloadUrlAs(
      url,
      `${output.slug}-${String(index + 1).padStart(2, '0')}.png`,
    )
  }

  async function downloadAll() {
    if (urls.length === 0) return
    setDownloadingAll(true)
    try {
      for (let i = 0; i < urls.length; i++) {
        await downloadUrlAs(
          urls[i],
          `${output.slug}-${String(i + 1).padStart(2, '0')}.png`,
        )
        // Small delay between downloads — some browsers throttle simultaneous
        await new Promise((r) => setTimeout(r, 250))
      }
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
          <LayoutGrid size={12} />
          {slides.length} slides · template:{' '}
          <span className="font-mono text-foreground">{output.template}</span> · theme:{' '}
          <span className="font-mono text-foreground">{output.theme}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyJson}
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            Copy JSON
          </button>
          {urls.length > 0 && (
            <button
              type="button"
              onClick={downloadAll}
              disabled={downloadingAll}
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Download size={12} />
              ดาวน์โหลดทั้งหมด ({urls.length})
            </button>
          )}
        </div>
      </div>

      {/* Warnings */}
      {output.carousel_warnings && output.carousel_warnings.length > 0 && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <AlertTriangle size={11} />
            Warnings
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            {output.carousel_warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Slide grid (rendered images) */}
      {urls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {urls.map((url, i) => {
            const slide = slides[i]
            return (
              <div
                key={i}
                className="surface-1 rounded-[14px] overflow-hidden group"
              >
                <div
                  className="relative aspect-[4/5] bg-secondary cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
                >
                  <Image
                    src={url}
                    alt={`slide ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <Eye
                      size={20}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/70 text-white tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {slide?.kind ? SLIDE_KIND_LABEL[slide.kind] ?? slide.kind : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadOne(url, i)}
                    className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    <Download size={9} />
                    save
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : slides.length > 0 ? (
        <div className="rounded-[14px] border border-dashed border-border p-6 text-center">
          <ImageIcon
            size={28}
            className="text-muted-foreground mx-auto mb-2"
            strokeWidth={1.4}
          />
          <p className="text-sm font-medium text-foreground mb-1">
            ยังไม่มี slide image render
          </p>
          <p className="text-xs text-muted-foreground">
            Worker ยังไม่ได้ render slides แสดง slide content เป็น JSON ด้านล่าง
          </p>
        </div>
      ) : null}

      {/* Slide content (text) — fallback / always shown for review */}
      <div className="surface-1 rounded-[14px] p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Slide content
        </h3>
        <ol className="space-y-3">
          {slides.map((s, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-[10px] font-medium tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {SLIDE_KIND_LABEL[s.kind] ?? s.kind}
                </span>
              </div>
              <SlideContentText slide={s} />
            </li>
          ))}
        </ol>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && urls[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={urls[lightboxIndex]}
              alt={`slide ${lightboxIndex + 1}`}
              width={1080}
              height={1350}
              unoptimized
              className="max-h-[90vh] w-auto rounded-[14px]"
            />
            <div className="absolute -top-10 right-0 inline-flex items-center gap-3 text-white">
              <span className="text-xs tabular-nums">
                {lightboxIndex + 1} / {renderedCount}
              </span>
              <button
                type="button"
                onClick={() => downloadOne(urls[lightboxIndex], lightboxIndex)}
                className="text-xs hover:underline inline-flex items-center gap-1"
              >
                <Download size={11} />
                Download
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="text-xs hover:underline"
              >
                ปิด
              </button>
            </div>
            {/* Prev/next buttons */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                className="absolute left-[-48px] top-1/2 -translate-y-1/2 text-white text-3xl"
              >
                ‹
              </button>
            )}
            {lightboxIndex < renderedCount - 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                className="absolute right-[-48px] top-1/2 -translate-y-1/2 text-white text-3xl"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SlideContentText({
  slide,
}: {
  slide: CarouselOutput['slides'][number]
}) {
  switch (slide.kind) {
    case 'tweet':
      return (
        <div>
          <p className="text-foreground whitespace-pre-wrap">{slide.text}</p>
          {slide.author && (
            <p className="text-xs text-muted-foreground mt-1">— {slide.author}</p>
          )}
        </div>
      )
    case 'cover':
      return (
        <div>
          <p className="font-semibold text-foreground">{slide.title}</p>
          {slide.subtitle && (
            <p className="text-muted-foreground mt-0.5">{slide.subtitle}</p>
          )}
        </div>
      )
    case 'content':
      return (
        <div>
          <p className="font-semibold text-foreground">{slide.heading}</p>
          <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
            {slide.body}
          </p>
        </div>
      )
    case 'quote':
      return (
        <div>
          <p className="text-foreground italic">&ldquo;{slide.text}&rdquo;</p>
          {slide.attribution && (
            <p className="text-xs text-muted-foreground mt-1">
              — {slide.attribution}
            </p>
          )}
        </div>
      )
    case 'list':
      return (
        <div>
          <p className="font-semibold text-foreground mb-1">{slide.heading}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
            {slide.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      )
    case 'cta':
      return (
        <div>
          <p className="font-semibold text-foreground">{slide.heading}</p>
          <p className="text-muted-foreground mt-0.5">{slide.body}</p>
          {slide.cta_text && (
            <p className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              {slide.cta_text}
            </p>
          )}
        </div>
      )
    default:
      return null
  }
}
