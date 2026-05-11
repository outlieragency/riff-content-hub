/**
 * Typed HTTP client to talk to the FastAPI worker.
 *
 * Server-side ใช้เท่านั้น (ใช้ WORKER_SECRET ใน Authorization header)
 * เรียกจาก server actions / route handlers
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

export type ChannelRefKind = 'handle' | 'channel_id' | 'custom'

export type SyncChannelResponse = {
  channel_uuid: string
  youtube_channel_id: string
  videos_synced: number
  channel_avg_views: number | null
  niches?: string[]
}

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
  meta: {
    model: string
    input_tokens: number
    output_tokens: number
    cache_read_input_tokens: number
    cache_creation_input_tokens: number
    latency_ms: number
    cache_hit_ratio: number
    stop_reason: string | null
  }
}

export const worker = {
  ping: () => call<{ ok: boolean; authenticated: boolean }>('GET', '/internal/ping'),

  syncChannel: (params: {
    user_id: string
    ref_kind: ChannelRefKind
    ref_value: string
    video_limit?: number
    mode?: 'top_viewed' | 'recent' | 'hybrid'
  }) => call<SyncChannelResponse>('POST', '/scrape/channel', params),

  previewChannel: (params: {
    url: string
  }) =>
    call<{
      youtube_channel_id: string
      handle: string | null
      title: string
      description: string | null
      thumbnail_url: string | null
      subscriber_count: number | null
      total_video_count: number | null
    }>('POST', '/scrape/channel/preview', params),

  searchChannels: (params: {
    query: string
    max_results?: number
  }) =>
    call<{
      hits: {
        youtube_channel_id: string
        handle: string | null
        title: string
        thumbnail_url: string | null
        subscriber_count: number | null
      }[]
    }>('POST', '/scrape/channel/search', params),

  extractVoice: (params: {
    user_id: string
    samples: ExtractVoiceSample[]
  }) => call<ExtractVoiceResponse>('POST', '/voice/extract', params),

  enqueueTranscript: (params: {
    user_id: string
    video_id: string
    force?: boolean
  }) => call<EnqueueResponse>('POST', '/transcripts/enqueue', params),

  enqueueRecreate: (params: {
    user_id: string
    idea_id: string
    format: string
    voice_profile_id?: string
    creative_style_id?: string
    instruction_extra?: string
  }) => call<EnqueueResponse>('POST', '/recreate/enqueue', params),

  previewCover: (params: {
    cover: CoverFieldsPayload
    video_meta?: VideoMetaPayload
    user_id?: string
    draft_id?: string
    creative_style_id?: string
  }) => call<CoverPreviewResponse>('POST', '/cover/preview', params),

  saveCover: (params: {
    user_id: string
    draft_id: string
    cover: CoverFieldsPayload
    video_meta?: VideoMetaPayload
  }) => call<CoverSaveResponse>('POST', '/cover/save', params),

  pushNotion: (params: { user_id: string; draft_id: string }) =>
    call<NotionPushResponse>('POST', '/notion/push', params),

  extractStyle: (params: {
    user_id: string
    references: { image_url: string; label?: string }[]
    format_type?: string
  }) => call<ExtractStyleResponse>('POST', '/styles/extract', params),

  runTool: (params: {
    user_id: string
    tool:
      | 'hook_doctor'
      | 'grade_draft'
      | 'niche_playbook'
      | 'voice_rewrite'
    input: string
    voice_profile?: Record<string, unknown>
  }) => call<ToolRunResponse>('POST', '/tools/run', params),
}

export type ToolRunResponse = {
  output_markdown: string
  meta: {
    model: string
    input_tokens: number
    output_tokens: number
    cache_read_input_tokens: number
    latency_ms: number
    cache_hit_ratio: number
  }
}

export type ExtractStyleResponse = {
  creative_style: {
    color_palette: {
      background: string
      foreground: string
      accent_colors: string[]
      highlight_colors: { primary: string; secondary: string; tertiary: string }
    }
    typography: {
      heading_weight: string
      heading_family: string
      body_weight: string
      is_thai_optimized: boolean
    }
    layout: {
      photo_treatment: string
      photo_position: string
      headline_position: string
      headline_lines: number
      highlight_pattern: string
      brand_mark_position: string
      badge_position: string
    }
    visual_tone: {
      primary_descriptor: string
      energy_level: string
      supporting_descriptors: string[]
    }
    suggested_base_template: string
    style_guide_md: string
    naming_suggestion: string
  }
  meta: {
    model: string
    input_tokens: number
    output_tokens: number
    cache_read_input_tokens: number
    cache_creation_input_tokens: number
    latency_ms: number
    cache_hit_ratio: number
    stop_reason: string | null
  }
}

export type NotionPushResponse = {
  notion_hub_url: string
  notion_output_url: string
}

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
  /** Per-cover font override. Wins over creative_style.renderer_config.fonts. */
  fonts?: { heading?: string; body?: string } | null
}

export type VideoMetaPayload = {
  youtube_video_id?: string | null
  thumbnail_url?: string | null
  channel_name?: string | null
  channel_avatar_url?: string | null
  subscriber_count?: number | null
}

export type CoverPreviewResponse = {
  cover_data_uri: string
  bytes_length: number
}

export type CoverSaveResponse = {
  cover_url: string | null
  warnings: string[]
}

export type EnqueueResponse = {
  job_id: string
  status: string
  deduplicated: boolean
}

export type RunRecreateResponse = {
  draft_id: string
  format: string
  title: string | null
  output: Record<string, unknown>
  output_markdown: string | null
  cache_hit_ratio: number
  latency_ms: number
}

export type TranscriptSummary = {
  main_thesis: string
  hook: string
  body_sections: { heading: string; key_points: string[] }[]
  examples: string[]
  cta: string | null
  takeaways: string[]
}

export type ProcessTranscriptResponse = {
  transcript_id: string
  language: string
  is_thai: boolean
  has_translation: boolean
  summary: TranscriptSummary
  cached: boolean
  timings_ms: Record<string, number>
  cost_meta: Record<string, unknown>
}
