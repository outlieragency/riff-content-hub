'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Save } from 'lucide-react'
import {
  setTutorialVideo,
  type TutorialVideo,
} from '@/lib/actions/app-settings'

export function TutorialVideoForm({ initial }: { initial: TutorialVideo }) {
  const router = useRouter()
  const [url, setUrl] = useState(initial.url ?? '')
  const [title, setTitle] = useState(initial.title ?? '')
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await setTutorialVideo({ url, title })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2400)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
          YouTube URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full h-10 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <p className="text-2xs text-muted-foreground mt-1.5">
          ใส่ URL เปล่าเพื่อซ่อน tutorial
        </p>
      </div>

      <div>
        <label className="block text-2xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
          ชื่อ video (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น แนะนำการใช้งาน Riff ใน 5 นาที"
          className="w-full h-10 px-3 rounded-[8px] bg-background border border-border-soft text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 rounded-[8px] px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check size={14} strokeWidth={2} /> บันทึกแล้ว
            </>
          ) : (
            <>
              <Save size={14} strokeWidth={1.8} />
              {pending ? 'กำลังบันทึก...' : 'บันทึก'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
