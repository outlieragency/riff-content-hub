'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'
import { addChannel, type SyncMode } from './add-channel'

export type ChannelPreview = {
  youtube_channel_id: string
  handle: string | null
  title: string
  description: string | null
  thumbnail_url: string | null
  subscriber_count: number | null
  total_video_count: number | null
}

/** Resolve channel metadata from URL — used in onboarding confirmation step. */
export async function previewChannelFromUrl(
  url: string,
): Promise<{ ok: true; channel: ChannelPreview } | { ok: false; error: string }> {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false, error: 'ใส่ URL ก่อน' }

  try {
    const ch = await worker.previewChannel({ url: trimmed })
    return { ok: true, channel: ch as ChannelPreview }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'preview channel failed',
    }
  }
}

export type ChannelSearchHit = {
  youtube_channel_id: string
  handle: string | null
  title: string
  thumbnail_url: string | null
  subscriber_count: number | null
}

/** Search YouTube for channels matching a handle/name (Eden-style dropdown). */
export async function searchChannelsByHandle(
  query: string,
): Promise<{ ok: true; hits: ChannelSearchHit[] } | { ok: false; error: string }> {
  const trimmed = query.trim().replace(/^@/, '')
  if (!trimmed) return { ok: true, hits: [] }
  if (trimmed.length < 2) return { ok: true, hits: [] }

  try {
    const res = await worker.searchChannels({
      query: trimmed,
      max_results: 6,
    })
    return { ok: true, hits: res.hits as ChannelSearchHit[] }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'search channels failed',
    }
  }
}

/** Mark user as onboarded + save interests. Channels are added via existing
 * addChannel action in the onboarding flow before this is called. */
export async function completeOnboarding(input: {
  interests: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      interests: input.interests,
      onboarded_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) return { ok: false, error: error.message }
  revalidatePath('/today')
  revalidatePath('/discover')
  return { ok: true }
}

/** Sync a channel after onboarding confirms it. Wraps existing addChannel. */
export async function addChannelFromOnboarding(
  url: string,
): Promise<
  | { ok: true; channel_uuid: string; videos_synced: number }
  | { ok: false; error: string }
> {
  const fd = new FormData()
  fd.append('url', url)
  fd.append('mode', 'top_viewed' satisfies SyncMode)
  const res = await addChannel(fd)
  return res
}

export async function getOnboardingStatus(): Promise<{
  onboardedAt: string | null
  interests: string[]
  hasChannels: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { onboardedAt: null, interests: [], hasChannels: false }

  const [{ data: settings }, { count }] = await Promise.all([
    supabase
      .from('user_settings')
      .select('onboarded_at, interests')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('channels')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  return {
    onboardedAt: settings?.onboarded_at ?? null,
    interests: (settings?.interests ?? []) as string[],
    hasChannels: (count ?? 0) > 0,
  }
}
