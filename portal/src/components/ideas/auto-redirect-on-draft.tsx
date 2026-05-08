'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Polls recreated_drafts for new fb_article drafts on this idea after Quick
 * Recreate kicked off the worker chain. When one appears with status='ready',
 * redirect to /recreated/[draftId].
 *
 * Uses lightweight polling (3s) instead of Realtime — simpler and works even
 * if Realtime channels are saturated.
 */
export function AutoRedirectOnDraft({
  ideaId,
  knownDraftIds,
}: {
  ideaId: string
  knownDraftIds: string[]
}) {
  const router = useRouter()
  const [waiting, setWaiting] = useState(true)

  useEffect(() => {
    const sb = createClient()
    const known = new Set(knownDraftIds)
    let cancelled = false

    const tick = async () => {
      const { data } = await sb
        .from('recreated_drafts')
        .select('id, format, status')
        .eq('idea_id', ideaId)
        .eq('format', 'fb_article')
        .order('created_at', { ascending: false })
        .limit(5)
      if (cancelled || !data) return
      for (const d of data) {
        if (!known.has(d.id) && d.status === 'ready') {
          setWaiting(false)
          router.push(`/recreated/${d.id}`)
          return
        }
      }
    }

    // Initial check + 3s polling
    tick()
    const interval = setInterval(tick, 3000)
    // Stop polling after 10 min as safety
    const stopTimer = setTimeout(
      () => {
        cancelled = true
        clearInterval(interval)
        setWaiting(false)
      },
      10 * 60 * 1000,
    )

    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(stopTimer)
    }
  }, [ideaId, knownDraftIds, router])

  if (!waiting) return null

  return (
    <div className="surface-1 rounded-[14px] p-4 mb-4 border border-brand bg-brand-soft">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-[8px] bg-brand text-white flex items-center justify-center shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            กำลังสร้าง FB Post อัตโนมัติ
            <Loader2 size={14} className="animate-spin text-brand" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            ระบบกำลัง: ดึง transcript → แปลไทย → AI สรุป → AI เขียน FB post → render
            cover. เสร็จแล้วจะพาไปหน้า draft อัตโนมัติ
            <br />
            ใช้เวลา ~90-150 วิ ปล่อยทิ้งไว้ได้
          </p>
        </div>
      </div>
    </div>
  )
}
