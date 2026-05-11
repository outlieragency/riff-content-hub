'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Eye,
  Loader2,
  RotateCcw,
  Save,
} from 'lucide-react'
import { resetUserPrompt, saveUserPrompt } from '@/lib/actions/prompts'

type Props = {
  promptKey: string
  label: string
  group: string
  description: string
  defaultContent: string
  userContent: string | null
  overridden: boolean
  updatedAt: string | null
}

export function PromptEditor({
  promptKey,
  label,
  group,
  description,
  defaultContent,
  userContent,
  overridden,
  updatedAt,
}: Props) {
  const router = useRouter()
  const initial = userContent ?? defaultContent
  const [text, setText] = useState(initial)
  const [showDefault, setShowDefault] = useState(false)
  const [saving, startSave] = useTransition()
  const [resetting, startReset] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const dirty = text !== initial
  const matchesDefault = useMemo(
    () => text.trim() === defaultContent.trim(),
    [text, defaultContent],
  )

  function save() {
    setError(null)
    setOkMsg(null)
    startSave(async () => {
      const res = await saveUserPrompt(promptKey, text)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOkMsg('บันทึกแล้ว — จะ apply กับการ generate ครั้งถัดไป')
      router.refresh()
    })
  }

  function reset() {
    if (!overridden) {
      // Just reset local edit to default content
      setText(defaultContent)
      setError(null)
      setOkMsg(null)
      return
    }
    setError(null)
    setOkMsg(null)
    startReset(async () => {
      const res = await resetUserPrompt(promptKey)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setText(defaultContent)
      setOkMsg('รีเซ็ตเป็น default แล้ว')
      router.refresh()
    })
  }

  const wordCount = text.length
  const lineCount = text.split('\n').length

  return (
    <section className="rounded-[12px] border border-border-soft bg-card overflow-hidden">
      <header className="px-5 py-4 border-b border-border-soft">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">
                {label}
              </h2>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                {group}
              </span>
              {overridden ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                  <CheckCircle2 size={10} />
                  Custom
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {updatedAt && overridden && (
              <p className="text-[11px] text-muted-foreground mt-1">
                แก้ไขล่าสุด {new Date(updatedAt).toLocaleString('th-TH')}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDefault((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-[8px] border border-border px-2.5 py-1.5"
          >
            <Eye size={12} />
            {showDefault ? 'ซ่อน default' : 'ดู default'}
          </button>
        </div>
      </header>

      <div
        className={
          showDefault
            ? 'grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-soft'
            : ''
        }
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
              Your version
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {wordCount.toLocaleString()} chars · {lineCount} lines
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="w-full min-h-[460px] font-mono text-xs leading-relaxed rounded-[8px] border border-border bg-background text-foreground p-3 focus:outline-none focus:ring-2 focus:ring-brand resize-y"
            placeholder="พิมพ์ prompt ที่นี่..."
          />
        </div>

        {showDefault && (
          <div className="p-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">
                Original default (read-only)
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {defaultContent.length.toLocaleString()} chars
              </span>
            </div>
            <pre className="w-full min-h-[460px] max-h-[700px] overflow-auto font-mono text-xs leading-relaxed rounded-[8px] border border-border bg-background text-foreground p-3 whitespace-pre-wrap break-words">
              {defaultContent}
            </pre>
          </div>
        )}
      </div>

      <footer className="px-5 py-4 border-t border-border-soft space-y-3">
        {error && (
          <div className="text-sm rounded-[8px] border border-status-red-border bg-status-red-bg text-status-red-text px-3 py-2">
            {error}
          </div>
        )}
        {okMsg && !error && (
          <div className="text-sm rounded-[8px] border border-emerald-200 bg-emerald-50 text-emerald-900 px-3 py-2">
            {okMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            {dirty
              ? 'มีการเปลี่ยนแปลงที่ยังไม่บันทึก'
              : matchesDefault && !overridden
                ? 'ใช้ default'
                : 'ไม่มีการเปลี่ยนแปลง'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={
                resetting || saving || (!overridden && matchesDefault)
              }
              className="inline-flex items-center gap-1.5 text-sm rounded-[8px] border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2"
              title={
                overridden
                  ? 'Deactivate override → fall back to default'
                  : 'Reset textarea to default content'
              }
            >
              {resetting ? (
                <Loader2 className="animate-spin" size={13} />
              ) : (
                <RotateCcw size={13} />
              )}
              Reset to default
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving || resetting}
              className="inline-flex items-center gap-1.5 text-sm font-medium rounded-[8px] bg-brand hover:bg-brand-hover text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={13} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}
