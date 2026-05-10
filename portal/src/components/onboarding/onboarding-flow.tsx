'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Tv,
  X,
} from 'lucide-react'
import {
  addChannelFromOnboarding,
  completeOnboarding,
  previewChannelFromUrl,
  type ChannelPreview,
} from '@/lib/actions/onboarding'

type Step = 'channels' | 'interests' | 'syncing'

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

type SavedChannel = ChannelPreview & { _addedAt: number }

export function OnboardingFlow({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('channels')
  const [pending, startPending] = useTransition()

  // Step 1 — channels
  const [url, setUrl] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [pendingPreview, setPendingPreview] = useState<ChannelPreview | null>(
    null,
  )
  const [confirmedChannels, setConfirmedChannels] = useState<SavedChannel[]>([])
  const [error, setError] = useState<string | null>(null)

  // Step 2 — interests
  const [interests, setInterests] = useState<string[]>([])

  // Step 3 — syncing progress
  const [syncProgress, setSyncProgress] = useState<{
    total: number
    done: number
    currentTitle: string | null
  }>({ total: 0, done: 0, currentTitle: null })

  async function onLookupChannel() {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('ใส่ URL channel ก่อน')
      return
    }
    setError(null)
    setPreviewing(true)
    try {
      const res = await previewChannelFromUrl(trimmed)
      if (!res.ok) {
        setError(res.error)
        return
      }
      // Already added?
      if (
        confirmedChannels.some(
          (c) => c.youtube_channel_id === res.channel.youtube_channel_id,
        )
      ) {
        setError('เพิ่มช่องนี้ไปแล้ว')
        return
      }
      setPendingPreview(res.channel)
    } finally {
      setPreviewing(false)
    }
  }

  function confirmChannel() {
    if (!pendingPreview) return
    setConfirmedChannels((prev) => [
      ...prev,
      { ...pendingPreview, _addedAt: Date.now() },
    ])
    setPendingPreview(null)
    setUrl('')
    setError(null)
  }

  function rejectChannel() {
    setPendingPreview(null)
    setUrl('')
  }

  function removeChannel(id: string) {
    setConfirmedChannels((prev) =>
      prev.filter((c) => c.youtube_channel_id !== id),
    )
  }

  function toggleInterest(id: string) {
    setInterests((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )
  }

  function goToInterests() {
    if (confirmedChannels.length === 0) {
      setError('เพิ่มอย่างน้อย 1 channel ก่อน')
      return
    }
    setStep('interests')
  }

  function goToSync() {
    if (interests.length < 2) {
      setError('เลือกความสนใจอย่างน้อย 2 อย่าง')
      return
    }
    setError(null)
    setStep('syncing')
    startPending(async () => {
      // Sync each confirmed channel sequentially (worker can rate-limit batch)
      setSyncProgress({
        total: confirmedChannels.length,
        done: 0,
        currentTitle: null,
      })

      for (let i = 0; i < confirmedChannels.length; i++) {
        const ch = confirmedChannels[i]
        setSyncProgress({
          total: confirmedChannels.length,
          done: i,
          currentTitle: ch.title,
        })
        const inputUrl = ch.handle
          ? `https://youtube.com/@${ch.handle}`
          : `https://youtube.com/channel/${ch.youtube_channel_id}`
        const res = await addChannelFromOnboarding(inputUrl)
        if (!res.ok) {
          // Continue on error (don't block onboarding) — channel can be retried later
          console.error('sync failed for', ch.title, res.error)
        }
      }

      setSyncProgress({
        total: confirmedChannels.length,
        done: confirmedChannels.length,
        currentTitle: null,
      })

      // Save interests + mark onboarded
      await completeOnboarding({ interests })

      // Redirect to discover with first results
      router.push('/discover')
      router.refresh()
    })
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 py-12 md:py-16">
      <Header userEmail={userEmail} step={step} />

      {step === 'channels' && (
        <ChannelsStep
          url={url}
          setUrl={setUrl}
          previewing={previewing}
          pendingPreview={pendingPreview}
          confirmedChannels={confirmedChannels}
          error={error}
          onLookup={onLookupChannel}
          onConfirm={confirmChannel}
          onReject={rejectChannel}
          onRemove={removeChannel}
          onNext={goToInterests}
        />
      )}

      {step === 'interests' && (
        <InterestsStep
          interests={interests}
          toggle={toggleInterest}
          error={error}
          onBack={() => setStep('channels')}
          onNext={goToSync}
        />
      )}

      {step === 'syncing' && (
        <SyncingStep progress={syncProgress} pending={pending} />
      )}
    </div>
  )
}

function Header({ userEmail, step }: { userEmail: string; step: Step }) {
  const stepIdx = step === 'channels' ? 1 : step === 'interests' ? 2 : 3
  return (
    <header className="mb-10">
      <div className="text-2xs uppercase tracking-[0.18em] text-text-muted font-medium mb-3">
        Welcome to Riff · {userEmail}
      </div>
      <h1
        className="font-serif-display text-foreground"
        style={{
          fontSize: 'clamp(28px, 4vw, 36px)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {step === 'channels' && 'เพิ่ม Channel ที่อยาก track'}
        {step === 'interests' && 'คุณสนใจเรื่องอะไร'}
        {step === 'syncing' && 'กำลังดึง content เข้ามา'}
      </h1>
      <div className="flex items-center gap-1.5 mt-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              flex: 1,
              background:
                i <= stepIdx
                  ? 'var(--color-forest-deep)'
                  : 'rgba(26,36,24,0.10)',
            }}
          />
        ))}
      </div>
    </header>
  )
}

