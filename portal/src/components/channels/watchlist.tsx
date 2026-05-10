'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Bookmark,
  ExternalLink,
  Flame,
  Loader2,
  RefreshCcw,
  TrendingUp,
} from 'lucide-react'
import { resyncChannel } from '@/lib/actions/add-channel'
import { formatCount } from '@/lib/utils'
import type { ChannelRow } from './channel-list'

type WatchlistRow = ChannelRow & {
  outliers_7d: number
}

/**
 * Eden-inspired watchlist UI for /channels.
 * 2-column grid of tracked creators with 7-day outlier counts.
 */
export function Watchlist({ channels }: { channels: WatchlistRow[] }) {
  if (channels.length === 0) return null

  return (
    <section className="rounded-[14px] border border-border-soft bg-card overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold text-foreground">Watchlist</h2>
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Bookmark size={11} />
          {channels.length} tracked
        </div>
      </header>

      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex justify-between mb-2 px-2">
          <span>Creators</span>
          <span>7d outliers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {channels.map((c) => (
            <WatchlistRowItem key={c.id} channel={c} />
          ))}
        </div>
      </div>
    </section>
  )
}

function WatchlistRowItem({ channel }: { channel: WatchlistRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [imgFailed, setImgFailed] = useState(false)

  function onResync(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    start(async () => {
      await resyncChannel(channel.id)
      router.refresh()
    })
  }

  const showImg = channel.thumbnail_url && !imgFailed
  const initials = channel.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const youtubeUrl = channel.handle
    ? `https://youtube.com/${channel.handle.startsWith('@') ? channel.handle : '@' + channel.handle}`
    : `https://youtube.com/channel/${channel.youtube_channel_id}`

  const isHot = channel.outliers_7d >= 5
  const isWarm = channel.outliers_7d >= 1 && channel.outliers_7d < 5

  return (
    <Link
      href={`/channels/${channel.id}`}
      className="group flex items-center gap-3 px-2 py-2 rounded-[8px] hover:bg-secondary/50 transition-colors"
    >
      {showImg ? (
        <Image
          src={channel.thumbnail_url!}
          alt=""
          width={40}
          height={40}
          unoptimized
          onError={() => setImgFailed(true)}
          className="w-10 h-10 rounded-full object-cover bg-muted shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground text-xs font-medium flex items-center justify-center shrink-0">
          {initials || '·'}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">
          {channel.title}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {channel.handle ? `@${channel.handle.replace(/^@/, '')}` : ''}
          {channel.subscriber_count != null && (
            <>
              {channel.handle ? ' · ' : ''}
              {formatCount(channel.subscriber_count)} subs
            </>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onResync}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
          title="Re-sync"
        >
          {pending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCcw size={12} />
          )}
        </button>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground"
          title="Open on YouTube"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      <div
        className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums w-10 justify-end ${
          isHot
            ? 'text-orange-600'
            : isWarm
              ? 'text-foreground'
              : 'text-muted-foreground'
        }`}
      >
        {isHot ? (
          <Flame size={12} fill="currentColor" />
        ) : isWarm ? (
          <TrendingUp size={12} />
        ) : null}
        {channel.outliers_7d}
      </div>
    </Link>
  )
}
