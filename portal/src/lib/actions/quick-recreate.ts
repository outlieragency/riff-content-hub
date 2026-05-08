'use server'

import { createClient } from '@/lib/supabase/server'

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

export type QuickInitResult =
  | { ok: true; ideaId: string; transcriptJobId: string; deduplicated: boolean }
  | { ok: false; error: string }

export async function quickInitFromUrl(url: string): Promise<QuickInitResult> {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false, error: 'ใส่ URL หรือ video ID ก่อน' }

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
      body: JSON.stringify({ user_id: user.id, url: trimmed }),
      cache: 'no-store',
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.detail || data.error || `worker ${res.status}` }
    }
    return {
      ok: true,
      ideaId: data.idea_id,
      transcriptJobId: data.transcript_job_id,
      deduplicated: !!data.deduplicated,
    }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'request failed' }
  }
}
