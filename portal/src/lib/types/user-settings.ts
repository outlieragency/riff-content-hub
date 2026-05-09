/**
 * User settings shape — mirrors public.user_settings table.
 * API keys are NEVER sent to client; only masked previews.
 */

export type LanguagePref = 'th' | 'en'

export type ProviderId = 'anthropic' | 'openai' | 'google' | 'openrouter'

export type TaskKind =
  | 'voice_extract'
  | 'transcript_translate'
  | 'transcript_summarize'
  | 'recreate_content'
  | 'style_extract'

export type ProviderStatus = 'configured' | 'not_configured' | 'invalid'

export type ProviderInfo = {
  id: ProviderId
  name: string
  description: string
  available: boolean // false = "Coming soon"
  status: ProviderStatus
  maskedKey: string | null // e.g. "sk-ant-***...3a2f"
}

export type ModelOption = {
  id: string
  label: string
  provider: ProviderId
  description?: string
  available: boolean
}

export type UserSettingsView = {
  user_id: string
  email: string
  display_name: string | null
  timezone: string
  language: LanguagePref
  providers: ProviderInfo[]
  task_models: Record<TaskKind, string>
  notion: {
    configured: boolean
    masked_token: string | null
    content_hub_dsid: string | null
    output_tracker_dsid: string | null
  }
}

export const DEFAULT_TASK_MODELS: Record<TaskKind, string> = {
  voice_extract: 'claude-haiku-4-5',
  transcript_translate: 'claude-haiku-4-5',
  transcript_summarize: 'claude-sonnet-4-6',
  recreate_content: 'claude-sonnet-4-6',
  style_extract: 'claude-sonnet-4-6',
}

export const TASK_LABELS: Record<TaskKind, string> = {
  voice_extract: 'Voice Extraction',
  transcript_translate: 'Transcript Translate',
  transcript_summarize: 'Transcript Summarize',
  recreate_content: 'Content Recreate',
  style_extract: 'Style Extraction',
}

export const TASK_DESCRIPTIONS: Record<TaskKind, string> = {
  voice_extract: 'AI สกัด voice profile จาก samples',
  transcript_translate: 'แปล transcript ภาษาอื่นเป็นไทย',
  transcript_summarize: 'สรุป transcript เป็น JSON sections',
  recreate_content: 'สร้าง FB post / YT script / Reels / Carousel',
  style_extract: 'AI Vision อ่าน reference cover → style guide',
}

export const PROVIDER_META: Record<
  ProviderId,
  { name: string; description: string; available: boolean }
> = {
  anthropic: {
    name: 'Anthropic',
    description: 'Claude Sonnet/Haiku · ดีที่สุดสำหรับเขียนไทย + prompt caching native',
    available: true,
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-5 / GPT-5-mini · structured output แม่นยำ',
    available: false,
  },
  google: {
    name: 'Google (Gemini)',
    description: 'Gemini 2.0 Flash · ราคาถูกที่สุด, 1M context',
    available: false,
  },
  openrouter: {
    name: 'OpenRouter',
    description: '1 key เข้าได้ 100+ models · routing + fallback',
    available: false,
  },
}

/** Available models per provider — used to populate task model dropdowns. */
export const PROVIDER_MODELS: Record<ProviderId, ModelOption[]> = {
  anthropic: [
    {
      id: 'claude-haiku-4-5',
      label: 'Claude Haiku 4.5',
      provider: 'anthropic',
      description: 'เร็ว ราคาถูก เหมาะกับ pattern-match',
      available: true,
    },
    {
      id: 'claude-sonnet-4-6',
      label: 'Claude Sonnet 4.6',
      provider: 'anthropic',
      description: 'Default — quality + price balance',
      available: true,
    },
    {
      id: 'claude-opus-4-7',
      label: 'Claude Opus 4.7 (1M context)',
      provider: 'anthropic',
      description: 'Premium — long context + best reasoning',
      available: true,
    },
  ],
  openai: [
    {
      id: 'gpt-5',
      label: 'GPT-5',
      provider: 'openai',
      description: 'Coming soon',
      available: false,
    },
    {
      id: 'gpt-5-mini',
      label: 'GPT-5 mini',
      provider: 'openai',
      description: 'Coming soon · ถูกกว่า',
      available: false,
    },
  ],
  google: [
    {
      id: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      provider: 'google',
      description: 'Coming soon · ถูกที่สุด',
      available: false,
    },
    {
      id: 'gemini-2.0-pro',
      label: 'Gemini 2.0 Pro',
      provider: 'google',
      description: 'Coming soon',
      available: false,
    },
  ],
  openrouter: [],
}

export function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 12) return key.slice(0, 4) + '***'
  const prefix = key.slice(0, 7)
  const suffix = key.slice(-4)
  return `${prefix}***...${suffix}`
}

export function isAvailableModel(modelId: string): boolean {
  for (const list of Object.values(PROVIDER_MODELS)) {
    const m = list.find((x) => x.id === modelId)
    if (m) return m.available
  }
  return false
}
