/**
 * Typed HTTP client to talk to the FastAPI worker (Riff v2).
 *
 * Server-side only — uses WORKER_SECRET in Authorization. Call from
 * server actions / Next.js route handlers, never from client components.
 */

const WORKER_URL = process.env.WORKER_URL!
const WORKER_SECRET = process.env.WORKER_SECRET!

type WorkerError = { detail: string }

async function call<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  if (!WORKER_URL || !WORKER_SECRET) {
    throw new Error('WORKER_URL or WORKER_SECRET env not set')
  }
  const res = await fetch(`${WORKER_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${WORKER_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) {
    let detail = `worker ${res.status}`
    try {
      const err = (await res.json()) as WorkerError
      detail = err.detail ?? detail
    } catch {}
    throw new Error(detail)
  }
  return (await res.json()) as T
}

// =====================================================================
// Voice profile (background extract — no UI in v2)
// =====================================================================

export type ExtractVoiceSample = {
  text: string
  type?: string
  date?: string
}

export type ExtractVoiceResponse = {
  voice_profile: {
    tone_words: string[]
    signature_phrases: string[]
    vocabulary: { thai_english_mix: number; register: string }
    sentence_rhythm: string
    dos: string[]
    donts: string[]
    samples: { text: string; type?: string; date?: string }[]
  }
  meta: Record<string, unknown>
}

// =====================================================================
// Generate (paste URL → FB post + cover)
// =====================================================================

export type VideoMetaPayload = {
  youtube_video_id?: string | null
  thumbnail_url?: string | null
  channel_name?: string | null
  channel_avatar_url?: string | null
  subscriber_count?: number | null
}

export type GenerateResponse = {
  draft_id: string
  title: string
  content: string
  cover_url: string | null
  cover_data: {
    line1: string
    line2: string
    line3: string
    line1_highlight?: string | null
    line2_highlight?: string | null
    line3_highlight?: string | null
    subhead?: string | null
    arrow_caption_top?: string | null
    arrow_caption_bottom?: string | null
    arrow_position?: string | null
    cover_template?: string | null
  }
  video_meta: VideoMetaPayload
  style_warnings: string[]
  cache_hit_ratio: number
  latency_ms: number
}

// =====================================================================
// Cover edit (live preview + save)
// =====================================================================

export type LineStylePayload = {
  highlight_color?: string | null
  highlight_style?: 'background' | 'text-color' | null
  font_size_pct?: number | null
  font_weight?: number | null
}

export type CoverFieldsPayload = {
  line1: string
  line2: string
  line3: string
  line1_highlight?: string | null
  line2_highlight?: string | null
  line3_highlight?: string | null
  line1_style?: LineStylePayload | null
  line2_style?: LineStylePayload | null
  line3_style?: LineStylePayload | null
  subhead?: string | null
  arrow_caption_top?: string | null
  arrow_caption_bottom?: string | null
  arrow_position?: string
  cover_template?: string
}

export type CoverPreviewResponse = {
  cover_data_uri: string
  bytes_length: number
}

export type CoverSaveResponse = {
  cover_url: string | null
  warnings: string[]
}

// =====================================================================
// Worker client
// =====================================================================

export const worker = {
  ping: () =>
    call<{ ok: boolean; authenticated: boolean }>('GET', '/internal/ping'),

  generate: (params: {
    user_id: string
    url: string
    instruction_extra?: string | null
  }) => call<GenerateResponse>('POST', '/generate', params),

  extractVoice: (params: {
    user_id: string
    samples: ExtractVoiceSample[]
  }) => call<ExtractVoiceResponse>('POST', '/voice/extract', params),

  previewCover: (params: {
    cover: CoverFieldsPayload
    video_meta?: VideoMetaPayload
    user_id?: string
    draft_id?: string
  }) => call<CoverPreviewResponse>('POST', '/cover/preview', params),

  saveCover: (params: {
    user_id: string
    draft_id: string
    cover: CoverFieldsPayload
    video_meta?: VideoMetaPayload
  }) => call<CoverSaveResponse>('POST', '/cover/save', params),
}
