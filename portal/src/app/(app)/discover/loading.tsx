import { Skeleton } from '@/components/shared/skeleton'

export default function DiscoverLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Skeleton className="h-10 w-48 mb-3" />
      <Skeleton className="h-4 w-72 mb-6" />

      {/* Mode tabs */}
      <div className="flex gap-2 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Filter row */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32" />
        ))}
      </div>

      {/* Video rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-[10px]" />
        ))}
      </div>
    </div>
  )
}
