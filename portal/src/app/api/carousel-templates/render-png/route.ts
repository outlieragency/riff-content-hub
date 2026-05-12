import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/carousel-templates/render-png
 *
 * Proxy to worker /carousel-templates/render-png. Streams the PNG
 * straight back to the browser so the user can download it.
 */
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('unauthenticated', { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('invalid JSON', { status: 400 })
  }

  const WORKER_URL = process.env.WORKER_URL
  const WORKER_SECRET = process.env.WORKER_SECRET
  if (!WORKER_URL || !WORKER_SECRET) {
    return new Response('worker not configured', { status: 500 })
  }

  const res = await fetch(`${WORKER_URL}/carousel-templates/render-png`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WORKER_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || `worker ${res.status}`, {
      status: res.status,
    })
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="slide.png"',
    },
  })
}
