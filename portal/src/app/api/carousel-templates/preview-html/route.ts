import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'

/**
 * POST /api/carousel-templates/preview-html
 *
 * Render a (Jinja2) carousel template + fields + theme → HTML string.
 * Used by the live-edit iframe — sends per-keystroke (debounced) to
 * see exactly what Playwright would screenshot on Save.
 *
 * Auth: must be logged in. We don't validate the template belongs to
 * the user because the html_template is sent in the request body
 * (already in their local editor state).
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

  let body: {
    html_template?: string
    fields?: Record<string, unknown>
    theme?: Record<string, unknown>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  if (!body.html_template || typeof body.html_template !== 'string') {
    return NextResponse.json(
      { error: 'html_template is required' },
      { status: 400 },
    )
  }

  try {
    const result = await worker.renderCarouselTemplateHtml({
      html_template: body.html_template,
      fields: body.fields ?? {},
      theme: body.theme ?? {},
    })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'worker error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
