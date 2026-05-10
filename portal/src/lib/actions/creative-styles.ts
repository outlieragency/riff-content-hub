'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  type CreativeStyleRow,
  type CreativeStyleSummary,
  type ExtractedCreativeStyle,
  type FormatType,
  type ReferenceImage,
  type RendererConfig,
  extractedToRendererConfig,
  normalizeCreativeStyle,
} from '@/lib/types/creative-style'
import { worker } from '@/lib/worker'

export async function listCreativeStyles(
  formatType?: FormatType,
): Promise<CreativeStyleSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('creative_styles')
    .select('id, name, format_type, is_default, reference_images, updated_at')
    .eq('user_id', user.id)

  if (formatType) query = query.eq('format_type', formatType)

  const { data } = await query.order('is_default', { ascending: false }).order(
    'updated_at',
    { ascending: false },
  )

  return (data ?? []).map((row) => {
    const refs = Array.isArray(row.reference_images)
      ? (row.reference_images as ReferenceImage[])
      : []
    return {
      id: row.id,
      name: row.name,
      format_type: row.format_type as FormatType,
      is_default: row.is_default,
      reference_image_count: refs.length,
      thumbnail_url: refs[0]?.url ?? null,
      updated_at: row.updated_at,
    }
  })
}

export async function getCreativeStyle(
  id: string,
): Promise<CreativeStyleRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('creative_styles')
    .select(
      'id, name, format_type, reference_images, style_guide_md, renderer_config, is_default, created_at, updated_at',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return normalizeCreativeStyle(data)
}

/** Get current default style for a format. Used by recreate to default-select. */
export async function getDefaultCreativeStyle(
  formatType: FormatType,
): Promise<CreativeStyleRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('creative_styles')
    .select(
      'id, name, format_type, reference_images, style_guide_md, renderer_config, is_default, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .eq('format_type', formatType)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (!data) return null
  return normalizeCreativeStyle(data)
}

/** AI extract style from N reference image URLs. */
export async function extractStyleFromReferences(
  imageUrls: string[],
  formatType: FormatType = 'cover',
): Promise<
  | { ok: true; extracted: ExtractedCreativeStyle; meta: { latency_ms: number; cache_hit_ratio: number } }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!imageUrls.length) {
    return { ok: false, error: 'ใส่ reference image อย่างน้อย 1 ภาพ' }
  }

  try {
    const res = await worker.extractStyle({
      user_id: user.id,
      references: imageUrls.map((url) => ({ image_url: url })),
      format_type: formatType,
    })
    return {
      ok: true,
      extracted: res.creative_style as ExtractedCreativeStyle,
      meta: {
        latency_ms: res.meta.latency_ms,
        cache_hit_ratio: res.meta.cache_hit_ratio,
      },
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown extraction error',
    }
  }
}

export async function createCreativeStyle(input: {
  name: string
  format_type: FormatType
  reference_images: ReferenceImage[]
  style_guide_md: string
  renderer_config: RendererConfig
  set_as_default?: boolean
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const trimmed = input.name.trim()
  if (!trimmed) return { ok: false, error: 'ตั้งชื่อ style ก่อน' }

  // If set_as_default, unset existing default for this format first
  if (input.set_as_default) {
    await supabase
      .from('creative_styles')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('format_type', input.format_type)
      .eq('is_default', true)
  }

  const { data, error } = await supabase
    .from('creative_styles')
    .insert({
      user_id: user.id,
      name: trimmed,
      format_type: input.format_type,
      reference_images: input.reference_images,
      style_guide_md: input.style_guide_md,
      renderer_config: input.renderer_config,
      is_default: !!input.set_as_default,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'create failed' }
  }
  revalidatePath('/templates')
  return { ok: true, id: data.id }
}

/** Convenience — wrap extracted output into a creatable creative style. */
export async function createCreativeStyleFromExtract(input: {
  name?: string
  format_type: FormatType
  reference_images: ReferenceImage[]
  extracted: ExtractedCreativeStyle
  set_as_default?: boolean
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = (input.name ?? input.extracted.naming_suggestion ?? 'New Style').trim()
  return createCreativeStyle({
    name,
    format_type: input.format_type,
    reference_images: input.reference_images,
    style_guide_md: input.extracted.style_guide_md,
    renderer_config: extractedToRendererConfig(input.extracted),
    set_as_default: input.set_as_default,
  })
}

export async function updateCreativeStyle(
  id: string,
  patch: Partial<{
    name: string
    style_guide_md: string
    renderer_config: RendererConfig
    reference_images: ReferenceImage[]
  }>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const update: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim()
    if (!trimmed) return { ok: false, error: 'name ห้ามว่าง' }
    update.name = trimmed
  }
  if (patch.style_guide_md !== undefined) update.style_guide_md = patch.style_guide_md
  if (patch.renderer_config !== undefined) update.renderer_config = patch.renderer_config
  if (patch.reference_images !== undefined) update.reference_images = patch.reference_images

  if (Object.keys(update).length === 0) return { ok: true }

  const { error } = await supabase
    .from('creative_styles')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/templates')
  revalidatePath(`/templates/${id}`)
  return { ok: true }
}

export async function setDefaultCreativeStyle(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: target } = await supabase
    .from('creative_styles')
    .select('format_type')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!target) return { ok: false, error: 'style not found' }

  // Unset existing defaults for this format
  await supabase
    .from('creative_styles')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('format_type', target.format_type)
    .eq('is_default', true)

  const { error } = await supabase
    .from('creative_styles')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/templates')
  return { ok: true }
}

