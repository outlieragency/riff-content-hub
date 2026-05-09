'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react'
import { quickInitFromUrl } from '@/lib/actions/quick-recreate'
import { createClient } from '@/lib/supabase/client'

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
  const [activeJobCount, setActiveJobCount] = useState(0)

  // Warn if any active jobs running — Earth otherwise might submit duplicates
  useEffect(() => {
    if (!open) return
    const sb = createClient()
    let cancelled = false

    async function check() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user || cancelled) return
      const { count } = await sb
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['queued', 'running'])
      if (cancelled) return
      setActiveJobCount(count ?? 0)
    }

    check()
    const interval = setInterval(check, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [open])

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

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          วาง URL ของ YouTube video ที่อยากเอามาทำ post →
          ระบบจะ fetch metadata + transcript + AI generate FB post + cover
          ให้อัตโนมัติ ใช้เวลา ~90-150 วินาที
        </p>

        {activeJobCount > 0 && (
          <div className="mb-3 px-3 py-2 rounded-[8px] bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <div>
              <strong>ตอนนี้มี {activeJobCount} job รออยู่</strong> — submit
              ใหม่ได้ แต่จะต่อคิว (จะรันทีละ 1) ดูสถานะใน popup ขวาล่างของหน้า
            </div>
          </div>
        )}

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
