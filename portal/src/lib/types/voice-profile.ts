/**
 * Voice profile JSONB shape
 * Reuse จาก Operation/products/outlier-carousel/SPEC.md §6
 *
 * เก็บใน voice_profiles.voice_profile (jsonb)
 * worker ใช้ render เข้า cache prefix ของทุก recreate call
 */

export type VoiceSample = {
  text: string
  type?: string         // youtube_caption | tweet | blog_post | ig_caption | other
  date?: string         // ISO date
}

export type VoiceVocabulary = {
  thai_english_mix: number  // 0-100, % Thai (เช่น 70 = ไทย 70 อังกฤษ 30)
  register: string          // 'casual but substantive' | 'formal' | etc
}

export type VoiceProfile = {
  tone_words: string[]
  signature_phrases: string[]
  vocabulary: VoiceVocabulary
  sentence_rhythm: string
  dos: string[]
  donts: string[]
  samples: VoiceSample[]
}

export const EMPTY_VOICE: VoiceProfile = {
  tone_words: [],
  signature_phrases: [],
  vocabulary: { thai_english_mix: 70, register: 'casual but substantive' },
  sentence_rhythm: '',
  dos: [],
  donts: [],
  samples: [],
}

export function normalizeVoice(v: Partial<VoiceProfile> | null | undefined): VoiceProfile {
  if (!v) return { ...EMPTY_VOICE }
  return {
    tone_words: v.tone_words ?? [],
    signature_phrases: v.signature_phrases ?? [],
    vocabulary: {
      thai_english_mix: v.vocabulary?.thai_english_mix ?? 70,
      register: v.vocabulary?.register ?? 'casual but substantive',
    },
    sentence_rhythm: v.sentence_rhythm ?? '',
    dos: v.dos ?? [],
    donts: v.donts ?? [],
    samples: v.samples ?? [],
  }
}
