'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  ImageIcon,
  Pencil,
} from 'lucide-react'

export type TemplateFbPostOutput = {
  kind: 'template_fb_post'
  template_id: string
  template_name?: string
  title?: string
  post_body: string
  thesis?: string
  cover_fields?: Record<string, string>
  theme?: Record<string, unknown>
  cover_url?: string
  cover_warnings?: string[]
  width?: number
  height?: number
}

export function TemplateFbPostViewer({
  draftId,
  output,
}: {
  draftId: string
  output: TemplateFbPostOutput
}) {
  const [copied, setCopied] = useState(false)
  const body = output.post_body ?? ''

  async function copyBody() {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function downloadCover() {
    if (!output.cover_url) return
    const a = document.createElement('a')
    a.href = output.cover_url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.download = 'cover.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="space-y-4">
      {/* Handoff banner to template editor */}
      <div className="rounded-[12px] border border-border-soft bg-brand-soft px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            Generate เสร็จแล้ว — ขั้นต่อไป edit ก่อน post
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Template:{' '}
            <span className="font-mono">
              {output.template_name ?? 'custom'}
            </span>
            {' '}— เปิด editor เพื่อแก้ cover text/theme ก่อน post
          </p>
        </div>
        <Link
          href={`/carousel-templates/${output.template_id}`}
          className="shrink-0 inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-[8px] px-4 py-2"
        >
          <Pencil size={13} />
          Edit cover
        </Link>
      </div>

      {output.cover_warnings && output.cover_warnings.length > 0 && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <AlertTriangle size={11} />
            Warnings
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            {output.cover_warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        {/* Cover preview */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
            Cover
          </div>
          <div
            className="relative w-full bg-[#0a0a0a] rounded-[12px] overflow-hidden"
            style={{
              aspectRatio: `${output.width ?? 1080} / ${output.height ?? 1350}`,
            }}
          >
            {output.cover_url ? (
              <Image
                src={output.cover_url}
                alt="cover"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                <ImageIcon size={20} className="mr-1.5" />
                ยังไม่มี cover render
              </div>
            )}
          </div>
          {output.cover_url && (
            <button
              type="button"
              onClick={downloadCover}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-[8px] border border-border bg-background hover:bg-secondary px-3 py-2"
            >
              <Download size={13} />
              Download cover.png
            </button>
          )}
        </div>

        {/* Post body */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
              Post body ({body.length.toLocaleString()} chars)
            </div>
            <button
              type="button"
              onClick={copyBody}
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy body'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-sans leading-relaxed rounded-[12px] border border-border-soft bg-card p-4 max-h-[600px] overflow-auto">
            {body || 'no body'}
          </pre>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground">
        Draft id: <span className="font-mono">{draftId}</span>
      </div>
    </div>
  )
}
