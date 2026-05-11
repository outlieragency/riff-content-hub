'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'

export type TrackCreatorResult =
  | { ok: true; channel_uuid: string; videos_synced: number; niches: string[] }
  | { ok: false; error: string }

/**
 * Sync a creator into the user's tracked channels by handle.
 *
 * Used by the "Suggested creators in [niche]" row on /discover —
 * click a `+ Track` chip → worker resolves the channel → videos sync
 * → page revalidates and the new videos appear in the feed.
 */
export async function trackCreator(
  handle: string,
): Promise<TrackCreatorResult> {
  const clean = handle.trim().replace(/^@+/, '')
  if (!clean) return { ok: false, error: 'handle ว่างเปล่า' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  try {
    const out = await worker.syncChannel({
      user_id: user.id,
      ref_kind: 'handle',
      ref_value: clean,
      mode: 'top_viewed',
    })
    revalidatePath('/discover')
    revalidatePath('/channels')
    return {
      ok: true,
      channel_uuid: out.channel_uuid,
      videos_synced: out.videos_synced,
      niches: out.niches ?? [],
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sync ไม่สำเร็จ'
    return { ok: false, error: msg }
  }
}
