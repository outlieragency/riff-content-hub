import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  worker,
  type CoverFieldsPayload,
  type VideoMetaPayload,
} from '@/lib/worker'

/**
 * POST /api/cover/preview-html — render the Jinja2 cover template to
 * HTML (no screenshot). Used by the iframe live-preview so the editor
 * shows EXACTLY the HTML/CSS that Playwright would screenshot on save.
 *
 * Same input shape as /api/cover/preview but returns html instead of
 * a base64 PNG.
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
    const result = await worker.previewCoverHtml({
      cover: body.cover,
      video_meta: body.video_meta,
      draft_id: body.draft_id,
      user_id: user.id,
    })
    // Return HTML inside a JSON envelope so the client can read it
    // alongside any future metadata (errors, warnings, render time).
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'worker error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
