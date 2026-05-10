import Link from 'next/link'
import { Lightbulb, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { IdeaCardItem, type IdeaCard } from '@/components/ideas/idea-card'
import { IdeaStatusFilter } from '@/components/ideas/status-filter'
import { IdeasKanbanView } from '@/components/ideas/kanban-view'
import {
  ViewModeToggle,
  type IdeasViewMode,
} from '@/components/ideas/view-mode-toggle'
import { BoardSidebar } from '@/components/boards/board-sidebar'
import { listBoards } from '@/lib/actions/boards'
import { getBoard } from '@/lib/actions/boards'
import type { IdeaStatus } from '@/lib/actions/ideas'
import { isBoardColor } from '@/lib/types/board'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  status?: string
  board?: string
  view?: string
}>

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const view: IdeasViewMode = sp.view === 'kanban' ? 'kanban' : 'list'
  // Kanban shows ALL statuses across columns; status filter only applies to list view
  const filter =
    view === 'kanban'
      ? 'all'
      : (sp.status as IdeaStatus | 'all' | undefined) ?? 'idea'
  const boardFilter = sp.board ?? null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Stage 1 — independent fetches in parallel
  const [boards, totalCountRes, selectedBoard, boardLinksRes] = await Promise.all([
    listBoards(),
    supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    boardFilter ? getBoard(boardFilter) : Promise.resolve(null),
    boardFilter
      ? supabase
          .from('board_ideas')
          .select('idea_id')
          .eq('user_id', user.id)
          .eq('board_id', boardFilter)
      : Promise.resolve({ data: null as { idea_id: string }[] | null }),
  ])
  const totalCount = totalCountRes.count ?? 0
  const ideaIds: string[] | null = boardFilter
    ? (boardLinksRes.data ?? []).map((l) => l.idea_id)
    : null

  // Status counts: if board is selected, filter to board ideas; else all user ideas
  let scopedStatusRows: { status: string }[] = []
  if (boardFilter) {
    if (ideaIds && ideaIds.length > 0) {
      const { data } = await supabase
        .from('ideas')
        .select('status')
        .eq('user_id', user.id)
        .in('id', ideaIds)
      scopedStatusRows = (data ?? []) as { status: string }[]
    }
  } else {
    const { data } = await supabase
      .from('ideas')
      .select('status')
      .eq('user_id', user.id)
    scopedStatusRows = (data ?? []) as { status: string }[]
  }

  const counts: Record<IdeaStatus | 'all', number> = {
    idea: 0,
    in_progress: 0,
    recreated: 0,
    archived: 0,
    all: scopedStatusRows.length,
  }
  for (const i of scopedStatusRows) {
    counts[i.status as IdeaStatus] = (counts[i.status as IdeaStatus] ?? 0) + 1
  }

  let ideaQ = supabase
    .from('ideas')
    .select(
      'id, title, source_url, thumbnail_url, notes, status, saved_at, video_id',
    )
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
    .limit(view === 'kanban' ? 200 : 60)
  if (filter !== 'all') ideaQ = ideaQ.eq('status', filter)
  if (ideaIds !== null) {
    if (ideaIds.length === 0) {
      // Empty board → no results
      ideaQ = ideaQ.eq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      ideaQ = ideaQ.in('id', ideaIds)
    }
  }
  const { data: ideas } = await ideaQ

  // Stage 3 — videos query + board memberships in parallel
  const videoIds = (ideas ?? []).map((i) => i.video_id).filter(Boolean) as string[]
  const visibleIdeaIds = (ideas ?? []).map((i) => i.id)
  const [videosRes, boardLinksHydrateRes] = await Promise.all([
    videoIds.length > 0
      ? supabase
          .from('videos')
          .select('id, outlier_score, view_count, channel_id')
          .in('id', videoIds)
      : Promise.resolve({ data: [] as { id: string; outlier_score: number | null; view_count: number | null; channel_id: string }[] }),
    visibleIdeaIds.length > 0 && boards.length > 0
      ? supabase
          .from('board_ideas')
          .select('idea_id, board_id')
          .eq('user_id', user.id)
          .in('idea_id', visibleIdeaIds)
      : Promise.resolve({ data: [] as { idea_id: string; board_id: string }[] }),
  ])

  const videoMap = new Map<string, IdeaCard['video']>()
  if (videosRes.data && videosRes.data.length > 0) {
    const channelIds = Array.from(new Set(videosRes.data.map((v) => v.channel_id)))
    const { data: channels } = await supabase
      .from('channels')
      .select('id, title, handle')
      .in('id', channelIds)

    const channelMap = new Map((channels ?? []).map((c) => [c.id, c]))
    for (const v of videosRes.data) {
      const ch = channelMap.get(v.channel_id)
      videoMap.set(v.id, {
        id: v.id,
        outlier_score: v.outlier_score,
        view_count: v.view_count,
        channel_handle: ch?.handle ?? null,
        channel_title: ch?.title ?? '',
      })
    }
  }

  // Hydrate board memberships
  const boardMembershipMap: Record<string, { id: string; name: string; color: string; icon: string | null }[]> = {}
  if (boardLinksHydrateRes.data && boardLinksHydrateRes.data.length > 0) {
    const boardLookup = new Map(boards.map((b) => [b.id, b]))
    for (const l of boardLinksHydrateRes.data) {
      const b = boardLookup.get(l.board_id)
      if (!b) continue
      const arr = boardMembershipMap[l.idea_id] ?? []
      arr.push({
        id: b.id,
        name: b.name,
        color: isBoardColor(b.color) ? b.color : 'slate',
        icon: b.icon,
      })
      boardMembershipMap[l.idea_id] = arr
    }
  }

  const cards: IdeaCard[] = (ideas ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    source_url: i.source_url,
    thumbnail_url: i.thumbnail_url,
    notes: i.notes,
    status: i.status,
    saved_at: i.saved_at,
    video: i.video_id ? videoMap.get(i.video_id) ?? null : null,
    boards: boardMembershipMap[i.id] ?? [],
  }))

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-serif-display text-3xl text-foreground leading-tight">
          {selectedBoard ? (
            <>
              {selectedBoard.icon && (
                <span className="mr-2">{selectedBoard.icon}</span>
              )}
              {selectedBoard.name}
            </>
          ) : (
            <>
              Your <span className="font-serif-italic">garden</span> of ideas
            </>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedBoard
            ? `Board · ${cards.length} ideas`
            : 'Saved videos รอ recreate ในเสียงคุณ'}
        </p>
      </div>

      <div className="flex gap-6">
        <BoardSidebar boards={boards} totalCount={totalCount} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            {view === 'list' ? (
              <IdeaStatusFilter counts={counts} />
            ) : (
              <div className="text-xs text-muted-foreground">
                Kanban — ลาก card เปลี่ยน status ได้
              </div>
            )}
            <ViewModeToggle current={view} />
          </div>

          {cards.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title={
                boardFilter
                  ? 'Board นี้ยังไม่มี idea'
                  : filter === 'idea'
                    ? 'ยังไม่ได้บันทึก idea'
                    : 'ไม่มี idea ในสถานะนี้'
              }
              description={
                boardFilter
                  ? 'ไป Discover แล้ว save idea, แล้ว Add to board'
                  : 'ไป Discover แล้วกด Save ที่ video ที่อยากเก็บไว้'
              }
              action={
                filter === 'idea' && !boardFilter ? (
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
                  >
                    <Plus size={14} />
                    ไป Discover
                  </Link>
                ) : undefined
              }
            />
          ) : view === 'kanban' ? (
            <IdeasKanbanView cards={cards} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cards.map((c) => (
                <IdeaCardItem key={c.id} idea={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
