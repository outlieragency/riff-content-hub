import { Tv } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { AddChannelForm } from '@/components/channels/add-channel-form'
import { ChannelList, type ChannelRow } from '@/components/channels/channel-list'

export const dynamic = 'force-dynamic'

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
    .order('created_at', { ascending: false })

  // count videos per channel (n+1 ok สำหรับ Earth's volume; optimize later)
  const rows: ChannelRow[] = []
  for (const c of channels ?? []) {
    const { count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', c.id)
    rows.push({ ...c, videos_count: count ?? 0 })
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-6">
      <PageHeader
        title="Channels"
        description="YouTube channels ที่ track อยู่"
      />

      <AddChannelForm />

      {rows.length > 0 ? (
        <ChannelList channels={rows} />
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
