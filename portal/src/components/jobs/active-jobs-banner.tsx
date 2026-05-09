'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Job = {
  id: string
  kind: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number
  progress_step: string | null
  payload: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
  finished_at: string | null
}

const KIND_LABELS: Record<string, string> = {
  sync_channel: 'Sync channel',
  process_transcript: 'Transcript',
  run_recreate: 'AI generate',
  extract_voice: 'Extract voice',
}

const STEP_LABELS: Record<string, string> = {
  starting: 'เริ่มประมวลผล',
  resolving_channel: 'หา channel',
  resolving_channel_top_viewed: 'หา top videos',
  resolving_channel_recent: 'หา latest videos',
  resolving_channel_hybrid: 'หา top + latest',
  fetching_transcript: 'ดึง transcript',
  translating: 'แปลไทย',
  summarizing: 'สรุปประเด็น',
  saving: 'บันทึก',
  cached: 'ใช้ cache',
  loading_context: 'โหลด context',
  generating_yt_script: 'เขียน YT script',
  generating_fb_article: 'เขียน FB post',
  generating_reels: 'เขียน Reels',
  generating_carousel: 'สร้าง Carousel',
  saving_draft: 'บันทึก draft',
  rendering_cover: 'render cover',
  rendering_carousel: 'render slides',
  analyzing: 'วิเคราะห์',
  done: 'เสร็จแล้ว',
}

const SEEN_KEY = 'riff:jobs:seen'
const DONE_LOOKBACK_MS = 60 * 60_000 // 1 hour — show recently done so user can find result

function stepLabel(s: string | null) {
  if (!s) return 'กำลังประมวลผล'
  return STEP_LABELS[s] ?? s
}

/**
 * Persistent floating banner for active + recently completed jobs.
 *
 * Design intent (after dogfood feedback):
 * - Banner stays visible whenever there's an active job OR an unseen completed
 *   job within the last hour. User must explicitly dismiss to hide.
 * - Polls every 2s for snappy updates while jobs are running.
 * - Stores "seen" job IDs in localStorage so dismissed history survives reload.
 * - Auto-expands when a new job completes so the "Open draft" link is
 *   immediately clickable (no extra click needed to see result).
 * - Shows BOTH active and done jobs in one combined stack — no more "where
 *   did my output go?" UX.
 */
