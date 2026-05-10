'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Loader2, Mic, Plus } from 'lucide-react'
import {
  setActiveVoiceProfile,
  type VoiceProfileSummary,
} from '@/lib/actions/voice'

/**
 * Compact voice profile picker for the topbar.
 * Always visible so user knows which voice AI is using.
 */
export function VoicePicker({
  profiles,
}: {
  profiles: VoiceProfileSummary[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  const active = profiles.find((p) => p.is_active) ?? profiles[0]
  if (!active && profiles.length === 0) {
    return (
      <Link
        href="/voice"
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1.5"
      >
        <Mic size={12} />
        ตั้งค่า Voice
      </Link>
    )
  }

  const onSwitch = (id: string) => {
    if (id === active?.id) {
      setOpen(false)
      return
    }
    start(async () => {
      const res = await setActiveVoiceProfile(id)
      setOpen(false)
      if (res.ok) {
        router.refresh()
      }
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Mic size={12} />
        )}
        <span className="hidden sm:inline text-muted-foreground">Voice:</span>
        <span className="font-medium text-foreground max-w-[160px] truncate">
          {active?.name ?? 'Default'}
        </span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 surface-1 rounded-[10px] shadow-lg border border-border-soft py-1.5">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Voice profiles ของคุณ
            </div>
            <ul>
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSwitch(p.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary/50 ${
                      p.is_active ? 'text-foreground font-medium' : 'text-foreground/85'
                    }`}
                  >
                    <span className="w-4 inline-flex justify-center">
                      {p.is_active && <Check size={12} className="text-emerald-600" />}
                    </span>
                    <span className="flex-1 truncate">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border-soft mt-1 pt-1">
              <Link
                href="/voice"
                onClick={() => setOpen(false)}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <Plus size={11} />
                จัดการ Voice profiles
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
