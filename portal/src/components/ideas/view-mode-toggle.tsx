'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LayoutGrid, KanbanSquare } from 'lucide-react'

export type IdeasViewMode = 'list' | 'kanban'

export function ViewModeToggle({ current }: { current: IdeasViewMode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setView(mode: IdeasViewMode) {
    const sp = new URLSearchParams(params.toString())
    if (mode === 'list') sp.delete('view')
    else sp.set('view', mode)
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="inline-flex items-center gap-1 bg-secondary/60 p-1 rounded-[8px]">
      <button
        type="button"
        onClick={() => setView('list')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium transition-colors ${
          current === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutGrid size={11} />
        Grid
      </button>
      <button
        type="button"
        onClick={() => setView('kanban')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium transition-colors ${
          current === 'kanban'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <KanbanSquare size={11} />
        Kanban
      </button>
    </div>
  )
}
