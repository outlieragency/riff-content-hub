'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { worker, type EditablePromptItem } from '@/lib/worker'

export type PromptListItemView = EditablePromptItem & {
  overridden: boolean
  updated_at: string | null
}

export type PromptDetailView = {
  key: string
  label: string
  group: string
  description: string
  default_content: string
  user_content: string | null
  overridden: boolean
  updated_at: string | null
}

async function getUserOrRedirect() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/**
 * List all editable prompts with per-user override status.
 * Merges worker whitelist with the user's user_prompts rows.
 */
export async function listEditablePrompts(): Promise<PromptListItemView[]> {
  const { supabase, user } = await getUserOrRedirect()
  const [whitelist, mine] = await Promise.all([
    worker.listPrompts(),
    supabase
      .from('user_prompts')
      .select('key, is_active, updated_at')
      .eq('user_id', user.id),
  ])

  const overrideMap = new Map<
    string,
    { is_active: boolean; updated_at: string }
  >()
  for (const row of mine.data ?? []) {
    overrideMap.set(row.key as string, {
      is_active: row.is_active as boolean,
      updated_at: row.updated_at as string,
    })
  }

  return whitelist.items.map((p) => {
    const ovr = overrideMap.get(p.key)
    return {
      ...p,
      overridden: !!ovr && ovr.is_active,
      updated_at: ovr?.updated_at ?? null,
    }
  })
}

/**
 * Load a single prompt (default + user override if any) for the editor.
 */
export async function getPromptDetail(
  key: string,
): Promise<PromptDetailView | { error: string }> {
  const { supabase, user } = await getUserOrRedirect()

  let meta: EditablePromptItem | undefined
  let defaultContent: string
  try {
    const whitelist = await worker.listPrompts()
    meta = whitelist.items.find((i) => i.key === key)
    if (!meta) return { error: `ไม่รู้จัก prompt key: ${key}` }
    const def = await worker.getPromptDefault(key)
    defaultContent = def.content
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'worker error',
    }
  }

  const { data: row } = await supabase
    .from('user_prompts')
    .select('content, is_active, updated_at')
    .eq('user_id', user.id)
    .eq('key', key)
    .maybeSingle()

  return {
    key,
    label: meta.label,
    group: meta.group,
    description: meta.description,
    default_content: defaultContent,
    user_content:
      row && row.is_active ? (row.content as string) : null,
    overridden: !!row && (row.is_active as boolean),
    updated_at: (row?.updated_at as string | undefined) ?? null,
  }
}

/**
 * Save (upsert) the user's override for a prompt key.
 * Empty/blank content is treated as "reset to default" (deactivate).
 */
export async function saveUserPrompt(
  key: string,
  content: string,
): Promise<{ ok: true; updated_at: string } | { ok: false; error: string }> {
  const { supabase, user } = await getUserOrRedirect()

  // Defensive: only accept keys in the whitelist
  try {
    const wl = await worker.listPrompts()
    if (!wl.items.some((i) => i.key === key)) {
      return { ok: false, error: `prompt key ไม่อยู่ใน whitelist: ${key}` }
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'worker unavailable',
    }
  }

  const trimmed = content.trim()
  if (!trimmed) {
    return { ok: false, error: 'เนื้อหาห้ามว่าง (ถ้าจะรีเซ็ตให้กด Reset to default)' }
  }
  if (trimmed.length > 200_000) {
    return { ok: false, error: 'เนื้อหายาวเกิน 200k chars' }
  }

  const { data, error } = await supabase
    .from('user_prompts')
    .upsert(
      {
        user_id: user.id,
        key,
        content,
        is_active: true,
      },
      { onConflict: 'user_id,key' },
    )
    .select('updated_at')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'save failed' }
  }

  revalidatePath('/settings/prompts')
  return { ok: true, updated_at: data.updated_at as string }
}

/**
 * Reset = deactivate the override so worker falls back to disk default.
 * We keep the row (is_active=false) so the user can re-enable / see history.
 */
export async function resetUserPrompt(
  key: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await getUserOrRedirect()

  const { error } = await supabase
    .from('user_prompts')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('key', key)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings/prompts')
  return { ok: true }
}
