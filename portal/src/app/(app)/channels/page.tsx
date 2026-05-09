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
  // Single grouped query instead of N+1 — pulls just channel_id refs and tallies in JS
  const cutoff = sevenDaysAgoIso()
  const channelList = channels ?? []
  const channelIds = channelList.map((c) => c.id)

  const [{ data: allVideoRefs }, { data: outlierVideoRefs }] = await Promise.all([
    channelIds.length
      ? supabase
          .from('videos')
          .select('channel_id')
          .eq('user_id', user.id)
          .in('channel_id', channelIds)
      : Promise.resolve({ data: [] as { channel_id: string }[] }),
    channelIds.length
      ? supabase
          .from('videos')
          .select('channel_id')
          .eq('user_id', user.id)
          .in('channel_id', channelIds)
          .gte('outlier_score', 2)
          .gte('published_at', cutoff)
      : Promise.resolve({ data: [] as { channel_id: string }[] }),
  ])

  const videoCounts = new Map<string, number>()
  for (const v of allVideoRefs ?? []) {
    videoCounts.set(v.channel_id, (videoCounts.get(v.channel_id) ?? 0) + 1)
  }
  const outlierCounts = new Map<string, number>()
  for (const v of outlierVideoRefs ?? []) {
    outlierCounts.set(v.channel_id, (outlierCounts.get(v.channel_id) ?? 0) + 1)
  }

  const rows: (ChannelRow & { outliers_7d: number })[] = channelList
    .map((c) => ({
      ...c,
      videos_count: videoCounts.get(c.id) ?? 0,
      outliers_7d: outlierCounts.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.outliers_7d - a.outliers_7d)

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
