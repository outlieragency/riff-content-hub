import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'

/**
 * POST /api/generate — proxy from /generate page → FastAPI worker.
 *
 * Body: { url: string, instruction_extra?: string }
 *
 * Worker call is synchronous and can take 30-60s (transcript fetch +
 * translate + summarize + recreate + cover render). Bumps Next's
 * default 10s server-action timeout — Vercel function maxDuration is
 * declared below.
 */
export const maxDuration = 90 // seconds — Vercel hobby cap is 60, pro 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { url?: unknown; instruction_extra?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }
  const instruction_extra =
    typeof body.instruction_extra === 'string'
      ? body.instruction_extra.trim() || null
      : null

  try {
    const result = await worker.generate({
      user_id: user.id,
      url,
      instruction_extra,
    })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'worker error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
