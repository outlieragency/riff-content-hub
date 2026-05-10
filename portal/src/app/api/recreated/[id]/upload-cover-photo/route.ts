/**
 * POST /api/recreated/[id]/upload-cover-photo  (multipart/form-data: file)
 *   Uploads user-supplied cover-photo.png override + triggers re-render
 *
 * DELETE /api/recreated/[id]/upload-cover-photo
 *   Removes override + re-renders with default thumbnail
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: draft } = await supabase
    .from('recreated_drafts')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!draft) {
    return NextResponse.json({ error: 'draft not found' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }

  // Forward multipart to worker
  const workerForm = new FormData()
  workerForm.append('user_id', user.id)
  workerForm.append('draft_id', id)
  workerForm.append('file', file)

  const workerUrl = process.env.WORKER_URL!
  const workerSecret = process.env.WORKER_SECRET!
  try {
    const res = await fetch(`${workerUrl}/cover/upload-source`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${workerSecret}` },
      body: workerForm,
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'upload failed' },
        { status: 502 },
      )
    }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'upload error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const workerUrl = process.env.WORKER_URL!
  const workerSecret = process.env.WORKER_SECRET!
  try {
    const url = new URL(`${workerUrl}/cover/clear-source`)
    url.searchParams.set('user_id', user.id)
    url.searchParams.set('draft_id', id)
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${workerSecret}` },
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'clear failed' },
        { status: 502 },
      )
    }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'clear error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
