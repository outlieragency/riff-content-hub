import Link from 'next/link'
import { Flame, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { OutlierRow, type OutlierVideo } from '@/components/outliers/outlier-row'
import { DiscoverModeTabs, type DiscoverMode } from '@/components/discover/mode-tabs'
import { DiscoverFilters } from '@/components/discover/filters'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  mode?: string
  channel?: string
  duration?: string
  score?: string
  q?: string
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: channels } = await supabase
    .from('channels')
    .select('id, title, handle, subscriber_count')
    .order('title')

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

  // Build videos query — base
  let videoQ = supabase
    .from('videos')
    .select(
      'id, youtube_video_id, title, thumbnail_url, view_count, duration_seconds, is_short, published_at, outlier_score, channel_id',
    )
    .limit(120)

  // Mode-specific
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

  // Common filters
  if (channelFilter) videoQ = videoQ.eq('channel_id', channelFilter)
  if (durationFilter === 'long') videoQ = videoQ.eq('is_short', false)
  else if (durationFilter === 'short') videoQ = videoQ.eq('is_short', true)
  if (q) videoQ = videoQ.ilike('title', `%${q}%`)

  const { data: videos } = await videoQ

  // Fetch saved ideas → mark which are saved
  const { data: ideaRows } = await supabase
    .from('ideas')
    .select('video_id')
    .eq('user_id', user.id)
  const savedIds = new Set((ideaRows ?? []).map((r) => r.video_id).filter(Boolean))

  const channelMap = new Map(channels.map((c) => [c.id, c]))

  let rows: OutlierVideo[] = (videos ?? []).map((v) => {
    const ch = channelMap.get(v.channel_id)
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
      channel_title: ch?.title ?? '',
      channel_handle: ch?.handle ?? null,
      channel_subscriber_count: ch?.subscriber_count ?? null,
      is_saved: savedIds.has(v.id),
    }
  })

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

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Header />
      <DiscoverModeTabs />
      <DiscoverFilters
        channels={channels.map((c) => ({ id: c.id, title: c.title }))}
        mode={mode}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Flame}
          title={emptyTitle(mode)}
          description={emptyDescription(mode)}
        />
      ) : (
        <div className="surface-2 divide-y divide-border-soft overflow-hidden">
          {rows.map((v) => (
            <OutlierRow key={v.id} video={v} />
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
