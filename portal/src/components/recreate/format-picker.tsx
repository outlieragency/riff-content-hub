'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  LayoutGrid,
  Loader2,
  Smartphone,
  Sparkles,
  Star,
  Video,
} from 'lucide-react'
import { startRecreate } from '@/lib/actions/recreate'
import { FORMAT_META, type RecreateFormat } from '@/lib/types/recreate-formats'
import { JobProgress } from '@/components/jobs/job-progress'
import { StylePicker } from '@/components/recreate/style-picker'
import { createClient } from '@/lib/supabase/client'
import type { JobRow } from '@/lib/supabase/realtime'
import type { FormatType } from '@/lib/types/creative-style'

const FORMAT_TO_VISUAL: Record<RecreateFormat, FormatType> = {
  fb_article: 'cover',
  yt_script: 'thumbnail',
  reels: 'reel',
  carousel: 'carousel',
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  video: Video,
  'file-text': FileText,
  smartphone: Smartphone,
  'layout-grid': LayoutGrid,
}

// Production-ready format. fb_article = primary; others remain available.
const PRIMARY: RecreateFormat = 'fb_article'
const SECONDARY: RecreateFormat[] = ['yt_script', 'reels', 'carousel']

export function FormatPicker({
  ideaId,
  hasSummary,
}: {
  ideaId: string
  hasSummary: boolean
}) {
  const router = useRouter()
  const [pendingFormat, setPendingFormat] = useState<RecreateFormat | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [extra, setExtra] = useState('')
  const [showOther, setShowOther] = useState(false)
  const [existingJobFormat, setExistingJobFormat] = useState<RecreateFormat | null>(
    null,
  )
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)

  // Detect existing inflight job for this idea — prevent duplicate submission
  useEffect(() => {
    const sb = createClient()
    let cancelled = false

    async function check() {
      const {
        data: { user },
      } = await sb.auth.getUser()
      if (!user || cancelled) return
      const { data } = await sb
        .from('jobs')
        .select('id, payload, status')
        .eq('user_id', user.id)
        .eq('kind', 'run_recreate')
        .in('status', ['queued', 'running'])
      if (cancelled || !data) return
      const match = data.find(
        (j) =>
          (j.payload as { idea_id?: string } | null)?.idea_id === ideaId,
      )
      if (match) {
        const fmt = (match.payload as { format?: string } | null)?.format
        setActiveJobId(match.id)
        if (fmt && (fmt === 'fb_article' || fmt === 'yt_script' || fmt === 'reels' || fmt === 'carousel')) {
          setExistingJobFormat(fmt as RecreateFormat)
          setPendingFormat(fmt as RecreateFormat)
        }
      }
    }

    check()
    const interval = setInterval(check, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [ideaId])

  function pick(format: RecreateFormat) {
    // Block duplicate clicks: if any active job for this idea, ignore.
    if (activeJobId || existingJobFormat) return
    setError(null)
    setPendingFormat(format)
    start(async () => {
      const res = await startRecreate(ideaId, format, {
        instruction_extra: extra.trim() || undefined,
        creative_style_id: selectedStyleId ?? undefined,
      })
      if (!res.ok) {
        setError(res.error)
        setPendingFormat(null)
        return
      }
      setActiveJobId(res.jobId)
      setExistingJobFormat(format)
    })
  }

  function onJobDone(job: JobRow) {
    const draftId = (job.result as { draft_id?: string } | null)?.draft_id
    if (draftId) {
      router.push(`/recreated/${draftId}`)
    }
  }

  function onJobError() {
    setActiveJobId(null)
    setPendingFormat(null)
    setExistingJobFormat(null)
  }

  // While job is running, lock all action buttons
  const locked = activeJobId !== null || existingJobFormat !== null

  const primaryMeta = FORMAT_META[PRIMARY]
  const PrimaryIcon = ICON_MAP[primaryMeta.icon] ?? Sparkles
  const isPrimaryPending = pending && pendingFormat === PRIMARY

  return (
    <div className="space-y-3">
      {!hasSummary && (
        <div className="rounded-[10px] border border-dashed border-border p-3 text-sm text-muted-foreground">
          ต้อง process transcript ของ video ก่อน (กดปุ่มในกล่อง Transcript ด้านบน)
        </div>
      )}

      {/* Optional instruction */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">
          ระบุเพิ่มก่อน generate (optional)
        </label>
        <input
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder='เช่น "เพิ่ม Offer Point ของ Outlier Agency" หรือ "สั้นกว่านี้"'
          disabled={pending || !hasSummary}
          className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Creative style picker — applies to cover render. Only relevant for primary FB. */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">
          Visual style (Cover Template)
        </label>
        <StylePicker
          formatType={FORMAT_TO_VISUAL[PRIMARY]}
          selectedId={selectedStyleId}
          onChange={setSelectedStyleId}
          disabled={pending || !hasSummary || locked}
        />
      </div>

      {error && (
        <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
          {error}
        </div>
      )}

      {activeJobId && (
        <JobProgress jobId={activeJobId} onDone={onJobDone} onError={onJobError} />
      )}

      {/* === Primary action: FB Article === */}
      <button
        type="button"
        onClick={() => pick(PRIMARY)}
        disabled={!hasSummary || pending || locked}
        className={`w-full text-left p-4 rounded-[14px] border-2 transition-all ${
          hasSummary && !pending && !locked
            ? 'border-brand bg-brand-soft hover:bg-brand/15 cursor-pointer'
            : 'border-border bg-background opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[10px] bg-brand text-white flex items-center justify-center shrink-0">
            {isPrimaryPending || (locked && existingJobFormat === PRIMARY) ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <PrimaryIcon size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                {primaryMeta.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand text-white">
                <Star size={10} fill="currentColor" />
                Recommended
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {primaryMeta.description}
            </p>
          </div>
          <div className="text-xs text-brand font-medium shrink-0">
            {locked
              ? existingJobFormat === PRIMARY
                ? 'กำลัง generate…'
                : 'รอ job อื่นเสร็จ'
              : isPrimaryPending
                ? 'กำลัง generate…'
                : 'เริ่ม →'}
          </div>
        </div>
      </button>

      {/* === Other formats (collapsed) === */}
      <div>
        <button
          type="button"
          onClick={() => setShowOther((v) => !v)}
          disabled={!hasSummary || pending}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          {showOther ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          format อื่น (text-only — ยังไม่มี cover render)
        </button>

        {showOther && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {SECONDARY.map((fmt) => {
              const meta = FORMAT_META[fmt]
              const Icon = ICON_MAP[meta.icon] ?? Sparkles
              const isPending = pending && pendingFormat === fmt
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => pick(fmt)}
                  disabled={!hasSummary || pending || locked}
                  className={`text-left p-3 rounded-[10px] border transition-colors ${
                    hasSummary && !locked
                      ? 'border-border hover:border-brand hover:bg-brand-soft cursor-pointer'
                      : 'border-border opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-[6px] bg-brand-soft text-brand flex items-center justify-center">
                      {isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Icon size={12} />
                      )}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {meta.description}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
