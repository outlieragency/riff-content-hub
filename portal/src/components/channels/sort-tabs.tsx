'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export type ChannelSortMode = 'recent' | 'top_liked' | 'top_viewed' | 'top_outlier'

const TABS: { id: ChannelSortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'top_liked', label: 'Top liked' },
  { id: 'top_viewed', label: 'Top viewed' },
  { id: 'top_outlier', label: 'Top outlier' },
]

export function ChannelSortTabs({ current }: { current: ChannelSortMode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  function setSort(next: ChannelSortMode) {
    const sp = new URLSearchParams(params.toString())
    if (next === 'recent') sp.delete('sort')
    else sp.set('sort', next)
    const qs = sp.toString()
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  return (
    <div className="flex items-center gap-1 mb-4 border-b border-border-soft">
      {TABS.map((t) => {
        const active = current === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setSort(t.id)}
            disabled={pending}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
              active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
