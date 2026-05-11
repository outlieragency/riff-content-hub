import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFounderEmail } from '@/lib/auth/founder'

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

/**
 * POST /api/admin/sync-curated-pool — trigger worker to sync the
 * curated creator catalog into shared_channels + shared_videos.
 *
 * Founder-only (Earth). Long-running — worker iterates ~25 channels,
 * each does a YouTube Data API + Shorts probe + outlier compute. The
 * route stays open for the duration and forwards the worker's summary
 * to the caller. Vercel maxDuration is bumped accordingly.
 */
export const maxDuration = 300

export async function POST(_request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  if (!isFounderEmail(user.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const res = await fetch(`${WORKER_URL}/internal/sync-curated-pool`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_limit: 30 }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: body.detail ?? `worker ${res.status}` },
        { status: res.status },
      )
    }
    return NextResponse.json(body)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'worker call failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
