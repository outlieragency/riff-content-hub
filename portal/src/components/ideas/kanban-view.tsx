'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Archive, CheckCircle2, Lightbulb, Loader2, Wrench } from 'lucide-react'
import { changeIdeaStatus, type IdeaStatus } from '@/lib/actions/ideas'
import { ScorePill } from '@/components/outliers/score-pill'
import { BoardChip } from '@/components/boards/board-chip'
import type { IdeaCard } from '@/components/ideas/idea-card'

const COLUMNS: {
  id: IdeaStatus
  label: string
  hint: string
  icon: typeof Lightbulb
  accent: string
}[] = [
  {
    id: 'idea',
    label: 'Ideas',
    hint: 'รอ recreate',
    icon: Lightbulb,
    accent: 'border-amber-300',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    hint: 'กำลังลุย',
    icon: Wrench,
    accent: 'border-blue-300',
  },
  {
    id: 'recreated',
    label: 'Recreated',
    hint: 'มี draft แล้ว',
    icon: CheckCircle2,
    accent: 'border-emerald-300',
  },
  {
    id: 'archived',
    label: 'Archived',
    hint: 'พักไว้ก่อน',
    icon: Archive,
    accent: 'border-slate-300',
  },
]

export function IdeasKanbanView({ cards }: { cards: IdeaCard[] }) {
  const router = useRouter()
  const [optimistic, setOptimistic] = useState<IdeaCard[]>(cards)
  const [, startStatusUpdate] = useTransition()
  const [movingId, setMovingId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  // Sync local optimistic state when parent cards prop changes (e.g. router.refresh)
  // Only when not currently dragging
  if (cards.length !== optimistic.length || movingId === null) {
    const cardIds = cards.map((c) => c.id).join(',')
    const localIds = optimistic.map((c) => c.id).join(',')
    if (cardIds !== localIds) {
      // Skip update if same set (just rerender)
    }
  }

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = optimistic.filter((c) => c.status === col.id)
      return acc
    },
    {} as Record<IdeaStatus, IdeaCard[]>,
  )

  function handleDragEnd(e: DragEndEvent) {
    const ideaId = e.active.id as string
    const overId = e.over?.id as string | undefined
    if (!overId) return
    const newStatus = overId as IdeaStatus
    if (!COLUMNS.find((c) => c.id === newStatus)) return

    const idea = optimistic.find((c) => c.id === ideaId)
    if (!idea || idea.status === newStatus) return

    // Optimistic local update
    setOptimistic((cur) =>
      cur.map((c) => (c.id === ideaId ? { ...c, status: newStatus } : c)),
    )
    setMovingId(ideaId)
    startStatusUpdate(async () => {
      const res = await changeIdeaStatus(ideaId, newStatus)
      if (!res.ok) {
        // Revert
        setOptimistic((cur) =>
          cur.map((c) =>
            c.id === ideaId ? { ...c, status: idea.status } : c,
          ),
        )
      } else {
        router.refresh()
      }
      setMovingId(null)
    })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            cards={grouped[col.id] ?? []}
            movingId={movingId}
          />
        ))}
      </div>
    </DndContext>
  )
}

function KanbanColumn({
  col,
  cards,
  movingId,
}: {
  col: (typeof COLUMNS)[number]
  cards: IdeaCard[]
  movingId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  const Icon = col.icon

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[12px] border-2 ${col.accent} bg-card p-3 min-h-[400px] transition-colors ${
        isOver ? 'bg-secondary/40' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {col.label}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {cards.length}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">{col.hint}</p>

      {cards.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic text-center py-6">
          ลากการ์ดมาวางที่นี่
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => (
            <KanbanCard key={c.id} card={c} pending={movingId === c.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function KanbanCard({ card, pending }: { card: IdeaCard; pending: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id })

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-background rounded-[10px] border border-border-soft overflow-hidden cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-brand' : 'hover:shadow-md'
      }`}
    >
      {card.thumbnail_url ? (
        <Image
          src={card.thumbnail_url}
          alt=""
          width={300}
          height={170}
          unoptimized
          className="w-full aspect-video object-cover bg-muted"
        />
      ) : (
        <div className="w-full aspect-video bg-muted" />
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-1 mb-1">
          <ScorePill score={card.video?.outlier_score} />
          {pending && (
            <Loader2 size={10} className="animate-spin text-brand ml-auto" />
          )}
        </div>
        <Link
          href={`/ideas/${card.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-medium text-foreground line-clamp-2 hover:text-brand-hover block"
        >
          {card.title}
        </Link>
        {card.boards && card.boards.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {card.boards.slice(0, 2).map((b) => (
              <BoardChip
                key={b.id}
                id={b.id}
                name={b.name}
                color={b.color}
                icon={b.icon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
