import { Tv } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { AddChannelForm } from '@/components/channels/add-channel-form'
import { Watchlist } from '@/components/channels/watchlist'
import type { ChannelRow } from '@/components/channels/channel-list'

export const dynamic = 'force-dynamic'

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

export default async function ChannelsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: channels } = await supabase
    .from('channels')
    .select(
      'id, youtube_channel_id, handle, title, thumbnail_url, subscriber_count, total_video_count, channel_avg_views, last_synced_at, sync_status',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 7-day outlier counts per channel (Eden-style watchlist)
  const cutoff = sevenDaysAgoIso()
  const rows: (ChannelRow & { outliers_7d: number })[] = []
  for (const c of channels ?? []) {
    const { count: videosCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', c.id)
      .eq('user_id', user.id)
    const { count: outliersCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', c.id)
      .eq('user_id', user.id)
      .gte('outlier_score', 2)
      .gte('published_at', cutoff)
    rows.push({
      ...c,
      videos_count: videosCount ?? 0,
      outliers_7d: outliersCount ?? 0,
    })
  }

  // Sort: highest 7d outliers first (most active creators on top)
  rows.sort((a, b) => b.outliers_7d - a.outliers_7d)

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-6">
      <PageHeader
        title="Channels"
        description="YouTube creators ที่ track อยู่ — ดู 7-day outlier ของแต่ละช่อง"
      />

      <AddChannelForm />

      {rows.length > 0 ? (
        <Watchlist channels={rows} />
      ) : (
        <EmptyState
          icon={Tv}
          title="ยังไม่มี channel"
          description="วาง YouTube channel URL ด้านบนเพื่อเริ่ม track outlier content"
        />
      )}
    </div>
  )
}
