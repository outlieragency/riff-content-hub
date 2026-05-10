'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Trash2, ChevronDown, Check } from 'lucide-react'
import {
  createVoiceProfile,
  deleteVoiceProfile,
  setActiveVoiceProfile,
  type VoiceProfileSummary,
} from '@/lib/actions/voice'

export function VoiceProfileSwitcher({
  activeId,
  profiles,
}: {
  activeId: string
  profiles: VoiceProfileSummary[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0]

  function onSwitch(id: string) {
    setError(null)
    setOpen(false)
    start(async () => {
      const res = await setActiveVoiceProfile(id)
      if (!res.ok) {
        setError(res.error ?? 'switch failed')
        return
      }
      router.refresh()
    })
  }

  function onCreate() {
    if (!newName.trim()) return
    setError(null)
    start(async () => {
      const res = await createVoiceProfile(newName)
      if (!res.ok) {
        setError(res.error)
        return
      }
      // Switch to the newly created profile
      const sw = await setActiveVoiceProfile(res.id)
      if (!sw.ok) {
        setError(sw.error ?? 'switch failed')
        return
      }
      setNewName('')
      setCreating(false)
      setOpen(false)
      router.refresh()
    })
  }

  function onDelete(id: string) {
    if (profiles.length <= 1) return
    if (!window.confirm('ลบ profile นี้? ไม่สามารถกู้คืนได้')) return
    setError(null)
    start(async () => {
      const res = await deleteVoiceProfile(id)
      if (!res.ok) {
        setError(res.error ?? 'delete failed')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
      >
        <span className="font-medium">{active?.name ?? '—'}</span>
        <span className="text-2xs text-muted-foreground">
          ({profiles.length} profile{profiles.length !== 1 ? 's' : ''})
        </span>
        {pending ? (
          <Loader2 size={12} className="animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown size={12} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-[280px] z-20 surface-1 rounded-[10px] border border-border-soft shadow-lg overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onSwitch(p.id)}
                  className="flex-1 flex items-center gap-2 text-left text-sm text-foreground"
                  disabled={pending}
                >
                  {p.is_active ? (
                    <Check size={12} className="text-brand" />
                  ) : (
                    <span className="w-3" />
                  )}
                  <span className="truncate">{p.name}</span>
                </button>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    aria-label="ลบ profile"
                    className="w-6 h-6 rounded-[5px] text-muted-foreground hover:bg-status-red-bg hover:text-status-red-text transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border-soft p-2">
            {creating ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCreate()
                    else if (e.key === 'Escape') {
                      setCreating(false)
                      setNewName('')
                    }
                  }}
                  placeholder="ชื่อ profile ใหม่"
                  autoFocus
                  disabled={pending}
                  className="flex-1 h-8 px-2 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={onCreate}
                  disabled={pending || !newName.trim()}
                  className="h-8 px-2.5 rounded-[6px] bg-brand text-white text-xs font-medium disabled:opacity-50"
                >
                  สร้าง
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                disabled={pending}
                className="w-full inline-flex items-center gap-1.5 h-8 px-2 rounded-[6px] text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Plus size={12} />
                สร้าง profile ใหม่
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-0 top-full mt-1.5 z-30 bg-status-red-bg border border-status-red-border rounded-[6px] px-2 py-1 text-xs text-status-red-text whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}
