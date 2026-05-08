/**
 * POST /api/recreated/[id]/status   {status: 'queued'|'generating'|'ready'|'edited'|'published'|'error'}
 *
 * Update draft.status. Used by "Mark as Posted" button.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = new Set([
  'queued',
  'generating',
  'ready',
  'edited',
  'published',
  'error',
])

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

  let body: { status: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!ALLOWED.has(body.status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const { error } = await supabase
    .from('recreated_drafts')
    .update({ status: body.status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: body.status })
}
