'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export function RuleList({
  values,
  onChange,
  placeholder,
  disabled,
  variant = 'do',
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  variant?: 'do' | 'dont'
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (!v) return
    onChange([...values, v])
    setDraft('')
  }

  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i))
  }

  const dotClass = variant === 'do' ? 'bg-status-green-text' : 'bg-status-red-text'

  return (
    <div className="space-y-1.5">
      <ul className="space-y-1">
        {values.map((v, i) => (
          <li
            key={`${v}-${i}`}
            className="group flex items-start gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-secondary"
          >
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${dotClass}`} />
            <span className="flex-1 text-sm text-foreground">{v}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-status-red-text disabled:opacity-50"
              aria-label="ลบ"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-9 px-3 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !draft.trim()}
          className="h-9 px-3 rounded-[6px] border border-border text-sm text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          <Plus size={13} />
          เพิ่ม
        </button>
      </div>
    </div>
  )
}
