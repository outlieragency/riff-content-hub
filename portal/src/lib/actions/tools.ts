'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeVoice } from '@/lib/types/voice-profile'
import { worker } from '@/lib/worker'

export type ToolKind =
  | 'hook_doctor'
  | 'grade_draft'
  | 'niche_playbook'
  | 'voice_rewrite'

export type RunToolResult =
  | {
      ok: true
      output_markdown: string
      meta: {
        model: string
        latency_ms: number
        cache_hit_ratio: number
      }
    }
  | { ok: false; error: string }

export async function runAiTool(
  tool: ToolKind,
  input: string,
): Promise<RunToolResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cleaned = (input ?? '').trim()
  if (!cleaned) {
    return { ok: false, error: 'input ห้ามว่าง' }
  }
  if (cleaned.length > 8000) {
    return { ok: false, error: 'input ยาวเกิน 8000 chars — ตัดให้สั้นลง' }
  }

  try {
    const res = await worker.runTool({
      user_id: user.id,
      tool,
      input: cleaned,
    })
    return {
      ok: true,
      output_markdown: res.output_markdown,
      meta: {
        model: res.meta.model,
        latency_ms: res.meta.latency_ms,
        cache_hit_ratio: res.meta.cache_hit_ratio,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

/**
 * Rewrite text using a specific voice profile (test mode).
 * Used by /voice page to preview "what would AI write in my voice?"
 */
export async function rewriteWithVoice(input: {
  voice_profile_id: string
  text: string
}): Promise<RunToolResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cleaned = (input.text ?? '').trim()
  if (!cleaned) return { ok: false, error: 'text ห้ามว่าง' }
  if (cleaned.length > 8000) {
    return { ok: false, error: 'text ยาวเกิน 8000 chars' }
  }

  // Load voice profile
  const { data: row } = await supabase
    .from('voice_profiles')
    .select('voice_profile')
    .eq('id', input.voice_profile_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!row) return { ok: false, error: 'voice profile not found' }
  const voice = normalizeVoice(row.voice_profile)

  try {
    const res = await worker.runTool({
      user_id: user.id,
      tool: 'voice_rewrite',
      input: cleaned,
      voice_profile: voice as unknown as Record<string, unknown>,
    })
    return {
      ok: true,
      output_markdown: res.output_markdown,
      meta: {
        model: res.meta.model,
        latency_ms: res.meta.latency_ms,
        cache_hit_ratio: res.meta.cache_hit_ratio,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
