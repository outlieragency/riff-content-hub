'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import { startRecreate } from '@/lib/actions/recreate'
import { type RecreateFormat } from '@/lib/types/recreate-formats'
import { JobProgress } from '@/components/jobs/job-progress'
import { createClient } from '@/lib/supabase/client'
import type { JobRow } from '@/lib/supabase/realtime'

/**
 * Format picker — focused on Earth's ghostwriter loop:
 *   FB Post + IG Carousel only.
 *
 * Each format card lets the user pick one of their uploaded templates
 * (filtered by format_type) before kicking off the recreate job.
 * No template = falls back to the built-in renderer.
 */

type TemplateOption = { id: string; name: string }

export function FormatPicker({
  ideaId,
  hasSummary,
}: {
  ideaId: string
  hasSummary: boolean
}) {
  const router = useRouter()
  const [pendingFormat, setPendingFormat] = useState<RecreateFormat | null>(
    null,
  )
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [extra, setExtra] = useState('')
  const [existingJobFormat, setExistingJobFormat] =
    useState<RecreateFormat | null>(null)

  const [fbPostTemplateId, setFbPostTemplateId] = useState<string | null>(
    null,
  )
  const [fbPostTemplates, setFbPostTemplates] = useState<TemplateOption[]>([])

  // FB-only mode: only fetch fb_post templates
  useEffect(() => {
    const sb = createClient()
    let cancelled = false
    async function load() {
      const {
        data: { user },
      } = await sb.auth.getUser()
      if (!user || cancelled) return
      const { data } = await sb
        .from('carousel_templates')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('format_type', 'fb_post')
        .order('created_at', { ascending: false })
      if (!cancelled && data) {
        setFbPostTemplates(
          data.map((d) => ({ id: d.id as string, name: d.name as string })),
        )
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

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
        if (fmt === 'fb_article') {
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
    if (activeJobId || existingJobFormat) return
    setError(null)
    setPendingFormat(format)
    start(async () => {
      const res = await startRecreate(ideaId, format, {
        instruction_extra: extra.trim() || undefined,
        fb_post_template_id:
          format === 'fb_article'
            ? fbPostTemplateId ?? undefined
            : undefined,
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
    if (draftId) router.push(`/recreated/${draftId}`)
  }

  function onJobError() {
    setActiveJobId(null)
    setPendingFormat(null)
    setExistingJobFormat(null)
  }

  const locked = activeJobId !== null || existingJobFormat !== null

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
          placeholder='เช่น "เน้น Offer ของ Outlier Agency" หรือ "สั้นกว่าปกติ"'
          disabled={pending || !hasSummary}
          className="w-full h-9 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {error && (
        <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
          {error}
        </div>
      )}

      {activeJobId && (
        <JobProgress
          jobId={activeJobId}
          onDone={onJobDone}
          onError={onJobError}
        />
      )}

      <FormatCard
        format="fb_article"
        icon={FileText}
        label="FB Post"
        description="บทความยาว + ภาพปก — pair กับ FB template ของพี่"
        templates={fbPostTemplates}
        selectedTemplateId={fbPostTemplateId}
        onSelectTemplate={setFbPostTemplateId}
        onPick={() => pick('fb_article')}
        locked={locked}
        isPending={pending && pendingFormat === 'fb_article'}
        isMine={existingJobFormat === 'fb_article'}
        disabled={!hasSummary || pending}
      />
    </div>
  )
}

function FormatCard({
  format,
  icon: Icon,
  label,
  description,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onPick,
  locked,
  isPending,
  isMine,
  disabled,
}: {
  format: RecreateFormat
  icon: React.ComponentType<{ size?: number }>
  label: string
  description: string
  templates: TemplateOption[]
  selectedTemplateId: string | null
  onSelectTemplate: (id: string | null) => void
  onPick: () => void
  locked: boolean
  isPending: boolean
  isMine: boolean
  disabled: boolean
}) {
  const isActive = locked && isMine
  const interactive = !disabled && !locked

  return (
    <div
      className={`rounded-[14px] border-2 p-4 transition-colors flex flex-col ${
        interactive
          ? 'border-brand bg-brand-soft'
          : 'border-border bg-background opacity-70'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-[10px] bg-brand text-white inline-flex items-center justify-center shrink-0">
          {isPending || isActive ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Icon size={18} />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-foreground">
            {label}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {description}
          </p>
        </div>
      </div>

      <div className="mb-3">
        {templates.length > 0 ? (
          <>
            <label className="block text-[10px] uppercase tracking-wide font-medium text-muted-foreground mb-1">
              Template
            </label>
            <select
              value={selectedTemplateId ?? ''}
              onChange={(e) =>
                onSelectTemplate(e.target.value || null)
              }
              disabled={locked}
              className="w-full h-9 px-2.5 rounded-[8px] border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Built-in (default)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  📐 {t.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <Link
            href="/carousel-templates"
            className="block text-[11px] text-muted-foreground hover:text-foreground bg-background rounded-[8px] border border-dashed border-border px-2.5 py-2 leading-snug"
          >
            ยังไม่มี {format === 'fb_article' ? 'FB Post' : 'Carousel'} template —
            <span className="text-brand"> upload ที่ Templates </span>
            เพื่อ AI ใช้สไตล์ของพี่
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={onPick}
        disabled={disabled || locked}
        className="mt-auto inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-[8px] bg-brand hover:bg-brand-hover text-white disabled:opacity-50 px-3 py-2"
      >
        {isPending || isActive ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            กำลัง generate…
          </>
        ) : (
          <>
            <Sparkles size={13} />
            {`สร้าง ${label}`}
          </>
        )}
      </button>
    </div>
  )
}
