import { cn } from '@/lib/utils'
import type { IdeaStatus } from '@/lib/actions/ideas'

const STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; classes: string }
> = {
  idea: {
    label: 'Idea',
    classes: 'bg-status-blue-bg text-status-blue-text',
  },
  in_progress: {
    label: 'Working on',
    classes: 'bg-status-amber-bg text-status-amber-text',
  },
  recreated: {
    label: 'Recreated',
    classes: 'bg-status-green-bg text-status-green-text',
  },
  archived: {
    label: 'Archived',
    classes: 'bg-secondary text-muted-foreground',
  },
}

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium',
        cfg.classes,
      )}
    >
      {cfg.label}
    </span>
  )
}
