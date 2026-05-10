/**
 * POST /api/recreated/[id]/push-notion
 *
 * Pushes the FB draft to Outlier Content OS (Notion) via worker.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'

export async function POST(
  _req: Request,
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

  try {
    const result = await worker.pushNotion({
      user_id: user.id,
      draft_id: id,
    })
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'push failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
