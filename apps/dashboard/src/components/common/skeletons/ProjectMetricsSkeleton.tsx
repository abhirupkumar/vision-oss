import { MetricsBar } from '@/components/metrics/MetricsBar';

export function ProjectMetricsSkeleton() {
  return (
    <div className="min-h-[136px] w-full animate-pulse rounded-lg border border-border bg-card p-6 shadow-sm">
      <MetricsBar>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 p-4">
            <div className="h-4 w-20 rounded-md bg-muted" />
            <div className="h-8 w-24 rounded-md bg-muted/80" />
            <div className="h-3 w-16 rounded-md bg-muted/50" />
          </div>
        ))}
      </MetricsBar>
    </div>
  );
}
