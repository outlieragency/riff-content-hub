'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type IdeaStatus = 'idea' | 'in_progress' | 'recreated' | 'archived'

export async function updateIdeaNotes(
  ideaId: string,
  notes: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('ideas')
    .update({ notes })
    .eq('id', ideaId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/ideas')
  revalidatePath(`/ideas/${ideaId}`)
  return { ok: true }
}

export async function changeIdeaStatus(
  ideaId: string,
  status: IdeaStatus,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('ideas')
    .update({ status })
    .eq('id', ideaId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/ideas')
  revalidatePath(`/ideas/${ideaId}`)
  return { ok: true }
}

export async function deleteIdea(
  ideaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/ideas')
  revalidatePath('/outliers')
  return { ok: true }
}

