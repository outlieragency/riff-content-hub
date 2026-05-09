'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import type { DiscoverMode } from './mode-tabs'

/**
 * Secondary filters for /discover. Score floor is shown only in `outliers`
 * mode (per PRD-001). Other filters persist across mode switches.
 */
export function DiscoverFilters({
  channels,
  mode,
}: {
  channels: { id: string; title: string }[]
  mode: DiscoverMode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    start(() => router.replace(`${pathname}?${next.toString()}`))
  }

  const channel = params.get('channel') ?? ''
  const duration = params.get('duration') ?? 'long'
  const score = params.get('score') ?? '2'
  const q = params.get('q') ?? ''

  return (
    <div className="surface-1 rounded-[12px] p-3 mb-4 flex flex-wrap items-center gap-2">
      <select
        value={channel}
        onChange={(e) => setParam('channel', e.target.value)}
        disabled={pending}
        className="h-9 px-3 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="">ทุกช่อง</option>
        {channels.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>

      <select
        value={duration}
        onChange={(e) => setParam('duration', e.target.value)}
        disabled={pending}
        className="h-9 px-3 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="long">Long-form</option>
        <option value="short">Shorts</option>
        <option value="all">ทั้งหมด</option>
      </select>

      {mode === 'outliers' && (
        <select
          value={score}
          onChange={(e) => setParam('score', e.target.value)}
          disabled={pending}
          className="h-9 px-3 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="1">≥ 1x</option>
          <option value="2">≥ 2x (outlier)</option>
          <option value="5">≥ 5x (viral)</option>
          <option value="10">≥ 10x (mega)</option>
        </select>
      )}

      <input
        defaultValue={q}
        type="text"
        placeholder="ค้นหา title"
        onKeyDown={(e) => {
          if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value)
        }}
        onBlur={(e) => setParam('q', e.target.value)}
        disabled={pending}
        className="flex-1 min-w-[180px] h-9 px-3 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  )
}
