/**
 * Supabase Realtime helper for the `jobs` table.
 *
 * Pattern:
 *   const unsub = subscribeToJob(jobId, (job) => { ... })
 *
 * The subscription is per-job-id (filtered server-side by RLS so user
 * only sees their own rows). On any UPDATE the callback fires with the
 * fresh row.
 */

import { createClient } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type JobRow = {
  id: string
  user_id: string
  kind: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number
  progress_step: string | null
  result: Record<string, unknown> | null
  error: string | null
  attempts: number
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export function subscribeToJob(
  jobId: string,
  onUpdate: (job: JobRow) => void,
  onError?: (err: Error) => void,
): () => void {
  const sb = createClient()
  const channel: RealtimeChannel = sb
    .channel(`job:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as JobRow | null
        if (row) onUpdate(row)
      },
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(err ?? new Error(`realtime ${status}`))
      }
    })

  return () => {
    sb.removeChannel(channel)
  }
}

/**
 * Fallback: poll job status every `intervalMs` until terminal status.
 * Use when Realtime is blocked (corporate firewall, etc.).
 */
export async function pollJobUntilDone(
  jobId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<JobRow> {
  const interval = opts.intervalMs ?? 2000
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000 // 5 min default
  const sb = createClient()
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const { data, error } = await sb
      .from('jobs')
      .select(
        'id, user_id, kind, status, progress, progress_step, result, error, attempts, created_at, started_at, finished_at',
      )
      .eq('id', jobId)
      .maybeSingle()

    if (error) {
      throw error
    }
    if (!data) {
      throw new Error('job not found')
    }
    if (data.status === 'done' || data.status === 'error') {
      return data as JobRow
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error('job poll timed out')
}

/**
 * Fetch current job state once (for initial render alongside Realtime sub).
 */
export async function fetchJob(jobId: string): Promise<JobRow | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('jobs')
    .select(
      'id, user_id, kind, status, progress, progress_step, result, error, attempts, created_at, started_at, finished_at',
    )
    .eq('id', jobId)
    .maybeSingle()
  if (error) throw error
  return (data as JobRow | null) ?? null
}
