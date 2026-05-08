'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  X,
} from 'lucide-react'
import { saveDraftBody } from '@/lib/actions/recreate'

const REQUIRED_HASHTAGS = [
  '#อ่านจบปุ๊ปเก่งขึ้นปั๊ป',
  '#สรุ๊ปสรุป',
  '#ความเห็นฉบับเอิร์ธ',
]
const REQUIRED_SIGNATURE = 'หวังว่าโพสต์นี้จะมีประโยชน์กับทุกคนนะครับผม'

type Props = {
  draftId: string
  initialBody: string
  /** The original LLM output, used for "restore" button. */
  pristineBody: string
  onClose: () => void
}

type Issue = { level: 'error' | 'warn'; msg: string }

function validate(body: string): Issue[] {
  const issues: Issue[] = []
  for (const tag of REQUIRED_HASHTAGS) {
    if (!body.includes(tag)) {
      issues.push({ level: 'error', msg: `ขาด hashtag: ${tag}` })
    }
  }
  if (!body.includes(REQUIRED_SIGNATURE)) {
    issues.push({
      level: 'error',
      msg: `ขาด signature: "${REQUIRED_SIGNATURE}"`,
    })
  }
  // Section divider count — should be exactly 10 chars '='
  const elevenPlus = /={11,}/.test(body)
  if (elevenPlus) {
    issues.push({
      level: 'error',
      msg: 'พบ divider ที่เป็น "===========" (11+ ตัว) — ต้องใช้ "==========" (10 ตัว)',
    })
  }
  // em dash check
  if (body.includes('—')) {
    issues.push({
      level: 'warn',
      msg: "พบ em dash (—) — Earth's style ห้ามใช้ ใช้ regular dash หรือขึ้นบรรทัดใหม่",
    })
  }
  // Numbering format
  if (/^\s*\d+\.\s/m.test(body)) {
    issues.push({
      level: 'warn',
      msg: 'พบ numbering แบบ "1." หรือ "2." — ต้องใช้ [1] [2] [3] (square brackets)',
    })
  }
  return issues
}

export function FbBodyEditor({
  draftId,
  initialBody,
  pristineBody,
  onClose,
}: Props) {
  const router = useRouter()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [body, setBody] = useState(initialBody)
  const [saving, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const dirty = body !== initialBody
  const issues = validate(body)
  const errorCount = issues.filter((i) => i.level === 'error').length
  const warnCount = issues.filter((i) => i.level === 'warn').length

  // Auto-resize textarea
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [body])

  const onSave = () => {
    setError(null)
    start(async () => {
      const res = await saveDraftBody(draftId, body)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  const restore = () => {
    setBody(pristineBody)
    setConfirmRestoreOpen(false)
  }

  const charCount = body.length
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="surface-1 rounded-[14px] p-4 mb-4 border border-blue-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">แก้ Body</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            แก้ข้อความได้โดยตรง — ไม่ต้อง re-generate ใหม่ (ฟรี)
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Validation pills */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {issues.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={10} />
            ผ่าน Style Guide
          </span>
        ) : (
          <>
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle size={10} />
                {errorCount} error
              </span>
            )}
            {warnCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle size={10} />
                {warnCount} warning
              </span>
            )}
          </>
        )}
        <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
          {charCount.toLocaleString()} chars · {wordCount} words
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        spellCheck={false}
        className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        style={{ minHeight: '300px' }}
        placeholder="ลบหรือเพิ่มเนื้อหาได้เลย — slot placeholders จะ highlight อัตโนมัติใน viewer"
      />

      {/* Issue list */}
      {issues.length > 0 && (
        <ul className="mt-2 space-y-1">
          {issues.map((i, idx) => (
            <li
              key={idx}
              className={`text-[11px] flex items-start gap-1.5 ${
                i.level === 'error' ? 'text-red-700' : 'text-amber-700'
              }`}
            >
              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
              <span>{i.msg}</span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setConfirmRestoreOpen(true)}
          disabled={saving || !dirty || body === pristineBody}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-40"
        >
          <RotateCcw size={11} />
          คืนค่าเริ่มต้น
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-md px-4 py-1.5 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            บันทึก
          </button>
        </div>
      </div>

      {/* Restore confirm */}
      {confirmRestoreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmRestoreOpen(false)}
        >
          <div
            className="bg-card rounded-[14px] p-5 w-[420px] max-w-[92vw] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-foreground mb-2">
              คืนค่าจาก output ของ AI?
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              จะลบทุกการแก้ไขปัจจุบัน + กลับไปใช้ body ที่ AI generate ครั้งแรก
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmRestoreOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
              >
                ยกเลิก
              </button>
              <button
                onClick={restore}
                className="inline-flex items-center gap-1.5 bg-foreground text-background text-sm rounded-md px-4 py-1.5"
              >
                <RotateCcw size={12} />
                คืนค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