export async function deleteCreativeStyle(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Don't delete the only default for a format
  const { data: target } = await supabase
    .from('creative_styles')
    .select('format_type, is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!target) return { ok: false, error: 'style not found' }

  if (target.is_default) {
    const { count } = await supabase
      .from('creative_styles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('format_type', target.format_type)
    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        error: 'ลบไม่ได้ — ต้องมี style อย่างน้อย 1 ตัวต่อ format',
      }
    }
  }

  const { error } = await supabase
    .from('creative_styles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/templates')
  return { ok: true }
}

/** Delete reference image objects from storage when removing/replacing them. */
export async function deleteStyleReferenceObjects(
  paths: string[],
): Promise<{ ok: boolean }> {
  if (!paths.length) return { ok: true }
  const supabase = await createClient()
  await supabase.storage.from('creative-styles').remove(paths)
  return { ok: true }
}

/**
 * Append reference images to an existing creative_style.
 * URLs come from already-uploaded files (Storage public URLs).
 */
export async function addReferenceImagesToStyle(
  styleId: string,
  imageUrls: string[],
): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  if (imageUrls.length === 0) return { ok: true, total: 0 }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: row, error: readErr } = await supabase
    .from('creative_styles')
    .select('reference_images')
    .eq('id', styleId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (readErr || !row) return { ok: false, error: 'style not found' }

  const current = Array.isArray(row.reference_images)
    ? (row.reference_images as ReferenceImage[])
    : []
  const additions: ReferenceImage[] = imageUrls.map((url) => ({
    url,
    uploaded_at: new Date().toISOString(),
  }))
  const next = [...current, ...additions]

  const { error } = await supabase
    .from('creative_styles')
    .update({ reference_images: next })
    .eq('id', styleId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/templates')
  revalidatePath(`/templates/${styleId}`)
  return { ok: true, total: next.length }
}

/**
 * Remove a single reference image from a style + delete from Storage.
 */
export async function removeReferenceFromStyle(
  styleId: string,
  imageUrl: string,
): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: row } = await supabase
    .from('creative_styles')
    .select('reference_images')
    .eq('id', styleId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!row) return { ok: false, error: 'style not found' }

  const current = Array.isArray(row.reference_images)
    ? (row.reference_images as ReferenceImage[])
    : []
  const next = current.filter((r) => r.url !== imageUrl)

  if (next.length === current.length) {
    return { ok: false, error: 'reference not found in this style' }
  }

  // Best-effort: remove from Storage if URL is from creative-styles bucket
  // URL pattern: https://*.supabase.co/storage/v1/object/public/creative-styles/<path>
  try {
    const m = imageUrl.match(
      /\/storage\/v1\/object\/public\/creative-styles\/(.+?)(?:\?|$)/,
    )
    if (m && m[1]) {
      const path = decodeURIComponent(m[1])
      // Only delete if user owns the path (folder is their user_id)
      if (path.startsWith(`${user.id}/`)) {
        await supabase.storage.from('creative-styles').remove([path])
      }
    }
  } catch {
    // Storage delete is best-effort — DB is source of truth
  }

  const { error } = await supabase
    .from('creative_styles')
    .update({ reference_images: next })
    .eq('id', styleId)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/templates')
  revalidatePath(`/templates/${styleId}`)
  return { ok: true, remaining: next.length }
}

