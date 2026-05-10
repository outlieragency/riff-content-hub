import { Skeleton } from '@/components/shared/skeleton'

export default function IdeasLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <Skeleton className="h-10 w-80 mb-3" />
      <Skeleton className="h-4 w-64 mb-6" />

      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video rounded-[14px]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
