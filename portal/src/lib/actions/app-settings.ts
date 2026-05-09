'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isFounderEmail } from '@/lib/auth/founder'

export type TutorialVideo = {
  url: string | null
  title: string | null
}

export async function getTutorialVideo(): Promise<TutorialVideo> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'tutorial_video')
      .maybeSingle()
    const v = (data?.value ?? {}) as Partial<TutorialVideo>
    return { url: v.url ?? null, title: v.title ?? null }
  } catch {
    return { url: null, title: null }
  }
}

export async function setTutorialVideo(input: {
  url: string
  title?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Founder gate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isFounderEmail(user?.email)) {
    return { ok: false, error: 'forbidden' }
  }

  const url = input.url.trim()
  if (url && !/^https?:\/\//.test(url)) {
    return { ok: false, error: 'URL ต้องขึ้นต้นด้วย http:// หรือ https://' }
  }

  const svc = createServiceClient()
  const { error } = await svc
    .from('app_settings')
    .upsert(
      {
        key: 'tutorial_video',
        value: { url: url || null, title: input.title?.trim() || null },
        updated_at: new Date().toISOString(),
        updated_by: user?.email ?? null,
      },
      { onConflict: 'key' },
    )

  if (error) return { ok: false, error: error.message }
  revalidatePath('/today')
  revalidatePath('/admin/settings')
  return { ok: true }
}
