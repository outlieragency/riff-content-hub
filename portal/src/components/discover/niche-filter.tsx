'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'
import { NICHES, nicheLabel } from '@/lib/niches'

/**
 * Compact niche filter — collapses 10 chips into a single dropdown.
 * Selected niches show as inline pills with × to remove individually.
 * Encodes selection as a comma-separated `?niche=` param.
 */
export function NicheFilter({
  availableNicheIds,
}: {
  availableNicheIds: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Close the popover when clicking outside or pressing Esc.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = new Set(
    (params.get('niche') ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
  const currentList = Array.from(current)

  function commit(next: Set<string>) {
    const sp = new URLSearchParams(params.toString())
    const merged = Array.from(next).sort().join(',')
    if (merged) sp.set('niche', merged)
    else sp.delete('niche')
    const qs = sp.toString()
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  function toggle(id: string) {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    commit(next)
  }

  function remove(id: string) {
    const next = new Set(current)
    next.delete(id)
    commit(next)
  }

  function clearAll() {
    commit(new Set())
    setOpen(false)
  }

  const available = new Set(availableNicheIds)

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
        >
          <Filter size={12} />
          {currentList.length === 0
            ? 'ทุก niche'
            : `${currentList.length} niche`}
          <ChevronDown size={11} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 z-30 w-[280px] rounded-[12px] bg-card border border-border-soft shadow-xl p-2"
          >
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">
                Niche
              </span>
              {currentList.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  เคลียร์
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
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
          </div>
        )}
      </div>

      {/* Inline pills for the currently active niches with × to remove */}
      {currentList.map((id) => (
        <span
          key={id}
          className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-foreground text-background text-xs font-medium"
        >
          {nicheLabel(id)}
          <button
            type="button"
            onClick={() => remove(id)}
            className="w-5 h-5 rounded-full inline-flex items-center justify-center hover:bg-white/15"
            aria-label={`remove ${id}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}
