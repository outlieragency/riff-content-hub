'use client'

import { useState, useTransition, useEffect } from 'react'
import { Save, Loader2, Check, Sparkles } from 'lucide-react'
import { updateVoiceProfile, renameVoiceProfile, type VoiceProfileRow } from '@/lib/actions/voice'
import { type VoiceProfile } from '@/lib/types/voice-profile'
import { ChipList } from './chip-list'
import { RuleList } from './rule-list'
import { VoiceExtractWizard } from './voice-extract-wizard'

const REGISTERS = [
  { value: 'casual but substantive', label: 'casual ที่มีสาระ' },
  { value: 'casual', label: 'สบาย ๆ' },
  { value: 'professional', label: 'ทางการ' },
  { value: 'expert', label: 'เชี่ยวชาญ' },
  { value: 'provocative', label: 'แรง ตรง' },
]

export function VoiceEditor({ initial }: { initial: VoiceProfileRow }) {
  const [name, setName] = useState(initial.name)
  const [profile, setProfile] = useState<VoiceProfile>(initial.voice_profile)
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractOpen, setExtractOpen] = useState(false)

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [saved])

  function patch<K extends keyof VoiceProfile>(key: K, value: VoiceProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function patchVocab<K extends keyof VoiceProfile['vocabulary']>(
    key: K,
    value: VoiceProfile['vocabulary'][K],
  ) {
    setProfile((p) => ({
      ...p,
      vocabulary: { ...p.vocabulary, [key]: value },
    }))
  }

  function onSave() {
    setError(null)
    start(async () => {
      if (name !== initial.name) {
        const r1 = await renameVoiceProfile(initial.id, name)
        if (!r1.ok) {
          setError(r1.error ?? 'rename failed')
          return
        }
      }
      const res = await updateVoiceProfile(initial.id, profile)
      if (!res.ok) {
        setError(res.error ?? 'save failed')
        return
      }
      setSaved(true)
    })
  }

  const dirty =
    name !== initial.name ||
    JSON.stringify(profile) !== JSON.stringify(initial.voice_profile)

  return (
    <div className="space-y-5">
      <div className="surface-1 rounded-[14px] p-5">
        <div className="flex items-center justify-between mb-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-md font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-brand rounded-[6px] px-1 -mx-1"
          />
          <button
            type="button"
            onClick={() => setExtractOpen(true)}
            disabled={pending}
            className="text-xs text-brand hover:text-brand-hover inline-flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} />
            Extract from samples
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          AI ใช้ profile นี้ตอน recreate ทุกชิ้น แก้ field ไหนก็ได้ตามต้องการ
        </p>
      </div>

      <Section title="Tone" hint="คำสั้น ๆ บอก vibe ของคุณ Enter เพื่อเพิ่ม">
        <ChipList
          values={profile.tone_words}
          onChange={(v) => patch('tone_words', v)}
          placeholder="direct, practical, no-fluff"
          disabled={pending}
        />
      </Section>

      <Section
        title="Signature phrases"
        hint="วลีหรือคำที่คุณใช้บ่อย AI จะนำมาใช้ในงานที่ generate"
      >
        <ChipList
          values={profile.signature_phrases}
          onChange={(v) => patch('signature_phrases', v)}
          placeholder="ลองดูเดี๋ยวก็รู้เอง, จริง ๆ แล้ว"
          disabled={pending}
        />
      </Section>

      <Section
        title="Vocabulary"
        hint="ระดับความเป็นทางการ และสัดส่วนภาษาไทยในงานของคุณ"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              ภาษาไทย vs อังกฤษ <span className="text-foreground font-medium">{profile.vocabulary.thai_english_mix}/{100 - profile.vocabulary.thai_english_mix}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={profile.vocabulary.thai_english_mix}
              onChange={(e) => patchVocab('thai_english_mix', Number(e.target.value))}
              disabled={pending}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-2xs text-muted-foreground">
              <span>อังกฤษทั้งหมด</span>
              <span>ไทยทั้งหมด</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              ระดับการพูด
            </label>
            <select
              value={profile.vocabulary.register}
              onChange={(e) => patchVocab('register', e.target.value)}
              disabled={pending}
              className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {REGISTERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
              {!REGISTERS.some((r) => r.value === profile.vocabulary.register) && (
                <option value={profile.vocabulary.register}>
                  {profile.vocabulary.register} (custom)
                </option>
              )}
            </select>
          </div>
        </div>
      </Section>

      <Section
        title="Sentence rhythm"
        hint="โครงประโยคของคุณ สั้น ยาว ผสม"
      >
        <textarea
          value={profile.sentence_rhythm}
          onChange={(e) => patch('sentence_rhythm', e.target.value)}
          placeholder="เช่น short punchy 2-8 words, mix with longer when explaining"
          disabled={pending}
          className="w-full min-h-[80px] px-3 py-2 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-y"
        />
      </Section>

      <Section title="Do's" hint="สิ่งที่ AI ควรทำเวลา recreate">
        <RuleList
          values={profile.dos}
          onChange={(v) => patch('dos', v)}
          placeholder="พูดจาก experience จริง ไม่ใช่ทฤษฎี"
          variant="do"
          disabled={pending}
        />
      </Section>

      <Section title="Don'ts" hint="สิ่งที่ AI ห้ามทำเวลา recreate">
        <RuleList
          values={profile.donts}
          onChange={(v) => patch('donts', v)}
          placeholder="ห้าม hype, ห้าม em dash, ห้าม emoji ใน body"
          variant="dont"
          disabled={pending}
        />
      </Section>

      {error && (
        <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
          {error}
        </div>
      )}

      <div className="sticky bottom-4 flex items-center justify-between surface-1 rounded-[14px] px-4 py-3 shadow-md">
        <span className="text-xs text-muted-foreground">
          {saved ? 'บันทึกแล้ว' : dirty ? 'ยังไม่ได้บันทึก' : 'ไม่มีการเปลี่ยน'}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={pending || !dirty}
          className="h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          บันทึก profile
        </button>
      </div>

      <VoiceExtractWizard
        profileId={initial.id}
        open={extractOpen}
        onClose={() => setExtractOpen(false)}
        onApplied={(next) => {
          setProfile(next)
        }}
      />
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="surface-1 rounded-[14px] p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