/**
 * Re-extract style from current references — called after user adds/removes
 * refs and wants to refresh style_guide_md to reflect new references.
 *
 * Returns the new extracted style data (caller can choose to apply or skip).
 */
export async function reExtractStyleFromCurrentRefs(
  styleId: string,
  formatType: FormatType = 'cover',
): Promise<
  | {
      ok: true
      extracted: ExtractedCreativeStyle
      meta: { latency_ms: number; cache_hit_ratio: number }
    }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: row } = await supabase
    .from('creative_styles')
    .select('reference_images')
    .eq('id', styleId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!row) return { ok: false, error: 'style not found' }

  const refs = Array.isArray(row.reference_images)
    ? (row.reference_images as ReferenceImage[])
    : []
  if (refs.length === 0) {
    return { ok: false, error: 'ไม่มี reference image — upload ก่อน' }
  }
  return extractStyleFromReferences(
    refs.map((r) => r.url),
    formatType,
  )
}

const HEADLINER_STYLE_GUIDE = `# Headliner — Visual Style Guide

## Tone
Bold, scroll-stopping, declarative. ปกแบบ "พาดหัวข่าว" ที่สะดุดตา ไม่ใช่ minimal/aesthetic. Energy = high.

## Color
- Background: ดำ #000000 (deep black, ไม่ใช่ off-black)
- Foreground: ขาว #FFFFFF (full contrast)
- 3 highlight ที่ใช้ลำดับสำคัญ: แดง #E53935 → เหลือง #FFD400 → ส้ม #FF6B1A
- Highlight สีเข้มเป็นแถบ background ของบางคำในบรรทัด ไม่ใช่เปลี่ยนสี text ทั้งบรรทัด

## Typography
- Heading: Noto Sans Thai (extra-bold 800-900) — ฟอนต์เดียวเท่านั้น สำหรับไทย ให้ ไม้โทไม่ตก
- Body: Noto Sans Thai (regular)
- Headline 3 บรรทัด เสมอ ห้าม 2 หรือ 4

## Layout rules
- Photo: full-bleed บนสุด ครอบ ~66% ของ canvas (1080×890 ของ 1080×1350)
- Headline: ล่าง 33% บน solid black
- Brand mark: top-right (avatar กลม 130×130)
- Channel badge: mid-right (subscriber count + name แบบ TrendTech)
- Hand-drawn arrow + caption $ figure (optional แต่แนะนำ)
- Italic subhead with dashes: " - subhead - "

## Headline patterns
- บรรทัดที่ 1: highlight = แถบสีแดง (background) บนคำ key
- บรรทัดที่ 2: highlight = ตัวอักษรสีเหลือง (text color)
- บรรทัดที่ 3: highlight = แถบสีส้ม (background) บนคำ key

## DON'T
- ห้ามใช้ฟอนต์อื่นนอกจาก Noto Sans Thai (ไม่ Sarabun, ไม่ IBM Plex)
- ห้าม background สีอื่นนอกจากดำ
- ห้าม headline 2 บรรทัด (ต้อง 3 เสมอ)
- ห้าม em dash — ใช้ "บรรทัดที่ 2" ตัด แทน
- ห้าม emoji ใน headline
`

/**
 * Auto-seed the user's Headliner default style if they don't have one.
 * Idempotent — safe to call on every visit to /templates.
 */
export async function ensureHeadlinerDefault(): Promise<{
  ok: true
  id: string
  created: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('creative_styles')
    .select('id')
    .eq('user_id', user.id)
    .eq('format_type', 'cover')
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (existing) return { ok: true, id: existing.id, created: false }

  const { data, error } = await supabase
    .from('creative_styles')
    .insert({
      user_id: user.id,
      name: 'Headliner',
      format_type: 'cover',
      reference_images: [],
      style_guide_md: HEADLINER_STYLE_GUIDE,
      renderer_config: {
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
      },
      is_default: true,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'failed to seed Headliner default')
  }

  // Backfill: link existing fb_article drafts that have no creative_style_id yet
  await supabase
    .from('recreated_drafts')
    .update({ creative_style_id: data.id })
    .eq('user_id', user.id)
    .eq('format', 'fb_article')
    .is('creative_style_id', null)

  revalidatePath('/templates')
  return { ok: true, id: data.id, created: true }
}
