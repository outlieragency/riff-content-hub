import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

/**
 * POST /api/cover/clean-source — run fal.ai text-removal over the
 * current cover photo source (override OR YouTube thumbnail) and
 * write the cleaned result back as the override.
 *
 * Body: { draft_id: string }
 *
 * Calls the long-running worker route — keep maxDuration high.
 */
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { draft_id?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const draftId = typeof body.draft_id === 'string' ? body.draft_id : ''
  if (!draftId) {
    return NextResponse.json(
      { error: 'draft_id required' },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(`${WORKER_URL}/cover/clean-source`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: user.id, draft_id: draftId }),
    })
    const responseBody = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        {
          error: responseBody.detail ?? `worker ${res.status}`,
          // 412 = FAL_API_KEY not set — UI surfaces this differently
          status: res.status,
        },
        { status: res.status },
      )
    }
    return NextResponse.json(responseBody)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'worker call failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
