'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, X } from 'lucide-react'
import { quickInitFromUrl } from '@/lib/actions/quick-recreate'

export function QuickRecreateModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    start(async () => {
      const res = await quickInitFromUrl(url)
      if (!res.ok) {
        setError(res.error)
        return
      }
      // ?auto=fb tells idea page to render AutoRedirectOnDraft (poll for new
      // fb_article draft + auto-navigate when ready)
      router.push(`/ideas/${res.ideaId}?auto=fb`)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-card rounded-[14px] p-5 w-[480px] max-w-[92vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand" />
            <h2 className="text-base font-semibold text-foreground">
              Quick Recreate from URL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          วาง URL ของ YouTube video ที่อยากเอามาทำ post →
          ระบบจะ fetch metadata + transcript ให้อัตโนมัติ
          แล้วเข้า Idea page ให้กด recreate
        </p>

        <form onSubmit={submit}>
          <input
            autoFocus
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={pending}
            className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />

          {error && (
            <div className="mt-3 px-3 py-2 rounded-[8px] bg-status-red-bg border border-status-red-border text-sm text-status-red-text">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-[8px]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending || !url.trim()}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  กำลังประมวลผล...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  เริ่ม
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
