'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import {
  fetchJob,
  pollJobUntilDone,
  subscribeToJob,
  type JobRow,
} from '@/lib/supabase/realtime'

/** Friendly Thai labels per worker progress_step value. */
const STEP_LABELS: Record<string, string> = {
  // sync_channel
  resolving_channel: 'กำลังหา channel',
  resolving_channel_top_viewed: 'กำลังหา top videos ของ channel',
  resolving_channel_recent: 'กำลังหา latest videos ของ channel',
  resolving_channel_hybrid: 'กำลังหา top + latest videos',
  // process_transcript
  fetching_transcript: 'กำลังดึง transcript จาก YouTube',
  translating: 'กำลังแปลเป็นไทย',
  summarizing: 'กำลังสรุปประเด็น',
  saving: 'กำลังบันทึกลง DB',
  cached: 'ใช้ข้อมูลที่ cache',
  // run_recreate
  starting: 'เริ่มประมวลผล',
  loading_context: 'กำลังโหลด voice profile + summary',
  generating_yt_script: 'AI กำลังเขียน YouTube Script',
  generating_fb_article: 'AI กำลังเขียน Facebook post',
  generating_reels: 'AI กำลังเขียน Reels',
  generating_carousel: 'AI กำลังสร้าง Carousel',
  saving_draft: 'กำลังบันทึก draft',
  rendering_cover: 'กำลัง render cover.png + upload',
  // extract_voice
  analyzing: 'กำลังวิเคราะห์ตัวอย่าง',
  // misc
  retrying: 'กำลัง retry',
  done: 'เสร็จแล้ว',
}

/** Rough estimate per step — used for elapsed time hint. */
const ETA_HINTS: Record<string, string> = {
  fetching_transcript: 'ใช้เวลา ~10-30 วิ',
  translating: 'ใช้เวลา ~10-20 วิ',
  summarizing: 'ใช้เวลา ~15-30 วิ',
  generating_fb_article: 'ใช้เวลา ~30-60 วิ (AI เขียน + render cover)',
  generating_yt_script: 'ใช้เวลา ~30-60 วิ',
  generating_reels: 'ใช้เวลา ~20-40 วิ',
  generating_carousel: 'ใช้เวลา ~30-60 วิ',
  rendering_cover: 'ใช้เวลา ~3-5 วิ',
  resolving_channel_top_viewed: 'ใช้เวลา ~30-60 วิ',
  resolving_channel_recent: 'ใช้เวลา ~10-20 วิ',
  resolving_channel_hybrid: 'ใช้เวลา ~30-60 วิ',
}

function stepLabel(status: string, step: string | null): string {
  if (status === 'queued') return 'อยู่ในคิว — รอ worker หยิบงาน'
  if (!step) return 'กำลังประมวลผล'
  return STEP_LABELS[step] ?? step
}

