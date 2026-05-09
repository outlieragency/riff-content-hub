import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FbArticleViewer } from '@/components/recreate/fb-article-viewer'
import { CarouselViewer } from '@/components/recreate/carousel-viewer'
import { ReelsViewer } from '@/components/recreate/reels-viewer'
import { YtScriptViewer } from '@/components/recreate/yt-script-viewer'
import {
  FORMAT_META,
  type CarouselOutput,
  type FbArticleOutput,
  type RecreateFormat,
  type ReelsOutput,
  type YtScriptOutput,
} from '@/lib/types/recreate-formats'
import { timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function RecreatedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: draft } = await supabase
    .from('recreated_drafts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!draft) notFound()

  const meta = FORMAT_META[draft.format as RecreateFormat]
  const format = draft.format as RecreateFormat

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <Link
        href="/recreated"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} />
        กลับไป Recreated
      </Link>

      <div className="surface-1 rounded-[14px] p-5 mb-4">
        <div className="text-xs text-muted-foreground mb-1">
          {meta?.label ?? draft.format} · {draft.status} · {timeAgo(draft.updated_at)}
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          {draft.title ?? 'Untitled draft'}
        </h1>
      </div>

      {format === 'fb_article' && draft.output ? (
        <FbArticleViewer
          draftId={draft.id}
          output={draft.output as FbArticleOutput}
          status={draft.status}
          creativeStyleId={draft.creative_style_id ?? null}
        />
      ) : format === 'carousel' && draft.output ? (
        <CarouselViewer
          draftId={draft.id}
          output={draft.output as CarouselOutput}
        />
      ) : format === 'reels' && draft.output ? (
        <ReelsViewer output={draft.output as ReelsOutput} />
      ) : format === 'yt_script' && draft.output ? (
        <YtScriptViewer output={draft.output as YtScriptOutput} />
      ) : draft.output_markdown ? (
        <div className="surface-1 rounded-[14px] p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Generated content
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
            {draft.output_markdown}
          </pre>
        </div>
      ) : (
        <div className="surface-1 rounded-[14px] p-5">
          <p className="text-sm text-muted-foreground italic">
            ไม่มี content จะแสดง — draft อาจ corrupt
          </p>
        </div>
      )}
    </div>
  )
}
