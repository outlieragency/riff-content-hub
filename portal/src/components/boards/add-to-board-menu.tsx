'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FolderPlus, Loader2 } from 'lucide-react'
import { toggleIdeaBoard } from '@/lib/actions/boards'
import { createClient } from '@/lib/supabase/client'
import {
  BOARD_COLOR_CLASSES,
  isBoardColor,
  type BoardColor,
} from '@/lib/types/board'

type Board = {
  id: string
  name: string
  color: BoardColor
  icon: string | null
}

/**
 * Compact dropdown attached to an idea card. Click → list user's boards
 * with checkboxes for membership in this idea. Toggle via toggleIdeaBoard.
 *
 * Loads boards client-side from Supabase (RLS-scoped). Tracks membership
 * for THIS idea only (lighter than passing full map down).
 */
export function AddToBoardMenu({
  ideaId,
  initialBoardIds,
}: {
  ideaId: string
  initialBoardIds: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [boards, setBoards] = useState<Board[]>([])
  const [memberships, setMemberships] = useState<Set<string>>(
    new Set(initialBoardIds),
  )
  const [loading, setLoading] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, start] = useTransition()

  useEffect(() => {
    if (!open || boards.length > 0) return
    let cancelled = false
    // Loading flag tracks an external fetch — intended pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const sb = createClient()
    sb.from('boards')
      .select('id, name, color, icon')
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        const list: Board[] = (data ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          color: isBoardColor(b.color) ? b.color : 'slate',
          icon: b.icon,
        }))
        setBoards(list)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, boards.length])

  function toggle(boardId: string) {
    setPendingId(boardId)
    start(async () => {
      const res = await toggleIdeaBoard(boardId, ideaId)
      if (res.ok) {
        setMemberships((cur) => {
          const next = new Set(cur)
          if (res.in_board) next.add(boardId)
          else next.delete(boardId)
          return next
        })
        router.refresh()
      }
      setPendingId(null)
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-7 px-2 rounded-[6px] border border-border text-2xs text-muted-foreground hover:bg-secondary hover:text-foreground inline-flex items-center justify-center gap-1"
        title="Add to board"
        aria-label="Add to board"
      >
        <FolderPlus size={11} />
        <span>Board</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-20 w-[220px] rounded-[10px] border border-border-soft bg-card shadow-xl overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border-soft">
            Add to board
          </div>
          {loading ? (
            <div className="px-3 py-3 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="animate-spin" size={11} />
              Loading...
            </div>
          ) : boards.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              ยังไม่มี board — ไปสร้างที่หน้า Ideas
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto py-1">
              {boards.map((b) => {
                const inBoard = memberships.has(b.id)
                const isPending = pendingId === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary/60 disabled:opacity-50"
                  >
                    {b.icon ? (
                      <span className="text-sm w-4 text-center">{b.icon}</span>
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full ${BOARD_COLOR_CLASSES[b.color].dot}`}
                      />
                    )}
                    <span className="flex-1 truncate text-foreground">
                      {b.name}
                    </span>
                    {isPending ? (
                      <Loader2 className="animate-spin" size={11} />
                    ) : inBoard ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
