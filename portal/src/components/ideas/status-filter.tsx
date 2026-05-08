'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { IdeaStatus } from '@/lib/actions/ideas'

const TABS: { key: IdeaStatus | 'all'; label: string }[] = [
  { key: 'idea', label: 'Ideas' },
  { key: 'in_progress', label: 'Working on' },
  { key: 'recreated', label: 'Recreated' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'ทั้งหมด' },
]

export function IdeaStatusFilter({
  counts,
}: {
  counts: Record<IdeaStatus | 'all', number>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  const active = (params.get('status') as IdeaStatus | 'all' | null) ?? 'idea'

  function setTab(key: IdeaStatus | 'all') {
    const next = new URLSearchParams(params.toString())
    if (key === 'idea') {
      next.delete('status')
    } else {
      next.set('status', key)
    }
    start(() => router.replace(`${pathname}?${next.toString()}`))
  }

  return (
    <div className="flex items-center gap-1 mb-4 border-b border-border-soft">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          disabled={pending}
          onClick={() => setTab(tab.key)}
          className={cn(
            'px-3 py-2 text-sm transition-colors border-b-2 -mb-px',
            active === tab.key
              ? 'border-brand text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          <span className="ml-1.5 text-2xs text-muted-foreground">
            {counts[tab.key] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
