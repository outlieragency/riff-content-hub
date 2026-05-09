'use client'

import { useState } from 'react'
import { Check, Copy, FileText, ImageIcon, Video } from 'lucide-react'
import type { YtScriptOutput } from '@/lib/types/recreate-formats'

export function YtScriptViewer({ output }: { output: YtScriptOutput }) {
  const [copiedTitle, setCopiedTitle] = useState<number | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  async function copyTitle(t: string, i: number) {
    await navigator.clipboard.writeText(t)
    setCopiedTitle(i)
    setTimeout(() => setCopiedTitle(null), 1500)
  }

  const fullScript = output.script_sections
    .map((s) => `## ${s.heading}\n\n${s.text}`)
    .join('\n\n')

  async function copyScript() {
    await navigator.clipboard.writeText(fullScript)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
        <Video size={12} />
        YouTube long-form script
      </div>

      {/* Title options */}
      <div className="surface-1 rounded-[14px] p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Title options
        </h3>
        <ol className="space-y-1.5">
          {output.title_options.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-[10px] font-medium tabular-nums shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="flex-1 text-foreground">{t}</span>
              <button
                type="button"
                onClick={() => copyTitle(t, i)}
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                {copiedTitle === i ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Outline */}
      <div className="surface-1 rounded-[14px] p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Outline
        </h3>
        <ol className="space-y-3">
          {output.outline.map((sec, i) => (
            <li key={i}>
              <p className="font-semibold text-foreground text-sm">
                {i + 1}. {sec.heading}
              </p>
              <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-sm text-muted-foreground">
                {sec.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {/* Full script */}
      <div className="surface-1 rounded-[14px] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1">
            <FileText size={11} />
            Full script
          </h3>
          <button
            type="button"
            onClick={copyScript}
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            {copiedScript ? <Check size={11} /> : <Copy size={11} />}
            Copy script
          </button>
        </div>
        <div className="space-y-3">
          {output.script_sections.map((s, i) => (
            <div key={i}>
              <p className="font-semibold text-foreground text-sm mb-1">
                {s.heading}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnail brief */}
      {output.thumbnail_brief && (
        <div className="surface-1 rounded-[14px] p-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1">
            <ImageIcon size={11} />
            Thumbnail brief
          </h3>
          <div className="space-y-2 text-sm">
            <Field
              label="Visual"
              value={output.thumbnail_brief.visual_description}
            />
            <Field
              label="Text overlay"
              value={output.thumbnail_brief.text_overlay}
            />
            <Field label="Mood" value={output.thumbnail_brief.mood} />
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="text-foreground">{value}</p>
    </div>
  )
}
