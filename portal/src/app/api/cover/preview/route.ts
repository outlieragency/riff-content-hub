import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  worker,
  type CoverFieldsPayload,
  type VideoMetaPayload,
} from '@/lib/worker'

/**
 * POST /api/cover/preview — re-render cover with edited fields.
 *
 * Body: { cover: CoverFieldsPayload, video_meta?, draft_id? }
 *
 * Returns base64 data URI from worker. Used by the live editor —
 * called on debounced text changes so user sees keystroke-level updates.
 */
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: {
    cover?: CoverFieldsPayload
    video_meta?: VideoMetaPayload
    draft_id?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  if (!body.cover) {
    return NextResponse.json({ error: 'cover is required' }, { status: 400 })
  }

  try {
    const result = await worker.previewCover({
      cover: body.cover,
      video_meta: body.video_meta,
      draft_id: body.draft_id,
      user_id: user.id,
    })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'worker error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
