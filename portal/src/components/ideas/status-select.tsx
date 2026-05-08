'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { changeIdeaStatus, type IdeaStatus } from '@/lib/actions/ideas'

const OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'in_progress', label: 'Working on' },
  { value: 'recreated', label: 'Recreated' },
  { value: 'archived', label: 'Archived' },
]

export function StatusSelect({
  ideaId,
  current,
}: {
  ideaId: string
  current: IdeaStatus
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as IdeaStatus
    if (next === current) return
    start(async () => {
      await changeIdeaStatus(ideaId, next)
      router.refresh()
    })
  }

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending}
      className="h-8 px-2.5 rounded-[6px] border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
