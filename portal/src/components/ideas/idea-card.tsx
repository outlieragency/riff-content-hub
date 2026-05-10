'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ArchiveRestore, Loader2 } from 'lucide-react'
import { changeIdeaStatus, deleteIdea, type IdeaStatus } from '@/lib/actions/ideas'
import { ScorePill } from '@/components/outliers/score-pill'
import { IdeaStatusBadge } from './status-badge'
import { BoardChip } from '@/components/boards/board-chip'
import { AddToBoardMenu } from '@/components/boards/add-to-board-menu'
import { formatCount, timeAgo } from '@/lib/utils'

type CardBoardRef = {
  id: string
  name: string
  color: string
  icon: string | null
}

export type IdeaCard = {
  id: string
  title: string
  source_url: string | null
  thumbnail_url: string | null
  notes: string | null
  status: IdeaStatus
  saved_at: string
  video: {
    id: string
    outlier_score: number | null
    view_count: number | null
    channel_handle: string | null
    channel_title: string
  } | null
  boards?: CardBoardRef[]
}

export function IdeaCardItem({ idea }: { idea: IdeaCard }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function onArchiveToggle() {
    const next: IdeaStatus = idea.status === 'archived' ? 'idea' : 'archived'
    start(async () => {
      await changeIdeaStatus(idea.id, next)
      router.refresh()
    })
  }

  function onDelete() {
    if (!confirm('ลบ idea นี้ออกจริง ๆ ใช่ไหม')) return
    start(async () => {
      await deleteIdea(idea.id)
      router.refresh()
    })
  }

  return (
    <div className="surface-1 rounded-[14px] overflow-hidden flex flex-col group">
      <Link href={`/ideas/${idea.id}`} className="block">
        {idea.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idea.thumbnail_url}
            alt=""
            className="w-full aspect-video object-cover bg-muted"
          />
        ) : (
          <div className="w-full aspect-video bg-muted" />
        )}
      </Link>

      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <ScorePill score={idea.video?.outlier_score} />
          <IdeaStatusBadge status={idea.status} />
        </div>

        <Link
          href={`/ideas/${idea.id}`}
          className="font-medium text-sm text-foreground line-clamp-2 hover:text-brand-hover"
        >
          {idea.title}
        </Link>

        {idea.boards && idea.boards.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {idea.boards.map((b) => (
              <BoardChip
                key={b.id}
                id={b.id}
                name={b.name}
                color={b.color}
                icon={b.icon}
              />
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-auto">
          {idea.video?.channel_handle
            ? `@${idea.video.channel_handle.replace(/^@/, '')}`
            : idea.video?.channel_title ?? 'ไม่ทราบช่อง'}
          {idea.video?.view_count != null && (
            <> · {formatCount(idea.video.view_count)} views</>
          )}
        </div>
        <div className="text-2xs text-muted-foreground">
          เก็บ {timeAgo(idea.saved_at)}
        </div>

        <div className="flex gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AddToBoardMenu
            ideaId={idea.id}
            initialBoardIds={(idea.boards ?? []).map((b) => b.id)}
          />
          <button
            type="button"
            onClick={onArchiveToggle}
            disabled={pending}
            className="flex-1 h-7 px-2 rounded-[6px] border border-border text-2xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 inline-flex items-center justify-center gap-1"
          >
            {pending ? <Loader2 size={11} className="animate-spin" /> : <ArchiveRestore size={11} />}
            {idea.status === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="h-7 px-2 rounded-[6px] border border-border text-2xs text-muted-foreground hover:bg-status-red-bg hover:text-status-red-text disabled:opacity-50 inline-flex items-center justify-center"
            title="ลบ"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
