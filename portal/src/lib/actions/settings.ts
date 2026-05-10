'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  DEFAULT_TASK_MODELS,
  PROVIDER_META,
  PROVIDER_MODELS,
  isAvailableModel,
  maskApiKey,
  type LanguagePref,
  type ProviderId,
  type ProviderInfo,
  type ProviderStatus,
  type TaskKind,
  type UserSettingsView,
} from '@/lib/types/user-settings'

const PROVIDER_IDS: ProviderId[] = ['anthropic', 'openai', 'google', 'openrouter']

type SettingsRow = {
  user_id: string
  display_name: string | null
  timezone: string
  language: string
  provider_keys_encrypted: Record<string, string> | null
  task_models: Record<string, string> | null
  notion_token_encrypted: string | null
  notion_content_hub_dsid: string | null
  notion_output_tracker_dsid: string | null
}

async function loadOrInitSettingsRow(): Promise<{
  user: { id: string; email: string }
  row: SettingsRow
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('user_settings')
    .select(
      'user_id, display_name, timezone, language, provider_keys_encrypted, task_models, notion_token_encrypted, notion_content_hub_dsid, notion_output_tracker_dsid',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return {
      user: { id: user.id, email: user.email ?? '' },
      row: existing as SettingsRow,
    }
  }

  // First-run insert (auth trigger should have created, but defensive)
  const { data: created, error } = await supabase
    .from('user_settings')
    .insert({ user_id: user.id })
    .select(
      'user_id, display_name, timezone, language, provider_keys_encrypted, task_models, notion_token_encrypted, notion_content_hub_dsid, notion_output_tracker_dsid',
    )
    .single()
  if (error || !created) {
    throw new Error(error?.message ?? 'failed to init user_settings')
  }
  return {
    user: { id: user.id, email: user.email ?? '' },
    row: created as SettingsRow,
  }
}

/**
 * Get user settings view (with masked API keys, never raw).
 * Called by /settings page server-side.
 */
export async function getUserSettings(): Promise<UserSettingsView> {
  const { user, row } = await loadOrInitSettingsRow()

  const taskModelsRaw = row.task_models ?? {}
  const task_models = (Object.fromEntries(
    (Object.keys(DEFAULT_TASK_MODELS) as TaskKind[]).map((t) => [
      t,
      typeof taskModelsRaw[t] === 'string' && taskModelsRaw[t]
        ? taskModelsRaw[t]
        : DEFAULT_TASK_MODELS[t],
    ]),
  ) as unknown) as Record<TaskKind, string>

  // Decrypt provider keys for status check (never sent to client)
  const encryptedMap = row.provider_keys_encrypted ?? {}
  const service = createServiceClient()
  const providers: ProviderInfo[] = await Promise.all(
    PROVIDER_IDS.map(async (id) => {
      const meta = PROVIDER_META[id]
      const encrypted = encryptedMap[id]
      let status: ProviderStatus = 'not_configured'
      let masked: string | null = null
      if (encrypted) {
        const decrypted = await decryptKey(service, encrypted)
        if (decrypted) {
          status = 'configured'
          masked = maskApiKey(decrypted)
        } else {
          status = 'invalid'
        }
      }
      return {
        id,
        name: meta.name,
        description: meta.description,
        available: meta.available,
        status,
        maskedKey: masked,
      }
    }),
  )

  // Notion token mask
  const notionMasked = row.notion_token_encrypted
    ? await decryptKey(service, row.notion_token_encrypted).then((d) =>
        d ? maskApiKey(d) : null,
      )
    : null

  return {
    user_id: user.id,
    email: user.email,
    display_name: row.display_name,
    timezone: row.timezone,
    language: (row.language === 'en' ? 'en' : 'th') as LanguagePref,
    providers,
    task_models,
    notion: {
      configured: !!row.notion_token_encrypted,
      masked_token: notionMasked,
      content_hub_dsid: row.notion_content_hub_dsid,
      output_tracker_dsid: row.notion_output_tracker_dsid,
    },
  }
}

function getEncryptionKey(): string | null {
  const key = process.env.APP_ENCRYPTION_KEY
  if (!key || key.length < 16) return null
  return key
}

async function decryptKey(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  encrypted: string,
): Promise<string | null> {
  const key = getEncryptionKey()
  if (!key) return null
  try {
    const { data, error } = await service.rpc('decrypt_secret', {
      ciphertext: encrypted,
      key,
    })
    if (error) return null
    return typeof data === 'string' ? data : null
  } catch {
    return null
  }
}

async function encryptKey(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  plaintext: string,
): Promise<string | null> {
  const key = getEncryptionKey()
  if (!key) return null
  try {
    const { data, error } = await service.rpc('encrypt_secret', {
      plaintext,
      key,
    })
    if (error) return null
    return typeof data === 'string' ? data : null
  } catch {
    return null
  }
}

// =============================================================
// Profile actions
// =============================================================

