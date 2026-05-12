'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import {
  quickInitFromUrl,
  type QuickRecreateFormat,
} from '@/lib/actions/quick-recreate'
import { createClient } from '@/lib/supabase/client'

type Step = 'url' | 'choose'

const FORMAT_OPTIONS: {
  value: QuickRecreateFormat
  label: string
  hint: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}[] = [
  {
    value: 'fb_article',
    label: 'Facebook Post',
    hint: 'บทความยาว 800-1,500 คำ + cover ปก',
    icon: Bookmark,
  },
  {
    value: 'ig_carousel',
    label: 'IG Carousel',
    hint: '3-9 slides ตาม template ที่พี่ upload',
    icon: ImageIcon,
  },
]

export function QuickRecreateModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeJobCount, setActiveJobCount] = useState(0)

  useEffect(() => {
    if (!open) return
    setStep('url')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const sb = createClient()
    let cancelled = false

    async function check() {
      const {
        data: { user },
      } = await sb.auth.getUser()
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

  function goNext(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) {
      setError('ใส่ URL ก่อน')
      return
    }
    setError(null)
    setStep('choose')
  }

  function submit(mode: 'save' | 'recreate', format?: QuickRecreateFormat) {
    setError(null)
    start(async () => {
      const res = await quickInitFromUrl(url, { mode, format })
      if (!res.ok) {
        setError(res.error)
        return
      }
      const auto =
        mode === 'recreate' && format === 'fb_article' ? '?auto=fb' : ''
      router.push(`/ideas/${res.ideaId}${auto}`)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-[14px] p-5 w-[520px] max-w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {step === 'choose' && (
              <button
                type="button"
                onClick={() => setStep('url')}
                className="text-muted-foreground hover:text-foreground"
                disabled={pending}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <Sparkles size={16} className="text-brand" />
            <h2 className="text-base font-semibold text-foreground">
              {step === 'url' ? 'Quick from URL' : 'จะให้ Riff ทำอะไร?'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            disabled={pending}
          >
            <X size={16} />
          </button>
        </div>

        {step === 'url' && (
          <UrlStep
            url={url}
            setUrl={setUrl}
            error={error}
            activeJobCount={activeJobCount}
            onSubmit={goNext}
          />
        )}

        {step === 'choose' && (
          <ChooseStep
            url={url}
            error={error}
            pending={pending}
            onSave={() => submit('save')}
            onRecreate={(f) => submit('recreate', f)}
          />
        )}
      </div>
    </div>
  )
}

function UrlStep({
  url,
  setUrl,
  error,
  activeJobCount,
  onSubmit,
}: {
  url: string
  setUrl: (v: string) => void
  error: string | null
  activeJobCount: number
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        วาง URL ของ YouTube video ที่อยากเอามาใช้
        ขั้นต่อไปเลือกได้ว่าจะแค่ save หรือ recreate เป็น format ไหน
      </p>

      {activeJobCount > 0 && (
        <div className="mb-3 px-3 py-2 rounded-[8px] bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <div>
            <strong>มี {activeJobCount} job รออยู่</strong>{' '}
            submit ใหม่ได้ แต่จะต่อคิว
          </div>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <input
          autoFocus
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full h-10 px-3 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        />

        {error && (
          <div className="mt-3 px-3 py-2 rounded-[8px] bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="submit"
            disabled={!url.trim()}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium rounded-[8px] px-4 py-2"
          >
            ถัดไป
          </button>
        </div>
      </form>
    </>
  )
}

function ChooseStep({
  url,
  error,
  pending,
  onSave,
  onRecreate,
}: {
  url: string
  error: string | null
  pending: boolean
  onSave: () => void
  onRecreate: (f: QuickRecreateFormat) => void
}) {
  return (
    <>
      <p
        className="text-xs text-muted-foreground mb-4 leading-relaxed truncate"
        title={url}
      >
        {url}
      </p>

      {pending && (
        <div className="mb-3 px-3 py-2 rounded-[8px] bg-secondary text-xs text-foreground flex items-center gap-2">
          <Loader2 className="animate-spin" size={12} />
          กำลังประมวลผล... อย่าปิดหน้านี้
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="w-full text-left flex items-start gap-3 p-3 rounded-[10px] border border-border hover:border-brand/40 hover:bg-secondary/30 transition-colors disabled:opacity-50 mb-2"
      >
        <span className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-[8px] bg-secondary text-foreground">
          <Bookmark size={15} strokeWidth={1.8} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-foreground">
            แค่ Save ลง Idea Library
          </span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            ดึงวิดีโอ + transcript เก็บไว้ ค่อย recreate ทีหลัง
          </span>
        </span>
      </button>

      <div className="text-2xs uppercase tracking-wider text-muted-foreground font-medium px-1 mt-4 mb-2">
        หรือ Recreate ทันทีเลย
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FORMAT_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onRecreate(f.value)}
            disabled={pending}
            className="text-left flex items-start gap-3 p-3 rounded-[10px] border border-border hover:border-brand/40 hover:bg-secondary/30 transition-colors disabled:opacity-50"
          >
            <span className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-[8px] bg-brand-soft text-brand">
              <f.icon size={15} strokeWidth={1.8} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {f.label}
              </span>
              <span className="block text-2xs text-muted-foreground mt-0.5 leading-snug">
                {f.hint}
              </span>
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 rounded-[8px] bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}
    </>
  )
}
