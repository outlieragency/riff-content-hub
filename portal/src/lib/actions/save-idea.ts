'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function toggleSaveIdea(videoId: string): Promise<{ ok: boolean; saved: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Pull video data ที่ต้องใช้ denormalize ลง ideas
  const { data: video, error: videoErr } = await supabase
    .from('videos')
    .select('id, title, youtube_video_id, thumbnail_url')
    .eq('id', videoId)
    .single()

  if (videoErr || !video) {
    return { ok: false, saved: false, error: 'หา video นี้ไม่เจอ' }
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('ideas')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Toggle: archive
    await supabase.from('ideas').delete().eq('id', existing.id)
    revalidatePath('/outliers')
    revalidatePath('/ideas')
    return { ok: true, saved: false }
  }

  // Insert
  const { error: insertErr } = await supabase.from('ideas').insert({
    user_id: user.id,
    video_id: video.id,
    title: video.title,
    source_url: `https://youtube.com/watch?v=${video.youtube_video_id}`,
    thumbnail_url: video.thumbnail_url,
    status: 'idea',
  })
  if (insertErr) {
    return { ok: false, saved: false, error: insertErr.message }
  }

  revalidatePath('/outliers')
  revalidatePath('/ideas')
  return { ok: true, saved: true }
}
