import { TableSkeleton } from '@/components/common/skeletons/TableSkeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4 shadow-sm">
        <TableSkeleton />
      </div>
    </div>
  );
}
