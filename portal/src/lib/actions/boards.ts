'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  type BoardColor,
  type BoardRow,
  type BoardSummary,
  isBoardColor,
} from '@/lib/types/board'

export async function listBoards(): Promise<BoardSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: boards } = await supabase
    .from('boards')
    .select('id, name, color, icon, sort_order, is_pinned, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!boards || boards.length === 0) return []

  // Fetch counts in 1 query
  const ids = boards.map((b) => b.id)
  const { data: counts } = await supabase
    .from('board_ideas')
    .select('board_id')
    .in('board_id', ids)

  const countMap = new Map<string, number>()
  for (const c of counts ?? []) {
    countMap.set(c.board_id, (countMap.get(c.board_id) ?? 0) + 1)
  }

  return boards.map((b) => ({
    ...b,
    color: isBoardColor(b.color) ? b.color : 'slate',
    idea_count: countMap.get(b.id) ?? 0,
  })) as BoardSummary[]
}

export async function getBoard(id: string): Promise<BoardRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('boards')
    .select(
      'id, name, color, icon, sort_order, is_pinned, created_at, updated_at',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return null
  return {
    ...data,
    color: isBoardColor(data.color) ? data.color : 'slate',
  } as BoardRow
}

export async function createBoard(input: {
  name: string
  color?: BoardColor
  icon?: string | null
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const trimmed = input.name.trim()
  if (!trimmed) return { ok: false, error: 'name ห้ามว่าง' }

  const { data, error } = await supabase
    .from('boards')
    .insert({
      user_id: user.id,
      name: trimmed,
      color: input.color && isBoardColor(input.color) ? input.color : 'slate',
      icon: input.icon ?? null,
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'create fail' }

  revalidatePath('/ideas')
  return { ok: true, id: data.id }
}

export async function updateBoard(
  id: string,
  patch: Partial<{
    name: string
    color: BoardColor
    icon: string | null
    is_pinned: boolean
    sort_order: number
  }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
  if (patch.color !== undefined && isBoardColor(patch.color)) {
    update.color = patch.color
  }
  if (patch.icon !== undefined) update.icon = patch.icon
  if (patch.is_pinned !== undefined) update.is_pinned = patch.is_pinned
  if (patch.sort_order !== undefined) update.sort_order = patch.sort_order

  if (Object.keys(update).length === 0) return { ok: true }

  const { error } = await supabase
    .from('boards')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/ideas')
  revalidatePath(`/boards/${id}`)
  return { ok: true }
}

export async function deleteBoard(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/ideas')
  return { ok: true }
}

// =============================================================
// idea ↔ board linking
// =============================================================

export async function addIdeasToBoard(
  boardId: string,
  ideaIds: string[],
): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  if (ideaIds.length === 0) return { ok: true, added: 0 }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rows = ideaIds.map((idea_id) => ({
    board_id: boardId,
    idea_id,
    user_id: user.id,
  }))
  const { error, data } = await supabase
    .from('board_ideas')
    .upsert(rows, { onConflict: 'board_id,idea_id', ignoreDuplicates: true })
    .select('idea_id')

  if (error) return { ok: false, error: error.message }
  revalidatePath('/ideas')
  revalidatePath(`/boards/${boardId}`)
  return { ok: true, added: data?.length ?? 0 }
}

export async function removeIdeaFromBoard(
  boardId: string,
  ideaId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('board_ideas')
    .delete()
    .eq('board_id', boardId)
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/ideas')
  revalidatePath(`/boards/${boardId}`)
  return { ok: true }
}

/**
 * Toggle an idea's membership in a single board.
 * Used by the "Add to board" dropdown on idea cards.
 */
export async function toggleIdeaBoard(
  boardId: string,
  ideaId: string,
): Promise<
  | { ok: true; in_board: boolean }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('board_ideas')
    .select('idea_id')
    .eq('board_id', boardId)
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('board_ideas')
      .delete()
      .eq('board_id', boardId)
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/ideas')
    revalidatePath(`/boards/${boardId}`)
    return { ok: true, in_board: false }
  }

  const { error } = await supabase.from('board_ideas').insert({
    board_id: boardId,
    idea_id: ideaId,
    user_id: user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/ideas')
  revalidatePath(`/boards/${boardId}`)
  return { ok: true, in_board: true }
}

/**
 * Get board membership for a list of ideas. Used to render board chips on cards.
 * Returns: { idea_id → [board_id, ...] }
 */
export async function getBoardsForIdeas(
  ideaIds: string[],
): Promise<Record<string, string[]>> {
  if (ideaIds.length === 0) return {}
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('board_ideas')
    .select('idea_id, board_id')
    .eq('user_id', user.id)
    .in('idea_id', ideaIds)

  const map: Record<string, string[]> = {}
  for (const row of data ?? []) {
    const arr = map[row.idea_id] ?? []
    arr.push(row.board_id)
    map[row.idea_id] = arr
  }
  return map
}
