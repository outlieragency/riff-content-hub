'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Inbox, Loader2, Pin, Plus, Star } from 'lucide-react'
import { createBoard } from '@/lib/actions/boards'
import {
  BOARD_COLOR_CLASSES,
  BOARD_COLORS,
  type BoardColor,
  type BoardSummary,
} from '@/lib/types/board'

/**
 * Left-rail board selector for /ideas page.
 * "All" = no board filter (default). Click a board → ?board=<id>.
 */
export function BoardSidebar({
  boards,
  totalCount,
}: {
  boards: BoardSummary[]
  totalCount: number
}) {
  const params = useSearchParams()
  const selectedBoardId = params.get('board') ?? null

  return (
    <aside className="w-[200px] shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Boards
        </h3>
        <NewBoardButton />
      </div>

      <nav className="space-y-0.5">
        <BoardLink
          href="/ideas"
          active={selectedBoardId === null}
          icon={<Inbox size={13} />}
          label="All ideas"
          count={totalCount}
        />
        {boards.map((b) => (
          <BoardLink
            key={b.id}
            href={`/ideas?board=${b.id}`}
            active={selectedBoardId === b.id}
            icon={
              b.icon ? (
                <span className="text-sm">{b.icon}</span>
              ) : (
                <span
                  className={`w-2 h-2 rounded-full ${BOARD_COLOR_CLASSES[b.color].dot}`}
                />
              )
            }
            label={b.name}
            count={b.idea_count}
            pinned={b.is_pinned}
          />
        ))}
      </nav>
    </aside>
  )
}

function BoardLink({
  href,
  active,
  icon,
  label,
  count,
  pinned,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  label: string
  count: number
  pinned?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-sm transition-colors ${
        active
          ? 'bg-secondary text-foreground font-medium'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      }`}
    >
      <span className="shrink-0 w-4 inline-flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {pinned && <Pin size={10} className="text-brand shrink-0" />}
      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
        {count}
      </span>
    </Link>
  )
}

function NewBoardButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<BoardColor>('orange')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit() {
    setError(null)
    start(async () => {
      const res = await createBoard({
        name,
        color,
        icon: icon.trim() || null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOpen(false)
      setName('')
      setIcon('')
      setColor('orange')
      router.refresh()
      // Navigate to new board
      router.push(`${pathname}?board=${res.id}`)
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center"
        aria-label="New board"
        title="New board"
      >
        <Plus size={13} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-6 z-50 w-[260px] rounded-[10px] border border-border-soft bg-card p-3 shadow-2xl"
          onMouseLeave={() => !pending && setOpen(false)}
        >
          <div className="text-xs font-semibold text-foreground mb-2">
            สร้าง board ใหม่
          </div>
          <input
            type="text"
            autoFocus
            placeholder="ชื่อ board"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            maxLength={32}
            className="w-full h-9 px-2.5 rounded-[6px] border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="text"
            placeholder="emoji (optional) เช่น 🔥 💡"
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, 2))}
            disabled={pending}
            className="w-full h-9 px-2.5 rounded-[6px] border border-border bg-background text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="mt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              สี
            </div>
            <div className="flex gap-1.5">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full ${BOARD_COLOR_CLASSES[c].dot} transition-all ${
                    color === c
                      ? `ring-2 ring-offset-2 ${BOARD_COLOR_CLASSES[c].ring}`
                      : ''
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          {error && (
            <div className="text-[11px] text-red-700 mt-2">{error}</div>
          )}
          <div className="flex justify-end gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !name.trim()}
              className="inline-flex items-center gap-1 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-medium rounded-[6px] px-3 py-1"
            >
              {pending ? (
                <Loader2 className="animate-spin" size={11} />
              ) : (
                <Star size={11} />
              )}
              สร้าง
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

