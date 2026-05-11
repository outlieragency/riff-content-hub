import Link from 'next/link'
import { Flame, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { type OutlierVideo } from '@/components/outliers/outlier-row'
import { OutlierCard } from '@/components/outliers/outlier-card'
import { DiscoverModeTabs, type DiscoverMode } from '@/components/discover/mode-tabs'
import { NicheFilter } from '@/components/discover/niche-filter'
import { SuggestedCreators } from '@/components/discover/suggested-creators'
import { RefreshPoolButton } from '@/components/discover/refresh-pool-button'
import { getSuggestedCreators } from '@/lib/niche-creators'
import { isFounderEmail } from '@/lib/auth/founder'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  mode?: string
  channel?: string
  duration?: string
  score?: string
  q?: string
  niche?: string
}>

const VALID_MODES: DiscoverMode[] = ['all', 'outliers', 'latest', 'channel']

function parseMode(raw: string | undefined): DiscoverMode {
  return (VALID_MODES as string[]).includes(raw ?? '')
    ? (raw as DiscoverMode)
    : 'all'
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const mode = parseMode(sp.mode)
  const channelFilter = sp.channel ?? ''
  const durationFilter = sp.duration ?? 'long'
  const scoreFloor = mode === 'outliers' ? Number(sp.score ?? '2') : 0
  const q = (sp.q ?? '').trim()
  const selectedNiches = (sp.niche ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Build videos query
  let videoQ = supabase
    .from('videos')
    .select(
      'id, youtube_video_id, title, thumbnail_url, view_count, duration_seconds, is_short, published_at, outlier_score, channel_id',
    )
    .limit(120)

  switch (mode) {
    case 'outliers':
      videoQ = videoQ
        .gte('outlier_score', scoreFloor)
        .order('outlier_score', { ascending: false, nullsFirst: false })
      break
    case 'latest':
      videoQ = videoQ
        .gte('published_at', daysAgoIso(14))
        .order('published_at', { ascending: false, nullsFirst: false })
      break
    case 'channel':
    case 'all':
    default:
      videoQ = videoQ.order('published_at', {
        ascending: false,
        nullsFirst: false,
      })
  }

  if (channelFilter) videoQ = videoQ.eq('channel_id', channelFilter)
  if (durationFilter === 'long') videoQ = videoQ.eq('is_short', false)
  else if (durationFilter === 'short') videoQ = videoQ.eq('is_short', true)
  if (q) videoQ = videoQ.ilike('title', `%${q}%`)

  // Shared pool feeds /discover on every load — Earth's note "ผมอยาก
  // ให้หน้า discovery หลากหลาย". Niche filter narrows it when active,
  // otherwise the whole curated catalog is fair game. Mode filter
  // mirrors the user-videos query so Latest/Outliers/All behave the
  // same on both sources.
  const buildSharedQuery = () => {
    let q = selectedNiches.length
      ? supabase
          .from('shared_videos')
          .select(
            'id, youtube_video_id, title, thumbnail_url, view_count, duration_seconds, is_short, published_at, outlier_score, shared_channel_id, shared_channels!inner(id, title, handle, subscriber_count, niches)',
          )
          .eq('is_short', false)
          .overlaps('shared_channels.niches', selectedNiches)
          .limit(120)
      : supabase
          .from('shared_videos')
          .select(
            'id, youtube_video_id, title, thumbnail_url, view_count, duration_seconds, is_short, published_at, outlier_score, shared_channel_id, shared_channels!inner(id, title, handle, subscriber_count, niches)',
          )
          .eq('is_short', false)
          .limit(120)
    switch (mode) {
      case 'outliers':
        q = q
          .gte('outlier_score', scoreFloor)
          .order('outlier_score', { ascending: false, nullsFirst: false })
        break
      case 'latest':
        q = q
          .gte('published_at', daysAgoIso(14))
          .order('published_at', { ascending: false, nullsFirst: false })
        break
      default:
        // Default 'all' interleaves recency with signal — published_at desc
        // so the feed has variety + freshness instead of one creator's
        // greatest-hits dominating.
        q = q.order('published_at', { ascending: false, nullsFirst: false })
    }
    return q
  }

  // 5 independent queries fire in parallel
  const [
    { data: channels },
    { data: videos },
    { data: ideaRows },
    sharedRes,
    { count: sharedChannelCount },
  ] = await Promise.all([
    supabase
      .from('channels')
      .select('id, title, handle, subscriber_count, niches')
      .order('title'),
    videoQ,
    supabase.from('ideas').select('video_id').eq('user_id', user.id),
    mode === 'channel'
      ? Promise.resolve({ data: [] as unknown[] })
      : buildSharedQuery(),
    supabase
      .from('shared_channels')
      .select('id', { count: 'exact', head: true }),
  ])

  if (!channels || channels.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Header />
        <EmptyState
          icon={Flame}
          title="ยังไม่มี content ให้ discover"
          description="เพิ่ม channel แรกเพื่อเริ่ม sync video เข้ามา"
          action={
            <Link
              href="/channels"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-colors"
            >
              <Plus size={14} />
              Add channel
            </Link>
          }
        />
      </div>
    )
  }

  const savedIds = new Set((ideaRows ?? []).map((r) => r.video_id).filter(Boolean))

  const channelMap = new Map(channels.map((c) => [c.id, c]))

  // Niches that have at least one tagged channel — used to dim chips with
  // no data so the filter row reflects reality.
  const availableNicheIds = Array.from(
    new Set(
      channels.flatMap((c) =>
        ((c as { niches?: string[] | null }).niches ?? []).map((n) =>
          n.toLowerCase(),
        ),
      ),
    ),
  )

  const selectedNicheSet = new Set(selectedNiches)
  // Channel-id allow-list when niches are selected (any-of semantics).
  const allowedChannelIds = selectedNicheSet.size
    ? new Set(
        channels
          .filter((c) =>
            (((c as { niches?: string[] | null }).niches ?? []) as string[]).some(
              (n) => selectedNicheSet.has(n.toLowerCase()),
            ),
          )
          .map((c) => c.id),
      )
    : null

  let rows: OutlierVideo[] = (videos ?? [])
    .filter((v) => !allowedChannelIds || allowedChannelIds.has(v.channel_id))
    .map((v) => {
    const ch = channelMap.get(v.channel_id) as
      | {
          id: string
          title: string
          handle: string | null
          subscriber_count: number | null
          niches?: string[] | null
        }
      | undefined
    return {
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
      channel_title: ch?.title ?? '',
      channel_handle: ch?.handle ?? null,
      channel_subscriber_count: ch?.subscriber_count ?? null,
      channel_niches: ch?.niches ?? [],
      is_saved: savedIds.has(v.id),
    }
  })

  // Mix in shared-pool videos on every load (except 'By Channel' mode,
  // which groups by user-tracked channel and doesn't fit the pool).
  // Dedupe against user's tracked youtube_video_ids — if Earth already
  // has this video from his own channel sync, prefer that version (it
  // has working save/recreate actions).
  if (mode !== 'channel' && sharedRes && Array.isArray(sharedRes.data)) {
    const ownedYtIds = new Set(
      (videos ?? []).map((v) => v.youtube_video_id).filter(Boolean),
    )
    type SharedRow = {
      id: string
      youtube_video_id: string
      title: string
      thumbnail_url: string | null
      view_count: number | null
      duration_seconds: number | null
      is_short: boolean
      published_at: string | null
      outlier_score: number | null
      shared_channel_id: string
      shared_channels:
        | {
            id: string
            title: string
            handle: string | null
            subscriber_count: number | null
            niches?: string[] | null
          }
        | {
            id: string
            title: string
            handle: string | null
            subscriber_count: number | null
            niches?: string[] | null
          }[]
        | null
    }
    const sharedRows = (sharedRes.data as SharedRow[])
      .filter((v) => !ownedYtIds.has(v.youtube_video_id))
      .map((v): OutlierVideo => {
        const ch = Array.isArray(v.shared_channels)
          ? v.shared_channels[0]
          : v.shared_channels
        return {
          id: v.id,
          youtube_video_id: v.youtube_video_id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          view_count: v.view_count,
          duration_seconds: v.duration_seconds,
          is_short: v.is_short,
          published_at: v.published_at,
          outlier_score: v.outlier_score,
          channel_id: v.shared_channel_id,
          channel_title: ch?.title ?? '',
          channel_handle: ch?.handle ?? null,
          channel_subscriber_count: ch?.subscriber_count ?? null,
          channel_niches: ch?.niches ?? [],
          is_saved: false,
          is_shared: true,
        }
      })
    rows = [...rows, ...sharedRows]
    // Re-sort the combined list so tracked + shared interleave by
    // whatever metric the active mode picked. Without this, all tracked
    // rows would render before any shared row regardless of date / score.
    switch (mode) {
      case 'latest':
        rows.sort((a, b) =>
          String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')),
        )
        break
      case 'outliers':
        rows.sort((a, b) => (b.outlier_score ?? 0) - (a.outlier_score ?? 0))
        break
      default:
        rows.sort((a, b) =>
          String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')),
        )
    }
  }

  // For "By Channel" mode, group + take top 5 per channel
  if (mode === 'channel') {
    const grouped = new Map<string, OutlierVideo[]>()
    for (const r of rows) {
      const key = r.channel_title || 'unknown'
      const arr = grouped.get(key) ?? []
      if (arr.length < 5) arr.push(r)
      grouped.set(key, arr)
    }
    rows = Array.from(grouped.values()).flat()
  }

  const isFounder = isFounderEmail(user.email)
  const trackedCount = channels.length
  const curatedCount = sharedChannelCount ?? 0

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
        <Header />
        <div className="text-[11px] text-text-muted">
          {trackedCount} tracked + {curatedCount} curated channels
        </div>
      </div>
      {isFounder && (
        <div className="flex justify-end mb-2">
          <RefreshPoolButton />
        </div>
      )}
      {/* Niche filter (compact dropdown) + mode tabs in one row. The
          inline channel/duration/score filters that used to live here
          are gone — Earth's 'feature เยอะแยะ' feedback. */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <NicheFilter availableNicheIds={availableNicheIds} />
        <DiscoverModeTabs />
      </div>
      {selectedNiches.length > 0 && (() => {
        const trackedHandles = new Set(
          channels
            .map((c) => (c as { handle?: string | null }).handle)
            .filter((h): h is string => Boolean(h))
            .map((h) => h.toLowerCase().replace(/^@/, '')),
        )
        const suggestions = getSuggestedCreators(selectedNiches).filter(
          (c) => !trackedHandles.has(c.handle.toLowerCase()),
        )
        return <SuggestedCreators creators={suggestions} />
      })()}

      {rows.length === 0 ? (
        <EmptyState
          icon={Flame}
          title={emptyTitle(mode)}
          description={emptyDescription(mode)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((v) => (
            <OutlierCard
              key={v.id}
              video={v}
              channelHref={`/channels/${v.channel_id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="mb-6">
      <h1 className="font-serif-display text-3xl text-foreground leading-tight">
        Discover
      </h1>
      <p className="text-sm text-muted-foreground mt-1.5">
        Content จากช่องที่คุณ track พร้อม filter — บันทึกเป็น idea แล้ว recreate
      </p>
    </div>
  )
}

function emptyTitle(mode: DiscoverMode): string {
  switch (mode) {
    case 'outliers':
      return 'ไม่พบ outlier ที่ตรงเงื่อนไข'
    case 'latest':
      return 'ไม่มี video ใหม่ใน 14 วัน'
    case 'channel':
      return 'ยังไม่มี video ของช่องที่ track'
    default:
      return 'ไม่พบ video ที่ตรงเงื่อนไข'
  }
}

function emptyDescription(mode: DiscoverMode): string {
  switch (mode) {
    case 'outliers':
      return 'ลด score floor หรือเปลี่ยน duration filter'
    case 'latest':
      return 'ลอง sync channel หรือเปลี่ยนเป็น mode All'
    case 'channel':
      return 'ลอง sync channel เพิ่ม'
    default:
      return 'ลองล้าง filter หรือเปลี่ยน mode'
  }
}
