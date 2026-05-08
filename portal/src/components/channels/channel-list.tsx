'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw, ExternalLink, Loader2 } from 'lucide-react'
import { resyncChannel } from '@/lib/actions/add-channel'
import { formatCount, timeAgo } from '@/lib/utils'

export type ChannelRow = {
  id: string
  youtube_channel_id: string
  handle: string | null
  title: string
  thumbnail_url: string | null
  subscriber_count: number | null
  total_video_count: number | null
  channel_avg_views: number | null
  last_synced_at: string | null
  sync_status: string
  videos_count: number
}

export function ChannelList({ channels }: { channels: ChannelRow[] }) {
  if (channels.length === 0) return null

  return (
    <div className="surface-2 divide-y divide-border-soft overflow-hidden">
      {channels.map((c) => (
        <ChannelRowItem key={c.id} channel={c} />
      ))}
    </div>
  )
}

function ChannelRowItem({ channel }: { channel: ChannelRow }) {
  const [pending, start] = useTransition()
  const [imgFailed, setImgFailed] = useState(false)
  const router = useRouter()

  function onResync() {
    start(async () => {
      await resyncChannel(channel.id)
      router.refresh()
    })
  }

  const youtubeUrl = channel.handle
    ? `https://youtube.com/${channel.handle.startsWith('@') ? channel.handle : '@' + channel.handle}`
    : `https://youtube.com/channel/${channel.youtube_channel_id}`

  const showImg = channel.thumbnail_url && !imgFailed
  const initials = channel.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={channel.thumbnail_url!}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="w-10 h-10 rounded-full object-cover bg-muted"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-secondary text-text-muted text-xs font-medium flex items-center justify-center">
          {initials || '·'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-foreground truncate hover:underline flex items-center gap-1"
          >
            {channel.title}
            <ExternalLink size={11} className="text-muted-foreground" />
          </a>
        </div>
        <div className="text-xs text-muted-foreground">
          {channel.subscriber_count != null && (
            <>{formatCount(channel.subscriber_count)} subs · </>
          )}
          {channel.videos_count} video tracked
          {channel.channel_avg_views != null && (
            <> · avg {formatCount(Math.round(channel.channel_avg_views))} views</>
          )}
          {channel.last_synced_at && (
            <> · sync {timeAgo(channel.last_synced_at)}</>
          )}
        </div>
      </div>
      <button
        onClick={onResync}
        disabled={pending}
        className="h-8 px-3 rounded-[6px] border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
        {pending ? 'syncing' : 'Re-sync'}
      </button>
    </div>
  )
}