function ChannelsStep({
  url,
  setUrl,
  previewing,
  pendingPreview,
  confirmedChannels,
  error,
  onLookup,
  onConfirm,
  onReject,
  onRemove,
  onNext,
}: {
  url: string
  setUrl: (v: string) => void
  previewing: boolean
  pendingPreview: ChannelPreview | null
  confirmedChannels: SavedChannel[]
  error: string | null
  onLookup: () => void
  onConfirm: () => void
  onReject: () => void
  onRemove: (id: string) => void
  onNext: () => void
}) {
  return (
    <>
      <p
        className="text-text-secondary"
        style={{ fontSize: 16, lineHeight: 1.6 }}
      >
        วาง URL channel YouTube ที่อยากให้ Riff ตามดู Riff จะ scan content
        ทุกวันแล้วเอา outliers มาให้เลือก
      </p>

      <div className="mt-7">
        <div
          className="flex items-center gap-2"
          style={{
            background: '#FBF7EC',
            border: '1px solid rgba(26,36,24,0.14)',
            borderRadius: 999,
            padding: '6px 6px 6px 16px',
          }}
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onLookup()
              }
            }}
            placeholder="youtube.com/@handle หรือ /channel/UC..."
            className="flex-1 bg-transparent border-0 outline-none text-text-primary"
            style={{ fontSize: 15, height: 40 }}
            disabled={previewing || !!pendingPreview}
          />
          <button
            type="button"
            onClick={onLookup}
            disabled={previewing || !url.trim() || !!pendingPreview}
            className="inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-50"
            style={{
              background: '#09321F',
              color: '#F1ECDF',
              height: 36,
              width: 36,
            }}
          >
            {previewing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </div>

        {error && (
          <div
            className="mt-3 px-3 py-2 rounded-[8px] text-sm"
            style={{
              background: 'rgba(159,42,24,0.08)',
              color: '#9F2A18',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Pending preview confirmation card */}
      {pendingPreview && (
        <div
          className="mt-5 rounded-[14px] overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(26,36,24,0.10)',
            boxShadow: '0 12px 32px -12px rgba(26,36,24,0.18)',
          }}
        >
          <div className="p-4 flex items-center gap-3">
            {pendingPreview.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingPreview.thumbnail_url}
                alt=""
                className="w-14 h-14 rounded-full object-cover"
                style={{ background: 'rgba(26,36,24,0.06)' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-text-primary truncate"
                style={{ fontSize: 16 }}
              >
                {pendingPreview.title}
              </div>
              <div
                className="text-text-muted truncate"
                style={{ fontSize: 13, marginTop: 2 }}
              >
                {pendingPreview.handle && `@${pendingPreview.handle}`}
                {pendingPreview.subscriber_count != null && (
                  <>
                    {pendingPreview.handle && ' · '}
                    {formatCount(pendingPreview.subscriber_count)} subscribers
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] font-medium transition-colors"
              style={{
                background: '#09321F',
                color: '#F1ECDF',
                height: 40,
                fontSize: 14.5,
              }}
            >
              <Check size={14} strokeWidth={2.2} />
              ใช่ ช่องนี้แหละ
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center justify-center rounded-[10px] transition-colors"
              style={{
                border: '1px solid rgba(26,36,24,0.14)',
                color: 'var(--color-text-secondary)',
                height: 40,
                width: 40,
              }}
              aria-label="ไม่ใช่"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmed channels list */}
      {confirmedChannels.length > 0 && (
        <div className="mt-7">
          <div className="text-2xs uppercase tracking-wider text-text-muted font-medium mb-2">
            เพิ่มแล้ว · {confirmedChannels.length}
          </div>
          <div className="space-y-2">
            {confirmedChannels.map((c) => (
              <div
                key={c.youtube_channel_id}
                className="flex items-center gap-3 p-3 rounded-[10px]"
                style={{
                  background: '#FBF7EC',
                  border: '1px solid rgba(26,36,24,0.06)',
                }}
              >
                {c.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnail_url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-text-primary truncate"
                    style={{ fontSize: 14.5 }}
                  >
                    {c.title}
                  </div>
                  {c.handle && (
                    <div
                      className="text-text-muted"
                      style={{ fontSize: 12 }}
                    >
                      @{c.handle}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(c.youtube_channel_id)}
                  className="text-text-muted hover:text-red-700 transition-colors"
                  aria-label="ลบ"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-9 flex items-center justify-between gap-3">
        <p className="text-2xs text-text-muted">
          เพิ่มได้หลายช่อง / ตอนนี้รองรับเฉพาะ YouTube
        </p>
        <button
          type="button"
          onClick={onNext}
          disabled={confirmedChannels.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full font-medium disabled:opacity-50 transition-all"
          style={{
            background: '#09321F',
            color: '#F1ECDF',
            height: 44,
            padding: '0 24px',
            fontSize: 15,
          }}
        >
          ถัดไป
          <ArrowRight size={14} />
        </button>
      </div>
    </>
  )
}

function InterestsStep({
  interests,
  toggle,
  error,
  onBack,
  onNext,
}: {
  interests: string[]
  toggle: (id: string) => void
  error: string | null
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <p
        className="text-text-secondary"
        style={{ fontSize: 16, lineHeight: 1.6 }}
      >
        Riff จะใช้ความสนใจของคุณช่วยจัดเรียง outliers ใน feed
        เลือกอย่างน้อย 2 อย่าง — เปลี่ยนได้ทีหลังใน Settings
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

      <div className="mt-9 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
          style={{ fontSize: 14 }}
        >
          <ArrowLeft size={14} />
          ย้อนกลับ
        </button>
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
          เริ่มใช้ Riff
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
  progress: { total: number; done: number; currentTitle: string | null }
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
        className="font-serif-display text-foreground mt-5"
        style={{ fontSize: 24, lineHeight: 1.2 }}
      >
        {progress.done < progress.total
          ? 'กำลังดึง content เข้ามา'
          : 'พร้อมแล้ว — กำลังพาไป Discover'}
      </h2>
      <p className="text-text-muted mt-3" style={{ fontSize: 14, maxWidth: 380, margin: '12px auto 0' }}>
        {progress.currentTitle
          ? `ดึงจาก ${progress.currentTitle}...`
          : 'Riff กำลังคำนวณ Outlier Score ของทุกวิดีโอ จะได้ตัวที่ดังเกินค่าเฉลี่ย channel มาให้คุณดู'}
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
          className="text-2xs text-text-muted mt-2 tabular-nums"
        >
          {progress.done} / {progress.total} channels
        </div>
      </div>
    </div>
  )
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toString()
}
