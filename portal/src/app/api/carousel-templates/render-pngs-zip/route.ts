import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/carousel-templates/render-pngs-zip
 *
 * Batch render all slides → worker zips them → stream zip to client.
 */
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('unauthenticated', { status: 401 })
  }

  let body: { filename_prefix?: string } & Record<string, unknown>
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

  const res = await fetch(
    `${WORKER_URL}/carousel-templates/render-pngs-zip`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || `worker ${res.status}`, {
      status: res.status,
    })
  }

  const prefix =
    (body.filename_prefix as string | undefined)?.replace(
      /[^a-zA-Z0-9_-]/g,
      '-',
    ) || 'slide'

  return new Response(res.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${prefix}-slides.zip"`,
    },
  })
}
