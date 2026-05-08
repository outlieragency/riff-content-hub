import Link from 'next/link'
import { Flame, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { OutlierRow, type OutlierVideo } from '@/components/outliers/outlier-row'
import { OutlierFilters } from '@/components/outliers/filters'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  channel?: string
  duration?: string
  score?: string
  q?: string
}>

export default async function OutliersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const channelFilter = sp.channel ?? ''
  const durationFilter = sp.duration ?? 'long'
  const scoreFloor = Number(sp.score ?? '2')
  const q = (sp.q ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Channels for filter dropdown
  const { data: channels } = await supabase
    .from('channels')
    .select('id, title, handle, subscriber_count')
    .order('title')

  if (!channels || channels.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif-display text-3xl text-foreground leading-tight">
            What's <span className="font-serif-italic">resonating</span> today
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Content ที่ทำได้ดีกว่าค่าเฉลี่ยช่อง เรียงจากแรงสุด
          </p>
        </div>
        <EmptyState
          icon={Flame}
          title="ยังไม่มี outlier"
          description="เพิ่ม channel แรกเพื่อเริ่ม track outlier content"
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

  // Build videos query
  let videoQ = supabase
    .from('videos')
    .select(
      'id, youtube_video_id, title, thumbnail_url, view_count, duration_seconds, is_short, published_at, outlier_score, channel_id',
    )
    .order('outlier_score', { ascending: false, nullsFirst: false })
    .limit(100)

  if (channelFilter) {
    videoQ = videoQ.eq('channel_id', channelFilter)
  }
  if (durationFilter === 'long') {
    videoQ = videoQ.eq('is_short', false)
  } else if (durationFilter === 'short') {
    videoQ = videoQ.eq('is_short', true)
  }
  if (scoreFloor > 0) {
    videoQ = videoQ.gte('outlier_score', scoreFloor)
  }
  if (q) {
    videoQ = videoQ.ilike('title', `%${q}%`)
  }

  const { data: videos } = await videoQ

  // Fetch saved ideas for current user → mark which are saved
  const { data: ideaRows } = await supabase
    .from('ideas')
    .select('video_id')
    .eq('user_id', user.id)
  const savedIds = new Set((ideaRows ?? []).map((r) => r.video_id).filter(Boolean))

  // Build channel lookup for denormalized fields
  const channelMap = new Map(channels.map((c) => [c.id, c]))

  const rows: OutlierVideo[] = (videos ?? []).map((v) => {
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

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-serif-display text-3xl text-foreground leading-tight">
          What's <span className="font-serif-italic">resonating</span> today
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Content ที่ทำได้ดีกว่าค่าเฉลี่ยช่อง เรียงจากแรงสุด
        </p>
      </div>

      <OutlierFilters
        channels={channels.map((c) => ({ id: c.id, title: c.title }))}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="ไม่พบ outlier ที่ตรงเงื่อนไข"
          description="ลองลด score floor หรือเปลี่ยน duration filter"
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
