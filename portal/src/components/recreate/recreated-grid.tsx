'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  RecreatedCard,
  type RecreatedCardData,
} from './recreated-card'
import { FORMAT_META, type RecreateFormat } from '@/lib/types/recreate-formats'

const ALL_FORMATS: RecreateFormat[] = [
  'fb_article',
  'yt_script',
  'reels',
  'carousel',
]

type FilterFormat = 'all' | RecreateFormat
type Group = 'none' | 'channel' | 'format'

export function RecreatedGrid({ items }: { items: RecreatedCardData[] }) {
  const [filter, setFilter] = useState<FilterFormat>('all')
  const [group, setGroup] = useState<Group>('none')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((d) => {
      if (filter !== 'all' && d.format !== filter) return false
      if (q) {
        const hay =
          (d.title ?? '').toLowerCase() +
          ' ' +
          (d.channel_title ?? '').toLowerCase() +
          ' ' +
          (d.source_video_title ?? '').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, filter, query])

  // Format counts (for filter pill badges)
  const formatCounts = useMemo(() => {
    const out: Record<string, number> = { all: items.length }
    for (const d of items) out[d.format] = (out[d.format] || 0) + 1
    return out
  }, [items])

  // Grouping
  const grouped = useMemo(() => {
    if (group === 'none') {
      return [{ key: '__all', label: '', items: filtered }]
    }
    const map = new Map<string, RecreatedCardData[]>()
    for (const d of filtered) {
      const key =
        group === 'channel'
          ? d.channel_title ?? '— (ไม่ระบุ channel)'
          : FORMAT_META[d.format]?.label ?? d.format
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, items]) => ({ key, label: key, items }))
  }, [filtered, group])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="ทั้งหมด"
          count={formatCounts.all ?? 0}
        />
        {ALL_FORMATS.map((f) => (
          <FilterPill
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
            label={FORMAT_META[f]?.label ?? f}
            count={formatCounts[f] ?? 0}
          />
        ))}

        <div className="flex-1" />

        {/* Group toggle */}
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as Group)}
          className="text-xs bg-background border border-border rounded-[8px] px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="none">ไม่ group</option>
          <option value="channel">Group ตาม Channel</option>
          <option value="format">Group ตาม Format</option>
        </select>

        {/* Search */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา title / channel"
            className="h-8 pl-7 pr-2.5 text-xs bg-background border border-border rounded-[8px] w-[180px] focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="text-xs text-muted-foreground">
        แสดง {filtered.length} / {items.length} drafts
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          ไม่พบ draft ที่ตรง filter
        </div>
      ) : (
        grouped.map((g) => (
          <div key={g.key} className="space-y-3">
            {g.label && (
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mt-2">
                {g.label}
                <span className="ml-2 text-muted-foreground font-normal lowercase">
                  ({g.items.length})
                </span>
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {g.items.map((d) => (
                <RecreatedCard key={d.id} data={d} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'bg-secondary text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20' : 'bg-background'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
