'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  worker,
  type CarouselTemplateField,
  type CarouselTemplateTheme,
} from '@/lib/worker'

export type CarouselTemplateRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  source_image_path: string | null
  source_image_url: string | null
  thumbnail_path: string | null
  thumbnail_url: string | null
  html_template: string
  schema: CarouselTemplateField[]
  default_theme: CarouselTemplateTheme
  width: number
  height: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const BUCKET = 'carousel-templates'

function publicUrl(path: string | null): string | null {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!base) return null
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`
}

async function authedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// ====================================================================
// List
// ====================================================================

export async function listCarouselTemplates(): Promise<CarouselTemplateRow[]> {
  const { supabase, user } = await authedUser()

  const { data, error } = await supabase
    .from('carousel_templates')
    .select(
      'id, user_id, name, description, source_image_path, thumbnail_path, html_template, schema, default_theme, width, height, is_active, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    ...(row as Omit<
      CarouselTemplateRow,
      'source_image_url' | 'thumbnail_url'
    >),
    source_image_url: publicUrl(row.source_image_path as string | null),
    thumbnail_url: publicUrl(row.thumbnail_path as string | null),
  })) as CarouselTemplateRow[]
}

// ====================================================================
// Get one
// ====================================================================

export async function getCarouselTemplate(
  id: string,
): Promise<CarouselTemplateRow | null> {
  const { supabase, user } = await authedUser()

  const { data } = await supabase
    .from('carousel_templates')
    .select(
      'id, user_id, name, description, source_image_path, thumbnail_path, html_template, schema, default_theme, width, height, is_active, created_at, updated_at',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return null
  return {
    ...(data as Omit<
      CarouselTemplateRow,
      'source_image_url' | 'thumbnail_url'
    >),
    source_image_url: publicUrl(data.source_image_path as string | null),
    thumbnail_url: publicUrl(data.thumbnail_path as string | null),
  } as CarouselTemplateRow
}

// ====================================================================
// Parse + save — the main flow
// ====================================================================

/**
 * Given a source image already uploaded to Storage (path + public URL),
 * call worker /parse, get HTML + schema + theme, and insert a new row.
 * Returns the new template's id so the UI can navigate to its editor.
 */
export async function parseAndSaveCarouselTemplate(input: {
  source_image_path: string
  source_image_url: string
  user_name?: string
}): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const { supabase, user } = await authedUser()

  let parsed
  try {
    parsed = await worker.parseCarouselTemplate({
      user_id: user.id,
      image_url: input.source_image_url,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'vision parse failed',
    }
  }

  const name =
    input.user_name?.trim() || parsed.name_suggestion || 'Untitled template'

  const { data, error } = await supabase
    .from('carousel_templates')
    .insert({
      user_id: user.id,
      name,
      source_image_path: input.source_image_path,
      html_template: parsed.html,
      schema: parsed.schema,
      default_theme: parsed.theme,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'insert failed' }
  }

  revalidatePath('/carousel-templates')
  return { ok: true, id: data.id as string }
}

// ====================================================================
// Update — rename, edit html/schema/theme
// ====================================================================

export async function updateCarouselTemplate(
  id: string,
  patch: Partial<{
    name: string
    description: string | null
    html_template: string
    schema: CarouselTemplateField[]
    default_theme: CarouselTemplateTheme
    thumbnail_path: string | null
  }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await authedUser()

  const cleaned: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    const n = patch.name.trim()
    if (!n) return { ok: false, error: 'name ห้ามว่าง' }
    cleaned.name = n.slice(0, 80)
  }
  if (patch.description !== undefined) {
    cleaned.description = patch.description?.trim().slice(0, 280) || null
  }
  if (patch.html_template !== undefined) {
    if (patch.html_template.length < 20) {
      return { ok: false, error: 'html_template สั้นเกินไป' }
    }
    cleaned.html_template = patch.html_template
  }
  if (patch.schema !== undefined) cleaned.schema = patch.schema
  if (patch.default_theme !== undefined)
    cleaned.default_theme = patch.default_theme
  if (patch.thumbnail_path !== undefined)
    cleaned.thumbnail_path = patch.thumbnail_path

  if (Object.keys(cleaned).length === 0) return { ok: true }

  const { error } = await supabase
    .from('carousel_templates')
    .update(cleaned)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/carousel-templates')
  revalidatePath(`/carousel-templates/${id}`)
  return { ok: true }
}

// ====================================================================
// Delete
// ====================================================================

export async function deleteCarouselTemplate(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await authedUser()

  // Read paths first so we can remove Storage objects
  const { data: row } = await supabase
    .from('carousel_templates')
    .select('source_image_path, thumbnail_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const paths = [
    row?.source_image_path as string | undefined,
    row?.thumbnail_path as string | undefined,
  ].filter((p): p is string => typeof p === 'string' && p.length > 0)

  if (paths.length) {
    await supabase.storage.from(BUCKET).remove(paths)
  }

  const { error } = await supabase
    .from('carousel_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/carousel-templates')
  return { ok: true }
}

// ====================================================================
// Render preview HTML — wraps worker call (for live iframe)
// ====================================================================

export async function previewCarouselTemplate(input: {
  html_template: string
  fields: Record<string, unknown>
  theme: Record<string, unknown>
}): Promise<
  { ok: true; html: string } | { ok: false; error: string }
> {
  try {
    const res = await worker.renderCarouselTemplateHtml(input)
    return { ok: true, html: res.html }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'render failed',
    }
  }
}
