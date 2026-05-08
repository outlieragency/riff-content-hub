'use client'

import { useState, useTransition, useEffect } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { updateIdeaNotes } from '@/lib/actions/ideas'

export function NotesEditor({
  ideaId,
  initialNotes,
}: {
  ideaId: string
  initialNotes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [saved])

  function onSave() {
    start(async () => {
      const res = await updateIdeaNotes(ideaId, notes)
      if (res.ok) setSaved(true)
    })
  }

  const dirty = notes !== (initialNotes ?? '')

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="โน้ตของคุณเอง อยากเล่ามุมไหน hook ที่ชอบ point ที่จะเอาไปต่อ"
        className="w-full min-h-[120px] px-3 py-2.5 rounded-[8px] border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-y"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-2xs text-muted-foreground">
          {saved ? 'บันทึกแล้ว' : dirty ? 'ยังไม่ได้บันทึก' : ''}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={pending || !dirty}
          className="h-8 px-3 rounded-[6px] bg-brand hover:bg-brand-hover text-white text-xs font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {pending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : saved ? (
            <Check size={12} />
          ) : (
            <Save size={12} />
          )}
          บันทึกโน้ต
        </button>
      </div>
    </div>
  )
}
