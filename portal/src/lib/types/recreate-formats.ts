/**
 * Discriminated union of all recreate output shapes.
 * `recreated_drafts.format` = discriminator
 * `recreated_drafts.output` = matching payload (validated at runtime by Zod ใน worker)
 */

export type RecreateFormat = 'fb_article' | 'yt_script' | 'reels' | 'carousel'

/** FB long-form post (Earth Rati style — May 2026 onward).
 * Replaces previous {title, body_markdown, hashtags} shape.
 */
export type FbArticleCover = {
  hook_framework: string
  headline_pattern: string  // "TT" default
  cover_template: string    // "trendtech-portrait" default
  color_theme: string       // "trendtech" default
  line1: string
  line1_highlight?: string
  line2: string
  line2_highlight?: string
  line3: string
  line3_highlight?: string
  subhead?: string
  arrow_caption_top?: string
  arrow_caption_bottom?: string
  arrow_position?: string
}

export type FbArticleOutput = {
  title: string
  cover: FbArticleCover
  post_body: string         // full FB post following 7-zone skeleton
  section_count: number
  thesis: string
  // Populated post-render by worker (recreate handler):
  cover_url?: string        // Supabase Storage public URL of final cover.png
  cover_photo_url?: string  // public URL of user-supplied cover-photo.png override (P0-2)
  cover_warnings?: string[]
  style_warnings?: string[]
  // Populated when user clicks "Push to Notion" (worker /notion/push):
  notion_hub_url?: string
  notion_output_url?: string
}

export type YtScriptOutput = {
  outline: { heading: string; bullets: string[] }[]
  script_sections: { heading: string; text: string }[]
  title_options: string[]  // 5 options
  thumbnail_brief: {
    visual_description: string
    text_overlay: string
    mood: string
  }
}

export type ReelsOutput = {
  hook: string         // 5s
  body: string         // 30-50s, 1-3 paragraphs
  cta: string          // 5s
  estimated_duration_seconds: number
  visual_cues: string[]
}

export type CarouselSlide =
  | { kind: 'tweet'; text: string; author?: string }
  | { kind: 'cover'; title: string; subtitle?: string }
  | { kind: 'content'; heading: string; body: string }
  | { kind: 'quote'; text: string; attribution?: string }
  | { kind: 'list'; heading: string; items: string[] }
  | { kind: 'cta'; heading: string; body: string; cta_text?: string }

export type CarouselOutput = {
  slug: string
  template: 'thread-x' | 'minimal-thai'
  theme: 'light' | 'dark' | 'cream' | 'orange' | 'white'
  slides: CarouselSlide[]
}

export type RecreateOutputByFormat = {
  fb_article: FbArticleOutput
  yt_script: YtScriptOutput
  reels: ReelsOutput
  carousel: CarouselOutput
}

export const FORMAT_META: Record<
  RecreateFormat,
  { label: string; description: string; icon: string }
> = {
  yt_script: {
    label: 'YouTube Script',
    description: 'Outline, script, ตัวเลือก title และ thumbnail brief',
    icon: 'video',
  },
  fb_article: {
    label: 'Facebook Post',
    description: 'โพสต์ FB long-form ในเสียงเอิร์ธ + cover ภาพปก TrendTech-style',
    icon: 'file-text',
  },
  reels: {
    label: 'Reels Script',
    description: 'Hook, Body, CTA สำหรับวิดีโอแนวตั้ง 30-60 วินาที',
    icon: 'smartphone',
  },
  carousel: {
    label: 'Carousel',
    description: 'JSON ส่งต่อให้ Outlier Carousel render',
    icon: 'layout-grid',
  },
}
