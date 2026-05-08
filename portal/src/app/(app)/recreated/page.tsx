import Link from 'next/link'
import { Lightbulb, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { RecreatedGrid } from '@/components/recreate/recreated-grid'
import type { RecreatedCardData } from '@/components/recreate/recreated-card'
import type { RecreateFormat } from '@/lib/types/recreate-formats'

export const dynamic = 'force-dynamic'

type DraftRow = {
  id: string
  format: string
  status: string
  title: string | null
  output: { cover_url?: string } | null
  idea_id: string
  updated_at: string
  error: string | null
}

type IdeaRow = {
  id: string
  video_id: string | null
  videos:
    | {
        id: string
        title: string | null
        channels: { title: string | null } | null
      }
    | null
}

export default async function RecreatedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Fetch drafts
  const { data: draftsRaw } = await supabase
    .from('recreated_drafts')
    .select('id, format, status, title, output, idea_id, updated_at, error')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(120)

  const drafts = (draftsRaw ?? []) as DraftRow[]

  // 2. Resolve channel + source video title via ideas → videos → channels
  const ideaIds = Array.from(new Set(drafts.map((d) => d.idea_id).filter(Boolean)))
  let ideaMap = new Map<
    string,
    { channel_title: string | null; source_video_title: string | null }
  >()
  if (ideaIds.length > 0) {
    const { data: ideasRaw } = await supabase
      .from('ideas')
      .select('id, video_id, videos(id, title, channels(title))')
      .eq('user_id', user.id)
      .in('id', ideaIds)
    const ideas = (ideasRaw ?? []) as unknown as IdeaRow[]
    ideaMap = new Map(
      ideas.map((i) => [
        i.id,
        {
          channel_title: i.videos?.channels?.title ?? null,
          source_video_title: i.videos?.title ?? null,
        },
      ]),
    )
  }

  const items: RecreatedCardData[] = drafts.map((d) => {
    const join = ideaMap.get(d.idea_id) ?? {
      channel_title: null,
      source_video_title: null,
    }
    return {
      id: d.id,
      format: d.format as RecreateFormat,
      status: d.status,
      title: d.title,
      cover_url: d.output?.cover_url ?? null,
      channel_title: join.channel_title,
      source_video_title: join.source_video_title,
      updated_at: d.updated_at,
      error: d.error,
    }
  })

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <PageHeader
        title="Recreated"
        description="Content ที่ AI generate เสร็จแล้ว พร้อมแก้ + เอาไปใช้"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Pencil}
          title="ยังไม่มี draft"
          description="ลอง Quick from URL ด้านบนซ้าย หรือเข้า Ideas page"
          action={
            <Link
              href="/ideas"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
            >
              <Lightbulb size={14} />
              ไปที่ Ideas
            </Link>
          }
        />
      ) : (
        <RecreatedGrid items={items} />
      )}
    </div>
  )
}
