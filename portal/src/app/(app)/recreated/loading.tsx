import { Skeleton } from '@/components/shared/skeleton'

export default function RecreatedLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <Skeleton className="h-9 w-44 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />

      {/* Filter pills row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/5] rounded-[14px]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
