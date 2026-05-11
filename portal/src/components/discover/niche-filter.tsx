'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { NICHES } from '@/lib/niches'

/**
 * Multi-select niche chips above the discover feed. Encodes selection
 * as a comma-separated `?niche=` param. Selecting nothing = "all".
 */
export function NicheFilter({
  availableNicheIds,
}: {
  /** Niches that have at least one tagged channel — others render disabled. */
  availableNicheIds: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  const current = new Set(
    (params.get('niche') ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )

  function toggle(id: string) {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    const sp = new URLSearchParams(params.toString())
    const merged = Array.from(next).sort().join(',')
    if (merged) sp.set('niche', merged)
    else sp.delete('niche')
    const qs = sp.toString()
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  function clearAll() {
    const sp = new URLSearchParams(params.toString())
    sp.delete('niche')
    const qs = sp.toString()
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  const available = new Set(availableNicheIds)

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      <button
        type="button"
        onClick={clearAll}
        disabled={pending || current.size === 0}
        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
          current.size === 0
            ? 'bg-foreground text-background'
            : 'bg-secondary text-muted-foreground hover:text-foreground'
        }`}
      >
        ทุก niche
      </button>
      {NICHES.map((n) => {
        const on = current.has(n.id)
        const hasData = available.has(n.id)
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => toggle(n.id)}
            disabled={pending || (!on && !hasData)}
            title={hasData ? undefined : 'ยังไม่มี channel ที่ tag niche นี้'}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              on
                ? 'bg-foreground text-background'
                : hasData
                  ? 'bg-secondary text-foreground hover:bg-secondary/80'
                  : 'bg-secondary/40 text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            {n.label}
          </button>
        )
      })}
    </div>
  )
}
