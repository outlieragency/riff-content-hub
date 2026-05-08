'use client'

import { useState, type KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

export function ChipList({
  values,
  onChange,
  placeholder,
  disabled,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const v = draft.trim()
    if (!v) return
    if (values.includes(v)) {
      setDraft('')
      return
    }
    onChange([...values, v])
    setDraft('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-wrap gap-1.5 px-2.5 py-2 rounded-[8px] border border-border bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-brand">
      {values.map((v, i) => (
        <span
          key={`${v}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs"
        >
          {v}
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="hover:text-status-red-text disabled:opacity-50"
            aria-label={`ลบ ${v}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
      />
      {draft && (
        <button
          type="button"
          onClick={commit}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground"
          aria-label="เพิ่ม"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}
