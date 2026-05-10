'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import {
  addChannelFromOnboarding,
  completeOnboarding,
} from '@/lib/actions/onboarding'
import { resolveCreatorsForInterests } from '@/lib/onboarding/niche-creators'

type Step = 'interests' | 'syncing'

const INTERESTS: { id: string; label: string }[] = [
  { id: 'business', label: 'Business / ผู้ประกอบการ' },
  { id: 'marketing', label: 'Marketing / Sales' },
  { id: 'finance', label: 'การเงินส่วนบุคคล' },
  { id: 'investing', label: 'Investing / ลงทุน' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'self-dev', label: 'Self-development / Mindset' },
  { id: 'ai-tech', label: 'AI / Technology' },
  { id: 'creator-economy', label: 'Creator Economy' },
  { id: 'digital-product', label: 'Digital Product / Course' },
  { id: 'coaching', label: 'Coaching / Consulting' },
  { id: 'philosophy', label: 'Philosophy / ความคิด' },
  { id: 'health', label: 'Health / Fitness' },
  { id: 'career', label: 'Career / ทำงาน' },
  { id: 'education', label: 'Education / การเรียน' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'lifestyle', label: 'Lifestyle / การใช้ชีวิต' },
]

export function OnboardingFlow({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('interests')
  const [pending, startPending] = useTransition()
  const [interests, setInterests] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<{
    total: number
    done: number
    currentHandle: string | null
  }>({ total: 0, done: 0, currentHandle: null })

  function toggleInterest(id: string) {
    setInterests((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )
  }

  function startSync() {
    if (interests.length < 2) {
      setError('เลือกความสนใจอย่างน้อย 2 อย่าง')
      return
    }
    setError(null)
    const creators = resolveCreatorsForInterests(interests)
    if (creators.length === 0) {
      setError('ยังไม่มี creator ที่ map กับความสนใจที่เลือก')
      return
    }

    setStep('syncing')
    startPending(async () => {
      setSyncProgress({
        total: creators.length,
        done: 0,
        currentHandle: null,
      })

      // Sync sequentially so progress UI is honest. Failures are non-fatal.
      for (let i = 0; i < creators.length; i++) {
        const handle = creators[i]
        setSyncProgress({
          total: creators.length,
          done: i,
          currentHandle: handle,
        })
        const url = `https://youtube.com/@${handle}`
        await addChannelFromOnboarding(url).catch(() => null)
      }

      setSyncProgress({
        total: creators.length,
        done: creators.length,
        currentHandle: null,
      })

      await completeOnboarding({ interests })

      router.push('/discover')
      router.refresh()
    })
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 py-12 md:py-16">
      <Header userEmail={userEmail} step={step} />

      {step === 'interests' && (
        <InterestsStep
          interests={interests}
          toggle={toggleInterest}
          error={error}
          onNext={startSync}
        />
      )}

      {step === 'syncing' && (
        <SyncingStep progress={syncProgress} pending={pending} />
      )}
    </div>
  )
}

function Header({ userEmail, step }: { userEmail: string; step: Step }) {
  const stepIdx = step === 'interests' ? 1 : 2
  return (
    <header className="mb-10">
      <div
        className="text-2xs uppercase font-medium mb-3"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.18em' }}
      >
        Welcome to Riff · {userEmail}
      </div>
      <h1
        className="font-serif-display"
        style={{
          fontSize: 'clamp(28px, 4vw, 36px)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: 'var(--color-text-primary)',
        }}
      >
        {step === 'interests' && 'คุณสนใจเรื่องอะไร'}
        {step === 'syncing' && 'Riff กำลังหา creators ให้คุณ'}
      </h1>
      <div className="flex items-center gap-1.5 mt-5">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              flex: 1,
              background:
                i <= stepIdx ? '#09321F' : 'rgba(26,36,24,0.10)',
            }}
          />
        ))}
      </div>
    </header>
  )
}

