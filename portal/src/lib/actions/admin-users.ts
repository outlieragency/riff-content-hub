'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isFounderEmail } from '@/lib/auth/founder'

export type AllowedEmailRow = {
  email: string
  granted_at: string
  granted_by: string | null
  notes: string | null
  expires_at: string | null
  plan: string | null
  stripe_customer_id: string | null
}

async function requireFounder(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email || !isFounderEmail(user.email)) {
    return { ok: false, error: 'forbidden' }
  }
  return { ok: true }
}

export async function listAllowedEmails(): Promise<AllowedEmailRow[]> {
  const gate = await requireFounder()
  if (!gate.ok) return []

  const svc = createServiceClient()
  const { data } = await svc
    .from('allowed_emails')
    .select('email, granted_at, granted_by, notes, expires_at, plan, stripe_customer_id')
    .order('granted_at', { ascending: false })
  return (data ?? []) as AllowedEmailRow[]
}

export async function inviteUser(input: {
  email: string
  plan?: string
  trialDays?: number
  notes?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireFounder()
  if (!gate.ok) return gate

  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'อีเมลไม่ถูกต้อง' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const grantedBy = user?.email ?? 'system'

  const expires_at =
    input.trialDays && input.trialDays > 0
      ? new Date(Date.now() + input.trialDays * 24 * 60 * 60 * 1000).toISOString()
      : null

  const svc = createServiceClient()
  const { error } = await svc.from('allowed_emails').upsert(
    {
      email,
      granted_by: grantedBy,
      plan: input.plan?.trim() || null,
      notes: input.notes?.trim() || null,
      expires_at,
    },
    { onConflict: 'email' },
  )

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function revokeUser(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireFounder()
  if (!gate.ok) return gate

  const target = email.trim().toLowerCase()
  if (!target) return { ok: false, error: 'missing email' }

  // Don't let founder revoke their own account by accident
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email?.toLowerCase() === target) {
    return { ok: false, error: 'ห้ามถอนสิทธิ์ของตัวเอง' }
  }

  const svc = createServiceClient()
  const { error } = await svc.from('allowed_emails').delete().eq('email', target)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function extendUser(
  email: string,
  trialDays: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireFounder()
  if (!gate.ok) return gate

  const target = email.trim().toLowerCase()
  if (!target || trialDays <= 0)
    return { ok: false, error: 'invalid input' }

  const newExpiry = new Date(
    Date.now() + trialDays * 24 * 60 * 60 * 1000,
  ).toISOString()

  const svc = createServiceClient()
  const { error } = await svc
    .from('allowed_emails')
    .update({ expires_at: newExpiry })
    .eq('email', target)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

/** Promote to permanent (unset expires_at) */
export async function makePermanent(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireFounder()
  if (!gate.ok) return gate

  const target = email.trim().toLowerCase()
  if (!target) return { ok: false, error: 'missing email' }

  const svc = createServiceClient()
  const { error } = await svc
    .from('allowed_emails')
    .update({ expires_at: null })
    .eq('email', target)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}
