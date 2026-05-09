'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ImagePlus, Plus, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  CreativeStyleSummary,
  FormatType,
} from '@/lib/types/creative-style'

/**
 * Compact picker — shows current style + click to swap.
 * Loads list client-side via Supabase RLS (same pattern as VoicePicker).
 */
export function StylePicker({
  formatType,
  selectedId,
  onChange,
  disabled,
}: {
  formatType: FormatType
  selectedId: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}) {
  const [styles, setStyles] = useState<CreativeStyleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchStyles() {
      const sb = createClient()
      const { data } = await sb
        .from('creative_styles')
        .select('id, name, format_type, is_default, reference_images, updated_at')
        .eq('format_type', formatType)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })

      if (cancelled) return
      const list: CreativeStyleSummary[] = (data ?? []).map((row) => {
        const refs = Array.isArray(row.reference_images)
          ? (row.reference_images as { url: string }[])
          : []
        return {
          id: row.id,
          name: row.name,
          format_type: row.format_type as FormatType,
          is_default: row.is_default,
          reference_image_count: refs.length,
          thumbnail_url: refs[0]?.url ?? null,
          updated_at: row.updated_at,
        }
      })
      setStyles(list)
      setLoading(false)

      // Auto-select default if nothing selected
      if (!selectedId) {
        const def = list.find((s) => s.is_default) ?? list[0]
        if (def) onChange(def.id)
      }
    }
    fetchStyles()
    return () => {
      cancelled = true
    }
  }, [formatType, selectedId, onChange])

  const selected = styles.find((s) => s.id === selectedId) ?? null

  if (loading) {
    return (
      <div className="h-10 rounded-[8px] border border-border bg-secondary/40 animate-pulse" />
    )
  }

  if (styles.length === 0) {
    return (
      <Link
        href="/templates/new"
        className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-border hover:border-brand text-sm text-muted-foreground hover:text-foreground"
      >
        <ImagePlus size={14} />
        ยังไม่มี template — สร้าง template แรก
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[8px] border border-border bg-background hover:border-border-strong text-left text-sm disabled:opacity-50"
      >
        {selected?.thumbnail_url ? (
          <div className="relative w-8 h-10 rounded-[4px] overflow-hidden bg-secondary shrink-0">
            <Image
              src={selected.thumbnail_url}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-10 rounded-[4px] bg-secondary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">
              {selected?.name ?? 'เลือก template'}
            </span>
            {selected?.is_default && (
              <Star size={10} className="text-brand shrink-0" fill="currentColor" />
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Creative template
          </div>
        </div>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {open && !disabled && (
        <div
          className="absolute z-20 mt-1 left-0 right-0 rounded-[10px] border border-border-soft bg-card shadow-lg overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="max-h-[280px] overflow-y-auto">
            {styles.map((s) => {
              const active = s.id === selectedId
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-left hover:bg-secondary/60 ${
                    active ? 'bg-brand-soft' : ''
                  }`}
                >
                  {s.thumbnail_url ? (
                    <div className="relative w-8 h-10 rounded-[4px] overflow-hidden bg-secondary shrink-0">
                      <Image
                        src={s.thumbnail_url}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-10 rounded-[4px] bg-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {s.name}
                      </span>
                      {s.is_default && (
                        <Star size={10} className="text-brand shrink-0" fill="currentColor" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.reference_image_count} refs
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <Link
            href="/templates/new"
            className="flex items-center gap-2 px-3 py-2 border-t border-border-soft text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          >
            <Plus size={12} />
            สร้าง template ใหม่
          </Link>
        </div>
      )}
    </div>
  )
}
