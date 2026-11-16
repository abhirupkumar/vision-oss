import { ProjectMetricsSkeleton } from '@/components/common/skeletons/ProjectMetricsSkeleton';
import { ProjectPanelsSkeleton } from '@/components/common/skeletons/ProjectPanelsSkeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Controls Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <ProjectMetricsSkeleton />

      {/* Chart Skeleton */}
      <div className="h-[520px] w-full animate-pulse rounded-lg border border-border bg-card p-6 shadow-sm" />

      <ProjectPanelsSkeleton />
    </div>
  );
}
