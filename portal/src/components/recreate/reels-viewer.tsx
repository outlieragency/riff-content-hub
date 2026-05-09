'use client'

import { useState } from 'react'
import { Check, Clock, Copy, Smartphone } from 'lucide-react'
import type { ReelsOutput } from '@/lib/types/recreate-formats'

export function ReelsViewer({ output }: { output: ReelsOutput }) {
  const [copied, setCopied] = useState<'hook' | 'body' | 'cta' | 'all' | null>(
    null,
  )

  async function copy(key: 'hook' | 'body' | 'cta' | 'all', text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const fullScript = `[HOOK – 5s]\n${output.hook}\n\n[BODY – ${
    output.estimated_duration_seconds - 10
  }s]\n${output.body}\n\n[CTA – 5s]\n${output.cta}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
          <Smartphone size={12} />
          Reels script ·{' '}
          <Clock size={12} />~{output.estimated_duration_seconds}s
        </div>
        <button
          type="button"
          onClick={() => copy('all', fullScript)}
          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          {copied === 'all' ? <Check size={12} /> : <Copy size={12} />}
          Copy full script
        </button>
      </div>

      <Section
        label="HOOK · 5s"
        text={output.hook}
        copied={copied === 'hook'}
        onCopy={() => copy('hook', output.hook)}
      />
      <Section
        label={`BODY · ~${output.estimated_duration_seconds - 10}s`}
        text={output.body}
        copied={copied === 'body'}
        onCopy={() => copy('body', output.body)}
      />
      <Section
        label="CTA · 5s"
        text={output.cta}
        copied={copied === 'cta'}
        onCopy={() => copy('cta', output.cta)}
      />

      {output.visual_cues && output.visual_cues.length > 0 && (
        <div className="surface-1 rounded-[14px] p-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Visual cues
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
            {output.visual_cues.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Section({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string
  text: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="surface-1 rounded-[14px] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </h3>
        <button
          type="button"
          onClick={onCopy}
          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          Copy
        </button>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </div>
  )
}
