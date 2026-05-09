import { Skeleton } from '@/components/shared/skeleton'

export default function AppLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Skeleton className="h-9 w-72 mb-3" />
      <Skeleton className="h-4 w-96 mb-8" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-5 w-48 mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-[12px]" />
        ))}
      </div>
    </div>
  )
}
