'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react'

/**
 * Admin-only button (rendered conditionally from page.tsx) to trigger
 * a curated-pool resync. Long-running call — keeps state in component
 * while the request is in flight so the founder can see progress.
 */
export function RefreshPoolButton() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'syncing' | 'ok' | 'err'>(
    'idle',
  )
  const [msg, setMsg] = useState<string | null>(null)
  const [, start] = useTransition()

  async function onClick() {
    setStatus('syncing')
    setMsg(null)
    try {
      const res = await fetch('/api/admin/sync-curated-pool', {
        method: 'POST',
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('err')
        setMsg(body.error ?? `HTTP ${res.status}`)
        return
      }
      setStatus('ok')
      setMsg(
        `synced ${body.creators_synced}/${body.creators_total} creators`,
      )
      start(() => router.refresh())
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e) {
      setStatus('err')
      setMsg(e instanceof Error ? e.message : 'request failed')
    }
  }

  const Icon =
    status === 'syncing'
      ? Loader2
      : status === 'ok'
        ? Check
        : status === 'err'
          ? AlertCircle
          : RefreshCw

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'syncing'}
        title="resync curated creator pool"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-secondary text-xs font-medium text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-60"
      >
        <Icon size={12} className={status === 'syncing' ? 'animate-spin' : ''} />
        <span>
          {status === 'syncing'
            ? 'syncing pool…'
            : status === 'ok'
              ? 'pool refreshed'
              : status === 'err'
                ? 'sync failed'
                : 'refresh pool'}
        </span>
      </button>
      {msg && (
        <span
          className={`text-[11px] ${
            status === 'err' ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {msg}
        </span>
      )}
    </div>
  )
}
