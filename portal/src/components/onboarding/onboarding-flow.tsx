'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import {
  addChannelFromOnboarding,
  completeOnboarding,
  previewChannelFromUrl,
  searchChannelsByHandle,
  type ChannelPreview,
  type ChannelSearchHit,
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

  // Step 1 — channels (Eden-style search-as-you-type)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ChannelSearchHit[]>([])
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

  // Debounced search — fires 350ms after last keystroke
  const searchTokenRef = useRef(0)
  useEffect(() => {
    const trimmed = query.trim().replace(/^@/, '')
    if (trimmed.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([])
      setSearching(false)
      return
    }

    // If user pasted a full URL, fall back to URL preview (single result)
    if (trimmed.includes('youtube.com/') || trimmed.includes('youtu.be/')) {
      const myToken = ++searchTokenRef.current
      setSearching(true)
      const timer = setTimeout(async () => {
        const res = await previewChannelFromUrl(trimmed)
        if (myToken !== searchTokenRef.current) return
        setSearching(false)
        if (res.ok) {
          setSearchResults([
            {
              youtube_channel_id: res.channel.youtube_channel_id,
              handle: res.channel.handle,
              title: res.channel.title,
              thumbnail_url: res.channel.thumbnail_url,
              subscriber_count: res.channel.subscriber_count,
            },
          ])
        } else {
          setSearchResults([])
          setError(res.error)
        }
      }, 350)
      return () => clearTimeout(timer)
    }

    const myToken = ++searchTokenRef.current
    setSearching(true)
    setError(null)
    const timer = setTimeout(async () => {
      const res = await searchChannelsByHandle(trimmed)
      if (myToken !== searchTokenRef.current) return
      setSearching(false)
      if (res.ok) {
        setSearchResults(res.hits)
      } else {
        setSearchResults([])
        setError(res.error)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  function selectChannel(hit: ChannelSearchHit) {
    if (
      confirmedChannels.some(
        (c) => c.youtube_channel_id === hit.youtube_channel_id,
      )
    ) {
      setError('เพิ่มช่องนี้ไปแล้ว')
      return
    }
    const channel: ChannelPreview = {
      youtube_channel_id: hit.youtube_channel_id,
      handle: hit.handle,
      title: hit.title,
      description: null,
      thumbnail_url: hit.thumbnail_url,
      subscriber_count: hit.subscriber_count,
      total_video_count: null,
    }
    setConfirmedChannels((prev) => [...prev, { ...channel, _addedAt: Date.now() }])
    setQuery('')
    setSearchResults([])
    setError(null)
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
          query={query}
          setQuery={setQuery}
          searching={searching}
          searchResults={searchResults}
          confirmedChannels={confirmedChannels}
          error={error}
          onSelect={selectChannel}
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
  query,
  setQuery,
  searching,
  searchResults,
  confirmedChannels,
  error,
  onSelect,
  onRemove,
  onNext,
}: {
  query: string
  setQuery: (v: string) => void
  searching: boolean
  searchResults: ChannelSearchHit[]
  confirmedChannels: SavedChannel[]
  error: string | null
  onSelect: (hit: ChannelSearchHit) => void
  onRemove: (id: string) => void
  onNext: () => void
}) {
  const showDropdown =
    query.trim().length >= 2 && (searching || searchResults.length > 0)

  return (
    <>
      <p
        className="text-text-secondary"
        style={{ fontSize: 16, lineHeight: 1.6 }}
      >
        พิมพ์ <strong className="text-text-primary">@handle</strong> หรือชื่อ channel
        ที่อยากให้ Riff ตามดู Riff จะ scan content ทุกวันแล้วเอา outliers
        มาให้เลือก
      </p>

      <div className="mt-7 relative">
        <div
          className="flex items-center gap-2"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(26,36,24,0.14)',
            borderRadius: 999,
            padding: '6px 6px 6px 16px',
            boxShadow: showDropdown
              ? '0 1px 2px rgba(9,50,31,0.04), 0 28px 72px -22px rgba(9,50,31,0.26)'
              : '0 1px 2px rgba(9,50,31,0.04)',
            transition: 'box-shadow .2s',
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: 'Lora, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 22,
              color: '#09321F',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            @
          </span>
          <span
            aria-hidden
            style={{
              width: 1,
              height: 18,
              background: 'rgba(26,36,24,0.14)',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="earthrati"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent border-0 outline-none text-text-primary"
            style={{ fontSize: 16, height: 40 }}
          />
          <button
            type="button"
            onClick={() => searchResults[0] && onSelect(searchResults[0])}
            disabled={searching || searchResults.length === 0}
            className="inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
            style={{
              background: '#09321F',
              color: '#F1ECDF',
              height: 36,
              width: 36,
            }}
            aria-label="เพิ่ม"
          >
            {searching ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </div>

        {/* Dropdown results — Eden-style */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 mt-2 rounded-[14px] overflow-hidden z-10"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(26,36,24,0.10)',
              boxShadow:
                '0 24px 60px -16px rgba(26,36,24,0.22), 0 4px 12px rgba(26,36,24,0.06)',
              maxHeight: 380,
              overflowY: 'auto',
            }}
          >
            {searching && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-text-muted">
                <Loader2 className="animate-spin inline mr-2" size={14} />
                กำลังค้นหา...
              </div>
            )}
            {!searching && searchResults.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-text-muted">
                ไม่พบ channel ลองเปลี่ยนคำค้นหา
              </div>
            )}
            {searchResults.map((hit) => (
              <button
                key={hit.youtube_channel_id}
                type="button"
                onClick={() => onSelect(hit)}
                className="w-full text-left transition-colors hover:bg-secondary/40"
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(26,36,24,0.05)',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-3">
                  {hit.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hit.thumbnail_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                      style={{ background: 'rgba(26,36,24,0.06)' }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full shrink-0"
                      style={{ background: 'rgba(26,36,24,0.10)' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold text-text-primary truncate"
                      style={{ fontSize: 15 }}
                    >
                      {hit.title}
                    </div>
                    <div
                      className="text-text-muted truncate"
                      style={{ fontSize: 13, marginTop: 1 }}
                    >
                      {hit.handle && `@${hit.handle}`}
                      {hit.subscriber_count != null && (
                        <>
                          {hit.handle && ' · '}
                          {formatCount(hit.subscriber_count)} followers
                        </>
                      )}
                    </div>
                  </div>
                  <YouTubePlatformBadge />
                </div>
              </button>
            ))}
          </div>
        )}

        {error && !showDropdown && (
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

      {/* "Other platforms coming soon" hint */}
      <div
        className="mt-4 inline-flex items-center gap-2 text-xs text-text-muted"
        style={{ fontSize: 12 }}
      >
        <span>ตอนนี้รองรับ YouTube · Instagram / TikTok / X เร็ว ๆ นี้</span>
      </div>

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

function YouTubePlatformBadge() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md shrink-0"
      style={{
        width: 28,
        height: 28,
        background: 'rgba(255,71,71,0.10)',
      }}
      aria-label="YouTube"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
        />
      </svg>
    </span>
  )
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toString()
}