function InterestsStep({
  interests,
  toggle,
  error,
  onNext,
}: {
  interests: string[]
  toggle: (id: string) => void
  error: string | null
  onNext: () => void
}) {
  return (
    <>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
        }}
      >
        เลือกความสนใจของคุณ Riff จะหา creator ใน niche นั้นมาให้
        แล้วโชว์ outliers ของพวกเขาในหน้า Discover ทุกวัน
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        {INTERESTS.map((it) => {
          const active = interests.includes(it.id)
          return (
            <button
              type="button"
              key={it.id}
              onClick={() => toggle(it.id)}
              className="transition-colors"
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                background: active ? '#09321F' : '#FBF7EC',
                color: active ? '#F1ECDF' : 'var(--color-text-primary)',
                border: '1px solid',
                borderColor: active ? '#09321F' : 'rgba(26,36,24,0.10)',
                cursor: 'pointer',
              }}
            >
              {it.label}
            </button>
          )
        })}
      </div>

      <p
        className="mt-4"
        style={{
          fontSize: 13,
          color: 'var(--color-text-muted)',
        }}
      >
        เลือกอย่างน้อย 2 — เปลี่ยนได้ทีหลังใน Settings
      </p>

      {error && (
        <div
          className="mt-5 px-3 py-2 rounded-[8px] text-sm"
          style={{
            background: 'rgba(159,42,24,0.08)',
            color: '#9F2A18',
          }}
        >
          {error}
        </div>
      )}

      <div className="mt-9 flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={interests.length < 2}
          className="inline-flex items-center gap-1.5 rounded-full font-medium disabled:opacity-50 transition-all"
          style={{
            background: '#09321F',
            color: '#F1ECDF',
            height: 44,
            padding: '0 24px',
            fontSize: 15,
          }}
        >
          ให้ Riff หา creators
          <Sparkles size={14} />
        </button>
      </div>
    </>
  )
}

function SyncingStep({
  progress,
  pending,
}: {
  progress: { total: number; done: number; currentHandle: string | null }
  pending: boolean
}) {
  const pct =
    progress.total === 0
      ? 0
      : Math.round((progress.done / progress.total) * 100)

  return (
    <div className="text-center py-8">
      <div
        className="inline-flex items-center justify-center rounded-full mx-auto"
        style={{
          width: 64,
          height: 64,
          background: 'rgba(9,50,31,0.08)',
          color: '#09321F',
        }}
      >
        {pending && progress.done < progress.total ? (
          <Loader2 className="animate-spin" size={28} />
        ) : (
          <Sparkles size={28} />
        )}
      </div>

      <h2
        className="font-serif-display mt-5"
        style={{
          fontSize: 24,
          lineHeight: 1.2,
          color: 'var(--color-text-primary)',
        }}
      >
        {progress.done < progress.total
          ? 'กำลังหา content ที่ตรงกับ niche คุณ'
          : 'พร้อมแล้ว — กำลังพาไป Discover'}
      </h2>
      <p
        className="mt-3"
        style={{
          fontSize: 14,
          color: 'var(--color-text-muted)',
          maxWidth: 420,
          margin: '12px auto 0',
        }}
      >
        {progress.currentHandle
          ? `ดึงจาก @${progress.currentHandle}...`
          : 'Riff scan top creators ใน niche ของคุณ คำนวณ Outlier Score แล้วเอาเฉพาะตัวที่ดังเกินค่าเฉลี่ย channel มาให้ดู'}
      </p>

      <div className="mt-8 mx-auto" style={{ maxWidth: 320 }}>
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 6, background: 'rgba(26,36,24,0.08)' }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              background: '#09321F',
            }}
          />
        </div>
        <div
          className="mt-2 tabular-nums"
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.05em',
          }}
        >
          {progress.done} / {progress.total} creators
        </div>
      </div>
    </div>
  )
}
