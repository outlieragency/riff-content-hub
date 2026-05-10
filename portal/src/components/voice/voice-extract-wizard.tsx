'use client'

import { useMemo, useState, useTransition } from 'react'
import { Loader2, Sparkles, Plus, Trash2, ArrowLeft, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import {
  applyExtractedVoice,
  extractVoiceFromSamples,
  type ExtractVoiceResult,
} from '@/lib/actions/voice'
import { type VoiceProfile } from '@/lib/types/voice-profile'

type Stage = 'input' | 'review'

type SampleDraft = {
  id: number
  text: string
  type: string
}

const SAMPLE_TYPES = [
  { value: '', label: '— ระบุ type (optional)' },
  { value: 'youtube_caption', label: 'YouTube caption' },
  { value: 'youtube_transcript', label: 'YouTube transcript' },
  { value: 'tweet', label: 'Tweet / thread' },
  { value: 'blog_post', label: 'Blog post' },
  { value: 'ig_caption', label: 'IG caption' },
  { value: 'other', label: 'อื่น ๆ' },
]

const MIN_LEN = 20

let nextId = 1
function makeDraft(): SampleDraft {
  return { id: nextId++, text: '', type: '' }
}

export function VoiceExtractWizard({
  profileId,
  open,
  onClose,
  onApplied,
}: {
  profileId: string
  open: boolean
  onClose: () => void
  onApplied: (next: VoiceProfile) => void
}) {
  const [stage, setStage] = useState<Stage>('input')
  const [drafts, setDrafts] = useState<SampleDraft[]>(() => [makeDraft(), makeDraft(), makeDraft()])
  const [extraction, setExtraction] = useState<
    Extract<ExtractVoiceResult, { ok: true }> | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [extracting, startExtract] = useTransition()
  const [applying, startApply] = useTransition()

  const validCount = useMemo(
    () => drafts.filter((d) => d.text.trim().length >= MIN_LEN).length,
    [drafts],
  )

  function reset() {
    setStage('input')
    setDrafts([makeDraft(), makeDraft(), makeDraft()])
    setExtraction(null)
    setError(null)
  }

  function close() {
    if (extracting || applying) return
    reset()
    onClose()
  }

  function update(id: number, patch: Partial<SampleDraft>) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  function addDraft() {
    setDrafts((ds) => [...ds, makeDraft()])
  }

  function removeDraft(id: number) {
    setDrafts((ds) => (ds.length <= 1 ? ds : ds.filter((d) => d.id !== id)))
  }

  function onExtract() {
    setError(null)
    startExtract(async () => {
      const payload = drafts
        .map((d) => ({
          text: d.text.trim(),
          type: d.type || undefined,
        }))
        .filter((s) => s.text.length >= MIN_LEN)

      const res = await extractVoiceFromSamples(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setExtraction(res)
      setStage('review')
    })
  }

  function onApply() {
    if (!extraction) return
    setError(null)
    startApply(async () => {
      const newSamples = drafts
        .map((d) => ({ text: d.text.trim(), type: d.type || undefined }))
        .filter((s) => s.text.length >= MIN_LEN)

      const res = await applyExtractedVoice(profileId, extraction.voice_profile, newSamples)
      if (!res.ok) {
        setError(res.error ?? 'apply failed')
        return
      }
      onApplied(extraction.voice_profile)
      reset()
      onClose()
    })
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={stage === 'input' ? 'Extract voice from samples' : 'Review extracted profile'}
      description={
        stage === 'input'
          ? 'วาง content เก่า 3-10 ชิ้น (caption, post, transcript) AI จะวิเคราะห์เป็น profile ที่คุณ edit ต่อได้'
          : 'AI ดึง pattern จาก samples ที่คุณวาง ตรวจสอบก่อน apply ทับ profile ปัจจุบัน'
      }
      size="lg"
    >
      {stage === 'input' && (
        <div className="space-y-3">
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 -mr-1">
            {drafts.map((d, i) => {
              const valid = d.text.trim().length >= MIN_LEN
              return (
                <div key={d.id} className="rounded-[10px] border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Sample {i + 1}
                    </span>
                    <select
                      value={d.type}
                      onChange={(e) => update(d.id, { type: e.target.value })}
                      disabled={extracting}
                      className="h-7 px-2 text-xs rounded-[6px] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      {SAMPLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`ml-auto text-2xs ${valid ? 'text-status-green-text' : 'text-muted-foreground'}`}
                    >
                      {d.text.trim().length} chars
                    </span>
                    {drafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDraft(d.id)}
                        disabled={extracting}
                        aria-label="ลบ sample"
                        className="w-6 h-6 rounded-[6px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={d.text}
                    onChange={(e) => update(d.id, { text: e.target.value })}
                    disabled={extracting}
                    placeholder="วาง content sample ของคุณตรงนี้ (อย่างน้อย 20 ตัวอักษร)"
                    className="w-full min-h-[100px] px-3 py-2 rounded-[8px] border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                  />
                </div>
              )
            })}

            <button
              type="button"
              onClick={addDraft}
              disabled={extracting}
              className="w-full h-9 rounded-[8px] border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={13} />
              เพิ่ม sample
            </button>
          </div>

          {error && (
            <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              พร้อม {validCount} / {drafts.length} sample · ขั้นต่ำ {MIN_LEN} ตัวอักษรต่อชิ้น
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                disabled={extracting}
                className="h-9 px-4 rounded-[8px] text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onExtract}
                disabled={extracting || validCount === 0}
                className="h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {extracting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Extract
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'review' && extraction && (
        <div className="space-y-4">
          <ExtractionPreview profile={extraction.voice_profile} />

          <div className="rounded-[10px] border border-border-soft bg-secondary/30 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
            <div>Model: <span className="text-foreground font-mono">{extraction.meta.model}</span></div>
            <div>
              Tokens: in <span className="font-mono">{extraction.meta.input_tokens}</span> ·
              cached <span className="font-mono">{extraction.meta.cache_read_input_tokens}</span> ·
              out <span className="font-mono">{extraction.meta.output_tokens}</span>
            </div>
            <div>
              Latency: <span className="font-mono">{extraction.meta.latency_ms} ms</span> ·
              Cache hit ratio: <span className="font-mono">{(extraction.meta.cache_hit_ratio * 100).toFixed(1)}%</span>
            </div>
          </div>

          {error && (
            <div className="bg-status-red-bg border border-status-red-border rounded-[8px] px-3 py-2 text-sm text-status-red-text">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStage('input')}
              disabled={applying}
              className="h-9 px-3 rounded-[8px] text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              แก้ samples
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                disabled={applying}
                className="h-9 px-4 rounded-[8px] text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={applying}
                className="h-9 px-4 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {applying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                ใช้ profile นี้
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ExtractionPreview({ profile }: { profile: VoiceProfile }) {
  return (
    <div className="space-y-3">
      <PreviewRow label="Tone" items={profile.tone_words} />
      <PreviewRow label="Signature phrases" items={profile.signature_phrases} />
      <div className="rounded-[10px] border border-border p-3">
        <div className="text-xs font-medium text-foreground mb-1">Vocabulary</div>
        <div className="text-sm text-muted-foreground">
          ภาษาไทย {profile.vocabulary.thai_english_mix}% / อังกฤษ {100 - profile.vocabulary.thai_english_mix}% ·
          register: <span className="text-foreground">{profile.vocabulary.register}</span>
        </div>
      </div>
      {profile.sentence_rhythm && (
        <div className="rounded-[10px] border border-border p-3">
          <div className="text-xs font-medium text-foreground mb-1">Sentence rhythm</div>
          <div className="text-sm text-muted-foreground">{profile.sentence_rhythm}</div>
        </div>
      )}
      <PreviewRow label="Do's" items={profile.dos} variant="do" />
      <PreviewRow label="Don'ts" items={profile.donts} variant="dont" />
    </div>
  )
}

function PreviewRow({
  label,
  items,
  variant,
}: {
  label: string
  items: string[]
  variant?: 'do' | 'dont'
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[10px] border border-border p-3">
        <div className="text-xs font-medium text-foreground mb-1">{label}</div>
        <div className="text-sm text-muted-foreground italic">— AI ไม่พบ pattern ชัดใน samples</div>
      </div>
    )
  }
  return (
    <div className="rounded-[10px] border border-border p-3">
      <div className="text-xs font-medium text-foreground mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span
            key={i}
            className={`text-xs px-2 py-1 rounded-[6px] border ${
              variant === 'do'
                ? 'bg-status-green-bg border-status-green-border text-status-green-text'
                : variant === 'dont'
                  ? 'bg-status-red-bg border-status-red-border text-status-red-text'
                  : 'bg-secondary border-border text-foreground'
            }`}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}
