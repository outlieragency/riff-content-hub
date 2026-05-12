'use server'

import { createClient } from '@/lib/supabase/server'

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

export type QuickRecreateFormat = 'fb_article' | 'ig_carousel'

export type QuickInitMode = 'save' | 'recreate'

export type QuickInitResult =
  | {
      ok: true
      ideaId: string
      transcriptJobId: string
      deduplicated: boolean
      mode: QuickInitMode
      format: QuickRecreateFormat | null
    }
  | { ok: false; error: string }

export async function quickInitFromUrl(
  url: string,
  options?: { mode?: QuickInitMode; format?: QuickRecreateFormat },
): Promise<QuickInitResult> {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false, error: 'ใส่ URL หรือ video ID ก่อน' }

  const mode: QuickInitMode = options?.mode ?? 'recreate'
  const format: QuickRecreateFormat | null =
    mode === 'save' ? null : options?.format ?? 'fb_article'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  if (!WORKER_URL || !WORKER_SECRET) {
    return { ok: false, error: 'worker not configured' }
  }

  try {
    const res = await fetch(`${WORKER_URL}/ideas/quick-init`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        url: trimmed,
        auto_recreate_format: format,
      }),
      cache: 'no-store',
    })
    // Read as text first — Railway's proxy returns plain text
    // 'Internal Server Error' on 5xx, which crashes res.json().
    const text = await res.text()
    if (!res.ok) {
      let detail = `worker ${res.status}`
      try {
        const err = JSON.parse(text) as { detail?: string; error?: string }
        detail = err.detail || err.error || detail
      } catch {
        const snippet = text.trim().slice(0, 200)
        if (snippet) detail = `${detail}: ${snippet}`
      }
      return { ok: false, error: detail }
    }
    let data: {
      idea_id: string
      transcript_job_id: string
      deduplicated?: boolean
    }
    try {
      data = JSON.parse(text)
    } catch {
      return {
        ok: false,
        error: `worker returned non-JSON: ${text.slice(0, 200)}`,
      }
    }
    return {
      ok: true,
      ideaId: data.idea_id,
      transcriptJobId: data.transcript_job_id,
      deduplicated: !!data.deduplicated,
      mode,
      format,
    }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'request failed' }
  }
}
