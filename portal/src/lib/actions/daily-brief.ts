'use server'

import { createClient } from '@/lib/supabase/server'

export type BriefVideo = {
  id: string
  youtube_video_id: string
  title: string
  thumbnail_url: string | null
  view_count: number | null
  outlier_score: number | null
  duration_seconds: number | null
  published_at: string | null
  channel_id: string
  channel_title: string
  channel_handle: string | null
}

/**
 * Daily Brief — top unsaved outliers across the user's tracked channels.
 *
 * Filter:
 *   - Long-form videos only (no shorts)
 *   - Outlier score >= 2.0 (above channel avg)
 *   - Not already saved as idea
 *   - Published within lookback_days
 * Order:
 *   - Outlier score DESC (biggest spike first)
 * Limit: default 5 (a manageable morning queue, not overwhelming)
 */
export async function getDailyBrief(
  options?: { limit?: number; lookbackDays?: number },
): Promise<BriefVideo[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const limit = options?.limit ?? 5
  const lookbackDays = options?.lookbackDays ?? 30
  const cutoff = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString()

  // Fetch user's existing ideas to filter out already-saved videos
  const [{ data: ideaRows }, { data: videos }] = await Promise.all([
    supabase
      .from('ideas')
      .select('video_id')
      .eq('user_id', user.id),
    supabase
      .from('videos')
      .select(
        'id, youtube_video_id, title, thumbnail_url, view_count, outlier_score, duration_seconds, published_at, channel_id',
      )
      .eq('user_id', user.id)
      .eq('is_short', false)
      .gte('outlier_score', 2)
      .gte('published_at', cutoff)
      .order('outlier_score', { ascending: false, nullsFirst: false })
      .limit(limit * 4), // fetch extra so we can filter saved ones
  ])

  if (!videos || videos.length === 0) return []

  const savedSet = new Set(
    (ideaRows ?? []).map((r) => r.video_id).filter(Boolean) as string[],
  )

  const unsaved = videos.filter((v) => !savedSet.has(v.id)).slice(0, limit)

  if (unsaved.length === 0) return []

  // Hydrate channel info
  const channelIds = Array.from(new Set(unsaved.map((v) => v.channel_id)))
  const { data: channels } = await supabase
    .from('channels')
    .select('id, title, handle')
    .in('id', channelIds)
  const channelMap = new Map((channels ?? []).map((c) => [c.id, c]))

  return unsaved.map((v) => {
    const ch = channelMap.get(v.channel_id)
    return {
      id: v.id,
      youtube_video_id: v.youtube_video_id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      view_count: v.view_count,
      outlier_score: v.outlier_score,
      duration_seconds: v.duration_seconds,
      published_at: v.published_at,
      channel_id: v.channel_id,
      channel_title: ch?.title ?? '',
      channel_handle: ch?.handle ?? null,
    }
  })
}

/**
 * This-week posting count (Monday-Sunday).
 * Returns { posted: 5, target: 7 } where target is configurable.
 */
export async function getWeeklyPostingStats(): Promise<{
  posted: number
  target: number
  postedToday: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { posted: 0, target: 7, postedToday: false }

  const now = new Date()
  const day = now.getDay()
  const diff = (day + 6) % 7 // Monday = 0
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('recreated_drafts')
    .select('updated_at')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .gte('updated_at', monday.toISOString())

  const days = new Set<string>()
  let postedToday = false
  for (const d of data ?? []) {
    const date = new Date(d.updated_at)
    days.add(date.toDateString())
    if (date >= todayStart) postedToday = true
  }

  return {
    posted: days.size,
    target: 7,
    postedToday,
  }
}
