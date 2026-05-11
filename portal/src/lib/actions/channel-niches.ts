'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SetNichesResult = { ok: true } | { ok: false; error: string }

/** Persist niches array on a channel row (owner-checked). */
export async function setChannelNiches(
  channelId: string,
  niches: string[],
): Promise<SetNichesResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Dedupe + trim + drop empties. Free-form text in DB but keep it tidy.
  const clean = Array.from(
    new Set(
      niches
        .map((n) => (typeof n === 'string' ? n.trim().toLowerCase() : ''))
        .filter(Boolean),
    ),
  )

  const { error } = await supabase
    .from('channels')
    .update({ niches: clean })
    .eq('id', channelId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/channels/${channelId}`)
  revalidatePath('/channels')
  revalidatePath('/discover')
  return { ok: true }
}
