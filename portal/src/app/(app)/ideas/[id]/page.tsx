import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ScorePill } from '@/components/outliers/score-pill'
import { IdeaStatusBadge } from '@/components/ideas/status-badge'
import { StatusSelect } from '@/components/ideas/status-select'
import { NotesEditor } from '@/components/ideas/notes-editor'
import { TranscriptPanel } from '@/components/ideas/transcript-panel'
import { FormatPicker } from '@/components/recreate/format-picker'
import { AutoRedirectOnDraft } from '@/components/ideas/auto-redirect-on-draft'
import { getTranscriptStateForIdea } from '@/lib/actions/transcripts'
import { listDraftsForIdea } from '@/lib/actions/recreate'
import { FORMAT_META } from '@/lib/types/recreate-formats'
import { formatCount, formatDuration, timeAgo } from '@/lib/utils'
import type { IdeaStatus } from '@/lib/actions/ideas'

export const dynamic = 'force-dynamic'

export default async function IdeaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ auto?: string }>
}) {
  const { id } = await params
  const { auto } = await searchParams
  const autoChainActive = auto === 'fb'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: idea } = await supabase
    .from('ideas')
    .select(
      'id, title, source_url, thumbnail_url, notes, status, saved_at, video_id',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!idea) notFound()

  const transcriptState = await getTranscriptStateForIdea(idea.id)
  const drafts = await listDraftsForIdea(idea.id)
  const hasSummary =
    transcriptState.status === 'ready' && transcriptState.summary !== null

  let video:
    | {
        id: string
        outlier_score: number | null
        view_count: number | null
        like_count: number | null
        comment_count: number | null
        duration_seconds: number | null
        is_short: boolean
        published_at: string | null
        youtube_video_id: string
        channel: { title: string; handle: string | null; channel_avg_views: number | null } | null
      }
    | null = null

  if (idea.video_id) {
    const { data: v } = await supabase
      .from('videos')
      .select(
        'id, outlier_score, view_count, like_count, comment_count, duration_seconds, is_short, published_at, youtube_video_id, channel_id',
      )
      .eq('id', idea.video_id)
      .maybeSingle()

    if (v) {
      const { data: ch } = await supabase
        .from('channels')
        .select('title, handle, channel_avg_views')
        .eq('id', v.channel_id)
        .maybeSingle()

      video = {
        id: v.id,
        outlier_score: v.outlier_score,
        view_count: v.view_count,
        like_count: v.like_count,
        comment_count: v.comment_count,
        duration_seconds: v.duration_seconds,
        is_short: v.is_short,
        published_at: v.published_at,
        youtube_video_id: v.youtube_video_id,
        channel: ch
          ? { title: ch.title, handle: ch.handle, channel_avg_views: ch.channel_avg_views }
          : null,
      }
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-6">
      <Link
        href="/ideas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} />
        กลับไป Ideas
      </Link>

      {autoChainActive && (
        <AutoRedirectOnDraft
          ideaId={idea.id}
          knownDraftIds={drafts.map((d) => d.id)}
        />
      )}

      <div className="surface-1 rounded-[14px] p-5 mb-6">
        <div className="flex items-start gap-4">
          {idea.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={idea.thumbnail_url}
              alt=""
              className="w-44 aspect-video rounded-[8px] object-cover bg-muted shrink-0"
            />
          ) : (
            <div className="w-44 aspect-video rounded-[8px] bg-muted shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <ScorePill score={video?.outlier_score} />
              <IdeaStatusBadge status={idea.status as IdeaStatus} />
              <span className="text-2xs text-muted-foreground">
                เก็บ {timeAgo(idea.saved_at)}
              </span>
            </div>

            <h1 className="text-lg font-semibold text-foreground mb-1.5 leading-snug">
              {idea.title}
            </h1>

            <div className="text-xs text-muted-foreground space-y-0.5">
              {video?.channel && (
                <div>
                  {video.channel.handle
                    ? `@${video.channel.handle.replace(/^@/, '')}`
                    : video.channel.title}
                  {video.channel.channel_avg_views != null && (
                    <> · ค่าเฉลี่ยช่อง {formatCount(Math.round(video.channel.channel_avg_views))} views</>
                  )}
                </div>
              )}
              <div>
                {video?.view_count != null && <>{formatCount(video.view_count)} views · </>}
                {video?.like_count != null && <>{formatCount(video.like_count)} likes · </>}
                {video?.duration_seconds != null && (
                  <>{formatDuration(video.duration_seconds)}</>
                )}
                {video?.is_short && <> · short</>}
                {video?.published_at && <> · {timeAgo(video.published_at)}</>}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {idea.source_url && (
                <a
                  href={idea.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-[6px] border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <ExternalLink size={11} />
                  เปิด YouTube
                </a>
              )}
              <StatusSelect ideaId={idea.id} current={idea.status as IdeaStatus} />
            </div>
          </div>
        </div>
      </div>

      <section className="surface-1 rounded-[14px] p-5 mb-6">
        <h2 className="text-md font-semibold text-foreground mb-3">
          โน้ต
        </h2>
        <NotesEditor ideaId={idea.id} initialNotes={idea.notes} />
      </section>

      <section className="surface-1 rounded-[14px] p-5 mb-6">
        <div className="mb-3">
          <h2 className="text-md font-semibold text-foreground">Transcript + Summary</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI ดึง caption แปลไทย สรุปเป็นโครงสร้างที่พร้อม recreate
          </p>
        </div>
        <TranscriptPanel ideaId={idea.id} initial={transcriptState} />
      </section>

      <section className="surface-1 rounded-[14px] p-5 mb-6">
        <h2 className="text-md font-semibold text-foreground mb-1">
          Recreate
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          เลือก format ที่อยาก recreate AI จะใช้ summary ด้านบน + voice profile ของคุณ
        </p>
        <FormatPicker ideaId={idea.id} hasSummary={hasSummary} />
      </section>

      {drafts.length > 0 && (
        <section className="surface-1 rounded-[14px] p-5">
          <h2 className="text-md font-semibold text-foreground mb-3">
            Drafts ก่อนหน้า ({drafts.length})
          </h2>
          <ul className="space-y-1.5">
            {drafts.map((d) => {
              const meta = FORMAT_META[d.format]
              return (
                <li key={d.id}>
                  <Link
                    href={`/recreated/${d.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-[8px] hover:bg-secondary transition-colors"
                  >
                    <span className="text-xs px-1.5 py-0.5 rounded-[5px] bg-brand-soft text-brand">
                      {meta?.label ?? d.format}
                    </span>
                    <span className="text-sm text-foreground truncate flex-1">
                      {d.title ?? 'Untitled draft'}
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {timeAgo(d.created_at)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
