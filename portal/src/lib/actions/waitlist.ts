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

export type SurveyInput = {
  email: string
  name?: string
  niche?: string
  primary_platforms?: string[]
  follower_range?: string
  posting_frequency?: string
  pain?: string
  contact_handle?: string
}

/**
 * Save onboarding survey for an existing waitlist row.
 * Called from /waitlist/thanks after the user fills out the form.
 * Upserts so survey isn't lost if user lands on the page directly.
 */
export async function saveOnboardingSurvey(
  input: SurveyInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = (input.email ?? '').trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'อีเมลไม่ถูกต้อง' }
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'service unavailable',
    }
  }

  const { error } = await supabase.from('waitlist').upsert(
    {
      email,
      name: input.name?.trim() || null,
      niche: input.niche?.trim() || null,
      primary_platforms: input.primary_platforms ?? null,
      follower_range: input.follower_range || null,
      posting_frequency: input.posting_frequency || null,
      pain: input.pain?.trim() || null,
      contact_handle: input.contact_handle?.trim() || null,
      survey_completed_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Founder-only: list all waitlist signups for admin view */
export async function listWaitlistEntries() {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('waitlist')
      .select(
        'id, email, name, source, niche, primary_platforms, follower_range, posting_frequency, pain, contact_handle, joined_at, survey_completed_at',
      )
      .order('joined_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}
