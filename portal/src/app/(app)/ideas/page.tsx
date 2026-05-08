import Link from 'next/link'
import { Lightbulb, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { IdeaCardItem, type IdeaCard } from '@/components/ideas/idea-card'
import { IdeaStatusFilter } from '@/components/ideas/status-filter'
import type { IdeaStatus } from '@/lib/actions/ideas'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ status?: string }>

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const filter = (sp.status as IdeaStatus | 'all' | undefined) ?? 'idea'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: allIdeas } = await supabase
    .from('ideas')
    .select('status')
    .eq('user_id', user.id)

  const counts: Record<IdeaStatus | 'all', number> = {
    idea: 0,
    in_progress: 0,
    recreated: 0,
    archived: 0,
    all: allIdeas?.length ?? 0,
  }
  for (const i of allIdeas ?? []) {
    counts[i.status as IdeaStatus] = (counts[i.status as IdeaStatus] ?? 0) + 1
  }

  let ideaQ = supabase
    .from('ideas')
    .select(
      'id, title, source_url, thumbnail_url, notes, status, saved_at, video_id',
    )
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })
    .limit(60)

  if (filter !== 'all') {
    ideaQ = ideaQ.eq('status', filter)
  }

  const { data: ideas } = await ideaQ

  const videoIds = (ideas ?? []).map((i) => i.video_id).filter(Boolean) as string[]
  let videoMap = new Map<string, IdeaCard['video']>()
  if (videoIds.length > 0) {
    const { data: videos } = await supabase
      .from('videos')
      .select('id, outlier_score, view_count, channel_id')
      .in('id', videoIds)

    const channelIds = Array.from(new Set((videos ?? []).map((v) => v.channel_id)))
    const { data: channels } = await supabase
      .from('channels')
      .select('id, title, handle')
      .in('id', channelIds)

    const channelMap = new Map((channels ?? []).map((c) => [c.id, c]))
    videoMap = new Map(
      (videos ?? []).map((v) => {
        const ch = channelMap.get(v.channel_id)
        return [
          v.id,
          {
            id: v.id,
            outlier_score: v.outlier_score,
            view_count: v.view_count,
            channel_handle: ch?.handle ?? null,
            channel_title: ch?.title ?? '',
          },
        ]
      }),
    )
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
  }))

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-serif-display text-3xl text-foreground leading-tight">
          Your <span className="font-serif-italic">garden</span> of ideas
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Outlier ที่เลือกไว้รอ recreate ในเสียงคุณ
        </p>
      </div>

      <IdeaStatusFilter counts={counts} />

      {cards.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={filter === 'idea' ? 'ยังไม่ได้บันทึก idea' : 'ไม่มี idea ในสถานะนี้'}
          description="ไปที่ Outliers แล้วกด Save ที่ video ที่อยากเก็บไว้"
          action={
            filter === 'idea' ? (
              <Link
                href="/outliers"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                ไปดู Outliers
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((c) => (
            <IdeaCardItem key={c.id} idea={c} />
          ))}
        </div>
      )}
    </div>
  )
}
