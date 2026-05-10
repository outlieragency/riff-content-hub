'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Compass,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toggleSaveIdea } from '@/lib/actions/save-idea'
import type { BriefVideo } from '@/lib/actions/daily-brief'

export function DailyBrief({ videos }: { videos: BriefVideo[] }) {
  if (videos.length === 0) {
    return <EmptyBrief />
  }

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
            <Sparkles size={15} className="text-brand" />
            วันนี้ใน niche ของคุณ
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {videos.length} outliers ที่เพิ่งเจอ — กด save ตัวที่อยากใช้
          </p>
        </div>
        <Link
          href="/discover"
          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          ดูเพิ่มใน Discover <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((v) => (
          <BriefCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  )
}

function BriefCard({ video }: { video: BriefVideo }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  function handleSave() {
    start(async () => {
      const res = await toggleSaveIdea(video.id)
      if (res.ok && res.saved) setSaved(true)
    })
  }

  function handleRecreate() {
    start(async () => {
      // Save first if not already, then navigate to ideas page with auto-fb
      const res = await toggleSaveIdea(video.id)
      // Need idea_id — fetch fresh
      // toggleSaveIdea returns saved boolean but not idea id. So go to /ideas
      // and let user click recreate from there. Or extend the action later.
      if (res.ok) {
        // Best-effort: navigate to /ideas filtered to this video
        router.push(`/ideas?status=idea`)
      }
    })
  }

  const score = video.outlier_score ?? 0
  const scoreColor =
    score >= 10
      ? '#dc2626' // red — mega
      : score >= 5
        ? '#ea580c' // orange — viral
        : '#65a30d' // green — outlier

  const thumb =
    video.thumbnail_url ||
    `https://img.youtube.com/vi/${video.youtube_video_id}/maxresdefault.jpg`

  return (
    <div className="surface-1 rounded-[14px] overflow-hidden flex flex-col group hover:shadow-[0_8px_24px_-12px_rgba(26,36,24,0.18)] transition-shadow">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`
          }}
        />
        <span
          className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
          style={{
            background: scoreColor,
            color: '#FFF',
          }}
        >
          {score.toFixed(1)}×
        </span>
        {video.duration_seconds && (
          <span
            className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-2xs font-medium tabular-nums text-white"
            style={{ fontSize: 10.5 }}
          >
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <div className="text-2xs text-muted-foreground">
          {video.channel_title}
          {video.view_count != null && (
            <>
              {' · '}
              {formatViewCount(video.view_count)} views
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-auto pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || saved}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-secondary hover:bg-secondary/70 text-foreground text-xs font-medium transition-colors disabled:opacity-50"
          >
            {saved ? (
              <>
                <BookmarkCheck size={12} strokeWidth={2.2} />
                Saved
              </>
            ) : pending ? (
              <Loader2 className="animate-spin" size={12} />
            ) : (
              <>
                <Bookmark size={12} strokeWidth={1.8} />
                Save
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleRecreate}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} strokeWidth={1.8} />
            Recreate
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyBrief() {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-brand" />
        วันนี้ใน niche ของคุณ
      </h2>
      <div className="surface-1 rounded-[14px] p-8 text-center">
        <div className="inline-flex w-12 h-12 rounded-full bg-secondary items-center justify-center mb-3 text-muted-foreground">
          <Compass size={20} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          ยังไม่มี outliers ใหม่
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
          อาจเป็นเพราะ channel ที่ track ยังไม่มีวิดีโอใหม่ หรือยังไม่ดังพอ
          ลอง sync ใหม่ หรือ add channel เพิ่ม
        </p>
        <div className="inline-flex items-center gap-2">
          <Link
            href="/channels"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            จัดการ Channels <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}
