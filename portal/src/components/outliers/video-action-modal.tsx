'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  Flame,
  Loader2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { toggleSaveIdea } from '@/lib/actions/save-idea'
import { trackCreator } from '@/lib/actions/track-creator'
import { createClient } from '@/lib/supabase/client'
import { formatCount, formatDuration, timeAgo } from '@/lib/utils'
import type { OutlierVideo } from './outlier-row'

/**
 * Action picker shown when user clicks a video card on /discover.
 * Replaces the previous "click → open YouTube directly" UX with a chooser:
 *   - Save as Idea
 *   - Recreate now (save + go to idea page → trigger recreate flow)
 *   - Open in YouTube (default behavior, kept as option)
 */
export function VideoActionModal({
  video,
  open,
  onClose,
  onSavedChange,
}: {
  video: OutlierVideo
  open: boolean
  onClose: () => void
  onSavedChange?: (saved: boolean) => void
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(video.is_saved)
  const [pending, start] = useTransition()
  const [navigating, setNavigating] = useState<'recreate' | null>(null)
  const [trackState, setTrackState] = useState<'idle' | 'done' | 'error'>('idle')
  const [trackError, setTrackError] = useState<string | null>(null)

  if (!open) return null

  const shared = !!video.is_shared
  const ytUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`

  function handleTrackCreator() {
    if (!video.channel_handle) {
      setTrackState('error')
      setTrackError('ไม่มี handle ของ channel')
      return
    }
    setTrackError(null)
    start(async () => {
      const res = await trackCreator(video.channel_handle as string)
      if (res.ok) {
        setTrackState('done')
        // Pull the new tracked-channel videos into the feed.
        router.refresh()
      } else {
        setTrackState('error')
        setTrackError(res.error)
      }
    })
  }

  function handleSaveOnly() {
    if (saved) {
      onClose()
      return
    }
    start(async () => {
      const res = await toggleSaveIdea(video.id)
      if (res.ok) {
        setSaved(true)
        onSavedChange?.(true)
        router.refresh()
        onClose()
      }
    })
  }

  async function handleRecreate() {
    setNavigating('recreate')
    // Ensure idea exists (save if not yet)
    if (!saved) {
      const res = await toggleSaveIdea(video.id)
      if (!res.ok) {
        setNavigating(null)
        return
      }
      setSaved(true)
      onSavedChange?.(true)
    }
    // Find the idea row for this video to get its UUID
    const sb = createClient()
    const {
      data: { user },
    } = await sb.auth.getUser()
    if (!user) {
      setNavigating(null)
      return
    }
    const { data: idea } = await sb
      .from('ideas')
      .select('id')
      .eq('video_id', video.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (idea?.id) {
      router.push(`/ideas/${idea.id}`)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending && !navigating) onClose()
      }}
    >
      <div
        className="bg-card rounded-[14px] w-[520px] max-w-[96vw] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnail header */}
        <div className="relative aspect-video bg-muted">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt=""
              fill
              sizes="520px"
              className="object-cover"
              unoptimized
            />
          ) : null}
          {video.duration_seconds != null && !video.is_short && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 text-white text-[10px] font-medium tabular-nums">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
          {typeof video.outlier_score === 'number' && video.outlier_score >= 2 && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 text-white text-[11px] font-semibold tabular-nums">
              <Flame size={11} className="text-orange-400" />
              {video.outlier_score >= 100
                ? `${Math.round(video.outlier_score)}x`
                : `${video.outlier_score.toFixed(1)}x`}{' '}
              outlier
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={pending || navigating !== null}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white inline-flex items-center justify-center hover:bg-black/80"
            aria-label="ปิด"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
            {video.title}
          </h2>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <Link
              href={`/channels/${video.channel_id}`}
              className="hover:text-foreground"
            >
              {video.channel_handle
                ? `@${video.channel_handle.replace(/^@/, '')}`
                : video.channel_title}
            </Link>
            {video.view_count != null && (
              <>
                <span>·</span>
                <span>{formatCount(video.view_count)} views</span>
              </>
            )}
            {video.published_at && (
              <>
                <span>·</span>
                <span>{timeAgo(video.published_at)}</span>
              </>
            )}
          </div>

          {/* Actions — buttons depend on whether this is a tracked
              video (save/recreate available) or a shared-pool video
              (must track the creator first). */}
          <div className="mt-5 space-y-2">
            {shared ? (
              <>
                <button
                  type="button"
                  onClick={handleTrackCreator}
                  disabled={pending || trackState === 'done'}
                  className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-[10px] bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    {pending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : trackState === 'done' ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                    {trackState === 'done'
                      ? 'Tracked — open feed อีกครั้งเพื่อ recreate'
                      : `Track @${(video.channel_handle ?? '').replace(/^@/, '')}`}
                  </span>
                  <span className="text-[11px] opacity-80 font-normal">
                    sync videos → recreate ได้ทันที
                  </span>
                </button>
                {trackError && (
                  <div className="text-xs text-red-600 px-1">{trackError}</div>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRecreate}
                  disabled={pending || navigating !== null}
                  className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-[10px] bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    {navigating === 'recreate' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Recreate ตอนนี้
                  </span>
                  <span className="text-[11px] opacity-80 font-normal">
                    save + ไปหน้า idea + start AI
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveOnly}
                  disabled={pending || navigating !== null}
                  className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-[10px] bg-secondary hover:bg-secondary/70 disabled:opacity-50 text-foreground text-sm font-medium transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    {pending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saved ? (
                      <BookmarkCheck size={14} className="text-emerald-600" />
                    ) : (
                      <Bookmark size={14} />
                    )}
                    {saved ? 'บันทึกแล้ว' : 'Save เป็น Idea (ไว้ทำทีหลัง)'}
                  </span>
                </button>
              </>
            )}

            <a
              href={ytUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-[10px] border border-border hover:bg-secondary/40 text-foreground text-sm font-medium transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <ExternalLink size={14} />
                ดูบน YouTube
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
