'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'
import type { RecreateFormat } from '@/lib/types/recreate-formats'

export type StartRecreateResult =
  | { ok: true; jobId: string; deduplicated: boolean }
  | { ok: false; error: string }

/**
 * Enqueue recreate job. Returns immediately with job_id.
 * UI subscribes to Supabase Realtime for progress + final draft_id.
 */
export async function startRecreate(
  ideaId: string,
  format: RecreateFormat,
  opts: {
    instruction_extra?: string
    voice_profile_id?: string
    creative_style_id?: string
  } = {},
): Promise<StartRecreateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: idea } = await supabase
    .from('ideas')
    .select('id, video_id')
    .eq('id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!idea) return { ok: false, error: 'idea not found' }
  if (!idea.video_id) {
    return { ok: false, error: 'idea ยังไม่ได้ link กับ video — recreate ต้องมี video' }
  }

  try {
    const res = await worker.enqueueRecreate({
      user_id: user.id,
      idea_id: ideaId,
      format,
      voice_profile_id: opts.voice_profile_id,
      creative_style_id: opts.creative_style_id,
      instruction_extra: opts.instruction_extra,
    })
    revalidatePath(`/ideas/${ideaId}`)
    return {
      ok: true,
      jobId: res.job_id,
      deduplicated: res.deduplicated,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown enqueue error',
    }
  }
}

export type IdeaRecreatedDraft = {
  id: string
  format: RecreateFormat
  title: string | null
  status: string
  created_at: string
}

export async function listDraftsForIdea(
  ideaId: string,
): Promise<IdeaRecreatedDraft[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('recreated_drafts')
    .select('id, format, title, status, created_at')
    .eq('user_id', user.id)
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })

  return (data ?? []).map((d) => ({
    id: d.id,
    format: d.format as RecreateFormat,
    title: d.title,
    status: d.status,
    created_at: d.created_at,
  }))
}

/**
 * Update post_body of an fb_article draft (no LLM call — pure DB update).
 * Also updates output_markdown so /recreated list reflects edits.
 */
export async function saveDraftBody(
  draftId: string,
  newBody: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: draft, error: fetchErr } = await supabase
    .from('recreated_drafts')
    .select('output, format')
    .eq('id', draftId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (fetchErr || !draft) return { ok: false, error: 'draft not found' }

  const trimmed = newBody.replace(/\r\n/g, '\n').trim()
  if (!trimmed) return { ok: false, error: 'body ห้ามว่าง' }

  const newOutput =
    draft.format === 'fb_article'
      ? { ...(draft.output ?? {}), post_body: trimmed }
      : draft.output

  const { error } = await supabase
    .from('recreated_drafts')
    .update({
      output: newOutput,
      output_markdown: trimmed,
      status: 'edited',
    })
    .eq('id', draftId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/recreated/${draftId}`)
  return { ok: true }
}

/**
 * Swap a draft's creative_style. Does NOT trigger re-render — caller should
 * follow with the existing /cover/save flow which picks up the new style.
 */
export async function setDraftCreativeStyle(
  draftId: string,
  creativeStyleId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { error } = await supabase
    .from('recreated_drafts')
    .update({ creative_style_id: creativeStyleId })
    .eq('id', draftId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/recreated/${draftId}`)
  return { ok: true }
}

/**
 * Delete a recreated draft + cleanup Storage assets (cover.png, cover-photo.png).
 * RLS guarantees user can only delete their own.
 */
export async function deleteRecreatedDraft(
  draftId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  // Verify ownership
  const { data: draft } = await supabase
    .from('recreated_drafts')
    .select('id')
    .eq('id', draftId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!draft) return { ok: false, error: 'draft not found' }

  // Cleanup Storage (best-effort, ignore failure)
  try {
    await supabase.storage
      .from('fb-covers')
      .remove([
        `${user.id}/${draftId}/cover.png`,
        `${user.id}/${draftId}/cover-photo.png`,
      ])
  } catch {
    // ignore
  }

  // Delete draft row
  const { error: delError } = await supabase
    .from('recreated_drafts')
    .delete()
    .eq('id', draftId)
    .eq('user_id', user.id)
  if (delError) return { ok: false, error: delError.message }

  revalidatePath('/recreated')
  return { ok: true }
}
