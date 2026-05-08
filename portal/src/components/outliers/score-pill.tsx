import { bandFor, BAND_CONFIG, formatScore } from '@/lib/outlier/score'
import { cn } from '@/lib/utils'

export function ScorePill({ score }: { score: number | null | undefined }) {
  const band = bandFor(score)
  if (band == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
        n/a
      </span>
    )
  }
  const cfg = BAND_CONFIG[band]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.bg,
        cfg.text,
        cfg.border,
      )}
      title={cfg.label}
    >
      {formatScore(score)}
    </span>
  )
}
