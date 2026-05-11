'use client'

import { useState, useTransition } from 'react'
import { Loader2, Check } from 'lucide-react'
import { NICHES } from '@/lib/niches'
import { setChannelNiches } from '@/lib/actions/channel-niches'

type Props = {
  channelId: string
  initialNiches: string[]
}

export function NicheEditor({ channelId, initialNiches }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialNiches.map((n) => n.toLowerCase())),
  )
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState<'idle' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSaved('idle')
  }

  function save() {
    const arr = Array.from(selected)
    setErrMsg(null)
    start(async () => {
      const res = await setChannelNiches(channelId, arr)
      if (res.ok) {
        setSaved('ok')
        setTimeout(() => setSaved('idle'), 1800)
      } else {
        setSaved('err')
        setErrMsg(res.error)
      }
    })
  }

  // Hide save button when no change vs initial.
  const initialSet = new Set(initialNiches.map((n) => n.toLowerCase()))
  const dirty =
    selected.size !== initialSet.size ||
    Array.from(selected).some((id) => !initialSet.has(id))

  return (
    <div className="rounded-[14px] border border-border-soft bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Niches</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            แท็กที่ใช้กรอง content บน /discover
          </p>
        </div>
        {dirty && (
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-foreground text-background text-xs font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            บันทึก
          </button>
        )}
        {saved === 'ok' && !dirty && (
          <span className="text-xs text-green-600 inline-flex items-center gap-1">
            <Check size={12} /> บันทึก
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {NICHES.map((n) => {
          const on = selected.has(n.id)
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => toggle(n.id)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                on
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {n.label}
            </button>
          )
        })}
      </div>

      {errMsg && (
        <div className="mt-2 text-xs text-destructive">{errMsg}</div>
      )}
    </div>
  )
}
