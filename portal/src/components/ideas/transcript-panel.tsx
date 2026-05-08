'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2, Sparkles, RotateCw, Languages, FileText } from 'lucide-react'
import {
  startTranscriptProcess,
  type TranscriptState,
} from '@/lib/actions/transcripts'
import type { TranscriptSummary } from '@/lib/worker'
import { JobProgress } from '@/components/jobs/job-progress'

type Props = {
  ideaId: string
  initial: TranscriptState
}

export function TranscriptPanel({ ideaId, initial }: Props) {
  const router = useRouter()
  const [state, setState] = useState<TranscriptState>(initial)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [showOriginal, setShowOriginal] = useState(false)

  function runProcess(force = false) {
    setError(null)
    start(async () => {
      const res = await startTranscriptProcess(ideaId, { force })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setActiveJobId(res.jobId)
    })
  }

  function onJobDone() {
    setActiveJobId(null)
    // Server-side data has been written; refresh route to pick it up
    router.refresh()
  }

  function onJobError() {
    setActiveJobId(null)
  }

  if (state.status === 'no_video') {
    return (
      <Empty
        title="ไม่มี video link"
        description="idea นี้ไม่ได้เชื่อมกับ YouTube video — recreate ต้องมี video เพื่อดึง transcript"
      />
    )
  }

  if (state.status === 'missing') {
    return (
      <div className="space-y-3">
        <Empty
          title="ยังไม่ได้ดึง transcript"
          description="กดปุ่มให้ AI ดึง caption ของ video → แปลไทยถ้าเป็นภาษาอื่น → สรุปเป็น structure ที่พร้อม recreate"
        />
        {error && <ErrorBox text={error} />}
        {activeJobId && (
          <JobProgress
            jobId={activeJobId}
            onDone={onJobDone}
            onError={onJobError}
          />
        )}
        {!activeJobId && (
          <button
            type="button"
            onClick={() => runProcess(false)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            ดึง + แปล + สรุป transcript
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Pill icon={<Languages size={11} />} label={`Language: ${state.language ?? 'unknown'}`} />
        {state.hasTranslation && (
          <Pill icon={<Languages size={11} />} label="แปลไทยแล้ว" tone="green" />
        )}
        {state.summarizedAt && (
          <span className="text-2xs text-muted-foreground">
            สรุป {new Date(state.summarizedAt).toLocaleString('th-TH')}
          </span>
        )}
        <button
          type="button"
          onClick={() => runProcess(true)}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : <RotateCw size={11} />}
          Re-run
        </button>
      </div>

      {error && <ErrorBox text={error} />}

      {activeJobId && (
        <JobProgress
          jobId={activeJobId}
          onDone={onJobDone}
          onError={onJobError}
        />
      )}

      {state.summary && <SummaryView summary={state.summary} />}

      {(state.plainText || state.translatedText) && (
        <details className="group rounded-[10px] border border-border-soft">
          <summary className="px-3 py-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none flex items-center gap-1.5">
            <FileText size={12} />
            เปิดดู transcript เต็ม
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-2">
            <div className="flex items-center gap-1.5 text-2xs">
              {state.translatedText && state.plainText && (
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="h-6 px-2 rounded-[5px] border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {showOriginal ? 'ดูฉบับแปล' : `ดูต้นฉบับ (${state.language})`}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">
              {showOriginal && state.plainText
                ? state.plainText
                : (state.translatedText ?? state.plainText ?? '')}
            </p>
          </div>
        </details>
      )}
    </div>
  )
}

function SummaryView({ summary }: { summary: TranscriptSummary }) {
  return (
    <div className="space-y-3">
      {summary.main_thesis && (
        <Block label="Main thesis">{summary.main_thesis}</Block>
      )}
      {summary.hook && <Block label="Hook ของต้นฉบับ">{summary.hook}</Block>}

      {summary.body_sections.length > 0 && (
        <div className="rounded-[10px] border border-border p-3">
          <div className="text-xs font-medium text-foreground mb-2">โครง body</div>
          <ol className="space-y-2.5">
            {summary.body_sections.map((s, i) => (
              <li key={i} className="text-sm text-foreground">
                <div className="font-medium">
                  {i + 1}. {s.heading}
                </div>
                {s.key_points.length > 0 && (
                  <ul className="mt-1 ml-4 space-y-0.5 list-disc text-xs text-muted-foreground">
                    {s.key_points.map((kp, j) => (
                      <li key={j}>{kp}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {summary.examples.length > 0 && (
        <ListBlock label="ตัวอย่าง / รูปธรรม" items={summary.examples} />
      )}
      {summary.takeaways.length > 0 && (
        <ListBlock label="Takeaways" items={summary.takeaways} variant="green" />
      )}
      {summary.cta && <Block label="CTA ของต้นฉบับ">{summary.cta}</Block>}
    </div>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border p-3">
      <div className="text-xs font-medium text-foreground mb-1">{label}</div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  )
}

function ListBlock({
  label,
  items,
  variant,
}: {
  label: string
  items: string[]
  variant?: 'green'
}) {
  return (
    <div className="rounded-[10px] border border-border p-3">
      <div className="text-xs font-medium text-foreground mb-2">{label}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li
            key={i}
            className={`text-sm leading-relaxed ${variant === 'green' ? 'text-status-green-text' : 'text-muted-foreground'}`}
          >
            • {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Pill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode
  label: string
  tone?: 'green'
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-2xs ${
        tone === 'green'
          ? 'bg-status-green-bg border border-status-green-border text-status-green-text'
          : 'bg-secondary border border-border text-muted-foreground'
      }`}
    >
      {icon}
      {label}
    </span>
  )
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[10px] border border-dashed border-border p-4 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
    </div>
  )
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
      {text}
    </div>
  )
}
