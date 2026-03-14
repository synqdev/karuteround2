import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-16" />

      {/* Profile header skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          {/* Large avatar skeleton */}
          <Skeleton className="size-16 shrink-0 rounded-full" />

          {/* Name and contact info skeletons */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>

          {/* Visit stats + Edit button */}
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      {/* Karute history skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
