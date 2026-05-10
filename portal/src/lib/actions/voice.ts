'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  EMPTY_VOICE,
  normalizeVoice,
  type VoiceProfile,
  type VoiceSample,
} from '@/lib/types/voice-profile'
import { worker, type ExtractVoiceSample } from '@/lib/worker'

export type VoiceProfileRow = {
  id: string
  name: string
  voice_profile: VoiceProfile
  updated_at: string
  is_active: boolean
}

export type VoiceProfileSummary = {
  id: string
  name: string
  is_active: boolean
  updated_at: string
}

/**
 * Returns the user's currently active voice profile (or oldest if none active).
 * Creates a default profile on first run.
 */
export async function getActiveVoiceProfile(): Promise<VoiceProfileRow> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Prefer is_active=true; fallback to oldest
  const { data: active } = await supabase
    .from('voice_profiles')
    .select('id, name, voice_profile, updated_at, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (active) {
    return {
      id: active.id,
      name: active.name,
      voice_profile: normalizeVoice(active.voice_profile),
      updated_at: active.updated_at,
      is_active: active.is_active,
    }
  }

  const { data: oldest } = await supabase
    .from('voice_profiles')
    .select('id, name, voice_profile, updated_at, is_active')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (oldest) {
    return {
      id: oldest.id,
      name: oldest.name,
      voice_profile: normalizeVoice(oldest.voice_profile),
      updated_at: oldest.updated_at,
      is_active: oldest.is_active,
    }
  }

  // First-run: create default + active
  const { data: created, error } = await supabase
    .from('voice_profiles')
    .insert({
      user_id: user.id,
      name: 'My voice',
      voice_profile: { ...EMPTY_VOICE },
      is_active: true,
    })
    .select('id, name, voice_profile, updated_at, is_active')
    .single()

  if (error || !created) {
    throw new Error(error?.message ?? 'failed to create voice profile')
  }

  return {
    id: created.id,
    name: created.name,
    voice_profile: normalizeVoice(created.voice_profile),
    updated_at: created.updated_at,
    is_active: created.is_active,
  }
}

/** Backward-compat alias — old code calls this */
export const getOrCreateVoiceProfile = getActiveVoiceProfile

/**
 * List all profiles owned by current user (lightweight — no body).
 * Used in switcher dropdown.
 */
export async function listVoiceProfiles(): Promise<VoiceProfileSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('voice_profiles')
    .select('id, name, is_active, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    is_active: p.is_active,
    updated_at: p.updated_at,
  }))
}

export async function createVoiceProfile(
  name: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'name ห้ามว่าง' }

  const { data, error } = await supabase
    .from('voice_profiles')
    .insert({
      user_id: user.id,
      name: trimmed,
      voice_profile: { ...EMPTY_VOICE },
      is_active: false,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'create failed' }
  }
  revalidatePath('/voice')
  return { ok: true, id: data.id }
}

export async function setActiveVoiceProfile(
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Trigger handles deactivating other profiles atomically
  const { error } = await supabase
    .from('voice_profiles')
    .update({ is_active: true })
    .eq('id', profileId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/voice')
  return { ok: true }
}

export async function deleteVoiceProfile(
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Don't allow deleting if it's the only profile
  const { count } = await supabase
    .from('voice_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) <= 1) {
    return { ok: false, error: 'ลบไม่ได้ — ต้องมี profile อย่างน้อย 1 ตัว' }
  }

  const { error } = await supabase
    .from('voice_profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/voice')
  return { ok: true }
}

export async function updateVoiceProfile(
  profileId: string,
  patch: Partial<VoiceProfile>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read current → merge → write back (avoid race when multiple fields edited)
  const { data: current, error: readErr } = await supabase
    .from('voice_profiles')
    .select('voice_profile')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readErr || !current) {
    return { ok: false, error: 'profile not found' }
  }

  const merged = normalizeVoice({
    ...normalizeVoice(current.voice_profile),
    ...patch,
  })

  const { error } = await supabase
    .from('voice_profiles')
    .update({ voice_profile: merged })
    .eq('id', profileId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/voice')
  return { ok: true }
}

export type ExtractVoiceResult =
  | {
      ok: true
      voice_profile: VoiceProfile
      meta: {
        model: string
        input_tokens: number
        output_tokens: number
        cache_read_input_tokens: number
        cache_hit_ratio: number
        latency_ms: number
      }
    }
  | { ok: false; error: string }

const MIN_SAMPLE_LEN = 20
const MAX_SAMPLES = 20

export async function extractVoiceFromSamples(
  rawSamples: { text: string; type?: string; date?: string }[],
): Promise<ExtractVoiceResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cleaned: ExtractVoiceSample[] = rawSamples
    .map((s) => ({
      text: (s.text ?? '').trim(),
      type: s.type?.trim() || undefined,
      date: s.date?.trim() || undefined,
    }))
    .filter((s) => s.text.length >= MIN_SAMPLE_LEN)
    .slice(0, MAX_SAMPLES)

  if (cleaned.length === 0) {
    return {
      ok: false,
      error: `ใส่ sample อย่างน้อย 1 ชิ้น (ความยาวอย่างน้อย ${MIN_SAMPLE_LEN} ตัวอักษร)`,
    }
  }

  try {
    const res = await worker.extractVoice({
      user_id: user.id,
      samples: cleaned,
    })
    return {
      ok: true,
      voice_profile: normalizeVoice(res.voice_profile),
      meta: {
        model: res.meta.model,
        input_tokens: res.meta.input_tokens,
        output_tokens: res.meta.output_tokens,
        cache_read_input_tokens: res.meta.cache_read_input_tokens,
        cache_hit_ratio: res.meta.cache_hit_ratio,
        latency_ms: res.meta.latency_ms,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown extraction error',
    }
  }
}

export async function applyExtractedVoice(
  profileId: string,
  extracted: VoiceProfile,
  newSamples: VoiceSample[],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: current, error: readErr } = await supabase
    .from('voice_profiles')
    .select('voice_profile, history')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readErr || !current) {
    return { ok: false, error: 'profile not found' }
  }

  const currentProfile = normalizeVoice(current.voice_profile)
  const mergedSamples: VoiceSample[] = [
    ...currentProfile.samples,
    ...newSamples.filter((s) => s.text.trim().length >= MIN_SAMPLE_LEN),
  ].slice(-MAX_SAMPLES)

  const next = normalizeVoice({
    ...extracted,
    samples: mergedSamples,
  })

  const history = Array.isArray(current.history) ? current.history : []
  const newHistory = [
    ...history,
    {
      replaced_at: new Date().toISOString(),
      previous: currentProfile,
    },
  ].slice(-10)

  const { error } = await supabase
    .from('voice_profiles')
    .update({
      voice_profile: next,
      history: newHistory,
    })
    .eq('id', profileId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/voice')
  return { ok: true }
}

export async function renameVoiceProfile(
  profileId: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'name ห้ามว่าง' }

  const { error } = await supabase
    .from('voice_profiles')
    .update({ name: trimmed })
    .eq('id', profileId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/voice')
  return { ok: true }
}
