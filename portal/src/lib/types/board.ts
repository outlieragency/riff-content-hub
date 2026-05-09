/**
 * Boards / Collections — user-labeled folders for saved ideas.
 * Eden swipe file pattern.
 */

export type BoardColor =
  | 'slate'
  | 'orange'
  | 'blue'
  | 'purple'
  | 'emerald'
  | 'amber'
  | 'rose'

export type BoardRow = {
  id: string
  name: string
  color: BoardColor
  icon: string | null
  sort_order: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export type BoardSummary = BoardRow & {
  idea_count: number
}

export const BOARD_COLORS: BoardColor[] = [
  'slate',
  'orange',
  'blue',
  'purple',
  'emerald',
  'amber',
  'rose',
]

export const BOARD_COLOR_CLASSES: Record<
  BoardColor,
  { chip: string; dot: string; ring: string }
> = {
  slate: {
    chip: 'bg-slate-100 text-slate-800',
    dot: 'bg-slate-500',
    ring: 'ring-slate-300',
  },
  orange: {
    chip: 'bg-orange-100 text-orange-900',
    dot: 'bg-orange-500',
    ring: 'ring-orange-300',
  },
  blue: {
    chip: 'bg-blue-100 text-blue-900',
    dot: 'bg-blue-500',
    ring: 'ring-blue-300',
  },
  purple: {
    chip: 'bg-purple-100 text-purple-900',
    dot: 'bg-purple-500',
    ring: 'ring-purple-300',
  },
  emerald: {
    chip: 'bg-emerald-100 text-emerald-900',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-300',
  },
  amber: {
    chip: 'bg-amber-100 text-amber-900',
    dot: 'bg-amber-500',
    ring: 'ring-amber-300',
  },
  rose: {
    chip: 'bg-rose-100 text-rose-900',
    dot: 'bg-rose-500',
    ring: 'ring-rose-300',
  },
}

export function isBoardColor(value: string): value is BoardColor {
  return (BOARD_COLORS as string[]).includes(value)
}
