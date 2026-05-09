import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ExternalLink, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OutlierCard } from '@/components/outliers/outlier-card'
import type { OutlierVideo } from '@/components/outliers/outlier-row'
import { ChannelSortTabs, type ChannelSortMode } from '@/components/channels/sort-tabs'
import { formatCount } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const VALID_SORT: ChannelSortMode[] = [
  'recent',
  'top_liked',
  'top_viewed',
  'top_outlier',
]

function parseSort(raw: string | undefined): ChannelSortMode {
  return (VALID_SORT as string[]).includes(raw ?? '')
    ? (raw as ChannelSortMode)
    : 'recent'
}

export default async function ChannelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string; q?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const sort = parseSort(sp.sort)
  const q = (sp.q ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: channel } = await supabase
    .from('channels')
    .select(
      'id, youtube_channel_id, handle, title, description, thumbnail_url, subscriber_count, total_video_count, channel_avg_views, last_synced_at',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!channel) notFound()

  // Build videos query
  let videoQ = supabase
    .from('videos')
    .select(
      'id, youtube_video_id, title, thumbnail_url, view_count, duration_seconds, is_short, published_at, outlier_score, channel_id',
    )
    .eq('channel_id', id)
    .eq('user_id', user.id)
    .eq('is_short', false)
    .limit(60)

  switch (sort) {
    case 'top_liked':
      // No like data — fall back to view_count as proxy
      videoQ = videoQ.order('view_count', { ascending: false, nullsFirst: false })
      break
    case 'top_viewed':
      videoQ = videoQ.order('view_count', { ascending: false, nullsFirst: false })
      break
    case 'top_outlier':
      videoQ = videoQ.order('outlier_score', { ascending: false, nullsFirst: false })
      break
    case 'recent':
    default:
      videoQ = videoQ.order('published_at', { ascending: false, nullsFirst: false })
  }

  if (q) videoQ = videoQ.ilike('title', `%${q}%`)

  const { data: videos } = await videoQ

  // Saved set
  const { data: ideaRows } = await supabase
    .from('ideas')
    .select('video_id')
    .eq('user_id', user.id)
  const savedIds = new Set((ideaRows ?? []).map((r) => r.video_id).filter(Boolean))

  const rows: OutlierVideo[] = (videos ?? []).map((v) => ({
    id: v.id,
    youtube_video_id: v.youtube_video_id,
    title: v.title,
    thumbnail_url: v.thumbnail_url,
    view_count: v.view_count,
    duration_seconds: v.duration_seconds,
    is_short: v.is_short,
    published_at: v.published_at,
    outlier_score: v.outlier_score,
    channel_id: v.channel_id,
    channel_title: channel.title ?? '',
    channel_handle: channel.handle ?? null,
    channel_subscriber_count: channel.subscriber_count ?? null,
    is_saved: savedIds.has(v.id),
  }))

  // Outliers count for "summary" stat
  const { count: outlierCount } = await supabase
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('channel_id', id)
    .eq('user_id', user.id)
    .gte('outlier_score', 2)

  const ytChannelUrl = channel.handle
    ? `https://youtube.com/${channel.handle}`
    : `https://youtube.com/channel/${channel.youtube_channel_id}`

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      <Link
        href="/channels"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} />
        Channels
      </Link>

      {/* Channel header card */}
      <div className="rounded-[14px] border border-border-soft bg-card p-5 mb-6">
        <div className="flex items-start gap-4">
          {channel.thumbnail_url ? (
            <Image
              src={channel.thumbnail_url}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="w-16 h-16 rounded-full object-cover bg-secondary"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">
                {channel.title}
              </h1>
              {channel.handle && (
                <span className="text-sm text-muted-foreground">
                  @{channel.handle.replace(/^@/, '')}
                </span>
              )}
              <a
                href={ytChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                <ExternalLink size={11} />
                Open on YouTube
              </a>
            </div>
            {channel.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 max-w-[680px]">
                {channel.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {channel.subscriber_count != null && (
                <Stat
                  label="followers"
                  value={formatCount(channel.subscriber_count)}
                />
              )}
              <Stat label="posts cached" value={String(rows.length)} />
              {channel.channel_avg_views != null && (
                <Stat
                  label="typical views"
                  value={formatCount(channel.channel_avg_views)}
                />
              )}
              {outlierCount != null && (
                <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                  <Flame size={11} />
                  {outlierCount} outliers
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChannelSortTabs current={sort} />

      {rows.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            ยังไม่มี video ใน channel นี้ — ลอง sync ใหม่
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((v) => (
            <OutlierCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-foreground font-semibold tabular-nums">{value}</span>
      <span>{label}</span>
    </span>
  )
}
