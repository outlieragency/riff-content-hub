'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { worker } from '@/lib/worker'
import type { TranscriptSummary } from '@/lib/worker'

export type TranscriptState =
  | { status: 'no_video' }
  | { status: 'missing'; videoId: string }
  | {
      status: 'ready'
      transcriptId: string
      videoId: string
      language: string | null
      isThai: boolean
      hasTranslation: boolean
      plainText: string | null
      translatedText: string | null
      summary: TranscriptSummary | null
      summarizedAt: string | null
    }

/**
 * Read-only loader. Returns the current transcript state for an idea.
 */
export async function getTranscriptStateForIdea(
  ideaId: string,
): Promise<TranscriptState> {
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

  if (!idea || !idea.video_id) {
    return { status: 'no_video' }
  }

  const { data: row } = await supabase
    .from('transcripts')
    .select(
      'id, language, plain_text, translated_text, summary, summarized_at',
    )
    .eq('user_id', user.id)
    .eq('video_id', idea.video_id)
    .maybeSingle()

  if (!row) {
    return { status: 'missing', videoId: idea.video_id }
  }

  return {
    status: 'ready',
    transcriptId: row.id,
    videoId: idea.video_id,
    language: row.language ?? null,
    isThai: row.language === 'th' || row.language === 'th-TH',
    hasTranslation: !!row.translated_text,
    plainText: row.plain_text ?? null,
    translatedText: row.translated_text ?? null,
    summary: (row.summary as TranscriptSummary | null) ?? null,
    summarizedAt: row.summarized_at ?? null,
  }
}

export type StartTranscriptResult =
  | { ok: true; jobId: string; deduplicated: boolean }
  | { ok: false; error: string }

/**
 * Enqueue transcript processing job. Returns immediately with job_id.
 * UI subscribes to Supabase Realtime for progress.
 */
export async function startTranscriptProcess(
  ideaId: string,
  opts: { force?: boolean } = {},
): Promise<StartTranscriptResult> {
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
    return {
      ok: false,
      error: 'idea นี้ยังไม่ได้ link กับ video — recreate ต้องมี video',
    }
  }

  try {
    const res = await worker.enqueueTranscript({
      user_id: user.id,
      video_id: idea.video_id,
      force: opts.force,
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
