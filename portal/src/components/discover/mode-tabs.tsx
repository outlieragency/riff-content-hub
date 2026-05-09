'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Calendar, Flame, Layers, Sparkles, Tv } from 'lucide-react'

export type DiscoverMode = 'all' | 'outliers' | 'latest' | 'channel'

const MODES: {
  id: DiscoverMode
  label: string
  icon: typeof Flame
  hint: string
}[] = [
  { id: 'all', label: 'All', icon: Layers, hint: 'video ทั้งหมดเรียงตามวันที่' },
  { id: 'outliers', label: 'Outliers', icon: Flame, hint: 'ดูที่ score ≥ 2x' },
  { id: 'latest', label: 'Latest', icon: Sparkles, hint: 'ลง 14 วันล่าสุด' },
  { id: 'channel', label: 'By Channel', icon: Tv, hint: 'top 5 ของแต่ละช่อง' },
]

export function DiscoverModeTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  const current = (params.get('mode') as DiscoverMode | null) ?? 'all'

  function setMode(next: DiscoverMode) {
    const sp = new URLSearchParams(params.toString())
    if (next === 'all') sp.delete('mode')
    else sp.set('mode', next)
    // Drop score floor when leaving outliers mode
    if (next !== 'outliers') sp.delete('score')
    const qs = sp.toString()
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3 overflow-x-auto">
      {MODES.map((m) => {
        const active = current === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            disabled={pending}
            title={m.hint}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
              active
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <m.icon size={13} />
            {m.label}
          </button>
        )
      })}
      {current === 'latest' && (
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 ml-1">
          <Calendar size={11} />
          14 วันล่าสุด
        </span>
      )}
    </div>
  )
}
