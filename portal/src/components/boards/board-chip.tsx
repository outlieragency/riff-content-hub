import Link from 'next/link'
import {
  BOARD_COLOR_CLASSES,
  isBoardColor,
  type BoardColor,
} from '@/lib/types/board'

export function BoardChip({
  id,
  name,
  color,
  icon,
}: {
  id: string
  name: string
  color: string
  icon: string | null
}) {
  const c: BoardColor = isBoardColor(color) ? color : 'slate'
  return (
    <Link
      href={`/ideas?board=${id}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${BOARD_COLOR_CLASSES[c].chip} hover:opacity-80`}
      onClick={(e) => e.stopPropagation()}
    >
      {icon && <span>{icon}</span>}
      <span className="truncate max-w-[80px]">{name}</span>
    </Link>
  )
}
