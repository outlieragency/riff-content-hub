'use server'

import { createServiceClient } from '@/lib/supabase/service'

export type JoinWaitlistResult =
  | { ok: true }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function joinWaitlist(input: {
  email: string
  name?: string
  source?: string
  referrer?: string
}): Promise<JoinWaitlistResult> {
  const email = (input.email ?? '').trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'อีเมลไม่ถูกต้อง' }
  }

  // Use service-role client to bypass anon RLS limits + handle unique-violation gracefully
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'service unavailable',
    }
  }

  const { error } = await supabase.from('waitlist').insert({
    email,
    name: input.name?.trim() || null,
    source: input.source?.trim() || null,
    referrer: input.referrer?.trim() || null,
  })

  if (error) {
    // Unique violation = email already on waitlist; treat as success (no leak about whether email is registered)
    if (error.code === '23505') {
      return { ok: true }
    }
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

/** Public count — used to show "N creators waiting" on landing. */
export async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}