export async function updateProfile(input: {
  display_name?: string | null
  timezone?: string
  language?: LanguagePref
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const patch: Record<string, unknown> = {}
  if (input.display_name !== undefined) {
    patch.display_name = input.display_name?.trim() || null
  }
  if (input.timezone !== undefined) {
    patch.timezone = input.timezone.trim() || 'Asia/Bangkok'
  }
  if (input.language !== undefined) {
    patch.language = input.language === 'en' ? 'en' : 'th'
  }
  if (Object.keys(patch).length === 0) return { ok: true }

  const { error } = await supabase
    .from('user_settings')
    .update(patch)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  return { ok: true }
}

// =============================================================
// AI Provider actions
// =============================================================

export async function setProviderApiKey(
  provider: ProviderId,
  apiKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const trimmed = apiKey.trim()
  if (!trimmed) return { ok: false, error: 'API key ห้ามว่าง' }

  if (!PROVIDER_META[provider]?.available && trimmed) {
    return {
      ok: false,
      error: `${provider} ยังไม่พร้อมใช้งาน — coming in next release`,
    }
  }

  const service = createServiceClient()
  const encrypted = await encryptKey(service, trimmed)
  if (!encrypted) {
    return {
      ok: false,
      error:
        'encryption ล้มเหลว — Vercel ยังไม่ได้ตั้ง env var APP_ENCRYPTION_KEY (ดู docs ใน Settings)',
    }
  }

  // Read current → merge → write
  const { data: cur } = await supabase
    .from('user_settings')
    .select('provider_keys_encrypted')
    .eq('user_id', user.id)
    .maybeSingle()
  const current = (cur?.provider_keys_encrypted as Record<string, string>) ?? {}
  const next = { ...current, [provider]: encrypted }

  const { error } = await supabase
    .from('user_settings')
    .update({ provider_keys_encrypted: next })
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  return { ok: true }
}

export async function clearProviderApiKey(
  provider: ProviderId,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: cur } = await supabase
    .from('user_settings')
    .select('provider_keys_encrypted')
    .eq('user_id', user.id)
    .maybeSingle()
  const current = (cur?.provider_keys_encrypted as Record<string, string>) ?? {}
  delete current[provider]

  const { error } = await supabase
    .from('user_settings')
    .update({ provider_keys_encrypted: current })
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

export async function testProviderApiKey(
  provider: ProviderId,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const service = createServiceClient()
  const { data: row } = await supabase
    .from('user_settings')
    .select('provider_keys_encrypted')
    .eq('user_id', user.id)
    .maybeSingle()

  const encrypted = (row?.provider_keys_encrypted as Record<string, string>)?.[provider]
  if (!encrypted) return { ok: false, error: 'ยังไม่ได้ตั้ง API key' }

  const decrypted = await decryptKey(service, encrypted)
  if (!decrypted) return { ok: false, error: 'decrypt fail — key อาจ corrupt' }

  if (provider !== 'anthropic') {
    return {
      ok: false,
      error: `${provider} ยังไม่พร้อมใช้งาน — Phase 1 รองรับ Anthropic เท่านั้น`,
    }
  }

  // Test Anthropic key with a minimal request
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': decrypted,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 8,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      return {
        ok: false,
        error: `Anthropic API ${res.status}: ${errBody?.error?.message ?? res.statusText}`,
      }
    }
    return { ok: true, message: 'Anthropic key ใช้งานได้ ✓' }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'network error',
    }
  }
}

export async function updateTaskModels(
  models: Partial<Record<TaskKind, string>>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const cleaned: Record<string, string> = {}
  for (const [task, model] of Object.entries(models) as [TaskKind, string][]) {
    if (typeof model !== 'string' || !model.trim()) continue
    if (!isAvailableModel(model)) {
      return { ok: false, error: `model ${model} ยังไม่พร้อมใช้งาน` }
    }
    cleaned[task] = model
  }

  // Read current → merge
  const { data: cur } = await supabase
    .from('user_settings')
    .select('task_models')
    .eq('user_id', user.id)
    .maybeSingle()
  const merged = { ...(cur?.task_models ?? {}), ...cleaned }

  const { error } = await supabase
    .from('user_settings')
    .update({ task_models: merged })
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

// =============================================================
// Notion integration
// =============================================================

export async function updateNotionConfig(input: {
  token?: string | null
  content_hub_dsid?: string | null
  output_tracker_dsid?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const patch: Record<string, unknown> = {}
  if (input.token !== undefined) {
    if (input.token === null || input.token.trim() === '') {
      patch.notion_token_encrypted = null
    } else {
      const service = createServiceClient()
      const enc = await encryptKey(service, input.token.trim())
      if (!enc) return { ok: false, error: 'encryption fail' }
      patch.notion_token_encrypted = enc
    }
  }
  if (input.content_hub_dsid !== undefined) {
    patch.notion_content_hub_dsid = input.content_hub_dsid?.trim() || null
  }
  if (input.output_tracker_dsid !== undefined) {
    patch.notion_output_tracker_dsid = input.output_tracker_dsid?.trim() || null
  }

  if (Object.keys(patch).length === 0) return { ok: true }
  const { error } = await supabase
    .from('user_settings')
    .update(patch)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

// =============================================================
// Account
// =============================================================

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
