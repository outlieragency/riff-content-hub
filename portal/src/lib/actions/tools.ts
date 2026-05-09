'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'

export type ToolKind = 'hook_doctor' | 'grade_draft' | 'niche_playbook'

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
