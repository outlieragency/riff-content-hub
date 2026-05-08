'use client'

import { useState, useTransition } from 'react'
import { ExternalLink, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { ScorePill } from './score-pill'
import { toggleSaveIdea } from '@/lib/actions/save-idea'
import { formatCount, formatDuration, timeAgo } from '@/lib/utils'

export type OutlierVideo = {
  id: string
  youtube_video_id: string
  title: string
  thumbnail_url: string | null
  view_count: number | null
  duration_seconds: number | null
  is_short: boolean
  published_at: string | null
  outlier_score: number | null
  channel_title: string
  channel_handle: string | null
  channel_subscriber_count: number | null
  is_saved: boolean
}

export function OutlierRow({ video }: { video: OutlierVideo }) {
  const [saved, setSaved] = useState(video.is_saved)
  const [pending, start] = useTransition()

  function onToggle() {
    start(async () => {
      const res = await toggleSaveIdea(video.id)
      if (res.ok) setSaved(res.saved)
    })
  }

  const ytUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors">
      <ScorePill score={video.outlier_score} />

      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail_url}
          alt=""
          className="w-20 h-12 rounded-[6px] object-cover shrink-0 bg-muted"
        />
      ) : (
        <div className="w-20 h-12 rounded-[6px] bg-muted shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <a
          href={ytUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm text-foreground line-clamp-1 hover:underline inline-flex items-start gap-1"
        >
          {video.title}
          <ExternalLink size={11} className="text-muted-foreground mt-0.5 shrink-0" />
        </a>
        <div className="text-xs text-muted-foreground">
          {video.channel_handle ? `@${video.channel_handle.replace(/^@/, '')}` : video.channel_title}
          {video.published_at && <> · {timeAgo(video.published_at)}</>}
          {video.duration_seconds != null && <> · {formatDuration(video.duration_seconds)}</>}
          {video.is_short && <> · short</>}
          {video.view_count != null && <> · {formatCount(video.view_count)} views</>}
          {video.channel_subscriber_count != null && (
            <> · {formatCount(video.channel_subscriber_count)} subs</>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={pending}
        className={`shrink-0 h-8 px-2.5 rounded-[6px] border text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
          saved
            ? 'bg-accent text-accent-foreground border-brand-border'
            : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
        title={saved ? 'บันทึกแล้ว คลิกเพื่อเอาออก' : 'บันทึกเข้า Idea Library'}
      >
        {pending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : saved ? (
          <BookmarkCheck size={12} />
        ) : (
          <Bookmark size={12} />
        )}
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}
