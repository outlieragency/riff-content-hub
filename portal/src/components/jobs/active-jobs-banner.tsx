'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
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
  analyzing: 'วิเคราะห์',
}

function stepLabel(s: string | null) {
  if (!s) return 'กำลังประมวลผล'
  return STEP_LABELS[s] ?? s
}

/**
 * Floating bottom-right banner that shows active jobs for the current user.
 * Persists across route changes (mounted in app layout).
 *
 * Behavior:
 * - Polls every 3s for user's running/queued jobs
 * - Auto-shows when active jobs > 0
 * - Auto-hides 4s after last job completes (with "✓ done" snapshot)
 * - Click to expand → see all active jobs + click to relevant page
 * - User can dismiss manually
 */
export function ActiveJobsBanner() {
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [recentlyDone, setRecentlyDone] = useState<Job[]>([])
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Poll active jobs every 3s
  useEffect(() => {
    const sb = createClient()
    let cancelled = false

    async function tick() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user || cancelled) return

      const { data } = await sb
        .from('jobs')
        .select(
          'id, kind, status, progress, progress_step, payload, result, created_at, finished_at',
        )
        .eq('user_id', user.id)
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false })
        .limit(8)
      if (cancelled) return
      setActiveJobs((data ?? []) as Job[])

      // Also fetch recently done (last 30s) for "✓ done" feedback
      const cutoff = new Date(Date.now() - 30_000).toISOString()
      const { data: done } = await sb
        .from('jobs')
        .select(
          'id, kind, status, progress, progress_step, payload, result, created_at, finished_at',
        )
        .eq('user_id', user.id)
        .eq('status', 'done')
        .gte('finished_at', cutoff)
        .order('finished_at', { ascending: false })
        .limit(3)
      if (cancelled) return
      setRecentlyDone((done ?? []) as Job[])
    }

    tick()
    const interval = setInterval(tick, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Reset dismissal when new active job starts (responding to data change is the
  // intended pattern here — not derived state)
  useEffect(() => {
    if (activeJobs.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false)
    }
  }, [activeJobs.length])

  const total = activeJobs.length
  const showDone = total === 0 && recentlyDone.length > 0
  const visible = !dismissed && (total > 0 || showDone)

  const headerLabel = useMemo(() => {
    if (total > 0) return `${total} งานกำลังทำ`
    if (showDone) return `${recentlyDone.length} งานเสร็จแล้ว`
    return ''
  }, [total, showDone, recentlyDone.length])

  if (!visible) return null

  const allJobs = total > 0 ? activeJobs : recentlyDone

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[360px] w-[92vw]">
      <div className="surface-1 rounded-[14px] shadow-2xl border border-border-soft overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-secondary/40 transition-colors"
        >
          {total > 0 ? (
            <Loader2 className="animate-spin text-brand shrink-0" size={16} />
          ) : (
            <CheckCircle2 className="text-emerald-600 shrink-0" size={16} />
          )}
          <span className="flex-1 text-left text-sm font-medium text-foreground">
            {headerLabel}
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </button>

        {/* Job list (expanded) */}
        {expanded && (
          <div className="border-t border-border-soft divide-y divide-border-soft max-h-[60vh] overflow-y-auto">
            {allJobs.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        )}

        {/* Compact: show first job inline */}
        {!expanded && total > 0 && activeJobs[0] && (
          <div className="px-4 pb-3 -mt-1">
            <CompactJobRow job={activeJobs[0]} />
          </div>
        )}
      </div>
    </div>
  )
}

function CompactJobRow({ job }: { job: Job }) {
  const pct = Math.max(0, Math.min(100, job.progress ?? 0))
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1">
        {KIND_LABELS[job.kind] ?? job.kind} · {stepLabel(job.progress_step)}
      </div>
      <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
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

function JobRow({ job }: { job: Job }) {
  const pct = Math.max(0, Math.min(100, job.progress ?? 0))
  const isDone = job.status === 'done'

  // Resolve link target based on job kind + result
  let linkHref: string | null = null
  let linkLabel: string = 'ดู'
  if (job.kind === 'run_recreate') {
    const draftId = (job.result as { draft_id?: string } | null)?.draft_id
    if (draftId) {
      linkHref = `/recreated/${draftId}`
      linkLabel = isDone ? 'เปิด draft' : 'ติดตาม'
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
      // No direct video page — link to ideas list
      linkHref = '/ideas'
      linkLabel = 'ดู ideas'
    }
  }

  return (
    <div className="px-4 py-3 hover:bg-secondary/30">
      <div className="flex items-center gap-2 mb-1.5">
        {isDone ? (
          <CheckCircle2 size={12} className="text-emerald-600" />
        ) : (
          <Loader2 className="animate-spin text-brand" size={12} />
        )}
        <span className="text-xs font-medium text-foreground">
          {KIND_LABELS[job.kind] ?? job.kind}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
          {isDone ? '100%' : `${pct}%`}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">
        {stepLabel(job.progress_step)}
      </div>
      {!isDone && (
        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      )}
      {linkHref && (
        <Link
          href={linkHref}
          className="inline-block mt-2 text-[11px] text-blue-600 hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}