function etaHint(step: string | null): string | null {
  if (!step) return null
  return ETA_HINTS[step] ?? null
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export type JobProgressProps = {
  jobId: string
  initial?: JobRow | null
  onDone?: (job: JobRow) => void
  onError?: (job: JobRow) => void
  /** Render compact version (no card chrome) */
  compact?: boolean
}

/**
 * Reactive component that subscribes to Supabase Realtime for a single job
 * row and renders progress until terminal state.
 *
 * v2 improvements:
 * - Shows elapsed time (so user knows it's actually running)
 * - Indeterminate shimmer when 0% / queued (instead of empty bar)
 * - Stuck warning if no progress for >8s
 * - Friendly Thai step labels
 * - ETA hint per step
 */
export function JobProgress({
  jobId,
  initial,
  onDone,
  onError,
  compact = false,
}: JobProgressProps) {
  const [job, setJob] = useState<JobRow | null>(initial ?? null)
  const [pollFallback, setPollFallback] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [lastProgressTick, setLastProgressTick] = useState(() => Date.now())

  // Initial fetch
  useEffect(() => {
    if (initial) return
    fetchJob(jobId)
      .then((j) => setJob(j))
      .catch(() => {})
  }, [jobId, initial])

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToJob(
      jobId,
      (j) => {
        setJob((prev) => {
          if (
            prev &&
            (prev.progress !== j.progress || prev.progress_step !== j.progress_step)
          ) {
            setLastProgressTick(Date.now())
          }
          return j
        })
      },
      () => setPollFallback(true),
    )
    return unsub
  }, [jobId])

  // Polling fallback
  useEffect(() => {
    if (!pollFallback) return
    let cancelled = false
    pollJobUntilDone(jobId, { intervalMs: 2000 })
      .then((j) => {
        if (!cancelled) setJob(j)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pollFallback, jobId])

  // 1Hz tick for elapsed time updates
  useEffect(() => {
    if (!job) return
    if (job.status === 'done' || job.status === 'error') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [job?.status, job])

  // Trigger callbacks on terminal status
  useEffect(() => {
    if (!job) return
    if (job.status === 'done') onDone?.(job)
    else if (job.status === 'error') onError?.(job)
  }, [job?.status, job, onDone, onError])

  if (!job) {
    return (
      <Wrapper compact={compact}>
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">กำลังโหลด job...</span>
        </div>
      </Wrapper>
    )
  }

  const isError = job.status === 'error'
  const isDone = job.status === 'done'
  const isQueued = job.status === 'queued'
  const pct = Math.max(0, Math.min(100, job.progress ?? 0))

  // Elapsed since started (or queued if not yet started)
  const startedMs = job.started_at
    ? new Date(job.started_at).getTime()
    : new Date(job.created_at).getTime()
  const elapsedSec = Math.max(0, Math.floor((now - startedMs) / 1000))

  // Stuck detection — no progress movement >8s while running
  const stuckMs = now - lastProgressTick
  const stuck = !isDone && !isError && stuckMs > 8000

  return (
    <Wrapper compact={compact}>
      <div className="flex items-center gap-2 mb-2">
        {isError ? (
          <AlertCircle size={15} className="text-status-red-text" />
        ) : isDone ? (
          <CheckCircle2 size={15} className="text-status-green-text" />
        ) : (
          <Loader2 size={15} className="animate-spin text-brand" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isError
            ? 'เกิดข้อผิดพลาด'
            : isDone
              ? 'เสร็จแล้ว'
              : stepLabel(job.status, job.progress_step)}
        </span>
        {!isError && !isDone && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Clock size={10} />
            {formatElapsed(elapsedSec)}
            {pct > 0 && <span className="ml-1.5 font-medium">{pct}%</span>}
          </span>
        )}
      </div>

      {!isError && !isDone && (
        <>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden relative">
            {isQueued || pct === 0 ? (
              <div className="absolute inset-0 progress-shimmer" />
            ) : (
              <div
                className={`h-full transition-all duration-500 ${
                  stuck ? 'bg-amber-400' : 'bg-brand'
                }`}
                style={{ width: `${pct}%` }}
              />
            )}
          </div>

          {stuck && pct > 0 && (
            <p className="text-2xs text-amber-700 mt-1.5">
              ขั้นตอนนี้ใช้เวลานานกว่าปกติ ({formatElapsed(Math.floor(stuckMs / 1000))} —
              ปกติเสร็จก่อนหน้านี้) — รอต่อสักครู่
            </p>
          )}

          {!stuck && etaHint(job.progress_step) && (
            <p className="text-2xs text-muted-foreground mt-1.5">
              {etaHint(job.progress_step)}
            </p>
          )}
        </>
      )}

      {isError && job.error && (
        <p className="text-xs text-status-red-text mt-1">{job.error}</p>
      )}

      {job.attempts > 1 && !isDone && (
        <p className="text-2xs text-muted-foreground mt-1">retry #{job.attempts}</p>
      )}
    </Wrapper>
  )
}

function Wrapper({
  compact,
  children,
}: {
  compact: boolean
  children: React.ReactNode
}) {
  if (compact) {
    return <div className="flex flex-col gap-1">{children}</div>
  }
  return (
    <div className="surface-1 rounded-[10px] px-3 py-3 border border-border-soft">
      {children}
    </div>
  )
}
