'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseYouTubeChannelUrl } from '@/lib/youtube/parse-url'
import { worker } from '@/lib/worker'

export type SyncMode = 'top_viewed' | 'recent' | 'hybrid'

export type AddChannelResult =
  | { ok: true; channel_uuid: string; videos_synced: number }
  | { ok: false; error: string }

function _normalizeMode(raw: unknown): SyncMode {
  return raw === 'recent' || raw === 'hybrid' ? raw : 'top_viewed'
}

export async function addChannel(formData: FormData): Promise<AddChannelResult> {
  const url = String(formData.get('url') ?? '').trim()
  const mode = _normalizeMode(formData.get('mode'))

  const ref = parseYouTubeChannelUrl(url)
  if (!ref) {
    return { ok: false, error: 'รูปแบบ URL ไม่ถูกต้อง ลองวาง URL ของช่อง YouTube' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  try {
    const out = await worker.syncChannel({
      user_id: user.id,
      ref_kind: ref.kind,
      ref_value: ref.value,
      mode,
    })
    revalidatePath('/channels')
    revalidatePath('/outliers')
    return { ok: true, channel_uuid: out.channel_uuid, videos_synced: out.videos_synced }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ไม่สามารถเชื่อมต่อ worker ได้'
    return { ok: false, error: msg }
  }
}

export async function resyncChannel(
  channelUuid: string,
  mode: SyncMode = 'top_viewed',
): Promise<AddChannelResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: channel, error } = await supabase
    .from('channels')
    .select('youtube_channel_id')
    .eq('id', channelUuid)
    .single()

  if (error || !channel) {
    return { ok: false, error: 'หา channel นี้ไม่เจอ' }
  }

  try {
    const out = await worker.syncChannel({
      user_id: user.id,
      ref_kind: 'channel_id',
      ref_value: channel.youtube_channel_id,
      mode,
    })
    revalidatePath('/channels')
    revalidatePath('/outliers')
    return { ok: true, channel_uuid: out.channel_uuid, videos_synced: out.videos_synced }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sync ล้มเหลว'
    return { ok: false, error: msg }
  }
}
