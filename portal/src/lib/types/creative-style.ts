/**
 * Creative style JSONB shapes
 *
 * Symmetric พี่ voice_profile แต่สำหรับภาพ
 *   reference_images: refs ที่ user upload
 *   style_guide_md:   markdown ที่ AI extract + user edit (ฝั่ง render-time prompt)
 *   renderer_config:  base_template + theme + fonts + layout overrides
 */

export type FormatType = 'cover' | 'carousel' | 'thumbnail' | 'reel'

export type ReferenceImage = {
  url: string
  caption?: string
  uploaded_at?: string
}

export type StyleHighlightColors = {
  primary: string
  secondary: string
  tertiary: string
}

export type StyleColorPalette = {
  background: string
  foreground: string
  accent_colors: string[]
  highlight_colors: StyleHighlightColors
}

export type StyleTypography = {
  heading_weight: 'extra-bold' | 'bold' | 'medium' | 'regular'
  heading_family: 'sans-serif' | 'serif' | 'display' | 'mono'
  body_weight: 'regular' | 'medium'
  is_thai_optimized: boolean
}

export type StyleLayout = {
  photo_treatment: 'full-bleed' | 'framed' | 'masked' | 'cutout' | 'none'
  photo_position: string
  headline_position: string
  headline_lines: number
  highlight_pattern: string
  brand_mark_position: string
  badge_position: string
}

export type StyleVisualTone = {
  primary_descriptor: string
  energy_level: 'high' | 'medium' | 'low'
  supporting_descriptors: string[]
}

export type BaseTemplate =
  | 'headliner'
  | 'minimal'
  | 'split'
  | 'minimal-card'
  | 'bold-quote'
  | 'full-text'
  | 'photo-frame'

export type RendererConfig = {
  base_template: BaseTemplate
  theme: {
    bg: string
    fg: string
    accent: string
    hl_red?: string
    hl_yellow?: string
    hl_orange?: string
  }
  fonts: {
    heading: string
    body: string
  }
  layout_overrides?: Record<string, unknown>
}

/** AI extraction output — what worker /styles/extract returns. */
export type ExtractedCreativeStyle = {
  color_palette: StyleColorPalette
  typography: StyleTypography
  layout: StyleLayout
  visual_tone: StyleVisualTone
  suggested_base_template: BaseTemplate
  style_guide_md: string
  naming_suggestion: string
}

export type CreativeStyleRow = {
  id: string
  name: string
  format_type: FormatType
  reference_images: ReferenceImage[]
  style_guide_md: string
  renderer_config: RendererConfig
  is_default: boolean
  created_at: string
  updated_at: string
}

export type CreativeStyleSummary = {
  id: string
  name: string
  format_type: FormatType
  is_default: boolean
  reference_image_count: number
  thumbnail_url: string | null
  updated_at: string
}

export const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  base_template: 'headliner',
  theme: {
    bg: '#000000',
    fg: '#FFFFFF',
    accent: '#FF6B1A',
    hl_red: '#E53935',
    hl_yellow: '#FFD400',
    hl_orange: '#FF6B1A',
  },
  fonts: {
    heading: 'Noto Sans Thai',
    body: 'Noto Sans Thai',
  },
}

/** Convert AI extraction output → renderer_config object. */
export function extractedToRendererConfig(
  ext: ExtractedCreativeStyle,
): RendererConfig {
  const accent = ext.color_palette.accent_colors[0] ?? '#FF6B1A'
  return {
    base_template: ext.suggested_base_template,
    theme: {
      bg: ext.color_palette.background,
      fg: ext.color_palette.foreground,
      accent,
      hl_red: ext.color_palette.highlight_colors.primary,
      hl_yellow: ext.color_palette.highlight_colors.secondary,
      hl_orange: ext.color_palette.highlight_colors.tertiary,
    },
    fonts: {
      heading: ext.typography.is_thai_optimized
        ? 'Noto Sans Thai'
        : 'Inter',
      body: ext.typography.is_thai_optimized
        ? 'Noto Sans Thai'
        : 'Inter',
    },
  }
}

export function normalizeCreativeStyle(
  row: Partial<CreativeStyleRow>,
): CreativeStyleRow {
  return {
    id: row.id ?? '',
    name: row.name ?? 'Untitled style',
    format_type: (row.format_type as FormatType) ?? 'cover',
    reference_images: Array.isArray(row.reference_images)
      ? row.reference_images
      : [],
    style_guide_md: row.style_guide_md ?? '',
    renderer_config: row.renderer_config ?? DEFAULT_RENDERER_CONFIG,
    is_default: !!row.is_default,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  }
}
