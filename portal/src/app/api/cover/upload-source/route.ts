import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

/**
 * POST /api/cover/upload-source — multipart proxy to worker.
 *
 * Form fields:
 *   draft_id: uuid (required)
 *   file: image/png|jpg|webp (required)
 *
 * The worker just persists the file as cover-photo.png override. The
 * editor calls /api/cover/preview right after to repaint with the new
 * source.
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

  const incoming = await request.formData()
  const file = incoming.get('file')
  const draftId = incoming.get('draft_id')
  if (!(file instanceof File) || typeof draftId !== 'string') {
    return NextResponse.json(
      { error: 'file and draft_id required' },
      { status: 400 },
    )
  }

  const fwd = new FormData()
  fwd.append('user_id', user.id)
  fwd.append('draft_id', draftId)
  fwd.append('file', file)

  const res = await fetch(`${WORKER_URL}/cover/upload-source`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WORKER_SECRET}` },
    body: fwd,
  })
  const body = await res.json().catch(() => ({}))
  return NextResponse.json(body, { status: res.status })
}
