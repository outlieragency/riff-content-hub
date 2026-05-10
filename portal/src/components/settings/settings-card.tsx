import type { LucideIcon } from 'lucide-react'

export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[14px] border border-border-soft bg-card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-[10px] bg-brand-soft text-brand inline-flex items-center justify-center shrink-0">
          <Icon size={16} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}
