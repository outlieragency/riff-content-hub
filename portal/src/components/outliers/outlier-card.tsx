'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, Flame, Loader2, Play } from 'lucide-react'
import { ScorePill } from './score-pill'
import { toggleSaveIdea } from '@/lib/actions/save-idea'
import { formatCount, formatDuration, timeAgo } from '@/lib/utils'
import { nicheLabel } from '@/lib/niches'
import type { OutlierVideo } from './outlier-row'
import { VideoActionModal } from './video-action-modal'

/**
 * Eden-inspired card for /discover feed.
 * Big thumbnail on top, title + meta below. Bookmark + duration overlay.
 */
export function OutlierCard({
  video,
  channelHref,
}: {
  video: OutlierVideo
  channelHref?: string | null
}) {
  const [saved, setSaved] = useState(video.is_saved)
  const [pending, start] = useTransition()
  const [actionOpen, setActionOpen] = useState(false)

  function onToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    start(async () => {
      const res = await toggleSaveIdea(video.id)
      if (res.ok) setSaved(res.saved)
    })
  }

  function openActions(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setActionOpen(true)
  }

  return (
    <article className="group flex flex-col rounded-[14px] bg-card border border-border-soft overflow-hidden hover:shadow-lg transition-all">
      <button
        type="button"
        onClick={openActions}
        className="relative block aspect-video bg-muted text-left w-full cursor-pointer"
        aria-label={`Open actions for ${video.title}`}
      >
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Play size={28} strokeWidth={1.4} />
          </div>
        )}

        {/* Duration badge — bottom-right of thumbnail */}
        {video.duration_seconds != null && !video.is_short && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 text-white text-[10px] font-medium tabular-nums">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
        {video.is_short && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-red-600/90 text-white text-[10px] font-medium uppercase tracking-wider">
            Short
          </span>
        )}

        {/* Save button — overlay top-right */}
        <button
          onClick={onToggle}
          disabled={pending}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full inline-flex items-center justify-center transition-all disabled:opacity-50 ${
            saved
              ? 'bg-brand text-white opacity-100'
              : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-brand'
          }`}
          title={saved ? 'บันทึกแล้ว' : 'บันทึก'}
        >
          {pending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : saved ? (
            <BookmarkCheck size={13} />
          ) : (
            <Bookmark size={13} />
          )}
        </button>

        {/* Outlier score badge — top-left */}
        {typeof video.outlier_score === 'number' && video.outlier_score >= 2 && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-semibold tabular-nums">
            <Flame size={10} className="text-orange-400" />
            {video.outlier_score >= 100
              ? `${Math.round(video.outlier_score)}x`
              : `${video.outlier_score.toFixed(1)}x`}
          </span>
        )}
      </button>

      <div className="p-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={openActions}
          className="text-left text-sm font-semibold text-foreground line-clamp-2 leading-snug hover:text-brand transition-colors"
        >
          {video.title}
        </button>

        {/* Channel link + niche chips inline */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
          {channelHref ? (
            <Link
              href={channelHref}
              className="hover:text-foreground inline-flex items-center"
            >
              {video.channel_handle
                ? `@${video.channel_handle.replace(/^@/, '')}`
                : video.channel_title}
            </Link>
          ) : (
            <span>
              {video.channel_handle
                ? `@${video.channel_handle.replace(/^@/, '')}`
                : video.channel_title}
            </span>
          )}
          {(video.channel_niches ?? []).slice(0, 2).map((n) => (
            <span
              key={n}
              className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground"
            >
              {nicheLabel(n)}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap mt-auto">
          {video.view_count != null && (
            <span>{formatCount(video.view_count)} views</span>
          )}
          {video.published_at && (
            <>
              <span>·</span>
              <span>{timeAgo(video.published_at)}</span>
            </>
          )}
          {!(typeof video.outlier_score === 'number' && video.outlier_score >= 2) && (
            <span className="ml-auto">
              <ScorePill score={video.outlier_score} />
            </span>
          )}
        </div>
      </div>

      <VideoActionModal
        video={video}
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        onSavedChange={(s) => setSaved(s)}
      />
    </article>
  )
}
