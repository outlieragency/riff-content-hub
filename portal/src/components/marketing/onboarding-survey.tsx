'use client'

import { useState, useTransition } from 'react'
import { saveOnboardingSurvey } from '@/lib/actions/waitlist'

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'other', label: 'อื่น ๆ' },
]

const FOLLOWER_RANGES = [
  { value: '<1k', label: 'ต่ำกว่า 1K' },
  { value: '1k-10k', label: '1K – 10K' },
  { value: '10k-100k', label: '10K – 100K' },
  { value: '100k-1m', label: '100K – 1M' },
  { value: '1m+', label: '1M ขึ้นไป' },
]

const POSTING_FREQ = [
  { value: 'daily', label: 'ลงทุกวัน' },
  { value: 'weekly', label: 'ลงสัปดาห์ละ 2-3 ชิ้น' },
  { value: 'sometimes', label: 'นาน ๆ ลงที' },
  { value: 'never', label: 'ยังไม่ได้เริ่มลง' },
]

export function OnboardingSurvey({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail)
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [followerRange, setFollowerRange] = useState('')
  const [postingFreq, setPostingFreq] = useState('')
  const [pain, setPain] = useState('')
  const [contact, setContact] = useState('')
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function togglePlatform(v: string) {
    setPlatforms((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('ใส่ email ก่อน')
      return
    }
    setError(null)
    start(async () => {
      const res = await saveOnboardingSurvey({
        email,
        name,
        niche,
        primary_platforms: platforms.length > 0 ? platforms : undefined,
        follower_range: followerRange || undefined,
        posting_frequency: postingFreq || undefined,
        pain,
        contact_handle: contact,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <div
        className="rm-soft-card text-center"
        style={{ padding: 40 }}
      >
        <div
          className="inline-flex items-center justify-center rounded-full mx-auto"
          style={{
            width: 56,
            height: 56,
            background: 'rgba(74,123,58,0.12)',
            color: 'var(--rm-success)',
            fontSize: 24,
          }}
        >
          ✓
        </div>
        <h2
          className="mt-5"
          style={{
            fontSize: 'clamp(22px, 2.4vw, 30px)',
            fontWeight: 600,
            lineHeight: 1.2,
            color: 'var(--rm-text)',
            letterSpacing: '-0.02em',
          }}
        >
          เรียบร้อย ขอบคุณมาก
        </h2>
        <p
          className="mt-3 text-[var(--rm-muted)]"
          style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 440, margin: '12px auto 0' }}
        >
          ผมจะ review คำตอบ แล้วเข้ามาทักหาคุณภายใน 2-3 วัน
          ถ้าฟิตจะส่ง access link ให้ใช้ Riff ได้เลย
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rm-soft-card"
      style={{ padding: 'clamp(24px, 3vw, 36px)' }}
    >
      <div className="space-y-5">
        <Field label="อีเมล" required>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
            placeholder="you@studio.co"
          />
        </Field>

        <Field label="ชื่ออะไรเรียก">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Earth, มุก, ปอนด์..."
          />
        </Field>

        <Field label="ทำธุรกิจอะไร / ขายอะไร">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className={INPUT_CLASS}
            placeholder="เช่น online course สอนถ่ายภาพ · agency ทำ ads · coaching ผู้บริหาร"
          />
        </Field>

        <Field label="ลงที่ไหนเป็นหลัก (เลือกได้หลายอัน)">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const active = platforms.includes(p.value)
              return (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => togglePlatform(p.value)}
                  className="transition-colors"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    background: active ? 'var(--rm-text)' : 'transparent',
                    color: active ? '#FBF7EC' : 'var(--rm-text)',
                    border: '1px solid',
                    borderColor: active ? 'var(--rm-text)' : 'rgba(26,36,24,0.18)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="ตอนนี้มี follower ประมาณเท่าไหร่">
          <div className="flex flex-wrap gap-2">
            {FOLLOWER_RANGES.map((r) => {
              const active = followerRange === r.value
              return (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setFollowerRange(active ? '' : r.value)}
                  className="transition-colors"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    background: active ? 'var(--rm-text)' : 'transparent',
                    color: active ? '#FBF7EC' : 'var(--rm-text)',
                    border: '1px solid',
                    borderColor: active ? 'var(--rm-text)' : 'rgba(26,36,24,0.18)',
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="ลงบ่อยแค่ไหนตอนนี้">
          <div className="flex flex-wrap gap-2">
            {POSTING_FREQ.map((f) => {
              const active = postingFreq === f.value
              return (
                <button
                  type="button"
                  key={f.value}
                  onClick={() => setPostingFreq(active ? '' : f.value)}
                  className="transition-colors"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    background: active ? 'var(--rm-text)' : 'transparent',
                    color: active ? '#FBF7EC' : 'var(--rm-text)',
                    border: '1px solid',
                    borderColor: active ? 'var(--rm-text)' : 'rgba(26,36,24,0.18)',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="ปัญหาที่เจอเรื่อง content / marketing คืออะไร">
          <textarea
            value={pain}
            onChange={(e) => setPain(e.target.value)}
            rows={3}
            className={INPUT_CLASS}
            style={{ resize: 'vertical', minHeight: 90, padding: '12px 14px', height: 'auto' }}
            placeholder="เช่น ไม่มีเวลาทำเอง, ทีมยังเล็ก, จ้าง agency แพง, ลงไม่สม่ำเสมอ, idea ไม่ปัง..."
          />
        </Field>

        <Field label="ติดต่อทาง Line / IG (ไม่บังคับ)">
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className={INPUT_CLASS}
            placeholder="@your.handle หรือ Line ID"
          />
        </Field>

        {error && (
          <div
            className="rounded-[8px] px-4 py-3"
            style={{
              background: 'rgba(159,42,24,0.08)',
              color: 'var(--rm-danger)',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rm-btn rm-btn-primary"
          style={{ width: '100%', height: 50, fontSize: 16 }}
        >
          {pending ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
        </button>

        <p
          className="text-center text-[var(--rm-muted-2)]"
          style={{ fontSize: 12.5, lineHeight: 1.5 }}
        >
          ข้อมูลใช้เพื่อ follow up เท่านั้น ไม่แชร์ต่อ
        </p>
      </div>
    </form>
  )
}

const INPUT_CLASS = 'rm-survey-input'

function Field({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-[var(--rm-text)] mb-2"
        style={{ fontSize: 14, fontWeight: 600 }}
      >
        {label}
        {required && <span style={{ color: 'var(--rm-accent)', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  )
}
