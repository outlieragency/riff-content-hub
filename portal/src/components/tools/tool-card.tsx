'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Loader2, Sparkles, type LucideIcon } from 'lucide-react'
import { runAiTool } from '@/lib/actions/tools'
import type { ToolKind } from '@/lib/types/tool'

export function ToolCard({
  tool,
  icon: Icon,
  title,
  tagline,
  description,
  inputLabel,
  inputPlaceholder,
  inputRows = 5,
}: {
  tool: ToolKind
  icon: LucideIcon
  title: string
  tagline: string
  description: string
  inputLabel: string
  inputPlaceholder: string
  inputRows?: number
}) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{
    model: string
    latency_ms: number
  } | null>(null)
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)

  function run() {
    if (!input.trim()) {
      setError('ใส่ input ก่อน')
      return
    }
    setError(null)
    setOutput(null)
    setMeta(null)
    start(async () => {
      const res = await runAiTool(tool, input)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOutput(res.output_markdown)
      setMeta({ model: res.meta.model, latency_ms: res.meta.latency_ms })
    })
  }

  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-[14px] border border-border-soft bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-[10px] bg-brand-soft text-brand inline-flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <span className="text-xs text-muted-foreground">{tagline}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <label className="block text-xs font-medium text-foreground mb-1.5">
        {inputLabel}
      </label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        rows={inputRows}
        disabled={pending}
        className="w-full px-3 py-2 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-y leading-relaxed"
      />
      <div className="text-[10px] text-muted-foreground mt-1 text-right tabular-nums">
        {input.length} / 8000
      </div>

      {error && (
        <div className="mt-2 text-sm bg-status-red-bg border border-status-red-border text-status-red-text rounded-[8px] px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={run}
          disabled={pending || !input.trim()}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              กำลังวิเคราะห์...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Run {title}
            </>
          )}
        </button>
      </div>

      {output && (
        <div className="mt-5 pt-5 border-t border-border-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Output
            </h3>
            <div className="flex items-center gap-3 text-xs">
              {meta && (
                <span className="text-muted-foreground tabular-nums">
                  {(meta.latency_ms / 1000).toFixed(1)}s · {meta.model}
                </span>
              )}
              <button
                type="button"
                onClick={copy}
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                Copy
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
            {output}
          </div>
        </div>
      )}
    </section>
  )
}
