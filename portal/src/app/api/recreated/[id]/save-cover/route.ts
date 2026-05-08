/**
 * POST /api/recreated/[id]/save-cover
 *
 * Re-render cover with edited fields, upload to Supabase Storage,
 * persist updated `output.cover` + `output.cover_url` to recreated_drafts.
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

  const { data: draft } = await supabase
    .from('recreated_drafts')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!draft) {
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

  try {
    const result = await worker.saveCover({
      user_id: user.id,
      draft_id: id,
      cover: body.cover,
      video_meta: body.video_meta,
    })
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'save failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
