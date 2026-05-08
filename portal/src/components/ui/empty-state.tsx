import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="surface-1 rounded-[16px] p-12 text-center">
      <div className="w-12 h-12 rounded-[12px] bg-secondary/60 flex items-center justify-center mx-auto mb-4">
        <Icon size={20} strokeWidth={1.5} className="text-text-muted" />
      </div>
      <p className="font-display-th text-xl text-foreground mb-1.5">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}
