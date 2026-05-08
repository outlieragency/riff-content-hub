'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { addChannel, type SyncMode } from '@/lib/actions/add-channel'

const MODES: { value: SyncMode; label: string; sub: string }[] = [
  {
    value: 'top_viewed',
    label: 'Top viewed',
    sub: 'ดึง 50 video ยอดวิวสูงสุด — เห็น outlier ของ channel ตลอด history',
  },
  {
    value: 'recent',
    label: 'Latest uploads',
    sub: 'ดึง 50 video ล่าสุด — เน้น content ใหม่',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    sub: 'ผสม top + recent — ครอบคลุมทั้ง 2 มิติ (quota แพงสุด)',
  },
]

export function AddChannelForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<SyncMode>('top_viewed')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    formData.set('mode', mode)
    start(async () => {
      const res = await addChannel(formData)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSuccess(`ดึงมา ${res.videos_synced} video (mode: ${mode})`)
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="surface-2 p-4 mb-4">
      <div className="flex gap-2">
        <input
          name="url"
          type="text"
          required
          disabled={pending}
          placeholder="วาง YouTube channel URL เช่น youtube.com/@earthrati"
          className="flex-1 h-10 px-3.5 rounded-[10px] bg-secondary/60 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 placeholder:text-text-muted"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-4 rounded-[10px] bg-foreground hover:bg-foreground/90 text-background font-medium text-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {pending ? 'กำลังดึง' : 'Add'}
        </button>
      </div>

      {/* Sync mode picker */}
      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          วิธีดึง video
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={pending}
              onClick={() => setMode(m.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                mode === m.value
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1.5">
          {MODES.find((m) => m.value === mode)?.sub}
        </div>
      </div>

      {error && <p className="text-sm text-status-red-text mt-3">{error}</p>}
      {success && (
        <p className="text-sm text-status-green-text mt-3">{success}</p>
      )}
    </form>
  )
}
