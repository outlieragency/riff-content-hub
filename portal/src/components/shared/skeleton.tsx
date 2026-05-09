/**
 * Animated skeleton — used in loading.tsx for slow routes.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[8px] bg-secondary/60 ${className}`}
    />
  )
}