export function ActiveJobsBanner() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      if (!raw) return new Set()
      return new Set(JSON.parse(raw) as string[])
    } catch {
      return new Set()
    }
  })
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const prevDoneCount = useRef(0)
  const autoExpandedOnce = useRef(false)

  // Poll for active + recent-done jobs
  useEffect(() => {
    const sb = createClient()
    let cancelled = false

    async function tick() {
      const {
        data: { user },
      } = await sb.auth.getUser()
      if (!user || cancelled) return

      const cutoff = new Date(Date.now() - DONE_LOOKBACK_MS).toISOString()

      // Active (queued + running)
      const { data: active } = await sb
        .from('jobs')
        .select(
          'id, kind, status, progress, progress_step, payload, result, error, created_at, finished_at',
        )
        .eq('user_id', user.id)
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false })
        .limit(20)

      // Recent done/error (last hour)
      const { data: done } = await sb
        .from('jobs')
        .select(
          'id, kind, status, progress, progress_step, payload, result, error, created_at, finished_at',
        )
        .eq('user_id', user.id)
        .in('status', ['done', 'error'])
        .gte('finished_at', cutoff)
        .order('finished_at', { ascending: false })
        .limit(20)

      if (cancelled) return

      const merged = [
        ...((active ?? []) as Job[]),
        ...((done ?? []) as Job[]),
      ]
      // Dedup by id (active + done can't overlap, but safe-guard)
      const seenLocal = new Set<string>()
      const result: Job[] = []
      for (const j of merged) {
        if (seenLocal.has(j.id)) continue
        seenLocal.add(j.id)
        result.push(j)
      }
      setJobs(result)
    }

    tick()
    const interval = setInterval(tick, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Persist seenIds to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seenIds]))
    } catch {
      // ignore quota errors
    }
  }, [seenIds])

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === 'queued' || j.status === 'running'),
    [jobs],
  )
  const unseenDoneJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (j.status === 'done' || j.status === 'error') && !seenIds.has(j.id),
      ),
    [jobs, seenIds],
  )

  const total = activeJobs.length
  const doneCount = unseenDoneJobs.length

  // When new jobs become "done" (and we have unseen ones), reset dismissal +
  // auto-expand so user sees the result link immediately
  useEffect(() => {
    if (doneCount > prevDoneCount.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false)
      if (!autoExpandedOnce.current) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setExpanded(true)
        autoExpandedOnce.current = true
      }
    }
    prevDoneCount.current = doneCount
  }, [doneCount])

  // Reset dismissal when new active job starts
  useEffect(() => {
    if (total > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false)
    }
  }, [total])

  const visible = !dismissed && (total > 0 || doneCount > 0)

  function markAllSeen() {
    setSeenIds((cur) => {
      const next = new Set(cur)
      for (const j of unseenDoneJobs) next.add(j.id)
      return next
    })
  }

  function markOneSeen(id: string) {
    setSeenIds((cur) => {
      const next = new Set(cur)
      next.add(id)
      return next
    })
  }

  function handleDismiss() {
    // Dismiss = mark all unseen done as seen + hide for now
    markAllSeen()
    setDismissed(true)
    autoExpandedOnce.current = false
  }

  const headerLabel = useMemo(() => {
    const parts: string[] = []
    if (total > 0) parts.push(`${total} กำลังทำ`)
    if (doneCount > 0) parts.push(`${doneCount} เสร็จแล้ว`)
    return parts.join(' · ') || 'งาน'
  }, [total, doneCount])

  if (!visible) return null

  // Combined stack — active first, then unseen done
  const visibleJobs = [...activeJobs, ...unseenDoneJobs]

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[400px] w-[92vw]">
      <div className="surface-1 rounded-[14px] shadow-2xl border border-border-soft overflow-hidden">
        {/* Header */}
        <div className="flex items-stretch border-b border-border-soft">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 flex items-center gap-2.5 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
          >
            {total > 0 ? (
              <Loader2 className="animate-spin text-brand shrink-0" size={16} />
            ) : doneCount > 0 ? (
              <Sparkles className="text-emerald-600 shrink-0" size={16} />
            ) : (
              <CheckCircle2 className="text-emerald-600 shrink-0" size={16} />
            )}
            <span className="flex-1 text-sm font-medium text-foreground">
              {headerLabel}
            </span>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Job list (always shown when expanded; compact summary when collapsed) */}
        {expanded ? (
          <div className="divide-y divide-border-soft max-h-[60vh] overflow-y-auto">
            {visibleJobs.map((j) => (
              <JobRow
                key={j.id}
                job={j}
                onDismiss={() => markOneSeen(j.id)}
              />
            ))}
            {doneCount > 0 && (
              <button
                onClick={markAllSeen}
                className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              >
                Mark all done as seen
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Compact: show first active job's progress inline */}
            {total > 0 && activeJobs[0] && (
              <div className="px-4 py-3">
                <CompactJobRow job={activeJobs[0]} />
              </div>
            )}
            {/* Done summary if any */}
            {doneCount > 0 && total === 0 && (
              <div className="px-4 py-3 text-xs text-muted-foreground">
                คลิกเพื่อดู {doneCount} งานที่เสร็จ
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CompactJobRow({ job }: { job: Job }) {
  const pct = Math.max(0, Math.min(100, job.progress ?? 0))
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1.5">
        {KIND_LABELS[job.kind] ?? job.kind} · {stepLabel(job.progress_step)}
      </div>
      <div className="h-1 w-full rounded-full bg-secondary overflow-hidden relative">
        {pct === 0 ? (
          <div className="absolute inset-0 progress-shimmer" />
        ) : (
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  )
}

function JobRow({ job, onDismiss }: { job: Job; onDismiss: () => void }) {
  const pct = Math.max(0, Math.min(100, job.progress ?? 0))
  const isDone = job.status === 'done'
  const isError = job.status === 'error'
  const isInflight = job.status === 'queued' || job.status === 'running'

  // Resolve link target based on job kind + result
  let linkHref: string | null = null
  let linkLabel = 'ดู'
  if (job.kind === 'run_recreate') {
    const draftId = (job.result as { draft_id?: string } | null)?.draft_id
    if (draftId) {
      linkHref = `/recreated/${draftId}`
      linkLabel = isDone ? 'เปิด draft →' : 'ติดตาม'
    } else {
      const ideaId = (job.payload as { idea_id?: string } | null)?.idea_id
      if (ideaId) {
        linkHref = `/ideas/${ideaId}`
        linkLabel = 'ติดตาม'
      }
    }
  } else if (job.kind === 'process_transcript') {
    const videoId = (job.payload as { video_id?: string } | null)?.video_id
    if (videoId) {
      linkHref = '/ideas'
      linkLabel = 'ดู ideas'
    }
  }

  return (
    <div className="px-4 py-3 hover:bg-secondary/30">
      <div className="flex items-center gap-2 mb-1.5">
        {isDone ? (
          <CheckCircle2 size={12} className="text-emerald-600" />
        ) : isError ? (
          <XCircle size={12} className="text-red-600" />
        ) : (
          <Loader2 className="animate-spin text-brand" size={12} />
        )}
        <span className="text-xs font-medium text-foreground">
          {KIND_LABELS[job.kind] ?? job.kind}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
          {isDone ? '✓ เสร็จ' : isError ? 'ผิดพลาด' : `${pct}%`}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">
        {isError ? job.error || 'มีข้อผิดพลาด' : stepLabel(job.progress_step)}
      </div>
      {isInflight && (
        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      )}
      <div className="mt-2 flex items-center gap-3">
        {linkHref && (
          <Link
            href={linkHref}
            onClick={onDismiss}
            className={`text-[11px] inline-flex items-center gap-1 ${
              isDone
                ? 'text-emerald-700 font-semibold hover:underline'
                : 'text-blue-600 hover:underline'
            }`}
          >
            {linkLabel}
          </Link>
        )}
        {(isDone || isError) && (
          <button
            onClick={onDismiss}
            className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
          >
            ปิด
          </button>
        )}
      </div>
    </div>
  )
}
