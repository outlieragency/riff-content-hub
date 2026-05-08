/**
 * POST /api/recreated/[id]/preview-cover
 *
 * Auth via Supabase session, verify owner, then proxy cover fields to worker
 * /cover/preview which returns base64 PNG. Used by the FB editor for live preview.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { worker, type CoverFieldsPayload, type VideoMetaPayload } from '@/lib/worker'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Verify the draft belongs to this user
  const { data: draft, error: draftErr } = await supabase
    .from('recreated_drafts')
    .select('id, idea_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (draftErr || !draft) {
    return NextResponse.json({ error: 'draft not found' }, { status: 404 })
  }

  let body: { cover: CoverFieldsPayload; video_meta?: VideoMetaPayload }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!body.cover) {
    return NextResponse.json({ error: 'missing cover' }, { status: 400 })
  }

  // Auto-populate video_meta from DB if not provided (so portal doesn't need to know it)
  let videoMeta = body.video_meta
  if (!videoMeta) {
    const { data: idea } = await supabase
      .from('ideas')
      .select('video_id')
      .eq('id', draft.idea_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (idea?.video_id) {
      const { data: video } = await supabase
        .from('videos')
        .select('youtube_video_id, thumbnail_url, channel_id')
        .eq('id', idea.video_id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (video) {
        let chMeta: { title?: string; thumbnail_url?: string; subscriber_count?: number } = {}
        if (video.channel_id) {
          const { data: ch } = await supabase
            .from('channels')
            .select('title, thumbnail_url, subscriber_count')
            .eq('id', video.channel_id)
            .eq('user_id', user.id)
            .maybeSingle()
          if (ch) chMeta = ch
        }
        videoMeta = {
          youtube_video_id: video.youtube_video_id,
          thumbnail_url: video.thumbnail_url,
          channel_name: chMeta.title,
          channel_avatar_url: chMeta.thumbnail_url,
          subscriber_count: chMeta.subscriber_count,
        }
      }
    }
  }

  try {
    const result = await worker.previewCover({ cover: body.cover, video_meta: videoMeta })
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'preview failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
