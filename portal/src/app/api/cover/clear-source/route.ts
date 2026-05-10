import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

/**
 * DELETE /api/cover/clear-source?draft_id=<uuid>
 * Removes the cover-photo.png override; editor calls /preview after to
 * repaint with the YouTube thumbnail.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const draftId = new URL(request.url).searchParams.get('draft_id')
  if (!draftId) {
    return NextResponse.json({ error: 'draft_id required' }, { status: 400 })
  }

  const params = new URLSearchParams({ user_id: user.id, draft_id: draftId })
  const res = await fetch(
    `${WORKER_URL}/cover/clear-source?${params.toString()}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${WORKER_SECRET}` },
    },
  )
  const body = await res.json().catch(() => ({}))
  return NextResponse.json(body, { status: res.status })
}
