import { TableSkeleton } from '@/components/common/skeletons/TableSkeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      {/* Controls Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex gap-4 border-b border-border pb-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <TableSkeleton />
      </div>
    </div>
  );
}
